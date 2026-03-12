#!/bin/sh
set -eu

PW_VERSION=$(node -p "require('./package.json').devDependencies['@playwright/test']")
IMAGE="mcr.microsoft.com/playwright:v${PW_VERSION}-noble"

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker is required for tests." >&2
  exit 1
fi

if [ $# -eq 0 ]; then
  set -- tests/e2e tests/visual
fi

EXIT_CODE=0
docker run --rm \
  --ipc=host \
  -v "$(pwd):/work" \
  -v drimchansky-playwright-node-modules:/work/node_modules \
  -v drimchansky-playwright-pnpm-store:/root/.local/share/pnpm/store/v10 \
  -w /work \
  -e SITE_URL=http://localhost:4321 \
  -e TESTING=true \
  -e CI="${CI:-}" \
  "$IMAGE" \
  sh -c 'corepack enable && corepack install && pnpm install --frozen-lockfile && pnpm build && pnpm exec playwright test "$@"' \
  -- "$@" || EXIT_CODE=$?

if [ "$EXIT_CODE" -ne 0 ] && [ -z "${CI:-}" ]; then
  pnpm exec playwright show-report
fi

exit "$EXIT_CODE"
