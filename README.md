# Browser Agent

An AI assistant for automating web browsers. You describe a task — the agent performs it independently.

## Capabilities

- Automatically explores websites and finds elements
- Fills out forms, clicks buttons, switches pages
- Adapts to interface changes
- Requests confirmation before critical actions

## Technologies

- **TypeScript** - main language
- **Playwright** - browser automation
- **OpenAI SDK** - LLM integration
- **Node.js 18+** - runtime

## Installation & Launch

```bash
git clone https://github.com/k0de1ne/browser-agent
cd browser-agent
npm install
cp .env.example .env
npm run build && npm run start
```

**.env Configuration:**

```bash
# Local model (default)
LLM_BASE_URL=http://127.0.0.1:1234/v1
LLM_MODEL=mistralai/ministral-3-14b-reasoning
LLM_API_KEY=not-needed

# Or OpenAI
# LLM_BASE_URL=https://api.openai.com/v1
# LLM_MODEL=gpt-4-turbo-preview
# LLM_API_KEY=sk-your-key

HEADLESS=false
BROWSER_TIMEOUT=30000
```

## Features

- **Smart Automation** - Playwright with session preservation, visual control
- **Autonomy** - independent execution of multi-step tasks
- **Intelligent Analysis** - extracts only important DOM elements
- **Safety** - detects dangerous actions, requests confirmation
- **Flexibility** - no hard-coded selectors, autonomous page exploration

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  USER: "Find Python developer jobs on hh.ru"                                │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. PLANNING                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  LLM creates a plan:                                                   │ │
│  │  [ ] Go to hh.ru                                                       │ │
│  │  [ ] Find the search field                                             │ │
│  │  [ ] Enter "Python developer"                                          │ │
│  │  [ ] Apply filters                                                     │ │
│  │  [ ] Collect results                                                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
         ┌────────────────────────────────────────────────────────┐
         │             EXECUTION LOOP (max 50 iterations)         │
         │                                                        │
         │  ┌──────────────────────────────────────────────────┐  │
         │  │  2. PAGE ANALYSIS                                │  │
         │  │                                                  │  │
         │  │  DOMExtractor extracts elements:                 │  │
         │  │  ┌────────────────────────────────────────────┐  │  │
         │  │  │ [el-1] input [placeholder="Search"]        │  │  │
         │  │  │ [el-2] button "Find"                       │  │  │
         │  │  │ [el-3] link "Moscow" {in filters}          │  │  │
         │  │  │ ...                                        │  │  │
         │  │  └────────────────────────────────────────────┘  │  │
         │  └──────────────────────────────────────────────────┘  │
         │                         │                              │
         │                         ▼                              │
         │  ┌──────────────────────────────────────────────────┐  │
         │  │  3. DECISION MAKING                              │  │
         │  │                                                  │  │
         │  │  LLM analyzes:                                   │  │
         │  │  • Current page state                            │  │
         │  │  • Progress against the plan                     │  │
         │  │  • Available elements                            │  │
         │  │                                                  │  │
         │  │  Chooses a tool:                                 │  │
         │  │  → type_text(el-1, "Python developer", enter)    │  │
         │  └──────────────────────────────────────────────────┘  │
         │                         │                              │
         │                         ▼                              │
         │  ┌──────────────────────────────────────────────────┐  │
         │  │  4. SECURITY CHECK                               │  │
         │  │                                                  │  │
         │  │  Security Layer checks:                          │  │
          │  │  • Keywords (delete, pay, buy)                    │  │
         │  │  • URLs (checkout, settings)                     │  │
         │  │  • Form types (payment, password)                │  │
         │  │                                                  │  │
         │  │  Risk: LOW → execute                             │  │
         │  │  Risk: HIGH → request confirmation               │  │
         │  └──────────────────────────────────────────────────┘  │
         │                         │                              │
         │                         ▼                              │
         │  ┌──────────────────────────────────────────────────┐  │
         │  │  5. ACTION EXECUTION                             │  │
         │  │                                                  │  │
         │  │  Playwright executes:                            │  │
         │  │  → Finds element by ID                           │  │
         │  │  → Types text "Python developer"                 │  │
         │  │  → Presses Enter                                 │  │
         │  │                                                  │  │
         │  │  Result: "Typed text and pressed Enter"          │  │
         │  └──────────────────────────────────────────────────┘  │
         │                         │                              │
         │                         ▼                              │
         │  ┌──────────────────────────────────────────────────┐  │
         │  │  6. STATE UPDATE                                 │  │
         │  │                                                  │  │
         │  │  Plan updated:                                   │  │
         │  │  [✓] Go to hh.ru                                 │  │
         │  │  [✓] Find the search field                       │  │
         │  │  [✓] Enter "Python developer"                    │  │
         │  │  [→] Apply filters ← current step                │  │
         │  │  [ ] Collect results                             │  │
         │  └──────────────────────────────────────────────────┘  │
         │                         │                              │
         │                         ▼                              │
         │            ┌─────────────────────────┐                 │
         │            │   Is task complete?     │                 │
         │            └───────────┬─────────────┘                 │
         │                        │                               │
         │           NO ←─────────┴─────────→ YES                 │
         │            │                       │                   │
         │            ▼                       │                   │
         │     [Next iteration]               │                   │
         │                                    │                   │
         └────────────────────────────────────┼───────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  7. COMPLETION                                                              │
│                                                                             │
│  complete_task({                                                            │
│    summary: "Found 156 Python developer jobs in Moscow",                    │
│    success: true                                                            │
│  })                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

The loop repeats until the task is complete (maximum 50 iterations).

## Architecture

```
src/
├── agent/          # Core agent logic
├── browser/        # Browser management
├── constants/      # Configurations
├── types/         # TypeScript types
├── utils/         # Utility functions
└── config.ts      # Application configuration
```

**Key Components:**

- **BrowserAgent** - task orchestration
- **Planning System** - dynamic planning
- **Security Layer** - action safety verification
- **DOM Extractor** - extracts relevant elements
- **LLM Client** - integration with language models

**Agent Tools:** navigation, page exploration, element interaction, tab management.

## DOM Extraction

The system extracts only interactive elements instead of the entire HTML:

```
=== VISIBLE IN VIEWPORT ===
[el-1] button "Add to Cart" [type="submit"] {in main content}
[el-2] input "" [placeholder="Search"] {in navigation}
```

## Safety

Risk verification before action execution:

```
════════════════════════════════════════════════════════════
SECURITY CHECK [FINANCIAL]
Risk: HIGH - Detected keyword: "pay"
Element: "Complete Purchase"
? Proceed? (y/N)
════════════════════════════════════════════════════════════
```

**Risk Categories:** payments, data deletion, account changes, privacy settings.
