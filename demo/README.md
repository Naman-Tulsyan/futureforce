# Mumbai Port Strike — automated demo

One command drives the whole scenario across four browser tabs:

1. **Dashboard** (baseline) → 2. **News site** (auto-fires the Slack alert) →
3. **Slack** (shows the agent's DM) → 4. writes the strike into Salesforce so the
**dashboard updates live** → 5. drives the **Agentforce console chat** through all
five capability prompts → 6. **stabilizes** the data so the dashboard risk settles.

## One-time setup

1. **Run the app** in another terminal:
   ```bash
   npm run dev
   ```
2. **Slack webhook** — already set in `.env` as `SLACK_WEBHOOK_URL`. (Create at
   api.slack.com/apps → Incoming Webhooks if you need a new one.)
3. **Edit [`demo/config.mjs`](./config.mjs):**
   - `agentforceUrl` → open your agent's **Preview** tab in Salesforce, copy the
     full address-bar URL, paste it here.
   - `slackUrl` → the DM/channel where the webhook posts (copy its URL from Slack).
   - `agentInputPlaceholder` → the chat box placeholder text (default already
     matches "Describe your task or ask a question").

## Run it

```bash
npm run demo            # auto-paced (timed)
MANUAL=1 npm run demo   # advance each step by pressing Enter (best for live demos)
```

- A dedicated Chrome window opens using `demo/.profile`. **On the first run, log in
  to Slack and Salesforce in that window**, then press Enter in the terminal to start.
  Logins persist for future runs.
- The script prints each phase. In `MANUAL=1` mode it waits for Enter between every
  step so you can narrate at your own pace.

## Pacing

Tune the delays in `demo/config.mjs` under `pacing` (all milliseconds).
`betweenPrompts` is how long it waits for the agent to answer each prompt — bump it
up if your agent is slow.

## If the agent chat box isn't found

The script searches the Agentforce page (and its iframes) for the placeholder text.
If Salesforce's markup differs, it prints the five prompts to the terminal so you can
paste them manually, and the rest of the demo still runs. You can also set
`agentSendButtonSelector` in the config if pressing Enter doesn't send.

## Reset between rehearsals

Every run starts by clearing demo data. To reset manually:

```bash
npm run demo:reset   # deletes all [DEMO]-tagged Salesforce records
```

All demo-created records are tagged `[DEMO]` and are the only ones touched.
