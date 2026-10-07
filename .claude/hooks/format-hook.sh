#!/bin/bash

# Read stdin (JSON input from PostToolUse hook)
INPUT=$(cat)

# Extract fields with node (jq is not installed on this machine)
json_field() {
  printf '%s' "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const v=$1;process.stdout.write(v==null?'':String(v))}catch{}})"
}

FILE_PATH=$(json_field 'JSON.parse(d).tool_input?.file_path')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Run eslint and prettier on the changed file.
# Anchor to project root (always has node_modules); fall back to session cwd.
ROOT="${CLAUDE_PROJECT_DIR:-$(json_field 'JSON.parse(d).cwd')}"
cd "$ROOT" 2>/dev/null || true
./node_modules/.bin/eslint --fix "$FILE_PATH" 2>/dev/null
./node_modules/.bin/prettier --write --ignore-unknown "$FILE_PATH" 2>/dev/null
exit 0
