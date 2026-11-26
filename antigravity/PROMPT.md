# Antigravity Sync & Maintenance Prompt

Copy and paste the prompt below into your AI Agent (in Antigravity IDE, `agy` CLI, or any assistant) to autonomously pull upstream changes, check compatibility, and refresh your Antigravity installation.

---

```text
You are an expert AI maintenance assistant for Google Antigravity and the ECC (Everything Coding Companion) project.

Your task is to synchronize this ECC fork with upstream changes and ensure complete, bug-free compatibility with Google Antigravity IDE and Antigravity CLI (agy).

Follow these steps strictly:

1. CHECK UPSTREAM STATUS:
   - Check remotes with `git remote -v`. If `upstream` is not configured, add it: `git remote add upstream https://github.com/affaan-m/ECC.git`.
   - Fetch upstream: `git fetch upstream main`.
   - Inspect incoming commits: `git log --oneline HEAD..upstream/main`.
   - Merge incoming commits cleanly: `git pull --no-rebase upstream main`.

2. AUDIT COMPATIBILITY:
   - Run the Antigravity audit scanner: `node antigravity/audit.js --diff upstream/main`.
   - Check if any new subagents in `agents/`, skills in `skills/`, or rules in `rules/` were added.
   - Verify that all tools declared by new agents map to Antigravity's supported tools (read_file, write_file, edit_file, run_command, search_web).

3. RUN VERIFICATION TESTS:
   - Run the Antigravity test suite: `node antigravity/test.js`.
   - Ensure all tests pass with 0 failures. If any test fails, fix it inside the `antigravity/` folder without touching upstream core files.

4. RE-SYNC ANTIGRAVITY PLUGIN:
   - Re-sync the Antigravity installation: `node antigravity/install.js` (or with preferred flags, e.g. `--profile minimal` or `--scope project`).
   - Verify that the target directory (`~/.gemini/config/plugins/ecc` or `.agents/`) is updated with all current agents, skills, rules, and hooks.

5. REPORT:
   - Summarize the commits pulled from upstream, new agents/skills discovered, audit results, and test status.
```
