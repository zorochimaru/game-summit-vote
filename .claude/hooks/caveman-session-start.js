// SessionStart hook: inject the caveman skill as additional context.
const fs = require('fs');
const path = require('path');

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const content = fs.readFileSync(
  path.join(root, '.claude', 'skills', 'caveman', 'SKILL.md'),
  'utf8'
);

process.stdout.write(
  JSON.stringify({
    systemMessage: 'Caveman mode active.',
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: 'Caveman skill loaded:\n' + content
    }
  })
);
