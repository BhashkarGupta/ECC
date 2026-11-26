#!/usr/bin/env node
'use strict';

/**
 * Antigravity Hook Bridge
 *
 * Bridges Google Antigravity's camelCase lifecycle hook protocol:
 *   - PreToolUse (stdin: { toolCall: { name, args }, conversationId, ... })
 *   - PostToolUse (stdin: { toolCall: { name, args }, error, ... })
 *   - SessionStart (stdin: { conversationId, workspacePaths, ... })
 *
 * Translates them to ECC's internal hook dispatcher contracts and emits
 * valid Antigravity JSON on stdout:
 *   - PreToolUse: { decision: "allow" | "deny", reason?: string }
 *   - PostToolUse: {}
 *   - SessionStart: { injectSteps?: [...] }
 *
 * Failsafe: Never crashes or blocks Antigravity on internal errors.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function safeParseJson(raw) {
  if (!raw || !raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function resolvePluginRoot() {
  if (process.env.PLUGIN_ROOT && fs.existsSync(process.env.PLUGIN_ROOT)) {
    return path.resolve(process.env.PLUGIN_ROOT);
  }
  let current = __dirname;
  for (let i = 0; i < 5; i += 1) {
    if (fs.existsSync(path.join(current, 'package.json')) && fs.existsSync(path.join(current, 'skills'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return process.cwd();
}

function mapToolCallToClaude(toolCall) {
  if (!toolCall || typeof toolCall !== 'object') {
    return { tool_name: 'unknown', tool_input: {} };
  }

  const name = toolCall.name || '';
  const args = toolCall.args || {};

  switch (name) {
    case 'run_command':
      return {
        tool_name: 'Bash',
        tool_input: {
          command: args.CommandLine || args.command || '',
        },
      };
    case 'read_file':
    case 'view_file':
      return {
        tool_name: 'Read',
        tool_input: {
          file_path: args.Path || args.path || args.file_path || '',
        },
      };
    case 'write_file':
    case 'write_to_file':
      return {
        tool_name: 'Write',
        tool_input: {
          file_path: args.Path || args.path || args.file_path || '',
          content: args.Content || args.content || '',
        },
      };
    case 'edit_file':
    case 'replace_file_content':
      return {
        tool_name: 'Edit',
        tool_input: {
          file_path: args.Path || args.path || args.file_path || '',
          old_string: args.Target || args.target || '',
          new_string: args.Replacement || args.replacement || '',
        },
      };
    default:
      return {
        tool_name: name,
        tool_input: args,
      };
  }
}

function handlePreToolUse(inputPayload, eccRoot) {
  const toolCall = inputPayload.toolCall || {};
  const mapped = mapToolCallToClaude(toolCall);

  if (mapped.tool_name === 'Bash') {
    const preBashScript = path.join(eccRoot, 'scripts', 'hooks', 'pre-bash-dispatcher.js');
    if (fs.existsSync(preBashScript)) {
      try {
        const translatedStdin = JSON.stringify({
          tool_name: 'Bash',
          tool_input: mapped.tool_input,
          session_id: inputPayload.conversationId || 'antigravity-session',
        });

        const result = spawnSync(process.execPath, [preBashScript], {
          input: translatedStdin,
          encoding: 'utf8',
          cwd: eccRoot,
          env: {
            ...process.env,
            CLAUDE_PLUGIN_ROOT: eccRoot,
          },
        });

        if (result.status === 2) {
          return {
            decision: 'deny',
            reason: result.stdout ? result.stdout.trim() : 'Blocked by ECC safety check.',
          };
        }
      } catch {
        // Fall through to allow on error
      }
    }
  }

  return { decision: 'allow' };
}

function handleSessionStart(inputPayload, eccRoot) {
  const bootstrapScript = path.join(eccRoot, 'scripts', 'hooks', 'session-start-bootstrap.js');
  if (fs.existsSync(bootstrapScript)) {
    try {
      spawnSync(process.execPath, [bootstrapScript], {
        input: JSON.stringify(inputPayload),
        encoding: 'utf8',
        cwd: eccRoot,
        env: {
          ...process.env,
          CLAUDE_PLUGIN_ROOT: eccRoot,
        },
      });
    } catch {
      // Ignored
    }
  }

  return {};
}

function main() {
  const event = process.argv[2] || 'PreToolUse';
  const rawInput = readStdin();
  const inputPayload = safeParseJson(rawInput);
  const eccRoot = resolvePluginRoot();

  let response = {};

  try {
    switch (event) {
      case 'PreToolUse':
        response = handlePreToolUse(inputPayload, eccRoot);
        break;
      case 'PostToolUse':
        response = {};
        break;
      case 'SessionStart':
        response = handleSessionStart(inputPayload, eccRoot);
        break;
      default:
        response = {};
        break;
    }
  } catch {
    if (event === 'PreToolUse') {
      response = { decision: 'allow' };
    } else {
      response = {};
    }
  }

  process.stdout.write(JSON.stringify(response) + '\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  mapToolCallToClaude,
  handlePreToolUse,
  handleSessionStart,
  resolvePluginRoot,
};
