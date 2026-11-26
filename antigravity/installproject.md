# ECC Project Installer for Google Antigravity (`installproject.md`)

This guide explains how to use `install-project.sh` to install curated subsets (or the entire suite) of **ECC (Everything Coding Companion)** into any local project repository for use with **Google Antigravity IDE and CLI**.

---

## 📖 Table of Contents
1. [Why Project-Specific Installations?](#why-project-specific-installations)
2. [Quick Start](#quick-start)
3. [Command Syntax & Overview](#command-syntax--overview)
4. [Official Profiles (`--profile`)](#official-profiles---profile)
5. [Language & Framework Stacks (`--lang`)](#language--framework-stacks---lang)
6. [Specialty Domains (`--domain`)](#specialty-domains---domain)
7. [Granular Custom Installation (`--skills`, `--agents`, `--rules`)](#granular-custom-installation)
8. [Discovery & Inspection Commands](#discovery--inspection-commands)
9. [Project Directory Layout](#project-directory-layout)
10. [Best Practices & Tips](#best-practices--tips)

---

## 1. Why Project-Specific Installations?

Installing hundreds of skills and agents globally overwhelms the AI's context window. On every single prompt, Antigravity injects the metadata catalog of all active tools. When too many are loaded globally:
- **Skills are dropped**: Antigravity automatically truncates skills when they exceed context budget limits.
- **Attention dilution**: The AI can hesitate, trigger irrelevant procedures, or hallucinate.
- **Token overhead**: Unused descriptions eat into your token limits and slow down responses.

**Project-level `.agents/` solves this.** By installing only what a specific project needs into `.agents/`:
- The AI has razor-sharp focus on that project's exact stack.
- The `.agents/` directory can be checked into git so your entire team shares the same standards, testing guidelines, and review agents.

---

## 2. Quick Start

### Interactive Mode (Recommended)
Navigate to your target project folder and run the installer without flags:

```bash
cd /path/to/my-project
bash /mnt/Drive/Github/ECC/antigravity/install-project.sh
```

You will see an interactive menu:
```text
==================================================================
       ECC Project Installer for Antigravity
==================================================================
Target Directory: /path/to/my-project
Source ECC Root : /mnt/Drive/Github/ECC
==================================================================

Choose an installation option:

  [1] Minimal Profile     (Planner, Reviewer, Security, TDD, Clean Code, Common Rules)
  [2] Developer Profile   (Minimal + Frameworks, Databases & Orchestration)
  [3] Security Profile    (Minimal + OWASP scanners, hardening & threat review)
  [4] Research Profile    (Minimal + Deep Research, Market Intel & Content)
  [5] Full ECC Suite      (EVERYTHING: All 72 agents, 328 skills, all rules)

  [L] Select Language/Framework Stacks (TypeScript, React, Python, Go, Rust, etc.)
  [D] Select Specialty Domains         (Database, DevOps, Testing/QA, ML, Research)
  [C] Custom selection by name
  [Q] Quit
```

### Scripted / One-Liner Mode
Install exactly what you need in a single terminal command:

```bash
# Add Minimal Core + TypeScript + React to current directory:
bash /mnt/Drive/Github/ECC/antigravity/install-project.sh . --minimal --lang ts,react

# Add Developer Profile + Python + Database tools to another project:
bash /mnt/Drive/Github/ECC/antigravity/install-project.sh /path/to/backend-service --developer --lang python --domain database
```

---

## 3. Command Syntax & Overview

```bash
bash install-project.sh [target_directory] [flags]
```

- **`target_directory`**: (Optional) The project directory to install into. Defaults to current working directory (`pwd`).
- If `.agents/` does not exist in the target directory, the script automatically creates `.agents/agents`, `.agents/skills`, and `.agents/rules`.

---

## 4. Official Profiles (`--profile`)

Profiles bundle pre-selected combinations of agents, skills, and rules designed for specific types of work:

| Profile Flag | Description | Included Components |
| :--- | :--- | :--- |
| **`--minimal`** | **Core Quality Baseline**<br>Planning, code review, TDD, and clean code. | **Agents**: `planner`, `architect`, `code-reviewer`, `security-reviewer`, `build-error-resolver`<br>**Skills**: `coding-standards`, `tdd-workflow`, `change-impact`, `verification-loop`<br>**Rules**: `rules/common/` |
| **`--developer`** | **Full Application Engineering**<br>Core + database, frontend/backend architecture, performance, and E2E testing. | **All Minimal components**, plus:<br>**Agents**: `database-reviewer`, `performance-optimizer`, `e2e-runner`, `silent-failure-hunter`<br>**Skills**: `backend-patterns`, `api-design`, `frontend-patterns`, `database-migrations`, `postgres-patterns`, `e2e-testing`, `dmux-workflows` |
| **`--security`** | **Security & Audit Heavy**<br>Vulnerability detection, hardening, and dependency auditing. | **All Minimal components**, plus:<br>**Agents**: `security-reviewer`<br>**Skills**: `security-review`, `security-scan`, `security-bounty-hunter`, `agent-security-hardening`, `mcp-dependency-review` |
| **`--research`** | **Investigation & Content**<br>Market research, competitive intelligence, and writing. | **All Minimal components**, plus:<br>**Skills**: `deep-research`, `market-research`, `osint-investigation`, `exa-search`, `article-writing`, `brand-voice`, `content-engine` |
| **`--full`** or **`--all`** | **Complete ECC Suite**<br>Installs all 72 agents, 328 skills, and all rule sets. | Copies the entire ECC repository's agents, skills, rules, and root `AGENTS.md`. |

---

## 5. Language & Framework Stacks (`--lang`)

Pass one or more comma-separated language identifiers using `--lang <names>`:

```bash
bash install-project.sh . --lang typescript,react,python
```

| Identifier | Included Agents | Included Skills | Included Rules |
| :--- | :--- | :--- | :--- |
| **`ts` / `typescript`** | `typescript-reviewer`<br>`type-design-analyzer` | `typescript-patterns`<br>`backend-patterns`<br>`api-design` | `rules/typescript/` |
| **`react` / `next`** | `react-reviewer`<br>`react-build-resolver` | `react-patterns`<br>`react-performance`<br>`react-testing`<br>`nextjs-turbopack` | `rules/react/` |
| **`rn` / `react-native`** | `react-reviewer` | `react-native-patterns`<br>`frontend-a11y` | `rules/react-native/` |
| **`python` / `fastapi` / `django`** | `python-reviewer`<br>`fastapi-reviewer`<br>`django-reviewer`<br>`django-build-resolver` | `python-patterns`<br>`python-testing`<br>`fastapi-patterns`<br>`django-patterns`<br>`django-tdd` | `rules/python/` |
| **`go` / `golang`** | `go-reviewer`<br>`go-build-resolver` | `golang-patterns`<br>`golang-testing` | `rules/golang/` |
| **`rust`** | `rust-reviewer`<br>`rust-build-resolver` | `rust-patterns`<br>`rust-testing` | `rules/rust/` |
| **`cpp` / `c`** | `cpp-reviewer`<br>`cpp-build-resolver` | `cpp-coding-standards`<br>`cpp-testing` | `rules/cpp/` |
| **`java` / `spring` / `quarkus`** | `java-reviewer`<br>`java-build-resolver` | `java-coding-standards`<br>`springboot-patterns`<br>`springboot-security`<br>`springboot-tdd`<br>`quarkus-patterns`<br>`jpa-patterns` | `rules/java/` |
| **`csharp` / `.net`** | `csharp-reviewer` | `dotnet-patterns`<br>`csharp-testing` | `rules/csharp/` |
| **`php` / `laravel`** | `php-reviewer` | `laravel-patterns`<br>`laravel-security`<br>`laravel-tdd` | `rules/php/` |
| **`ruby` / `rails`** | `ruby-reviewer` | `rails-patterns`<br>`rails-security` | `rules/ruby/` |
| **`swift` / `ios`** | `swift-reviewer`<br>`swift-build-resolver` | `swiftui-patterns`<br>`swift-concurrency-6-2`<br>`swift-actor-persistence` | `rules/swift/` |
| **`kotlin` / `android`** | `kotlin-reviewer`<br>`kotlin-build-resolver` | `kotlin-patterns`<br>`kotlin-coroutines-flows`<br>`kotlin-testing` | `rules/kotlin/` |
| **`flutter` / `dart`** | `flutter-reviewer`<br>`dart-build-resolver` | `dart-flutter-patterns`<br>`flutter-dart-code-review` | `rules/dart/` |
| **`vue` / `nuxt`** | `vue-reviewer` | `vue-patterns`<br>`nuxt4-patterns` | `rules/vue/` |
| **`angular`** | — | `angular-developer` | `rules/angular/` |

---

## 6. Specialty Domains (`--domain`)

Domains bundle cross-cutting engineering tools for specific subsystems. Pass using `--domain <names>`:

```bash
bash install-project.sh . --domain database,testing
```

| Domain | Focus | What Gets Installed |
| :--- | :--- | :--- |
| **`database`** | Schema design, SQL optimization, migrations | **Agent**: `database-reviewer`<br>**Skills**: `database-migrations`, `postgres-patterns`, `prisma-patterns`, `clickhouse-io`, `redis-patterns`, `mysql-patterns` |
| **`testing`** | Playwright E2E, silent bug hunting, QA | **Agents**: `e2e-runner`, `pr-test-analyzer`, `silent-failure-hunter`<br>**Skills**: `e2e-testing`, `browser-qa`, `test-collaboration`, `verification-loop` |
| **`devops`** | Containers, deployment, local dev | **Skills**: `docker-patterns`, `kubernetes-patterns`, `deployment-patterns`, `flox-environments` |
| **`ml`** | PyTorch, ML evaluation, RAG pipelines | **Agents**: `mle-reviewer`, `pytorch-build-resolver`, `rag-pipeline-reviewer`<br>**Skills**: `mle-workflow`, `pytorch-patterns` |
| **`research`** | Deep web search, OSINT, competitive intel | **Skills**: `deep-research`, `market-research`, `osint-investigation`, `exa-search` |
| **`content`** | Technical writing, brand voice, presentations | **Skills**: `article-writing`, `brand-voice`, `content-engine`, `crosspost`, `frontend-slides` |
| **`loops`** | Autonomous agent loops & multi-agent swarms | **Agents**: `loop-operator`, `harness-optimizer`<br>**Skills**: `autonomous-loops`, `continuous-agent-loop`, `dmux-workflows`, `team-builder`, `gateguard` |

---

## 7. Granular Custom Installation

You can specify exact skills, agents, or rules by name:

```bash
# Install individual components by name
bash install-project.sh /path/to/project \
  --skills e2e-testing,api-design,deep-research \
  --agents planner,code-reviewer,architect \
  --rules common,typescript
```

- `--skills <s1,s2,...>`: Copies matching subdirectories from `skills/`.
- `--agents <a1,a2,...>`: Copies matching agent markdown files from `agents/` (with or without `.md`).
- `--rules <r1,r2,...>`: Copies matching rule directories from `rules/`.

---

## 8. Discovery & Inspection Commands

Inspect available components before installing:

```bash
# List all 5 profiles
bash install-project.sh --list-profiles

# List supported language stacks
bash install-project.sh --list-languages

# Print all 328 available skills
bash install-project.sh --list-skills

# Print all 72 available agents
bash install-project.sh --list-agents

# List all available rule folders
bash install-project.sh --list-rules
```

---

## 9. Project Directory Layout

After running `install-project.sh`, your target project will have this clean, self-contained layout:

```text
my-project/
├── .agents/
│   ├── agents/
│   │   ├── planner.md
│   │   ├── code-reviewer.md
│   │   └── typescript-reviewer.md
│   ├── skills/
│   │   ├── coding-standards/
│   │   │   └── SKILL.md
│   │   ├── tdd-workflow/
│   │   │   └── SKILL.md
│   │   └── typescript-patterns/
│   │       └── SKILL.md
│   └── rules/
│       ├── common/
│       └── typescript/
├── src/
├── package.json
└── ...
```

When you open `my-project` in **Google Antigravity IDE** or run the **Antigravity CLI (`agy`)**, it automatically traverses up to the project root and activates these agents, skills, and rules exclusively for this workspace.

---

## 10. Best Practices & Tips

1. **Keep `.agents/` in Version Control**:
   Commit `.agents/` to git. When your teammates pull the repo, their Antigravity AI assistant will follow the exact same coding standards, TDD rules, and architectural guidelines.
2. **Start Lean**:
   Install `--minimal` plus your project's specific language stack (`--lang <stack>`). Add extra domains (`--domain database` or `--domain testing`) only when actively working on those parts.
3. **Re-running is Safe**:
   You can run `install-project.sh` multiple times on the same directory to add new stacks or refresh existing ones. It overwrites cleanly without breaking your workspace.
EOF
