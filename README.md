# INVESTOR WAR

Startup stress-test. Five investor personas (Market, Customer, Money, Execution Shark and The Devil) interrogate a founder. Questions adapt to earlier answers, contradictions and risky assumptions are tracked, confidence and investment probability move with evidence quality, and the run ends in a verdict, validation experiments, a rewritten pitch and a 7-day plan.

## Two modes
**REAL AI MODE** is active when the server has `LLM_API_KEY`. The browser calls `POST /api/ai`; the server calls the LLM, validates the JSON it returns, and the shared simulation state is updated. The AI does the question writing and investor selection, answer grading, claim, assumption and contradiction extraction, the competitor ambush scenario, ambush and final-boss scoring, and the final report, experiments and pitch rewrite. Probabilities are still computed by the deterministic scoring model from the AI's grades (no random values).

**DEMO MODE · LOCAL ENGINE** needs no API key. It is used automatically when no key exists, when the API fails (a short notice is shown, never a raw error), and always for the built-in MealMind demo, so the demo is deterministic.

The key lives only in server environment variables and is never sent to the browser.

## Environment variables
| Name | Required | Meaning |
|---|---|---|
| `LLM_API_KEY` | for REAL AI MODE | provider API key (server only) |
| `LLM_PROVIDER` | no | `anthropic` (default) or `openai` (any OpenAI-compatible API) |
| `LLM_MODEL` | no | default `claude-sonnet-5-5` |
| `LLM_BASE_URL` | no | override the provider base URL |

## Local development
    cp .env.example .env      # put your key in LLM_API_KEY (leave empty for DEMO MODE)
    node dev-server.js        # http://localhost:3000  (Node 18+, no npm install needed)

Opening `index.html` directly also works, in DEMO MODE only (no `/api/ai` there).

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. Vercel: Add New, Project, import the repo. Framework Preset **Other**; leave Build Command and Output Directory empty.
3. Project Settings, Environment Variables: add `LLM_API_KEY` (Production, Preview), then **redeploy**. Without it the site runs in DEMO MODE.
4. Open the deployment URL.

## Files
`index.html`, `styles.css`, `app.js` (UI and local engine) · `ai-client.js` (browser bridge, falls back to local engine on any error) · `api/ai.js` (Vercel serverless route: rate limit, size limit, no raw errors) · `lib/ai-service.js` (provider call, prompts, typed request and response shapes, validation) · `dev-server.js` · `.env.example`
