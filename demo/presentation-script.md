# Supply Chain Disruption Agent — Live Demo Script (3 speakers)

**Scenario:** The Mumbai Port Customs Strike · **Run time:** ~6 min
**One-line pitch:** *"From disruption detected → alternative sourced → email sent, in under 60 seconds."*

---

## Setup (before you start)

- Run the app: `npm run dev` (separate terminal).
- Run the demo in **manual** mode so the operator advances each beat by pressing **Enter**:
  ```bash
  MANUAL=1 npm run demo
  ```
- In the **launched Chrome window**, get ready: Slack on the alert DM, and the
  **Agentforce → Preview** tab open with the *"Describe your task…"* box visible.
- **Roles:**
  - 🎤 **Speaker A** — Problem + Trigger + Alert
  - 🎤 **Speaker B** — Risk Assessment + Impact Simulation (the "wow")
  - 🎤 **Speaker C** — Resolution + Dashboard close
  - 🖱️ **Operator** — sits at the laptop, presses **Enter** on each cue. (Can be Speaker A.)

> Every "▶ Operator: Enter" below = press Enter once in the terminal. The agent
> answers during the gap, so the speaker narrates while it thinks.

---

## 🎤 Speaker A — Problem & Trigger (0:00 – 1:30)

**[Screen: Operations Dashboard — baseline]**

> "Every year, EV manufacturers lose millions to supply-chain disruptions caught
> too late. Operations managers are firefighting — reacting after the damage is done.
>
> We built a 24/7 AI Supply Chain Intelligence Officer on Salesforce Agentforce. It
> doesn't just tell you what went wrong — it tells you what's *about* to go wrong,
> who to switch to, drafts the supplier email, and simulates the full impact before
> you decide. This is our live command center — suppliers, deliveries, risk, all live
> from Salesforce."

**▶ Operator: Enter** → *(switches to the mock news site, auto-fires the Slack alert)*

**[Screen: Breaking news — "Mumbai Port Customs Workers Go On Indefinite Strike"]**

> "Here's the trigger. Breaking news: customs workers at the Mumbai Port have gone
> on an indefinite strike. A human might see this hours later — if at all. Our agent
> is already listening, and cross-referencing it against our live delivery data."

**▶ Operator: Enter** → *(switches to Slack)*

**[Screen: Slack DM from the agent]**

> "Within seconds, the agent proactively DMs our operations manager — no one asked it
> to. It has connected the news to a specific shipment: **SiliconEdge Corp's
> semiconductor shipment DEL-006**, already **7 days overdue** at that exact port. It
> flags this **Critical** and offers to pull a health check. Let me hand over to
> investigate."

**▶ Operator: Enter** → *(writes the strike into Salesforce, reloads the dashboard)*

**[Screen: Dashboard — point at the changes]**

> "And notice the command center already reacted: **Active Disruptions ticked up**, a
> new **Critical SiliconEdge risk** appears in Active Risks, and the strike is now top
> of our **Live Disruption Signals**."

**▶ Operator: Enter** → *(brings up the Agentforce Preview chat)*

---

## 🎤 Speaker B — Risk Assessment & Simulation (1:30 – 3:45)

*(Operator may need to confirm the Preview chat is ready, then Enter.)*

**[Screen: Agentforce Preview chat]**

> "Let's ask the agent directly."

**Prompt 1 auto-types:** *"Yes, pull a health snapshot on SiliconEdge Corp. Include
their Total Score and registered contact email."*

> "It returns a full health snapshot — status **At Risk**, the Total Score, and the
> contact email, ready to act on. One question, complete picture."

**▶ Operator: Enter** → **Prompt 2 auto-types:** *"Are there any monopoly risks tied
to SiliconEdge Corp for our semiconductor supply?"*

> "Now the strategic risk. The agent finds that SiliconEdge supplies a huge share of
> our baseline semiconductor volume — a **single-source bottleneck**. One strike, and
> a big chunk of production is exposed."

**▶ Operator: Enter** → **Prompt 3 auto-types:** *"Take this customs hold into account
and run a simulation — if SiliconEdge faces a full 4-week delay, what's the projected
production drop and revenue impact this quarter?"*

> "This is the moment no spreadsheet gives you. The agent simulates a full 4-week
> delay — projecting the **production drop**, the **multi-million-rupee revenue hit**,
> and warning the assembly line could halt. We can see the cost of doing nothing
> *before* we spend a single rupee. So — what do we do about it?"

---

## 🎤 Speaker C — Resolution & Close (3:45 – 6:00)

**▶ Operator: Enter** → **Prompt 4 auto-types:** *"That revenue impact is too high.
Find alternative semiconductor suppliers who don't route through India. Rank them by
Quality Score and Total Score."*

> "The agent doesn't just flag the problem — it solves it. It recommends two active,
> high-quality alternatives outside India: **NanoChip Semiconductors** and
> **ChipMaster Global**, both in Taiwan — ranked, with reasoning, not just a list."

**▶ Operator: Enter** → **Prompt 5 auto-types:** *"Let's pivot to NanoChip. Draft an
urgent email to procurement summarizing the strike, the simulated revenue loss, and a
recommendation to onboard NanoChip immediately."*

> "And it closes the loop. A professional, context-aware email to our procurement
> team — the strike, the simulated loss, the recommendation — drafted and ready to
> send in seconds."

**▶ Operator: Enter** → *(stabilizes the data, reloads the dashboard)*

**[Screen: Dashboard — risk settling]**

> "As we activate the alternative, watch the command center stabilize: the
> **SiliconEdge Critical risk clears**, **Active Disruptions drops back down**, and the
> feed shows **NanoChip activated, Mumbai exposure mitigated**.
>
> That's the whole loop — disruption *detected*, impact *simulated*, alternative
> *sourced*, email *drafted* — in under a minute, on Salesforce Agentforce. From
> firefighting to foresight."

**[Optional Q&A]**

---

## Timing cheat-sheet

| Beat | Speaker | Screen | Operator |
|---|---|---|---|
| Intro / problem | A | Dashboard baseline | — |
| Breaking news | A | News site | Enter |
| Slack DM | A | Slack | Enter |
| Dashboard reacts | A | Dashboard (changes) | Enter |
| → Agentforce | A→B | Preview chat | Enter |
| Health snapshot | B | Prompt 1 | — |
| Monopoly risk | B | Prompt 2 | Enter |
| Simulation (wow) | B | Prompt 3 | Enter |
| Alternatives | C | Prompt 4 | Enter |
| Email draft | C | Prompt 5 | Enter |
| Stabilized dashboard | C | Dashboard (settles) | Enter |

**If the agent is slow:** stretch the narration — the next prompt only fires when the
operator presses Enter, so you're never racing the model.
