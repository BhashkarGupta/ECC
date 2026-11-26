#!/usr/bin/env node
'use strict';

/**
 * ECC Antigravity Installer & Synchronizer
 *
 * Supports both:
 *   1. Global Plugin Mode (Default):
 *      node antigravity/install.js
 *      Installs into ~/.gemini/config/plugins/ecc/ (available across all projects).
 *
 *   2. Project-Specific Workspace Mode:
 *      node antigravity/install.js --scope project [--project /path/to/project]
 *      Installs into <project>/.agents/ (version-controlled within that repo).
 *
 * Supports Profiles:
 *   --profile full (default) | minimal | developer | security
 *
 * Supports Language Filtering:
 *   --languages typescript,python,go
 *
 * Supports Hooks Control:
 *   --no-hooks | --hooks off|standard|strict
 *
 * Zero external dependencies — runs directly with vanilla Node.js.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const ANTIGRAVITY_DIR = __dirname;
const REPO_ROOT = path.resolve(ANTIGRAVITY_DIR, '..');
const AGENTS_SRC = path.join(REPO_ROOT, 'agents');
const SKILLS_SRC = path.join(REPO_ROOT, 'skills');
const RULES_SRC = path.join(REPO_ROOT, 'rules');
const MANIFEST_SRC = path.join(ANTIGRAVITY_DIR, 'plugin.json');
const HOOKS_SRC = path.join(ANTIGRAVITY_DIR, 'hooks.json');
const BRIDGE_SRC = path.join(ANTIGRAVITY_DIR, 'hook-bridge.js');
const AGENTS_MD_SRC = path.join(REPO_ROOT, 'AGENTS.md');
const GEMINI_MD_SRC = path.join(REPO_ROOT, '.gemini', 'GEMINI.md');

const PROFILES_FILE = path.join(REPO_ROOT, 'manifests', 'install-profiles.json');
const MODULES_FILE = path.join(REPO_ROOT, 'manifests', 'install-modules.json');

const TOOL_MAP = {
  Read: 'read_file',
  ReadFile: 'read_file',
  NotebookRead: 'read_file',
  Write: 'write_file',
  Edit: 'edit_file',
  MultiEdit: 'edit_file',
  Grep: 'grep_search',
  Glob: 'find_by_name',
  Bash: 'run_command',
  WebSearch: 'search_web',
  WebFetch: 'search_web',
};

const MODEL_MAP = {
  haiku: 'flash',
  sonnet: 'pro',
  opus: 'pro',
};

function resolveDefaultGlobalDir() {
  return path.join(os.homedir(), '.gemini', 'config', 'plugins', 'ecc');
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    copy: false,
    scope: 'global', // 'global' or 'project'
    projectRoot: process.cwd(),
    dest: null,
    profile: 'full', // 'full', 'minimal', 'developer', 'security'
    languages: null, // array of strings or null
    hooks: 'standard', // 'standard', 'strict', 'off'
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--copy') {
      options.copy = true;
    } else if (arg === '--scope' && argv[i + 1]) {
      options.scope = argv[i + 1].toLowerCase();
      i += 1;
    } else if (arg === '--project') {
      options.scope = 'project';
      if (argv[i + 1] && !argv[i + 1].startsWith('-')) {
        options.projectRoot = path.resolve(argv[i + 1]);
        i += 1;
      }
    } else if (arg === '--dest' && argv[i + 1]) {
      options.dest = path.resolve(argv[i + 1]);
      i += 1;
    } else if (arg === '--profile' && argv[i + 1]) {
      options.profile = argv[i + 1].toLowerCase();
      i += 1;
    } else if (arg === '--languages' && argv[i + 1]) {
      options.languages = argv[i + 1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      i += 1;
    } else if (arg === '--no-hooks') {
      options.hooks = 'off';
    } else if (arg === '--hooks' && argv[i + 1]) {
      options.hooks = argv[i + 1].toLowerCase();
      i += 1;
    }
  }

  if (!options.dest) {
    if (options.scope === 'project') {
      options.dest = path.join(options.projectRoot, '.agents');
    } else {
      options.dest = resolveDefaultGlobalDir();
    }
  }

  return options;
}

function ensureDir(dir, dryRun) {
  if (!fs.existsSync(dir) && !dryRun) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function adaptAgent(content) {
  const match = content.match(/^---(\r?\n)([\s\S]*?)\r?\n---(\r?\n)([\s\S]*)$/);
  if (!match) return content;

  const headerEol = match[1];
  const yamlContent = match[2];
  const trailingEol = match[3];
  const body = match[4];

  const lines = yamlContent.split(/\r?\n/);
  const adaptedLines = [];
  let inTools = false;
  const tools = new Set();
  let modelVal = null;
  let nameVal = null;
  let descVal = null;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('name:')) {
      nameVal = trimmed.slice(5).trim();
    } else if (trimmed.startsWith('description:')) {
      descVal = trimmed.slice(12).trim();
    } else if (trimmed.startsWith('model:')) {
      const rawModel = trimmed.slice(6).trim();
      modelVal = MODEL_MAP[rawModel] || rawModel;
    } else if (trimmed.startsWith('tools:')) {
      inTools = true;
      const rest = trimmed.slice(6).trim();
      if (rest) {
        rest.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).forEach(t => {
          if (TOOL_MAP[t]) tools.add(TOOL_MAP[t]);
          else if (t) tools.add(t);
        });
      }
    } else if (inTools && trimmed.startsWith('-')) {
      const tool = trimmed.slice(1).trim().replace(/^['"]|['"]$/g, '');
      if (TOOL_MAP[tool]) tools.add(TOOL_MAP[tool]);
      else if (tool) tools.add(tool);
    } else if (trimmed.startsWith('color:')) {
      // Strip color
    } else {
      inTools = false;
      adaptedLines.push(line);
    }
  }

  const result = ['---'];
  if (nameVal) result.push(`name: ${nameVal}`);
  if (descVal) result.push(`description: ${descVal}`);
  result.push('kind: local');
  result.push(`model: ${modelVal || 'inherit'}`);
  result.push('max_turns: 30');

  if (tools.size > 0) {
    result.push('tools:');
    for (const t of tools) {
      result.push(`  - ${t}`);
    }
  }

  for (const extra of adaptedLines) {
    result.push(extra);
  }

  result.push('---');
  return result.join(headerEol) + trailingEol + body;
}

function resolveIncludedSkills(profile, languages) {
  if (profile === 'full' && !languages) return null; // null means include all

  const allowedSkills = new Set();

  // Core skills for minimal profile
  const minimalSkills = [
    'test-driven-development', 'tdd-workflow', 'executing-plans',
    'brainstorming', 'writing-plans', 'systematic-debugging',
    'receiving-code-review', 'requesting-code-review', 'verification-loop',
    'codebase-onboarding', 'coding-standards', 'git-workflow',
  ];

  minimalSkills.forEach(s => allowedSkills.add(s));

  if (profile === 'developer' || profile === 'full') {
    const devSkills = [
      'backend-patterns', 'frontend-patterns', 'api-design',
      'postgres-patterns', 'mysql-patterns', 'docker-patterns',
      'performance-optimizer', 'refactor-cleaner',
    ];
    devSkills.forEach(s => allowedSkills.add(s));
  }

  if (profile === 'security' || profile === 'full') {
    const secSkills = [
      'security-review', 'threat-intelligence', 'hipaa-compliance',
    ];
    secSkills.forEach(s => allowedSkills.add(s));
  }

  // Language specific skills if requested
  if (languages && languages.length > 0) {
    if (fs.existsSync(SKILLS_SRC)) {
      const allSkills = fs.readdirSync(SKILLS_SRC);
      for (const s of allSkills) {
        for (const lang of languages) {
          if (s.toLowerCase().includes(lang)) {
            allowedSkills.add(s);
          }
        }
      }
    }
  }

  return allowedSkills;
}

function syncAgents(destDir, dryRun) {
  const agentsDest = path.join(destDir, 'agents');
  ensureDir(agentsDest, dryRun);

  if (!fs.existsSync(AGENTS_SRC)) return 0;
  const files = fs.readdirSync(AGENTS_SRC).filter(f => f.endsWith('.md'));
  let count = 0;

  for (const file of files) {
    const srcPath = path.join(AGENTS_SRC, file);
    const destPath = path.join(agentsDest, file);
    const raw = fs.readFileSync(srcPath, 'utf8');
    const adapted = adaptAgent(raw);

    if (!dryRun) {
      fs.writeFileSync(destPath, adapted, 'utf8');
    }
    count += 1;
  }

  return count;
}

function syncSkills(destDir, options) {
  const skillsDest = path.join(destDir, 'skills');
  ensureDir(skillsDest, options.dryRun);

  const includedSet = resolveIncludedSkills(options.profile, options.languages);

  if (!includedSet && !options.copy && options.scope === 'global') {
    // Fast path for full global install: symlink the entire skills folder
    if (fs.existsSync(skillsDest)) {
      if (!options.dryRun) fs.rmSync(skillsDest, { recursive: true, force: true });
    }
    if (!options.dryRun) {
      try {
        fs.symlinkSync(SKILLS_SRC, skillsDest, 'junction');
      } catch {
        fs.cpSync(SKILLS_SRC, skillsDest, { recursive: true });
      }
    }
    return 314;
  }

  // Selective or copy install
  const entries = fs.readdirSync(SKILLS_SRC).filter(e => {
    return fs.statSync(path.join(SKILLS_SRC, e)).isDirectory();
  });

  let count = 0;
  for (const entry of entries) {
    if (includedSet && !includedSet.has(entry)) continue;

    const src = path.join(SKILLS_SRC, entry);
    const dst = path.join(skillsDest, entry);

    if (!options.dryRun) {
      if (options.copy) {
        fs.cpSync(src, dst, { recursive: true });
      } else {
        try {
          fs.symlinkSync(src, dst, 'junction');
        } catch {
          fs.cpSync(src, dst, { recursive: true });
        }
      }
    }
    count += 1;
  }

  return count;
}

function syncHooks(destDir, options) {
  if (options.hooks === 'off') return false;
  if (options.dryRun) return true;

  const raw = fs.readFileSync(HOOKS_SRC, 'utf8');
  const customized = JSON.parse(raw);

  if (options.hooks === 'strict') {
    customized['ecc-lifecycle'].PreToolUse[0].hooks[0].timeout = 30;
  }

  fs.writeFileSync(path.join(destDir, 'hooks.json'), JSON.stringify(customized, null, 2), 'utf8');
  fs.copyFileSync(BRIDGE_SRC, path.join(destDir, 'hook-bridge.js'));
  return true;
}

function syncRules(destDir, options) {
  const rulesDir = path.join(destDir, 'rules');
  ensureDir(rulesDir, options.dryRun);

  if (options.dryRun) return;

  if (fs.existsSync(AGENTS_MD_SRC)) {
    fs.copyFileSync(AGENTS_MD_SRC, path.join(rulesDir, 'AGENTS.md'));
    fs.copyFileSync(AGENTS_MD_SRC, path.join(destDir, 'AGENTS.md'));
  }

  if (fs.existsSync(GEMINI_MD_SRC)) {
    fs.copyFileSync(GEMINI_MD_SRC, path.join(destDir, 'GEMINI.md'));
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log('=== ECC Antigravity Installer ===\n');
  console.log(`Repository root:    ${REPO_ROOT}`);
  console.log(`Target destination: ${options.dest}`);
  console.log(`Scope:              ${options.scope.toUpperCase()} ${options.scope === 'project' ? `(${options.projectRoot})` : ''}`);
  console.log(`Profile:            ${options.profile.toUpperCase()}`);
  if (options.languages) console.log(`Languages:          ${options.languages.join(', ')}`);
  console.log(`Hooks:              ${options.hooks.toUpperCase()}`);
  console.log(`Install mode:       ${options.copy ? 'Copy' : 'Symlink / Junction'}`);
  if (options.dryRun) console.log('Mode:               DRY-RUN (no files modified)\n');

  ensureDir(options.dest, options.dryRun);

  if (options.scope === 'global') {
    if (!options.dryRun) fs.copyFileSync(MANIFEST_SRC, path.join(options.dest, 'plugin.json'));
    console.log('✓ plugin.json ready');
  }

  const agentCount = syncAgents(options.dest, options.dryRun);
  console.log(`✓ ${agentCount} subagents adapted`);

  const skillCount = syncSkills(options.dest, options);
  console.log(`✓ ${skillCount} skills installed (${options.profile} profile)`);

  syncRules(options.dest, options);
  console.log('✓ AGENTS.md rules installed');

  if (options.hooks !== 'off') {
    syncHooks(options.dest, options);
    console.log(`✓ Lifecycle hooks and bridge installed (${options.hooks} mode)`);
  } else {
    console.log('○ Lifecycle hooks skipped (--no-hooks)');
  }

  console.log('\n=== Installation Complete! ===');
  console.log(`Installed location: ${options.dest}\n`);
  if (options.scope === 'global') {
    console.log('Ready in Antigravity:');
    console.log('  - Type @planner or @code-reviewer to invoke subagents');
    console.log('  - Type /plan or /tdd to invoke skills');
  } else {
    console.log('Project workspace ready:');
    console.log('  - Customizations active when working in this project directory.');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  adaptAgent,
  parseArgs,
  resolveIncludedSkills,
  resolveDefaultGlobalDir,
  resolveDefaultPluginDir: resolveDefaultGlobalDir,
};
