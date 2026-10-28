import { appendFileSync } from 'node:fs'

const REPOSITORY = 'drimchansky/drimchansky.dev'
const PROJECT = 'drimchansky-dev'
const REQUEST_TIMEOUT_MS = 30_000
const COMMENT_MARKER = '<!-- pages-pr-preview -->'
const COMMENTS_PER_PAGE = 100
// Cloudflare's Pages deployments list rejects per_page above 25 with HTTP 400.
const DEPLOYMENTS_PER_PAGE = 25
const MAX_DEPLOYMENT_PAGES = 200
const CLEANUP_PASSES = 3
const DEPLOYMENT_STATUS_ATTEMPTS = 24
const DEPLOYMENT_STATUS_DELAY_MS = 5_000

type Environment = Record<string, string | undefined>
type PreviewContext = {
  env: Environment
  number: number
  request: typeof fetch
}

const requireRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Invalid API response')
  return { ...value }
}

const required = (env: Environment, name: string) => {
  const value = env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

const withDetail = (message: string, detail: string) => (detail ? `${message}: ${detail}` : message)

async function errorBody(response: Response): Promise<Record<string, unknown>> {
  try {
    return requireRecord(JSON.parse(await response.text()))
  } catch {
    return {}
  }
}

function cloudflareErrors(body: Record<string, unknown>) {
  const errors: unknown[] = Array.isArray(body.errors) ? body.errors : []
  return errors
    .flatMap(error => {
      if (typeof error !== 'object' || error === null || !('code' in error) || !('message' in error)) return []
      const { code, message } = error
      return typeof code === 'number' && typeof message === 'string' ? [`${code} ${message}`] : []
    })
    .join('; ')
}

async function github(context: PreviewContext, path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await context.request(`https://api.github.com/repos/${REPOSITORY}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${required(context.env, 'GITHUB_TOKEN')}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    redirect: 'error',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })
  if (!response.ok) {
    const { message } = await errorBody(response)
    const detail = typeof message === 'string' ? message : ''
    throw new Error(withDetail(`GitHub request failed (HTTP ${response.status})`, detail))
  }
  return response.json()
}

async function cloudflare(context: PreviewContext, path = '', init: RequestInit = {}): Promise<unknown> {
  const account = encodeURIComponent(required(context.env, 'CLOUDFLARE_ACCOUNT_ID'))
  const response = await context.request(
    `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${PROJECT}${path}`,
    {
      ...init,
      headers: { Authorization: `Bearer ${required(context.env, 'CLOUDFLARE_API_TOKEN')}` },
      redirect: 'error',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    }
  )
  if (response.status === 404 && init.method === 'DELETE') return null
  if (!response.ok) {
    const detail = cloudflareErrors(await errorBody(response))
    throw new Error(withDetail(`Cloudflare request failed (HTTP ${response.status})`, detail))
  }
  const body = requireRecord(await response.json())
  if (body.success !== true) throw new Error(withDetail('Cloudflare request was unsuccessful', cloudflareErrors(body)))
  return body.result
}

function skip(context: PreviewContext, reason: string, action = 'preview') {
  console.log(`::notice::Skipped the PR #${context.number} ${action}: ${reason}`)
  return false
}

async function newerRunExists(context: PreviewContext, headRef: unknown) {
  const sha = required(context.env, 'PR_HEAD_SHA')
  // Runs for one head SHA come only from PRs at that commit, their reopens and pushes back to it,
  // so one page holds them all. Only this PR's branch in this repository supersedes this run.
  const runs = requireRecord(
    await github(context, `/actions/workflows/ci.yaml/runs?event=pull_request&head_sha=${sha}&per_page=100`)
  ).workflow_runs
  if (!Array.isArray(runs)) throw new Error('Invalid workflow runs response')
  const runNumber = Number(required(context.env, 'GITHUB_RUN_NUMBER'))
  return runs.some(value => {
    const run = requireRecord(value)
    const repository = run.head_repository === null ? {} : requireRecord(run.head_repository)
    return run.head_branch === headRef && repository.full_name === REPOSITORY && Number(run.run_number) > runNumber
  })
}

async function currentPreviewMismatch(context: PreviewContext) {
  const pr = requireRecord(await github(context, `/pulls/${context.number}`))
  const head = requireRecord(pr.head)
  const base = requireRecord(pr.base)
  if (pr.state !== 'open') return `the PR is ${String(pr.state)}`
  if (base.ref !== 'main' || requireRecord(base.repo).full_name !== REPOSITORY) return 'the PR no longer targets main'
  if (requireRecord(head.repo).full_name !== REPOSITORY) return 'the head branch is not in this repository'
  if (head.sha !== required(context.env, 'PR_HEAD_SHA')) return 'a newer push superseded this run'
  if (await newerRunExists(context, head.ref)) return 'a newer run superseded this run'
}

async function previewMismatch(context: PreviewContext, state: 'open' | 'closed') {
  const pr = requireRecord(await github(context, `/pulls/${context.number}`))
  if (pr.state !== state) return `the PR is ${String(pr.state)}`
  if (requireRecord(requireRecord(pr.head).repo).full_name !== REPOSITORY) {
    return 'the head branch is not in this repository'
  }
}

async function checkPreview(context: PreviewContext) {
  const mismatch = await currentPreviewMismatch(context)
  if (mismatch) return skip(context, mismatch)
  const project = requireRecord(await cloudflare(context))
  if (project.production_branch !== 'main') throw new Error('Pages production branch must be main')
  if (project.source !== undefined && project.source !== null) {
    const config = requireRecord(requireRecord(project.source).config)
    if (config.deployments_enabled !== false && config.preview_deployment_setting !== 'none') {
      throw new Error('Disable independent Pages Git preview deployments before using PR previews')
    }
  }
  return true
}

async function confirmDeployment(context: PreviewContext) {
  const id = encodeURIComponent(required(context.env, 'DEPLOYMENT_ID'))
  for (let attempt = 1; ; attempt++) {
    const stage = requireRecord(requireRecord(await cloudflare(context, `/deployments/${id}`)).latest_stage)
    if (stage.name === 'deploy' && stage.status === 'success') return
    const unconfirmed = `Preview deployment not confirmed (${String(stage.name)}: ${String(stage.status)})`
    if (stage.status === 'failure' || stage.status === 'canceled') throw new Error(unconfirmed)
    if (attempt === DEPLOYMENT_STATUS_ATTEMPTS) {
      // Cloudflare can still finish this deployment after the job ends and move the alias past the comment.
      try {
        await cloudflare(context, `/deployments/${id}?force=true`, { method: 'DELETE' })
      } catch (error) {
        throw new Error(
          `${unconfirmed}; deleting it failed: ${error instanceof Error ? error.message : 'request failed'}`
        )
      }
      throw new Error(`${unconfirmed}; deleted it`)
    }
    await new Promise(resolve => setTimeout(resolve, DEPLOYMENT_STATUS_DELAY_MS))
  }
}

async function findPreviewCommentId(context: PreviewContext): Promise<number | undefined> {
  for (let page = 1; ; page++) {
    const comments = await github(
      context,
      `/issues/${context.number}/comments?per_page=${COMMENTS_PER_PAGE}&page=${page}`
    )
    if (!Array.isArray(comments)) throw new Error('Invalid comments response')
    for (const value of comments) {
      const comment = requireRecord(value)
      const user = comment.user === null ? {} : requireRecord(comment.user)
      if (
        typeof comment.body === 'string' &&
        comment.body.startsWith(COMMENT_MARKER) &&
        user.login === 'github-actions[bot]' &&
        user.type === 'Bot' &&
        typeof comment.id === 'number'
      ) {
        return comment.id
      }
    }
    if (comments.length < COMMENTS_PER_PAGE) return undefined
  }
}

async function publishComment(context: PreviewContext) {
  if (context.env.DEPLOYMENT_ENVIRONMENT !== 'preview') throw new Error('Expected a preview deployment')
  const sha = required(context.env, 'PR_MERGE_SHA')
  const url = new URL(context.env.PREVIEW_URL || required(context.env, 'DEPLOYMENT_URL'))
  if (url.protocol !== 'https:' || !url.hostname.endsWith(`.${PROJECT}.pages.dev`) || url.username || url.password) {
    throw new Error('Unexpected preview URL')
  }
  await confirmDeployment(context)
  const mismatch = await previewMismatch(context, 'open')
  if (mismatch) return skip(context, mismatch)

  const commentId = await findPreviewCommentId(context)

  const laterMismatch = await previewMismatch(context, 'open')
  if (laterMismatch) return skip(context, laterMismatch)
  const body = `${COMMENT_MARKER}\n### Preview deployment\n\n[Open preview](${url.href})\n\nBuilt from [\`${sha.slice(0, 7)}\`](https://github.com/${REPOSITORY}/commit/${sha}).`
  await github(
    context,
    commentId === undefined ? `/issues/${context.number}/comments` : `/issues/comments/${commentId}`,
    { body: JSON.stringify({ body }), method: commentId === undefined ? 'POST' : 'PATCH' }
  )
  return true
}

async function findPreviewDeployments(context: PreviewContext) {
  const ids = new Set<string>()
  for (let page = 1; page <= MAX_DEPLOYMENT_PAGES; page++) {
    const deployments = await cloudflare(
      context,
      `/deployments?env=preview&per_page=${DEPLOYMENTS_PER_PAGE}&page=${page}`
    )
    if (!Array.isArray(deployments)) throw new Error('Invalid deployments response')
    if (deployments.length === 0) return [...ids]
    for (const value of deployments) {
      const deployment = requireRecord(value)
      if (deployment.environment !== 'preview') continue
      const metadata = requireRecord(requireRecord(deployment.deployment_trigger).metadata)
      if (metadata.branch !== `pr-${context.number}`) continue
      if (typeof deployment.id !== 'string' || !deployment.id) throw new Error('Invalid deployment ID')
      ids.add(deployment.id)
    }
  }
  throw new Error(`Deployments list did not end within ${MAX_DEPLOYMENT_PAGES} pages`)
}

// A deletion elsewhere can shift a deployment onto a page a scan already read, so an empty scan is repeated once.
async function findRemainingPreviewDeployments(context: PreviewContext) {
  const ids = await findPreviewDeployments(context)
  return ids.length ? ids : findPreviewDeployments(context)
}

async function markPreviewRemoved(context: PreviewContext) {
  const commentId = await findPreviewCommentId(context)
  if (commentId === undefined) return true
  const mismatch = await previewMismatch(context, 'closed')
  if (mismatch) return skip(context, mismatch, 'comment update')
  const body = `${COMMENT_MARKER}\n### Preview deployment\n\nThe preview was removed when this PR closed.`
  await github(context, `/issues/comments/${commentId}`, { body: JSON.stringify({ body }), method: 'PATCH' })
  return true
}

async function cleanupPreview(context: PreviewContext) {
  for (let pass = 1; pass <= CLEANUP_PASSES; pass++) {
    const mismatch = await previewMismatch(context, 'closed')
    if (mismatch) return skip(context, mismatch, 'cleanup')
    const ids = await findRemainingPreviewDeployments(context)
    if (!ids.length) return markPreviewRemoved(context)
    const laterMismatch = await previewMismatch(context, 'closed')
    if (laterMismatch) return skip(context, laterMismatch, 'cleanup')
    const failures: string[] = []
    for (const id of ids) {
      try {
        await cloudflare(context, `/deployments/${encodeURIComponent(id)}?force=true`, { method: 'DELETE' })
      } catch (error) {
        failures.push(`${id}: ${error instanceof Error ? error.message : 'request failed'}`)
      }
    }
    if (failures.length) throw new Error(`Preview cleanup failed: ${failures.join('; ')}`)
  }
  if ((await findRemainingPreviewDeployments(context)).length) {
    throw new Error('Preview deployments remain after cleanup')
  }
  return markPreviewRemoved(context)
}

export async function runPreviewCommand(command: string, env: Environment = process.env, request = fetch) {
  if (env.GITHUB_REPOSITORY !== REPOSITORY) throw new Error('Unexpected repository')
  const number = Number(required(env, 'PR_NUMBER'))
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error('Invalid PR number')
  const context = { env, number, request }
  if (command === 'cleanup') {
    if (env.GITHUB_EVENT_NAME !== 'pull_request_target') throw new Error('Cleanup requires a pull_request_target event')
    return cleanupPreview(context)
  }
  if (command !== 'check' && command !== 'comment') throw new Error('Unknown preview command')
  if (env.GITHUB_EVENT_NAME !== 'pull_request') throw new Error('Preview requires a pull_request event')
  if (command === 'check') {
    if (!/^[a-f0-9]{40}$/.test(required(env, 'PR_HEAD_SHA'))) throw new Error('Invalid PR head SHA')
    if (!/^[1-9]\d*$/.test(required(env, 'GITHUB_RUN_NUMBER'))) throw new Error('Invalid run number')
    return checkPreview(context)
  }
  if (!/^[a-f0-9]{40}$/.test(required(env, 'PR_MERGE_SHA'))) throw new Error('Invalid PR merge SHA')
  return publishComment(context)
}

export async function runPreviewCli(command: string, env: Environment = process.env, request = fetch) {
  const result = await runPreviewCommand(command, env, request)
  if (command === 'check') appendFileSync(required(env, 'GITHUB_OUTPUT'), `eligible=${result}\n`)
}

if (import.meta.main) await runPreviewCli(process.argv[2] ?? '')
