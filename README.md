# INVESTOR WAR

Startup stress-test. Five investor personas (Market, Customer, Money, Execution Shark and The Devil) interrogate a founder. Questions adapt to earlier answers, contradictions and risky assumptions are tracked, confidence and investment probability move with evidence quality, and the run ends in a verdict, validation experiments, a rewritten pitch and a 7-day plan.

## Product flow
Landing, **Choose Investor** (five original AI investors), **Investor Profile** (role, expertise, personality, live confidence, evidence strength, risk level, current concern), **Start Investor War**, **Initial Pitch** (TEXT or VOICE), interview, Competitor Ambush, Final Boss, Verdict, Validation Lab, Pitch History. The profile cards read the same simulation state as the War Room. The investor you pick opens the war; after that the next investor is always the one with the strongest unresolved risk (a pending contradiction goes to The Devil), never a fixed rotation. Each investor only gives credit to answers that address their own expertise.

## Text and voice input
Every pitch and answer can be typed or spoken. Voice uses the browser's built-in speech recognition (Chrome, Edge, Safari), so DEMO MODE needs no extra API key. Flow: record, stop, editable transcript ("Transcript ready - review before sending."), EDIT, SUBMIT. Nothing is sent automatically. Both modes go through `normalizeFounderInput({mode, text})` and then the one shared engine, so identical text is evaluated identically; the TEXT/VOICE tag is only stored in the timeline and pitch history and never affects scoring. Handled without crashing: permission denied, no microphone, unsupported browser, empty transcript, cancelled recording. Voice needs HTTPS or localhost (Vercel provides HTTPS).

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

## v2.2 changes (final pass)
- **State isolation.** Every simulation has a `sid`. Storage is namespaced: `iw:v3:active` (user simulation, the only thing a refresh restores), `iw:v3:demo` (the MealMind demo, never restored as a user run) and `iw:v3:history` (finished attempts, never read back into live state). Late AI responses are dropped if the simulation they belong to has been replaced.
- **Demo price.** `₹999 per month` exists only in the built-in `DEMO` constant (the MealMind demo story depends on it). A user simulation uses exactly what was typed; blank means unknown and is never filled in.
- **Final Boss scoring.** One canonical key set in `app.js` (`BOSS`) and `lib/ai-service.js` (`BOSS_CRITERIA`): Clarity, Evidence, Confidence, Differentiation, Business model, Traction, Objection handling. Provider names are mapped to these on the server and again in the browser; missing criteria fall back to the local score.
- **Evaluation fixes.** "small-chain" is no longer read as an enterprise claim, and an answer that calls its own numbers an estimate or assumption is capped at STRONG EVIDENCE, never VERIFIED.
- **Intake** now has all ten fields, each optional field with I DON'T KNOW YET. Unknown fields are listed as investigation targets.
- **Shark visual.** An original inline SVG shark in the hero and header, plus a mark for each investor. No external images.
- **vercel.json** sets a 30 s function limit for `/api/ai` and redirects `/lib/*` and `/dev-server.js` away from the public site.

## Tests
    npm test
Runs the real `app.js` and `ai-client.js` in a stubbed browser, with the LLM provider mocked. These are **MOCK tests**. No real provider call is made, and nothing here was verified in a real browser or on a real Vercel deployment.

## v2.2.1: clean start
A first visit to `/` always opens the dashboard. `restore()` only brings back an *unfinished*, structurally valid user simulation (and still opens on the dashboard, with a Resume card); finished runs, demo runs, legacy `iw_s` data and history are never restored as the active simulation. The header shows `build 2.2.1-clean-start`, so you can confirm which code a deployment is serving. `vercel.json` sends `Cache-Control: no-cache` so browsers and the CDN revalidate assets.
