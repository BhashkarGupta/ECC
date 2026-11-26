#!/usr/bin/env bash
# ==============================================================================
# ECC Project Installer for Google Antigravity (.agents/)
# ==============================================================================
# Installs any subset (or everything) of ECC into a target project workspace.
#
# Usage:
#   bash install-project.sh [target_directory] [options]
#
# Examples:
#   # Interactive menu in current directory:
#   bash install-project.sh
#
#   # Install everything ECC has to offer:
#   bash install-project.sh . --full
#
#   # Install by profile:
#   bash install-project.sh /path/to/project --profile minimal
#   bash install-project.sh . --profile developer
#   bash install-project.sh . --profile security
#
#   # Install by language/stack:
#   bash install-project.sh . --lang ts,react,python
#   bash install-project.sh . --lang go,rust --domain database
#
#   # Install specific skills/agents/rules:
#   bash install-project.sh . --skills e2e-testing,api-design --agents planner,code-reviewer
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ECC_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

AGENTS_SRC="$ECC_ROOT/agents"
SKILLS_SRC="$ECC_ROOT/skills"
RULES_SRC="$ECC_ROOT/rules"

TARGET_DIR=""
SELECTED_PROFILE=""
SELECTED_LANGS=""
SELECTED_DOMAINS=""
CUSTOM_SKILLS=""
CUSTOM_AGENTS=""
CUSTOM_RULES=""
INSTALL_ALL=false

# ------------------------------------------------------------------------------
# Helper Functions
# ------------------------------------------------------------------------------

show_help() {
  cat << 'EOF'
ECC Project Installer for Google Antigravity

Usage:
  bash install-project.sh [target_directory] [options]

Target Directory:
  Default is current directory (pwd). Target will have an .agents/ folder configured.

Profiles:
  --minimal             Core planning, code review, security, TDD & common rules
  --developer           Core + web/backend frameworks, databases, and orchestration
  --security            Core + OWASP security scanners, hardening, and dependency review
  --research            Core + deep research, market intelligence, writing, and APIs
  --full, --all         Install EVERYTHING ECC has to offer (all 72 agents, 328 skills, all rules)
  --profile <name>      minimal | developer | security | research | full

Languages / Frameworks (--lang <comma-separated>):
  typescript, react, react-native, python, golang, rust, cpp, java,
  csharp, php, ruby, swift, kotlin, flutter, vue, angular

Specialty Domains (--domain <comma-separated>):
  database              PostgreSQL, Supabase, ClickHouse, Prisma, migrations, Redis
  testing               Playwright E2E, PR analyzer, silent error hunter, verification
  devops                Docker, Kubernetes, CI/CD, deployment patterns
  ml                    PyTorch, MLE reviewer, RAG pipeline, AI evals
  research              Deep research, OSINT, market analysis, Exa search
  content               Longform article writing, brand voice, content engine, slides
  loops                 Autonomous loops, loop operator, gateguard, multi-agent

Custom Selections:
  --skills <names>      Comma-separated skill directory names
  --agents <names>      Comma-separated agent names (with or without .md)
  --rules <names>       Comma-separated language rule folder names

Listing Commands:
  --list-profiles       Show available install profiles
  --list-languages      Show supported language stacks
  --list-skills         List all 328 available skills
  --list-agents         List all 72 available agents
  --list-rules          List all available rule sets

  -h, --help            Show this help text
EOF
  exit 0
}

list_profiles() {
  echo "Available ECC Profiles:"
  echo "  - minimal   : Core workflow (planner, code-reviewer, security-reviewer, tdd, common rules)"
  echo "  - developer : Minimal + framework patterns, databases, and orchestration"
  echo "  - security  : Minimal + security review, bounty hunter, and dependency review"
  echo "  - research  : Minimal + deep research, market research, and content engine"
  echo "  - full      : Complete ECC suite (all agents, skills, and rules)"
  exit 0
}

list_languages() {
  echo "Supported Language / Framework Stacks:"
  echo "  typescript, react, react-native, python, golang, rust, cpp, java,"
  echo "  csharp, php, ruby, swift, kotlin, flutter, vue, angular"
  exit 0
}

list_skills() {
  echo "Available ECC Skills ($(ls -1 "$SKILLS_SRC" | wc -l) total):"
  ls -1 "$SKILLS_SRC" | column -c 80 || ls -1 "$SKILLS_SRC"
  exit 0
}

list_agents() {
  echo "Available ECC Agents ($(ls -1 "$AGENTS_SRC"/*.md | wc -l) total):"
  ls -1 "$AGENTS_SRC"/*.md | sed 's/.*\///; s/\.md$//' | column -c 80
  exit 0
}

list_rules() {
  echo "Available Rule Sets:"
  ls -1 "$RULES_SRC"
  exit 0
}

# ------------------------------------------------------------------------------
# Argument Parsing
# ------------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
  case "$1" in
    --minimal) SELECTED_PROFILE="minimal"; shift ;;
    --developer) SELECTED_PROFILE="developer"; shift ;;
    --security) SELECTED_PROFILE="security"; shift ;;
    --research) SELECTED_PROFILE="research"; shift ;;
    --full|--all) INSTALL_ALL=true; shift ;;
    --profile) SELECTED_PROFILE="$2"; shift 2 ;;
    --lang|--language|--languages) SELECTED_LANGS="$2"; shift 2 ;;
    --domain|--domains) SELECTED_DOMAINS="$2"; shift 2 ;;
    --skills) CUSTOM_SKILLS="$2"; shift 2 ;;
    --agents) CUSTOM_AGENTS="$2"; shift 2 ;;
    --rules) CUSTOM_RULES="$2"; shift 2 ;;
    --list-profiles) list_profiles ;;
    --list-languages) list_languages ;;
    --list-skills) list_skills ;;
    --list-agents) list_agents ;;
    --list-rules) list_rules ;;
    -h|--help) show_help ;;
    *)
      if [[ -z "$TARGET_DIR" ]]; then
        TARGET_DIR="$1"
      else
        echo "Error: Unknown argument '$1'"
        exit 1
      fi
      shift
      ;;
  esac
done

# Resolve Target Directory
if [[ -z "$TARGET_DIR" ]]; then
  TARGET_DIR="$(pwd)"
fi

mkdir -p "$TARGET_DIR"
TARGET_DIR="$(cd "$TARGET_DIR" 2>/dev/null && pwd || echo "$TARGET_DIR")"
AGENTS_DIR="$TARGET_DIR/.agents"

# ------------------------------------------------------------------------------
# Interactive Menu (if no flags were passed)
# ------------------------------------------------------------------------------

if [[ -z "$SELECTED_PROFILE" && -z "$SELECTED_LANGS" && -z "$SELECTED_DOMAINS" && \
      -z "$CUSTOM_SKILLS" && -z "$CUSTOM_AGENTS" && -z "$CUSTOM_RULES" && "$INSTALL_ALL" = false ]]; then

  clear 2>/dev/null || true
  echo "=================================================================="
  echo "       ECC Project Installer for Antigravity"
  echo "=================================================================="
  echo "Target Directory: $TARGET_DIR"
  echo "Source ECC Root : $ECC_ROOT"
  echo "=================================================================="
  echo ""
  echo "Choose an installation option:"
  echo ""
  echo "  [1] Minimal Profile     (Planner, Reviewer, Security, TDD, Clean Code, Common Rules)"
  echo "  [2] Developer Profile   (Minimal + Frameworks, Databases & Orchestration)"
  echo "  [3] Security Profile    (Minimal + OWASP scanners, hardening & threat review)"
  echo "  [4] Research Profile    (Minimal + Deep Research, Market Intel & Content)"
  echo "  [5] Full ECC Suite      (EVERYTHING: All 72 agents, 328 skills, all rules)"
  echo ""
  echo "  [L] Select Language/Framework Stacks (TypeScript, React, Python, Go, Rust, etc.)"
  echo "  [D] Select Specialty Domains         (Database, DevOps, Testing/QA, ML, Research)"
  echo "  [C] Custom selection by name"
  echo "  [Q] Quit"
  echo ""
  read -p "Enter choice [1-5, L, D, C, Q]: " main_choice

  case "$main_choice" in
    1) SELECTED_PROFILE="minimal" ;;
    2) SELECTED_PROFILE="developer" ;;
    3) SELECTED_PROFILE="security" ;;
    4) SELECTED_PROFILE="research" ;;
    5) INSTALL_ALL=true ;;
    [Ll])
      echo ""
      echo "Available Stacks: typescript, react, react-native, python, golang, rust, cpp,"
      echo "                  java, csharp, php, ruby, swift, kotlin, flutter, vue"
      echo ""
      read -p "Enter stacks to install (e.g. typescript, react, python): " SELECTED_LANGS
      SELECTED_PROFILE="minimal"
      ;;
    [Dd])
      echo ""
      echo "Available Domains: database, testing, devops, ml, research, content, loops"
      echo ""
      read -p "Enter domains to install (e.g. database, testing): " SELECTED_DOMAINS
      SELECTED_PROFILE="minimal"
      ;;
    [Cc])
      read -p "Enter skills (comma-separated, or enter for none): " CUSTOM_SKILLS
      read -p "Enter agents (comma-separated, or enter for none): " CUSTOM_AGENTS
      read -p "Enter rules  (comma-separated, or enter for none): " CUSTOM_RULES
      ;;
    [Qq]) exit 0 ;;
    *) echo "Invalid choice. Exiting."; exit 1 ;;
  esac
fi

# ------------------------------------------------------------------------------
# Installation Engine
# ------------------------------------------------------------------------------

mkdir -p "$AGENTS_DIR/agents" "$AGENTS_DIR/skills" "$AGENTS_DIR/rules"

copy_skill() {
  local skill="$1"
  if [[ -d "$SKILLS_SRC/$skill" ]]; then
    cp -r "$SKILLS_SRC/$skill" "$AGENTS_DIR/skills/"
    echo "  + [skill] $skill"
  else
    echo "  ! Warning: Skill '$skill' not found in $SKILLS_SRC"
  fi
}

copy_agent() {
  local agent="$1"
  agent="${agent%.md}"
  if [[ -f "$AGENTS_SRC/$agent.md" ]]; then
    cp "$AGENTS_SRC/$agent.md" "$AGENTS_DIR/agents/"
    echo "  + [agent] $agent"
  else
    echo "  ! Warning: Agent '$agent' not found in $AGENTS_SRC"
  fi
}

copy_rule() {
  local rule="$1"
  if [[ -d "$RULES_SRC/$rule" ]]; then
    cp -r "$RULES_SRC/$rule" "$AGENTS_DIR/rules/"
    echo "  + [rule]  $rule"
  else
    echo "  ! Warning: Rule set '$rule' not found in $RULES_SRC"
  fi
}

echo ""
echo "Installing to $AGENTS_DIR ..."

# 1. Full ECC Installation
if [[ "$INSTALL_ALL" = true || "$SELECTED_PROFILE" == "full" ]]; then
  echo "-> Installing Complete ECC Suite (All Agents, Skills, and Rules)..."
  cp -r "$AGENTS_SRC"/* "$AGENTS_DIR/agents/"
  cp -r "$SKILLS_SRC"/* "$AGENTS_DIR/skills/"
  cp -r "$RULES_SRC"/* "$AGENTS_DIR/rules/"
  if [[ -f "$ECC_ROOT/AGENTS.md" ]]; then
    cp "$ECC_ROOT/AGENTS.md" "$TARGET_DIR/"
  fi
  echo ""
  echo "Complete ECC suite installed successfully!"
  echo "Total agents: $(ls -1 "$AGENTS_DIR/agents" | wc -l)"
  echo "Total skills: $(ls -1 "$AGENTS_DIR/skills" | wc -l)"
  echo "Total rules : $(ls -1 "$AGENTS_DIR/rules" | wc -l)"
  exit 0
fi

# 2. Profiles
install_minimal() {
  echo "-> Applying Minimal Profile..."
  copy_agent "planner"
  copy_agent "architect"
  copy_agent "code-reviewer"
  copy_agent "security-reviewer"
  copy_agent "build-error-resolver"
  copy_skill "coding-standards"
  copy_skill "tdd-workflow"
  copy_skill "change-impact"
  copy_skill "verification-loop"
  copy_rule "common"
}

case "$SELECTED_PROFILE" in
  minimal)
    install_minimal
    ;;
  developer)
    install_minimal
    echo "-> Applying Developer Additions..."
    copy_agent "database-reviewer"
    copy_agent "performance-optimizer"
    copy_agent "e2e-runner"
    copy_agent "silent-failure-hunter"
    copy_skill "backend-patterns"
    copy_skill "api-design"
    copy_skill "frontend-patterns"
    copy_skill "database-migrations"
    copy_skill "postgres-patterns"
    copy_skill "e2e-testing"
    copy_skill "dmux-workflows"
    ;;
  security)
    install_minimal
    echo "-> Applying Security Additions..."
    copy_agent "security-reviewer"
    copy_skill "security-review"
    copy_skill "security-scan"
    copy_skill "security-bounty-hunter"
    copy_skill "agent-security-hardening"
    copy_skill "mcp-dependency-review"
    ;;
  research)
    install_minimal
    echo "-> Applying Research Additions..."
    copy_skill "deep-research"
    copy_skill "market-research"
    copy_skill "osint-investigation"
    copy_skill "exa-search"
    copy_skill "article-writing"
    copy_skill "brand-voice"
    copy_skill "content-engine"
    ;;
esac

# 3. Languages
IFS=',' read -ra LANG_ARRAY <<< "$SELECTED_LANGS"
for lang in "${LANG_ARRAY[@]}"; do
  lang="$(echo "$lang" | xargs | tr '[:upper:]' '[:lower:]')"
  [[ -z "$lang" ]] && continue
  echo "-> Installing Language: $lang..."

  case "$lang" in
    ts|typescript|js|javascript)
      copy_agent "typescript-reviewer"
      copy_agent "type-design-analyzer"
      copy_skill "typescript-patterns"
      copy_skill "backend-patterns"
      copy_skill "api-design"
      copy_rule "typescript"
      ;;
    react|next|nextjs)
      copy_agent "react-reviewer"
      copy_agent "react-build-resolver"
      copy_skill "react-patterns"
      copy_skill "react-performance"
      copy_skill "react-testing"
      copy_skill "nextjs-turbopack"
      copy_rule "react"
      ;;
    rn|react-native)
      copy_agent "react-reviewer"
      copy_skill "react-native-patterns"
      copy_skill "frontend-a11y"
      copy_rule "react-native"
      ;;
    python|py|fastapi|django)
      copy_agent "python-reviewer"
      copy_agent "fastapi-reviewer"
      copy_agent "django-reviewer"
      copy_agent "django-build-resolver"
      copy_skill "python-patterns"
      copy_skill "python-testing"
      copy_skill "fastapi-patterns"
      copy_skill "django-patterns"
      copy_skill "django-tdd"
      copy_rule "python"
      ;;
    go|golang)
      copy_agent "go-reviewer"
      copy_agent "go-build-resolver"
      copy_skill "golang-patterns"
      copy_skill "golang-testing"
      copy_rule "golang"
      ;;
    rust)
      copy_agent "rust-reviewer"
      copy_agent "rust-build-resolver"
      copy_skill "rust-patterns"
      copy_skill "rust-testing"
      copy_rule "rust"
      ;;
    c|cpp|c++)
      copy_agent "cpp-reviewer"
      copy_agent "cpp-build-resolver"
      copy_skill "cpp-coding-standards"
      copy_skill "cpp-testing"
      copy_rule "cpp"
      ;;
    java|spring|springboot|quarkus)
      copy_agent "java-reviewer"
      copy_agent "java-build-resolver"
      copy_skill "java-coding-standards"
      copy_skill "springboot-patterns"
      copy_skill "springboot-security"
      copy_skill "springboot-tdd"
      copy_skill "quarkus-patterns"
      copy_skill "jpa-patterns"
      copy_rule "java"
      ;;
    csharp|c#|.net|dotnet)
      copy_agent "csharp-reviewer"
      copy_skill "dotnet-patterns"
      copy_skill "csharp-testing"
      copy_rule "csharp"
      ;;
    php|laravel)
      copy_agent "php-reviewer"
      copy_skill "laravel-patterns"
      copy_skill "laravel-security"
      copy_skill "laravel-tdd"
      copy_rule "php"
      ;;
    ruby|rails)
      copy_agent "ruby-reviewer"
      copy_skill "rails-patterns"
      copy_skill "rails-security"
      copy_rule "ruby"
      ;;
    swift|ios)
      copy_agent "swift-reviewer"
      copy_agent "swift-build-resolver"
      copy_skill "swiftui-patterns"
      copy_skill "swift-concurrency-6-2"
      copy_skill "swift-actor-persistence"
      copy_rule "swift"
      ;;
    kotlin|android)
      copy_agent "kotlin-reviewer"
      copy_agent "kotlin-build-resolver"
      copy_skill "kotlin-patterns"
      copy_skill "kotlin-coroutines-flows"
      copy_skill "kotlin-testing"
      copy_rule "kotlin"
      ;;
    flutter|dart)
      copy_agent "flutter-reviewer"
      copy_agent "dart-build-resolver"
      copy_skill "dart-flutter-patterns"
      copy_skill "flutter-dart-code-review"
      copy_rule "dart"
      ;;
    vue|nuxt)
      copy_agent "vue-reviewer"
      copy_skill "vue-patterns"
      copy_skill "nuxt4-patterns"
      copy_rule "vue"
      ;;
    angular)
      copy_skill "angular-developer"
      copy_rule "angular"
      ;;
    *)
      if [[ -d "$RULES_SRC/$lang" ]]; then
        copy_rule "$lang"
      else
        echo "  ! Unknown language: '$lang'"
      fi
      ;;
  esac
done

# 4. Domains
IFS=',' read -ra DOMAIN_ARRAY <<< "$SELECTED_DOMAINS"
for domain in "${DOMAIN_ARRAY[@]}"; do
  domain="$(echo "$domain" | xargs | tr '[:upper:]' '[:lower:]')"
  [[ -z "$domain" ]] && continue
  echo "-> Installing Domain: $domain..."

  case "$domain" in
    database|db)
      copy_agent "database-reviewer"
      copy_skill "database-migrations"
      copy_skill "postgres-patterns"
      copy_skill "prisma-patterns"
      copy_skill "clickhouse-io"
      copy_skill "redis-patterns"
      copy_skill "mysql-patterns"
      ;;
    testing|qa)
      copy_agent "e2e-runner"
      copy_agent "pr-test-analyzer"
      copy_agent "silent-failure-hunter"
      copy_skill "e2e-testing"
      copy_skill "browser-qa"
      copy_skill "test-collaboration"
      copy_skill "verification-loop"
      ;;
    devops|infra)
      copy_skill "docker-patterns"
      copy_skill "kubernetes-patterns"
      copy_skill "deployment-patterns"
      copy_skill "flox-environments"
      ;;
    ml|ai)
      copy_agent "mle-reviewer"
      copy_agent "pytorch-build-resolver"
      copy_agent "rag-pipeline-reviewer"
      copy_skill "mle-workflow"
      copy_skill "pytorch-patterns"
      ;;
    research)
      copy_skill "deep-research"
      copy_skill "market-research"
      copy_skill "osint-investigation"
      copy_skill "exa-search"
      ;;
    content|brand)
      copy_skill "article-writing"
      copy_skill "brand-voice"
      copy_skill "content-engine"
      copy_skill "crosspost"
      copy_skill "frontend-slides"
      ;;
    loops|orchestration)
      copy_agent "loop-operator"
      copy_agent "harness-optimizer"
      copy_skill "autonomous-loops"
      copy_skill "continuous-agent-loop"
      copy_skill "dmux-workflows"
      copy_skill "team-builder"
      copy_skill "gateguard"
      ;;
    *)
      echo "  ! Unknown domain: '$domain'"
      ;;
  esac
done

# 5. Custom granular items
if [[ -n "$CUSTOM_SKILLS" ]]; then
  echo "-> Installing Custom Skills..."
  IFS=',' read -ra CS_ARRAY <<< "$CUSTOM_SKILLS"
  for s in "${CS_ARRAY[@]}"; do
    copy_skill "$(echo "$s" | xargs)"
  done
fi

if [[ -n "$CUSTOM_AGENTS" ]]; then
  echo "-> Installing Custom Agents..."
  IFS=',' read -ra CA_ARRAY <<< "$CUSTOM_AGENTS"
  for a in "${CA_ARRAY[@]}"; do
    copy_agent "$(echo "$a" | xargs)"
  done
fi

if [[ -n "$CUSTOM_RULES" ]]; then
  echo "-> Installing Custom Rules..."
  IFS=',' read -ra CR_ARRAY <<< "$CUSTOM_RULES"
  for r in "${CR_ARRAY[@]}"; do
    copy_rule "$(echo "$r" | xargs)"
  done
fi

# Clean up empty folders
find "$AGENTS_DIR" -type d -empty -delete 2>/dev/null || true

echo ""
echo "Done! Installed components into:"
echo "  $AGENTS_DIR"
echo ""
echo "Summary:"
echo "  Agents : $(find "$AGENTS_DIR/agents" -name "*.md" 2>/dev/null | wc -l)"
echo "  Skills : $(find "$AGENTS_DIR/skills" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l)"
echo "  Rules  : $(find "$AGENTS_DIR/rules" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l)"
echo ""
echo "Antigravity will automatically discover these when you open $TARGET_DIR."
