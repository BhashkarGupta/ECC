---
name: goal-architect
description: "Interactive requirements architect and autonomous loop orchestrator. Combines SWE-bench and OpenHands grade patterns: Default-FAIL contracts, Git checkpoints with safe rollback, Stuck Detectors with circuit breakers, Fresh-Context Evaluators, Episodic Negative Memory, Tiered Model Cascading (pro, flash, flash_lite), Hierarchical Memory (.agents/memory/), and Graphify topology analysis."
---

# Goal Architect (Autonomous Goal & Loop Orchestrator)

An enterprise-grade autonomous harness combining cutting-edge engineering patterns from **SWE-bench, OpenHands, SWE-agent, Antigravity multi-agent runtime**, and **ECC's rigorous engineering gates (TDD, Gateguard, Security, Immutability)**.

---

## When to Activate

Trigger this skill whenever:
- The user wants to start an autonomous task, feature implementation, refactoring, or bug fix.
- The user asks to design, architect, or scope a goal before running it.
- A task is too complex or ambiguous for one-shot execution and requires thorough scoping and autonomous multi-agent execution.

---

## The 6 Core Autonomous Principles

1. **The Default-FAIL Contract (Anthropic / CWC Pattern)**:
   - Every acceptance criterion is initialized to `[ ] FALSE` by default.
   - A criterion can **only** flip to `[x] TRUE` when a terminal command produces verifiable proof (exit code 0, test assertions passed). No assertions = automatic FAIL.
2. **Git Checkpoint & Safe Rollback (Zero-Risk Execution)**:
   - Before executing code, automatically create a temporary snapshot tag: `checkpoint/goal-<timestamp>`.
   - If an iteration goes off the rails, cleanly revert to the snapshot rather than untangling broken edits.
3. **The Stuck Detector Circuit Breaker (SWE-agent Pattern)**:
   - Monitor error signatures across iterations. If the **exact same error occurs 3 times consecutively**, trip the breaker:
     - Halt code editing.
     - Roll back the failed edits.
     - Force a **Root-Cause Redesign Phase** (formulate an entirely new hypothesis instead of thrashing line-by-line).
4. **Fresh-Context Evaluator (Zero Confirmation Bias)**:
   - The agent that wrote the code **never** evaluates its own work.
   - The supervisor spawns an independent **Evaluator Subagent** in an isolated context window that inspects only the `git diff` and terminal logs against the Default-FAIL contract.
5. **Episodic Negative Memory (`.agents/memory/negative_ledger.md`)**:
   - Whenever an approach fails, log the failed hypothesis and error reason into a temporary negative ledger.
   - Pass this ledger to the next subagent: *"Here is what was tried and failed. Do NOT repeat these approaches."*
6. **Tiered Model Routing & Cascading (Cost & Speed Optimization)**:
   - Do not run every subagent on `pro`. Cascade models by cognitive difficulty:
     - **`pro`** (High Thinking): Coordinator, Security Reviewer, Fresh Evaluator.
     - **`flash`** (Standard Thinking): Coder, Tester / TDD Guide, Build Resolver (10x cheaper, 4x faster).
     - **`flash_lite`** (Minimal/Off): File finding, grep, linter text parsing (near-zero cost).
   - Saves **70%–85% of token costs** and accelerates loop iterations by 3x–4x.

---

## Model Cascading Matrix

```
                        Supervisor: goal-architect
                       (Model: PRO | High Thinking)
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  Security Reviewer   │  │   Coder & Tester     │  │  File Search / Grep  │
│   Fresh Evaluator    │  │   Build Resolver     │  │   Linter Log Parser  │
├──────────────────────┤  ├──────────────────────┤  ├──────────────────────┤
│     Model: PRO       │  │     Model: FLASH     │  │   Model: FLASH_LITE  │
│  (Deep Reasoning)    │  │   (Fast & Cheap)     │  │   (Instant & Free)   │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

---

## Hierarchical Memory Layout (`.agents/memory/`)

```text
.agents/
└── memory/
    ├── ARCHITECTURE.md     # 🟢 COMPACT (~100 lines): God nodes, module boundaries, database engines
    ├── PREFERENCES.md      # 🟢 STATIC (~50 lines): Team rules (e.g. "Use Vitest", "Strict immutability")
    ├── negative_ledger.md  # 🔴 EPISODIC (Temporary): Failed hypotheses during active loops
    ├── journal/            # 🟡 APPEND-ONLY: One short log per completed task
    │   ├── 2026-11-20-auth-setup.md
    │   └── 2026-11-26-user-profile.md
    └── archive/            # 📦 COMPACTED: Older historical logs compressed together
```

---

## Complete Lifecycle Workflow

### Phase 1: Pre-Flight Reconnaissance & Checkpoint

#### 1. Greenfield vs. Brownfield Detection
- Check source file count (`git ls-files`):
  - **If empty or < 3 files**: Mark as **Greenfield**. Skip Graphify completely. Jump to Greenfield Scaffolding Interview.
  - **If brownfield**: Read `.agents/memory/ARCHITECTURE.md`, `PREFERENCES.md`, and only the latest 1–2 journal files (~300 tokens total).
  - If `ARCHITECTURE.md` is missing, run `graphify .` locally (0 tokens via CPU AST parser) to generate the initial compact summary.

#### 2. Create Safety Checkpoint
Run in terminal before any subagent touches code:
```bash
git stash --include-untracked 2>/dev/null || true
git tag -f "checkpoint/goal-$(date +%s)"
```

#### 3. Initialize Episodic Negative Ledger
Ensure `.agents/memory/negative_ledger.md` is empty and ready for the active task.

---

### Phase 2: In-Depth MCQ Interview (Using `ask_question`)

Conduct structured multiple-choice questions with **no arbitrary question cap**. Group questions into thematic rounds (2–3 questions per call):

- **Every question MUST use `ask_question`**.
- Put `(Recommended)` on the recommended option.
- Provide detailed trade-off explanations for every option.
- Allow the user to enter custom answers via the built-in "Other" option.

#### Interview Rounds:
- **Round 1 (Scope & Topology Integration)**: How the new feature/fix integrates with existing modules and data contracts.
- **Round 2 (Edge Cases & Blast Radius)**: Failure modes, concurrency, timeouts, error status codes, and downstream consumers.
- **Round 3 (Subagent Squad Selection & Model Assignment)**:
  - **Coder (`flash`)**: Implements minimal changes in isolated modules.
  - **Tester / TDD Guide (`flash`)**: Enforces RED $\to$ GREEN cycle.
  - **Security Reviewer (`pro`)**: Audits OWASP, secret leaks, input validation.
  - **Build Resolver (`flash`)**: Fixes type and compile errors incrementally.
- **Round 4 (Default-FAIL Contract Setup)**:
  - Exact test command (e.g. `npm test`, `pytest`)
  - Type-check command (e.g. `npx tsc --noEmit`, `mypy`)
  - Target coverage metric ($\ge 80\%$)

*Continue asking until zero ambiguity remains.*

---

### Phase 3: The Airtight Goal Specification

Synthesize findings into an actionable specification containing the **Default-FAIL Verification Matrix**:

```markdown
# Autonomous Execution Goal: [Task Name]

## 1. Project Context & Blast Radius
- Project Type: [Greenfield | Brownfield]
- Primary Modules: [Module A, Module B]
- Downstream Dependents: [Consumer C, Consumer D]

## 2. Objective & Non-Negotiables
- Core Deliverable: ...
- Invariants & Constraints: ... (Immutability, Schemas, Security)

## 3. Subagent Squad & Tiered Model Allocation
- [Coordinator / Main Agent]: Supervises loop, checks circuit breaker (Model: pro).
- [Subagent: Coder]: Implements atomic changes (Model: flash).
- [Subagent: Tester]: Writes failing tests first, verifies fixes (Model: flash).
- [Subagent: Security Reviewer]: Inspects diffs for vulnerabilities (Model: pro).
- [Subagent: Fresh Evaluator]: Independent context auditor for final verification (Model: pro).

## 4. Default-FAIL Verification Matrix
- [ ] Test Suite: `<exact command>` exits with code 0. [DEFAULT: FALSE]
- [ ] Type Check: `<exact command>` passes with 0 errors. [DEFAULT: FALSE]
- [ ] Coverage Metric: Meets or exceeds 80%. [DEFAULT: FALSE]
- [ ] Security Review: Zero HIGH/CRITICAL issues. [DEFAULT: FALSE]
- [ ] Clean Working Tree: Zero unintended file modifications. [DEFAULT: FALSE]
```

---

### Phase 4: Execution Loop with Circuit Breaker

The Supervisor executes the task in micro-milestones:

```
[Start Milestone]
       │
       ▼
[Dispatch Coder / Tester on FLASH]
       │
       ▼
[Run Verification Commands]
       │
       ├──> Failed? ──> Check Consecutive Error Count
       │                     │
       │                     ├──> Error repeated 3 times? ──> [TRIP CIRCUIT BREAKER]
       │                     │                                  - Roll back failed edits
       │                     │                                  - Log to negative_ledger.md
       │                     │                                  - Trigger Root-Cause Redesign
       │                     │
       │                     └──> Error count < 3 ──> Log to negative_ledger.md ──> Retry
       │
       └──> Passed? ──> [Dispatch Fresh Evaluator on PRO]
                             │
                             ├──> Evaluator rejects diff ──> Re-enter loop
                             │
                             └──> Evaluator certifies diff ──> Advance Milestone
```

---

### Phase 5: Post-Completion Memory & Graph Sync (Automatic)

Once all Default-FAIL criteria are certified `[x] TRUE`:

1. **Local Graph Update (0 LLM Tokens)**:
   Run `graphify . --update` in terminal to refresh `graphify-out/graph.json` locally using AST parsers.
2. **Write Journal Entry**:
   Create `.agents/memory/journal/YYYY-MM-DD-<task-slug>.md` detailing completed work, files modified, and verification exit codes.
3. **Clean Up Temporary Artifacts**:
   - Clear `.agents/memory/negative_ledger.md`.
   - Remove temporary git checkpoint tag (`git tag -d "checkpoint/goal-..."`).
4. **Log Compaction / Rollup**:
   If `journal/` exceeds 10 files, compact the oldest 5 files into `.agents/memory/archive/`.
EOF
