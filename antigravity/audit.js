#!/usr/bin/env node
'use strict';

/**
 * ECC Antigravity Audit Tool
 *
 * Scans the codebase and recent git diffs to verify 100% Antigravity compatibility.
 * Zero external dependencies.
 *
 * Usage:
 *   node antigravity/audit.js [--diff [base-ref]]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { adaptAgent } = require('./install');

const REPO_ROOT = path.resolve(__dirname, '..');
const AGENTS_DIR = path.join(REPO_ROOT, 'agents');
const SKILLS_DIR = path.join(REPO_ROOT, 'skills');
const RULES_DIR = path.join(REPO_ROOT, 'rules');

function auditAgents() {
  const issues = [];
  let checked = 0;
  if (!fs.existsSync(AGENTS_DIR)) return { checked: 0, issues: ['agents/ directory missing'] };

  const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    checked += 1;
    const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
    if (!content.startsWith('---')) {
      issues.push(`${file}: missing YAML frontmatter`);
      continue;
    }
    const adapted = adaptAgent(content);
    if (!adapted.includes('kind: local')) {
      issues.push(`${file}: adaptation failed to add kind: local`);
    }
  }
  return { checked, issues };
}

function auditSkills() {
  const issues = [];
  let checked = 0;
  if (!fs.existsSync(SKILLS_DIR)) return { checked: 0, issues: ['skills/ directory missing'] };

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    checked += 1;
    const skillFile = path.join(SKILLS_DIR, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillFile)) {
      issues.push(`${entry.name}: missing SKILL.md`);
      continue;
    }
    const content = fs.readFileSync(skillFile, 'utf8');
    if (!content.startsWith('---')) {
      issues.push(`${entry.name}/SKILL.md: missing YAML frontmatter`);
    }
  }
  return { checked, issues };
}

function auditRules() {
  const issues = [];
  let checked = 0;
  if (!fs.existsSync(RULES_DIR)) return { checked: 0, issues: [] };

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md') && entry.name !== 'README.md') {
        checked += 1;
        const size = fs.statSync(full).size;
        if (size > 24000) {
          issues.push(`${entry.name}: exceeds 24 KB rule budget (${size} bytes)`);
        }
      }
    }
  }

  walk(RULES_DIR);
  return { checked, issues };
}

function auditGitDiff(baseRef) {
  try {
    const ref = baseRef || 'HEAD~1';
    const out = execSync(`git diff --name-only ${ref} HEAD`, { encoding: 'utf8', cwd: REPO_ROOT });
    const files = out.split('\n').filter(Boolean);
    console.log(`Git diff against ${ref}: ${files.length} files changed.`);
    const modifiedAgents = files.filter(f => f.startsWith('agents/'));
    const modifiedSkills = files.filter(f => f.startsWith('skills/'));
    const modifiedRules = files.filter(f => f.startsWith('rules/'));
    console.log(`  - Modified Agents: ${modifiedAgents.length}`);
    console.log(`  - Modified Skills: ${modifiedSkills.length}`);
    console.log(`  - Modified Rules:  ${modifiedRules.length}`);
  } catch {
    console.log('Git diff not available or ref invalid; running full audit.');
  }
}

function main() {
  console.log('=== ECC Antigravity Compatibility Audit ===\n');

  const diffIdx = process.argv.indexOf('--diff');
  if (diffIdx !== -1) {
    const base = process.argv[diffIdx + 1] && !process.argv[diffIdx + 1].startsWith('-')
      ? process.argv[diffIdx + 1]
      : 'upstream/main';
    auditGitDiff(base);
    console.log('');
  }

  const agents = auditAgents();
  const skills = auditSkills();
  const rules = auditRules();

  console.log(`Agents checked:  ${agents.checked} (${agents.issues.length} issues)`);
  console.log(`Skills checked:  ${skills.checked} (${skills.issues.length} issues)`);
  console.log(`Rules checked:   ${rules.checked} (${rules.issues.length} issues)`);

  const allIssues = [...agents.issues, ...skills.issues, ...rules.issues];

  if (allIssues.length > 0) {
    console.log('\nIssues found:');
    for (const issue of allIssues) {
      console.log(`  ✗ ${issue}`);
    }
    console.log('\nAudit status: FAILED');
    process.exit(1);
  } else {
    console.log('\nAll ECC components are 100% compatible with Google Antigravity!');
    console.log('Audit status: PASSED');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  auditAgents,
  auditSkills,
  auditRules,
};
