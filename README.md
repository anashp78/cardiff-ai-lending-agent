# Cardiff AI Lending Agent

**AI-native loan underwriting agent** — multi-model pipeline with MCP tool registry, HITL gates, and real-time observability.

Built as a production demonstration for [Cardiff Inc.](https://cardiff.co), an AI-first alternative lender that has funded over $10B to small businesses.

**Live demo:** [cardiff-demo.maxevdigital.com](https://cardiff-demo.maxevdigital.com)

---

## Architecture

```
Loan Application
    |
    v
[1] Haiku — Risk Classification (LOW/MEDIUM/HIGH)
    |         Route: auto_approve | manual_review | decline
    v
[2] Snowflake Tool — Pull risk data (credit score, DTI, defaults)
    |
    v
[3] Salesforce Tool — Pull CRM record (account, tier, rep, loans)
    |
    v
[4] Sonnet — Full reasoning over all data → structured decision
    |         Confidence score + reasoning + next steps
    v
[5] Gmail Tool — Send formatted review email to assigned rep
    |   (HITL gate)
    v
[6] Slack Tool — Post alert with decision, scores, reasoning
    |   (HITL gate)
    v
[7] Zoom Tool — Create 30-min review meeting
        (HITL gate)
```

## MCP Tool Registry

5 tools with full JSON Schema definitions, mock fallbacks, and structured observability:

| Tool | Integration | Purpose |
|------|------------|---------|
| `snowflake_query` | Snowflake | Credit score, risk score, DTI, prior defaults, system recommendation |
| `salesforce_query` | Salesforce | Account name, relationship tier, existing loans, assigned rep |
| `send_gmail` | Gmail | Formatted HTML loan review summary to assigned rep |
| `post_slack` | Slack | Structured alert with decision, credit score, risk reasoning |
| `create_zoom_meeting` | Zoom | 30-min review meeting for manual review cases |

## Multi-Model Routing

| Model | Role | Use Case |
|-------|------|----------|
| Claude Haiku | Classification | Fast risk routing — LOW/MEDIUM/HIGH in <1s |
| Claude Sonnet | Reasoning | Full context analysis with structured JSON decision |

## Human-in-the-Loop (HITL)

All external actions (email, Slack, Zoom) require human confirmation before execution. In CLI mode, the agent prompts interactively. In web mode, the frontend provides confirm/skip buttons per action.

## Stack

**Backend:** Python, FastAPI, Gunicorn/Uvicorn, Anthropic SDK, Pydantic models, SQLite (demo), structured logging

**Frontend:** Next.js, React, TypeScript — admin dashboard with real-time agent run logs, step-by-step execution viewer, trigger UI

**Infrastructure:** PM2 process management, Nginx reverse proxy, Let's Encrypt SSL

## Running Locally

```bash
# Backend
cd backend
pip install -r ../requirements.txt
export ANTHROPIC_API_KEY=sk-ant-xxx
python -m backend.agent --application-id APP-12345  # CLI mode with HITL prompts

# Frontend
cd frontend
npm install && npm run dev  # http://localhost:3000

# API server
gunicorn -w 1 -k uvicorn.workers.UvicornWorker backend.main:app --bind 0.0.0.0:3023
```

## Mock Mode

Set `MOCK_MODE=true` (default) to run with synthetic data — no real API keys needed. The agent falls back to mocks automatically if a real tool call fails.

## Key Files

| File | Purpose |
|------|---------|
| `backend/agent.py` | 7-step agent pipeline with multi-model routing |
| `backend/mcp_server.py` | MCP tool registry — 5 tools with JSON Schema |
| `backend/tools/` | Individual tool implementations (Snowflake, Salesforce, Gmail, Slack, Zoom) |
| `backend/models.py` | Pydantic models for all data structures |
| `backend/mock/` | Mock data and tool fallbacks for demo mode |
| `frontend/app/page.tsx` | Application submission UI |
| `frontend/app/admin/page.tsx` | Admin dashboard with agent run logs |
| `frontend/components/RunLog.tsx` | Step-by-step agent execution viewer |

## Author

**Will Peterson** — Solutions Architect & Forward Deployed Engineer at Wolters Kluwer. Previously founded Max EV Digital (6 FDE client engagements, 50+ live agentic AI endpoints). Built with Claude Code as primary development environment.
