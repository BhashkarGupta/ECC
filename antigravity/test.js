'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ANTIGRAVITY_DIR = __dirname;
const { adaptAgent, resolveDefaultPluginDir } = require('./install');
const { mapToolCallToClaude, handlePreToolUse } = require('./hook-bridge');
const { auditAgents, auditSkills, auditRules } = require('./audit');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed += 1;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
    failed += 1;
  }
}

console.log('=== Running Antigravity Self-Contained Tests ===\n');

test('antigravity/plugin.json exists and has valid metadata', () => {
  const p = path.join(ANTIGRAVITY_DIR, 'plugin.json');
  assert.ok(fs.existsSync(p));
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.strictEqual(data.name, 'ecc');
  assert.strictEqual(data.category, 'Developer Tools');
  assert.ok(data.description);
});

test('antigravity/hooks.json exists and has lifecycle events', () => {
  const p = path.join(ANTIGRAVITY_DIR, 'hooks.json');
  assert.ok(fs.existsSync(p));
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.ok(data['ecc-lifecycle']);
  assert.strictEqual(data['ecc-lifecycle'].enabled, true);
  assert.ok(Array.isArray(data['ecc-lifecycle'].SessionStart));
  assert.ok(Array.isArray(data['ecc-lifecycle'].PreToolUse));
  assert.ok(Array.isArray(data['ecc-lifecycle'].PostToolUse));
});

test('adaptAgent correctly transforms tools and sets kind: local', () => {
  const sample = [
    '---',
    'name: test-agent',
    'description: Test agent description',
    'tools: Read, Write, Bash, WebSearch',
    'model: sonnet',
    'color: teal',
    '---',
    '',
    '# Role',
    'Do something.',
  ].join('\n');

  const adapted = adaptAgent(sample);
  assert.ok(adapted.includes('name: test-agent'));
  assert.ok(adapted.includes('kind: local'));
  assert.ok(adapted.includes('model: pro'));
  assert.ok(adapted.includes('max_turns: 30'));
  assert.ok(adapted.includes('- read_file'));
  assert.ok(adapted.includes('- write_file'));
  assert.ok(adapted.includes('- run_command'));
  assert.ok(adapted.includes('- search_web'));
  assert.ok(!adapted.includes('color:'));
  assert.ok(adapted.includes('# Role'));
});

test('hook-bridge maps tool calls and handles pre-tool check safely', () => {
  const call = { name: 'run_command', args: { CommandLine: 'git status' } };
  const mapped = mapToolCallToClaude(call);
  assert.strictEqual(mapped.tool_name, 'Bash');
  assert.strictEqual(mapped.tool_input.command, 'git status');

  const res = handlePreToolUse({ toolCall: call }, path.resolve(ANTIGRAVITY_DIR, '..'));
  assert.strictEqual(res.decision, 'allow');
});

test('resolveDefaultPluginDir resolves to ~/.gemini/config/plugins/ecc', () => {
  const dir = resolveDefaultPluginDir();
  assert.ok(dir.endsWith(path.join('.gemini', 'config', 'plugins', 'ecc')));
});

test('parseArgs parses project scope and profiles properly', () => {
  const { parseArgs } = require('./install');
  const globalOpts = parseArgs([]);
  assert.strictEqual(globalOpts.scope, 'global');
  assert.strictEqual(globalOpts.profile, 'full');
  assert.strictEqual(globalOpts.hooks, 'standard');

  const projOpts = parseArgs(['--scope', 'project', '--profile', 'minimal', '--no-hooks']);
  assert.strictEqual(projOpts.scope, 'project');
  assert.strictEqual(projOpts.profile, 'minimal');
  assert.strictEqual(projOpts.hooks, 'off');
  assert.ok(projOpts.dest.endsWith('.agents'));
});

test('audit verifies all agents, skills, and rules', () => {
  const agents = auditAgents();
  assert.ok(agents.checked >= 71);
  assert.strictEqual(agents.issues.length, 0);

  const skills = auditSkills();
  assert.ok(skills.checked >= 314);
  assert.strictEqual(skills.issues.length, 0);

  const rules = auditRules();
  assert.strictEqual(rules.issues.length, 0);
});

console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
