#!/bin/bash
if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  exit 0
fi

export PATH="/opt/node26/bin:$PATH"
cd "$CLAUDE_PROJECT_DIR"

# Mirrors the repo's own "takeoff" script
FORCE_COLOR=2 pnpm install --prefer-offline --reporter=append-only

exit 0
