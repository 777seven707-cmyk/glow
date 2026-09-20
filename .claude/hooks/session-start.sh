#!/bin/bash
set -euo pipefail

# Only needed in Claude Code on the web / remote sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if command -v uv >/dev/null 2>&1; then
  uv tool install graphifyy
elif command -v pipx >/dev/null 2>&1; then
  pipx install graphifyy
else
  pip install --user graphifyy
fi
