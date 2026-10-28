import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'

import { runPreviewCli, runPreviewCommand } from './pages-preview.ts'

const HEAD_SHA = 'a'.repeat(40)
const MERGE_SHA = 'c'.repeat(40)
const malformedShas = (sha: string) => [sha.slice(1), `${sha}0`, sha.toUpperCase(), `${sha.slice(1)}g`, `${sha}\n`]
const REPOSITORY = 'drimchansky/drimchansky.dev'
const env = {
  CLOUDFLARE_ACCOUNT_ID: 'account',
  CLOUDFLARE_API_TOKEN: 'cloudflare-token',
  GITHUB_EVENT_NAME: 'pull_request',
  GITHUB_REPOSITORY: REPOSITORY,
  GITHUB_RUN_NUMBER: '7',
  GITHUB_TOKEN: 'github-token',
  PR_HEAD_SHA: HEAD_SHA,
  PR_MERGE_SHA: MERGE_SHA,
  PR_NUMBER: '42'
}

const pullRequest = () => ({
  base: { ref: 'main', repo: { full_name: REPOSITORY } },
  draft: false,
  head: { ref: 'feature', repo: { full_name: REPOSITORY }, sha: HEAD_SHA },
  merge_commit_sha: MERGE_SHA,
  state: 'open'
})

const workflowRun = (runNumber: number, headBranch = 'feature', repository = REPOSITORY) => ({
  head_branch: headBranch,
  head_repository: { full_name: repository },
  run_number: runNumber
})
const workflowRuns = (...runs: (number | ReturnType<typeof workflowRun>)[]) => ({
  total_count: runs.length,
  workflow_runs: runs.map(run => (typeof run === 'number' ? workflowRun(run) : run))
})
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })
const project = (value: unknown = { production_branch: 'main' }) => ({ result: value, success: true })
const deploymentStatus = (name = 'deploy', status = 'success') => ({
  result: { latest_stage: { name, status } },
  success: true
})
const commentEnv = {
  ...env,
  DEPLOYMENT_ENVIRONMENT: 'preview',
  DEPLOYMENT_ID: 'deployment-id',
  DEPLOYMENT_URL: 'https://hash.drimchansky-dev.pages.dev',
  PREVIEW_URL: 'https://pr-42.drimchansky-dev.pages.dev'
}

const botComment = (id = 123) => ({
  body: '<!-- pages-pr-preview -->\nprevious build',
  id,
  user: { login: 'github-actions[bot]', type: 'Bot' }
})

const deployment = (id: string, branch = 'pr-42', environment = 'preview') => ({
  deployment_trigger: { metadata: { branch } },
  environment,
  id
})

function commentApi(comments: unknown[] = []) {
  const state = {
    commentPages: [comments],
    confirmed: false,
    pr: pullRequest(),
    prAfterDiscovery: undefined as ReturnType<typeof pullRequest> | undefined,
    stages: [deploymentStatus()],
    writes: [] as { body: string; method: string; url: string }[]
  }
  const request = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
    const url = new URL(String(input))
    if (url.hostname === 'api.cloudflare.com') {
      const stage = (state.stages.length > 1 ? state.stages.shift() : state.stages[0]) ?? deploymentStatus()
      state.confirmed = stage.result.latest_stage.name === 'deploy' && stage.result.latest_stage.status === 'success'
      return json(stage)
    }
    if (init?.method === 'POST' || init?.method === 'PATCH') {
      if (!state.confirmed) throw new Error('Published before Cloudflare confirmed the deployment')
      state.writes.push({ body: String(init.body), method: init.method, url: url.href })
      return json(botComment())
    }
    if (url.pathname.endsWith('/issues/42/comments')) {
      if (state.prAfterDiscovery) state.pr = state.prAfterDiscovery
      return json(state.commentPages[Number(url.searchParams.get('page')) - 1] ?? [])
    }
    if (url.pathname.endsWith('/pulls/42')) return json(state.pr)
    throw new Error(`Unexpected request: ${url.href}`)
  })
  return { request, state }
}

const cleanupEnv = { ...env, GITHUB_EVENT_NAME: 'pull_request_target', PR_HEAD_SHA: '', PR_MERGE_SHA: '' }
const CLOUDFLARE_MAX_DEPLOYMENTS_PER_PAGE = 25

function cleanupApi(deployments = [deployment('first')]) {
  const deleted: string[] = []
  const state = {
    commentEdits: [] as { body: string; id: string }[],
    comments: [] as unknown[],
    deleted,
    deleteStatus: 200,
    deployments: [...deployments],
    keepDeployment: false,
    pr: { ...pullRequest(), state: 'closed' },
    runs: workflowRuns(7)
  }
  const request = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
    const url = new URL(String(input))
    if (url.hostname === 'api.github.com') {
      if (init?.method === 'PATCH') {
        state.commentEdits.push({ body: String(init.body), id: url.pathname.split('/').at(-1) ?? '' })
        return json(botComment())
      }
      if (url.pathname.endsWith('/actions/workflows/ci.yaml/runs')) return json(state.runs)
      return json(url.pathname.endsWith('/comments') ? state.comments : state.pr)
    }
    if (url.pathname.endsWith('/pages/projects/drimchansky-dev')) return json(project())
    if (init?.method === 'DELETE') {
      const id = decodeURIComponent(url.pathname.split('/').at(-1) ?? '')
      expect(url.searchParams.get('force')).toBe('true')
      expect(url.pathname).toContain('/pages/projects/drimchansky-dev/deployments/')
      state.deleted.push(id)
      if (state.deleteStatus < 400 || state.deleteStatus === 404) {
        if (!state.keepDeployment) state.deployments = state.deployments.filter(item => item.id !== id)
      }
      return json({ result: null, success: state.deleteStatus < 400 }, state.deleteStatus)
    }
    if (url.pathname.includes('/deployments/')) return json(deploymentStatus())
    if (Number(url.searchParams.get('per_page')) > CLOUDFLARE_MAX_DEPLOYMENTS_PER_PAGE) {
      return json(
        {
          errors: [
            { code: 8000024, message: 'Invalid list options provided. Review the `page` or `per_page` parameter.' }
          ],
          result: null,
          success: false
        },
        400
      )
    }
    const page = Number(url.searchParams.get('page'))
    return json({ result: state.deployments.slice((page - 1) * 2, page * 2), success: true })
  })
  return { request, state }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('preview eligibility', () => {
  it.each(['d'.repeat(40), null])('deploys when only the live merge revision changed: %s', async mergeCommitSha => {
    const request = vi.fn<typeof fetch>()
    request
      .mockResolvedValueOnce(json({ ...pullRequest(), merge_commit_sha: mergeCommitSha }))
      .mockResolvedValueOnce(json(workflowRuns(7)))
      .mockResolvedValueOnce(json(project()))

    await expect(runPreviewCommand('check', env, request)).resolves.toBe(true)
  })

  it.each([false, true])('deploys an eligible open PR (draft: %s)', async draft => {
    const request = vi.fn<typeof fetch>()
    request
      .mockResolvedValueOnce(json({ ...pullRequest(), draft }))
      .mockResolvedValueOnce(json(workflowRuns(7)))
      .mockResolvedValueOnce(json(project()))

    await expect(runPreviewCommand('check', env, request)).resolves.toBe(true)
  })

  it('checks eligibility without the merge SHA it does not read', async () => {
    const request = vi.fn<typeof fetch>()
    request
      .mockResolvedValueOnce(json(pullRequest()))
      .mockResolvedValueOnce(json(workflowRuns(7)))
      .mockResolvedValueOnce(json(project()))

    await expect(runPreviewCommand('check', { ...env, PR_MERGE_SHA: '' }, request)).resolves.toBe(true)
  })

  it.each([
    [{ state: 'closed' }, 'the PR is closed'],
    [{ base: { ref: 'other', repo: { full_name: REPOSITORY } } }, 'the PR no longer targets main'],
    [{ head: { repo: { full_name: 'someone/fork' }, sha: HEAD_SHA } }, 'the head branch is not in this repository'],
    [{ head: { repo: { full_name: REPOSITORY }, sha: 'b'.repeat(40) } }, 'a newer push superseded this run']
  ])('skips an ineligible PR without contacting Cloudflare: %j', async (change, reason) => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(json({ ...pullRequest(), ...change }))

    await expect(runPreviewCommand('check', env, request)).resolves.toBe(false)
    expect(request).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalledWith(`::notice::Skipped the PR #42 preview: ${reason}`)
  })

  it('rejects an older head that reaches the mutation queue after a newer run', async () => {
    const { request, state } = cleanupApi([])
    state.pr.state = 'open'
    state.pr.head.sha = 'e'.repeat(40)

    await expect(runPreviewCommand('check', { ...env, PR_HEAD_SHA: state.pr.head.sha }, request)).resolves.toBe(true)
    await expect(runPreviewCommand('check', env, request)).resolves.toBe(false)
  })

  it('rejects an older run once a newer run exists for the same head', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { request, state } = cleanupApi([])
    state.pr.state = 'open'
    state.runs = workflowRuns(8, 7)

    await expect(runPreviewCommand('check', env, request)).resolves.toBe(false)
    expect(request).toHaveBeenCalledWith(
      `https://api.github.com/repos/${REPOSITORY}/actions/workflows/ci.yaml/runs?event=pull_request&head_sha=${HEAD_SHA}&per_page=100`,
      expect.anything()
    )
    expect(log).toHaveBeenCalledWith('::notice::Skipped the PR #42 preview: a newer run superseded this run')
  })

  it('ignores newer runs from other PRs at the same head', async () => {
    const { request, state } = cleanupApi([])
    state.pr.state = 'open'
    state.runs = workflowRuns(workflowRun(9, 'other'), workflowRun(8, 'feature', 'someone/fork'), 7)

    await expect(runPreviewCommand('check', env, request)).resolves.toBe(true)
  })

  it.each(['0', '-1', '7a'])('rejects the invalid run number %j before any API call', async runNumber => {
    const request = vi.fn<typeof fetch>()

    await expect(runPreviewCommand('check', { ...env, GITHUB_RUN_NUMBER: runNumber }, request)).rejects.toThrow(
      'Invalid run number'
    )
    expect(request).not.toHaveBeenCalled()
  })

  it('rejects a branch push before any API call', async () => {
    const request = vi.fn<typeof fetch>()

    await expect(runPreviewCommand('check', { ...env, GITHUB_EVENT_NAME: 'push' }, request)).rejects.toThrow(
      'pull_request event'
    )
    expect(request).not.toHaveBeenCalled()
  })

  it('rejects a run from another repository before any API call', async () => {
    const request = vi.fn<typeof fetch>()

    await expect(runPreviewCommand('check', { ...env, GITHUB_REPOSITORY: 'someone/fork' }, request)).rejects.toThrow(
      'Unexpected repository'
    )
    expect(request).not.toHaveBeenCalled()
  })

  it.each(['deploy', ''])('rejects the unknown preview command %j before any API call', async command => {
    const request = vi.fn<typeof fetch>()

    await expect(runPreviewCommand(command, env, request)).rejects.toThrow('Unknown preview command')
    expect(request).not.toHaveBeenCalled()
  })

  it.each(['0', '-1', '42/a', '9007199254740992'])('rejects invalid PR number %s', async number => {
    const request = vi.fn<typeof fetch>()

    await expect(runPreviewCommand('check', { ...env, PR_NUMBER: number }, request)).rejects.toThrow(
      'Invalid PR number'
    )
    expect(request).not.toHaveBeenCalled()
  })

  it.each(malformedShas(HEAD_SHA))('rejects the malformed PR head SHA %j before any API call', async sha => {
    const request = vi.fn<typeof fetch>()

    await expect(runPreviewCommand('check', { ...env, PR_HEAD_SHA: sha }, request)).rejects.toThrow(
      'Invalid PR head SHA'
    )
    expect(request).not.toHaveBeenCalled()
  })

  it('fails closed when Pages treats another branch as production', async () => {
    const request = vi.fn<typeof fetch>()
    request
      .mockResolvedValueOnce(json(pullRequest()))
      .mockResolvedValueOnce(json(workflowRuns(7)))
      .mockResolvedValueOnce(json(project({ production_branch: 'other' })))

    await expect(runPreviewCommand('check', env, request)).rejects.toThrow('production branch must be main')
  })

  it('surfaces an API failure instead of treating it as eligibility', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(json({}, 403))

    await expect(runPreviewCommand('check', env, request)).rejects.toThrow('GitHub request failed (HTTP 403)')
  })

  it("names GitHub's reason for a rejected request", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ message: 'Resource not accessible by integration' }, 403))

    await expect(runPreviewCommand('check', env, request)).rejects.toThrow(
      'GitHub request failed (HTTP 403): Resource not accessible by integration'
    )
  })

  it.each([
    [400, 'Cloudflare request failed (HTTP 400)'],
    [200, 'Cloudflare request was unsuccessful']
  ])("names Cloudflare's error codes for a rejected request (HTTP %i)", async (status, message) => {
    const request = vi.fn<typeof fetch>()
    request
      .mockResolvedValueOnce(json(pullRequest()))
      .mockResolvedValueOnce(json(workflowRuns(7)))
      .mockResolvedValueOnce(
        json({ errors: [{ code: 8000024, message: 'Invalid list options provided.' }], success: false }, status)
      )

    await expect(runPreviewCommand('check', env, request)).rejects.toThrow(
      `${message}: 8000024 Invalid list options provided.`
    )
  })

  it.each([
    ['an HTML page', '<html>'],
    ['an empty body', ''],
    ['no errors', '{"errors":[],"success":false}']
  ])('reports only the HTTP status when a Cloudflare failure carries %s', async (_, body) => {
    const request = vi.fn<typeof fetch>()
    request
      .mockResolvedValueOnce(json(pullRequest()))
      .mockResolvedValueOnce(json(workflowRuns(7)))
      .mockResolvedValueOnce(new Response(body, { status: 502 }))

    await expect(runPreviewCommand('check', env, request)).rejects.toHaveProperty(
      'message',
      'Cloudflare request failed (HTTP 502)'
    )
  })

  it('fails when the Pages project is missing instead of treating it as already absent', async () => {
    const request = vi.fn<typeof fetch>()
    request
      .mockResolvedValueOnce(json(pullRequest()))
      .mockResolvedValueOnce(json(workflowRuns(7)))
      .mockResolvedValueOnce(json({}, 404))

    await expect(runPreviewCommand('check', env, request)).rejects.toHaveProperty(
      'message',
      'Cloudflare request failed (HTTP 404)'
    )
  })

  it('rejects independent Git preview deployments', async () => {
    const request = vi.fn<typeof fetch>()
    request
      .mockResolvedValueOnce(json(pullRequest()))
      .mockResolvedValueOnce(json(workflowRuns(7)))
      .mockResolvedValueOnce(
        json(project({ production_branch: 'main', source: { config: { preview_deployment_setting: 'all' } } }))
      )

    await expect(runPreviewCommand('check', env, request)).rejects.toThrow('Disable independent Pages Git preview')
  })

  it.each([{ deployments_enabled: false }, { preview_deployment_setting: 'none' }])(
    'accepts disabled Git previews: %j',
    async config => {
      const request = vi.fn<typeof fetch>()
      request
        .mockResolvedValueOnce(json(pullRequest()))
        .mockResolvedValueOnce(json(workflowRuns(7)))
        .mockResolvedValueOnce(json(project({ production_branch: 'main', source: { config } })))

      await expect(runPreviewCommand('check', env, request)).resolves.toBe(true)
    }
  )
})

describe('preview command line', () => {
  it.each([
    ['open', 'eligible=true\n'],
    ['closed', 'eligible=false\n']
  ])('writes the check result for an %s PR to GITHUB_OUTPUT', async (prState, line) => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const directory = mkdtempSync(join(tmpdir(), 'pages-preview-'))
    onTestFinished(() => rmSync(directory, { force: true, recursive: true }))
    const output = join(directory, 'output')
    const { request, state } = cleanupApi([])
    state.pr.state = prState

    await runPreviewCli('check', { ...env, GITHUB_OUTPUT: output }, request)
    expect(readFileSync(output, 'utf8')).toBe(line)
  })
})

describe('preview comment', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a comment with the alias and exact uploaded revision', async () => {
    const { request, state } = commentApi()

    await expect(runPreviewCommand('comment', commentEnv, request)).resolves.toBe(true)
    expect(state.writes).toEqual([
      expect.objectContaining({
        method: 'POST',
        url: 'https://api.github.com/repos/drimchansky/drimchansky.dev/issues/42/comments'
      })
    ])
    expect(state.writes[0].body).toContain(commentEnv.PREVIEW_URL)
    expect(state.writes[0].body).toContain(MERGE_SHA)
    expect(state.writes[0].body).not.toContain('https://hash.')
  })

  it('retains the bot comment ID on a subsequent deployment', async () => {
    const updatedMergeSha = 'd'.repeat(40)
    const { request, state } = commentApi([botComment()])
    state.pr = { ...pullRequest(), merge_commit_sha: updatedMergeSha }

    await expect(runPreviewCommand('comment', { ...commentEnv, PR_MERGE_SHA: updatedMergeSha }, request)).resolves.toBe(
      true
    )
    expect(state.writes).toEqual([
      expect.objectContaining({
        method: 'PATCH',
        url: 'https://api.github.com/repos/drimchansky/drimchansky.dev/issues/comments/123'
      })
    ])
    expect(state.writes[0].body).toContain(updatedMergeSha)
    expect(state.writes[0].body).toContain(commentEnv.PREVIEW_URL)
  })

  it('waits for Cloudflare to confirm the deployment before publishing', async () => {
    vi.useFakeTimers()
    const { request, state } = commentApi()
    state.stages = [deploymentStatus('deploy', 'active'), deploymentStatus()]

    const published = expect(runPreviewCommand('comment', commentEnv, request)).resolves.toBe(true)
    await vi.runAllTimersAsync()
    await published
    const statusUrl =
      'https://api.cloudflare.com/client/v4/accounts/account/pages/projects/drimchansky-dev/deployments/deployment-id'
    expect(request.mock.calls.filter(([url]) => url === statusUrl)).toHaveLength(2)
    expect(state.writes.map(write => write.method)).toEqual(['POST'])
  })

  it.each([
    ['deploy', 'failure'],
    ['build', 'failure'],
    ['deploy', 'canceled']
  ])('does not announce a deployment whose %s stage reports %s', async (name, status) => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(json(deploymentStatus(name, status)))

    await expect(runPreviewCommand('comment', commentEnv, request)).rejects.toThrow(
      `Preview deployment not confirmed (${name}: ${status})`
    )
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('deletes a deployment still in progress after every attempt', async () => {
    vi.useFakeTimers()
    const request = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_, init) =>
        json(init?.method === 'DELETE' ? { result: null, success: true } : deploymentStatus('deploy', 'active'))
      )

    const rejected = expect(runPreviewCommand('comment', commentEnv, request)).rejects.toThrow(
      'Preview deployment not confirmed (deploy: active); deleted it'
    )
    await vi.runAllTimersAsync()
    await rejected
    expect(request).toHaveBeenCalledTimes(25)
    expect(request).toHaveBeenLastCalledWith(
      'https://api.cloudflare.com/client/v4/accounts/account/pages/projects/drimchansky-dev/deployments/deployment-id?force=true',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('reports a failed delete of a deployment still in progress', async () => {
    vi.useFakeTimers()
    const request = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_, init) =>
        init?.method === 'DELETE' ? json({}, 500) : json(deploymentStatus('deploy', 'active'))
      )

    const rejected = expect(runPreviewCommand('comment', commentEnv, request)).rejects.toThrow(
      'Preview deployment not confirmed (deploy: active); deleting it failed: Cloudflare request failed (HTTP 500)'
    )
    await vi.runAllTimersAsync()
    await rejected
  })

  it('finds the bot-owned comment after a full page containing a human marker', async () => {
    const humanComments = Array.from({ length: 100 }, (_, id) => ({
      ...botComment(id),
      user: { login: 'human', type: 'User' }
    }))
    const { request, state } = commentApi(humanComments)
    state.commentPages.push([botComment()])

    await expect(runPreviewCommand('comment', commentEnv, request)).resolves.toBe(true)
    expect(state.writes).toEqual([
      expect.objectContaining({
        method: 'PATCH',
        url: 'https://api.github.com/repos/drimchansky/drimchansky.dev/issues/comments/123'
      })
    ])
  })

  it('does not publish after the PR closes during comment discovery', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { request, state } = commentApi([botComment()])
    state.prAfterDiscovery = { ...pullRequest(), state: 'closed' }

    await expect(runPreviewCommand('comment', commentEnv, request)).resolves.toBe(false)
    expect(state.writes).toEqual([])
    expect(log).toHaveBeenCalledWith('::notice::Skipped the PR #42 preview: the PR is closed')
  })

  it.each([
    { head: { ref: 'feature', repo: { full_name: REPOSITORY }, sha: 'e'.repeat(40) } },
    { merge_commit_sha: 'f'.repeat(40) }
  ])('names the uploaded revision when the PR moves during publishing: %j', async change => {
    const { request, state } = commentApi([botComment()])
    state.prAfterDiscovery = { ...pullRequest(), ...change }

    await expect(runPreviewCommand('comment', commentEnv, request)).resolves.toBe(true)
    expect(state.writes).toEqual([expect.objectContaining({ method: 'PATCH' })])
    expect(state.writes[0].body).toContain(MERGE_SHA)
  })

  it('uses the deployment URL when the action returns no alias', async () => {
    const { request, state } = commentApi()

    await expect(runPreviewCommand('comment', { ...commentEnv, PREVIEW_URL: '' }, request)).resolves.toBe(true)
    expect(state.writes[0].body).toContain(commentEnv.DEPLOYMENT_URL)
  })

  it('publishes without the head SHA it does not read', async () => {
    const { request, state } = commentApi()

    await expect(runPreviewCommand('comment', { ...commentEnv, PR_HEAD_SHA: '' }, request)).resolves.toBe(true)
    expect(state.writes).toHaveLength(1)
  })

  it('fails clearly when neither deployment URL is available', async () => {
    const request = vi.fn<typeof fetch>()

    await expect(
      runPreviewCommand('comment', { ...commentEnv, DEPLOYMENT_URL: '', PREVIEW_URL: '' }, request)
    ).rejects.toThrow('Missing DEPLOYMENT_URL')
    expect(request).not.toHaveBeenCalled()
  })

  it('does not label a production upload as a preview', async () => {
    const request = vi.fn<typeof fetch>()

    await expect(
      runPreviewCommand('comment', { ...commentEnv, DEPLOYMENT_ENVIRONMENT: 'production' }, request)
    ).rejects.toThrow('Expected a preview deployment')
    expect(request).not.toHaveBeenCalled()
  })

  it.each([
    ['a lookalike host', 'https://evil-drimchansky-dev.pages.dev'],
    ['plain HTTP', 'http://pr-42.drimchansky-dev.pages.dev'],
    ['a username', 'https://user@pr-42.drimchansky-dev.pages.dev'],
    ['a password', 'https://:pass@pr-42.drimchansky-dev.pages.dev'],
    ['a suffixed host', 'https://pr-42.drimchansky-dev.pages.dev.evil.test']
  ])('refuses to link a preview URL with %s before any API call: %s', async (_, previewUrl) => {
    const request = vi.fn<typeof fetch>()

    await expect(runPreviewCommand('comment', { ...commentEnv, PREVIEW_URL: previewUrl }, request)).rejects.toThrow(
      'Unexpected preview URL'
    )
    expect(request).not.toHaveBeenCalled()
  })

  it.each([...malformedShas(MERGE_SHA), `${MERGE_SHA.slice(1)})`])(
    'refuses to link the malformed PR merge SHA %j before any API call',
    async sha => {
      const request = vi.fn<typeof fetch>()

      await expect(runPreviewCommand('comment', { ...commentEnv, PR_MERGE_SHA: sha }, request)).rejects.toThrow(
        'Invalid PR merge SHA'
      )
      expect(request).not.toHaveBeenCalled()
    }
  )
})

describe('preview cleanup', () => {
  it("collects every page before deleting only this PR's previews", async () => {
    const unrelated = [
      deployment('other-pr', 'pr-420'),
      deployment('production', 'pr-42', 'production'),
      deployment('legacy', 'preview')
    ]
    const { request, state } = cleanupApi([
      deployment('first'),
      unrelated[0],
      deployment('second'),
      unrelated[1],
      deployment('third'),
      unrelated[2]
    ])

    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).resolves.toBe(true)
    expect(state.deleted).toEqual(['first', 'second', 'third'])
    expect(state.deployments).toEqual(unrelated)
  })

  it('finds deployments that shift pages when another cleanup deletes during discovery', async () => {
    const { request, state } = cleanupApi([deployment('other-pr', 'pr-420'), deployment('first'), deployment('second')])
    const firstRequest = request.getMockImplementation()
    if (!firstRequest) throw new Error('Missing test API')
    request.mockImplementation(async (input, init) => {
      const response = await firstRequest(input, init)
      if (new URL(String(input)).searchParams.get('page') === '1') {
        state.deployments = state.deployments.filter(item => item.id !== 'other-pr')
      }
      return response
    })

    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).resolves.toBe(true)
    expect(state.deployments).toEqual([])
  })

  it("finds this PR's only deployment when a deletion elsewhere shifts it onto a page already read", async () => {
    const { request, state } = cleanupApi([
      deployment('timed-out', 'pr-420'),
      deployment('other-pr', 'pr-420'),
      deployment('first')
    ])
    const firstRequest = request.getMockImplementation()
    if (!firstRequest) throw new Error('Missing test API')
    request.mockImplementation(async (input, init) => {
      const response = await firstRequest(input, init)
      if (new URL(String(input)).searchParams.get('page') === '1') {
        state.deployments = state.deployments.filter(item => item.id !== 'timed-out')
      }
      return response
    })

    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).resolves.toBe(true)
    expect(state.deleted).toEqual(['first'])
    expect(state.deployments).toEqual([deployment('other-pr', 'pr-420')])
  })

  it('is idempotent after successful cleanup', async () => {
    const { request, state } = cleanupApi()

    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).resolves.toBe(true)
    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).resolves.toBe(true)
    expect(state.deleted).toEqual(['first'])
  })

  it('accepts a confirmed already-absent deployment', async () => {
    const { request, state } = cleanupApi()
    state.deleteStatus = 404

    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).resolves.toBe(true)
    expect(state.deployments).toEqual([])
  })

  it('reports delete failures while attempting the remaining deployments', async () => {
    const { request, state } = cleanupApi([deployment('first'), deployment('second')])
    state.deleteStatus = 500

    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).rejects.toThrow('HTTP 500')
    expect(state.deleted).toEqual(['first', 'second'])
  })

  it('rejects successful API responses that leave deployments behind', async () => {
    const { request, state } = cleanupApi()
    state.keepDeployment = true

    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).rejects.toThrow('remain after cleanup')
  })

  it('succeeds when the final pass deletes the last deployment that shifted listings hid', async () => {
    const { request, state } = cleanupApi([deployment('first'), deployment('second'), deployment('third')])
    const firstRequest = request.getMockImplementation()
    if (!firstRequest) throw new Error('Missing test API')
    request.mockImplementation(async (input, init) => {
      if (!String(input).includes('/deployments?')) return firstRequest(input, init)
      const page = new URL(String(input)).searchParams.get('page')
      return json({ result: page === '1' ? state.deployments.slice(0, 1) : [], success: true })
    })

    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).resolves.toBe(true)
    expect(state.deleted).toEqual(['first', 'second', 'third'])
    expect(state.deployments).toEqual([])
  })

  it('fails instead of paging forever when the deployments list never ends', async () => {
    const { request, state } = cleanupApi()
    const firstRequest = request.getMockImplementation()
    if (!firstRequest) throw new Error('Missing test API')
    request.mockImplementation(async (input, init) => {
      if (!String(input).includes('/deployments?')) return firstRequest(input, init)
      return json({ result: state.deployments, success: true })
    })

    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).rejects.toThrow('did not end within 200 pages')
    expect(state.deleted).toEqual([])
  })

  it('does not run delayed cleanup after a PR has reopened', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { request, state } = cleanupApi()
    state.pr.state = 'open'

    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).resolves.toBe(false)
    expect(state.deleted).toEqual([])
    expect(state.deployments).toEqual([deployment('first')])
    expect(log).toHaveBeenCalledWith('::notice::Skipped the PR #42 cleanup: the PR is open')
  })

  it('rechecks a PR that reopens during deployment discovery', async () => {
    const { request, state } = cleanupApi()
    const firstRequest = request.getMockImplementation()
    if (!firstRequest) throw new Error('Missing test API')
    request.mockImplementation(async (input, init) => {
      const response = await firstRequest(input, init)
      if (String(input).includes('/deployments?')) state.pr.state = 'open'
      return response
    })

    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).resolves.toBe(false)
    expect(state.deleted).toEqual([])
  })

  it('cleans a retargeted or conflicted PR without testing its current base', async () => {
    const { request, state } = cleanupApi()
    state.pr.base.ref = 'other'

    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).resolves.toBe(true)
    expect(state.deployments).toEqual([])
  })

  it('requires the trusted event before contacting an API', async () => {
    const request = vi.fn<typeof fetch>()

    await expect(runPreviewCommand('cleanup', env, request)).rejects.toThrow('pull_request_target event')
    expect(request).not.toHaveBeenCalled()
  })

  it('removes an upload that finishes after close and rejects a later obsolete deployment', async () => {
    const { request, state } = cleanupApi([])
    state.pr.state = 'open'
    await expect(runPreviewCommand('check', env, request)).resolves.toBe(true)

    state.pr.state = 'closed'
    state.deployments.push(deployment('finished-upload'))
    await expect(runPreviewCommand('comment', commentEnv, request)).resolves.toBe(false)
    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).resolves.toBe(true)
    await expect(runPreviewCommand('check', env, request)).resolves.toBe(false)
    expect(state.deployments).toEqual([])
  })

  it('marks the preview comment removed once no deployments remain', async () => {
    const { request, state } = cleanupApi()
    state.comments = [botComment()]

    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).resolves.toBe(true)
    expect(state.deployments).toEqual([])
    expect(state.commentEdits).toEqual([{ body: expect.stringContaining('removed') as unknown, id: '123' }])
    expect(JSON.parse(state.commentEdits[0].body)).toEqual({
      body: expect.stringMatching(/^<!-- pages-pr-preview -->/) as unknown
    })
  })

  it('leaves the comment to the next preview when the PR reopens before it is marked', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { request, state } = cleanupApi()
    state.comments = [botComment()]
    const firstRequest = request.getMockImplementation()
    if (!firstRequest) throw new Error('Missing test API')
    request.mockImplementation(async (input, init) => {
      const response = await firstRequest(input, init)
      if (new URL(String(input)).pathname.endsWith('/comments')) state.pr.state = 'open'
      return response
    })

    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).resolves.toBe(false)
    expect(state.deployments).toEqual([])
    expect(state.commentEdits).toEqual([])
    expect(log).toHaveBeenCalledWith('::notice::Skipped the PR #42 comment update: the PR is open')
  })

  it('preserves deployments when the PR belongs to a fork', async () => {
    const { request, state } = cleanupApi()
    state.pr.head.repo.full_name = 'someone/fork'

    await expect(runPreviewCommand('cleanup', cleanupEnv, request)).resolves.toBe(false)
    expect(state.deleted).toEqual([])
  })
})

const workflow = (name: string) => readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8')

function workflowJob(text: string, name: string) {
  const start = text.indexOf(`\n  ${name}:\n`)
  if (start === -1) throw new Error(`Missing ${name} job`)
  const end = text.slice(start + 1).search(/\n {2}[\w-]+:\n/)
  return end === -1 ? text.slice(start) : text.slice(start, start + 1 + end)
}

describe('preview mutation queue', () => {
  it.each([
    ['ci.yaml', 'preview'],
    ['preview-cleanup.yaml', 'cleanup']
  ])('%s queues the %s job behind the other preview mutations for its PR', (file, job) => {
    expect(workflowJob(workflow(file), job)).toContain(
      [
        '    concurrency:',
        // eslint-disable-next-line no-template-curly-in-string -- a GitHub Actions expression, not a template
        '      group: pages-preview-pr-${{ github.event.pull_request.number }}',
        '      cancel-in-progress: false',
        '      queue: max'
      ].join('\n')
    )
  })

  it('queues cleanups without cancelling one another', () => {
    expect(workflow('preview-cleanup.yaml')).toContain(
      ['concurrency:', '  group: pages-preview-cleanup', '  cancel-in-progress: false', '  queue: max'].join('\n')
    )
  })
})

describe('production deploy', () => {
  it('queues deploys without dropping one and skips a commit main has moved past', () => {
    const job = workflowJob(workflow('ci.yaml'), 'deploy')
    expect(job).toContain(
      ['    concurrency:', '      group: pages-production', '      cancel-in-progress: false', '      queue: max'].join(
        '\n'
      )
    )
    expect(job).toContain("if: steps.head.outputs.current == 'true'")
  })
})
