# ECC for Google Antigravity (IDE & CLI)

Welcome! This folder provides first-class support for running **ECC (Everything Coding Companion)** in **Google Antigravity IDE** and the **Antigravity CLI (`agy`)**.

It is intentionally self-contained inside `antigravity/` so that **you will never experience git merge conflicts** when pulling future updates from the upstream ECC repository.

---

## ⚡ Quick Start

From the root of this repository, run:

```bash
node antigravity/install.js
```

That's it! It has **zero dependencies** and instantly installs ECC as a global plugin under:
```text
~/.gemini/config/plugins/ecc/
```

---

## ⚙️ Installation Options & Profiles

You can customize your installation with simple flags:

### 1. Project-Specific Workspace Install (`.agents/`)
Instead of a global plugin, install ECC directly into a specific project repository to commit with your team:
```bash
# Install into the current project's .agents/ directory
node antigravity/install.js --scope project

# Install into a specific project path
node antigravity/install.js --scope project --project /path/to/my-repo
```

### 2. Lightweight / Minimal Profiles
For lower context usage, install only core or specific workflow modules:
```bash
# Minimal profile (core rules, core agents, essential skills, no hooks)
node antigravity/install.js --profile minimal

# Developer profile (core + frameworks, databases, and architecture)
node antigravity/install.js --profile developer

# Security profile (core + OWASP, threat intel, security scanning)
node antigravity/install.js --profile security
```

### 3. Language & Framework Filtering
Install core skills plus only specific language rules:
```bash
node antigravity/install.js --languages typescript,python,go
```

### 4. Lifecycle Hooks Configuration
```bash
# Disable hook automation
node antigravity/install.js --no-hooks

# Use strict hook mode
node antigravity/install.js --hooks strict
```

---
- 🤖 **71 Specialized Subagents** adapted for Antigravity (`@planner`, `@code-reviewer`, `@architect`, `@security-reviewer`, etc.).
- 🛠️ **314+ Workflow Skills** automatically exposed as slash commands (`/plan`, `/tdd`, `/security-review`, etc.).
- 🛡️ **Lifecycle Hooks**: Pre-execution command safety checks and session startup hooks bridged to Antigravity's event loop.
- 📜 **Active Rules**: Coding standards and guidelines loaded from `AGENTS.md`.

---

## 🚀 How to Use in Antigravity

1. Open your project in **Antigravity IDE** or start a session in **Antigravity CLI** (`agy`).
2. **Invoke any subagent** by typing `@`:
   - `@planner` to create detailed implementation plans.
   - `@code-reviewer` to review your staged diffs and recent edits.
   - `@architect` to design scalable systems.
   - `@tdd-guide` to write tests first.
3. **Run any skill** by typing `/`:
   - `/plan`
   - `/tdd`
   - `/security-review`

---

## 🔄 How to Keep Your Fork Updated from Upstream

Whenever the upstream ECC repository releases new skills, subagents, or bug fixes, you can update your fork with **zero merge conflicts**.

### Option A: Let an AI Agent do it (Easiest)
Copy the prompt in **[`antigravity/PROMPT.md`](PROMPT.md)** and paste it directly into your Antigravity chat.
The agent will:
1. Pull new commits from `upstream/main`.
2. Inspect the git history and audit compatibility with `node antigravity/audit.js --diff`.
3. Run verification tests with `node antigravity/test.js`.
4. Refresh your installation with `node antigravity/install.js`.

### Option B: Run it Manually
```bash
# 1. Fetch and merge upstream
git fetch upstream main
git pull --no-rebase upstream main

# 2. Audit what changed
node antigravity/audit.js --diff upstream/main

# 3. Run verification tests
node antigravity/test.js

# 4. Refresh Antigravity global plugin
node antigravity/install.js
```

---

## 🧪 Testing and Verification

To verify that your installation and all subagents are working properly:

```bash
node antigravity/test.js
```

All tests run locally with zero external dependencies in milliseconds.
