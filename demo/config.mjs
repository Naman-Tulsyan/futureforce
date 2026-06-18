// ===========================================================================
// Demo configuration — edit the values in this file before running the demo.
// Run with:  npm run demo            (auto-paced)
//            MANUAL=1 npm run demo   (advance each step by pressing Enter)
// ===========================================================================

export default {
  // Your running Next.js app (dashboard + news + demo APIs).
  baseUrl: "http://localhost:3000",

  // Slack workspace/DM/channel to show the alert landing in.
  // Tip: open Slack in the launched browser once, navigate to the exact DM,
  // copy that URL here so the script lands right on the message.
  slackUrl: "https://app.slack.com/client/T0BB00XM7N3/D0BC9PM5ZQ8",

  // FULL Agentforce Builder preview URL (the page in your screenshot).
  // In your browser, open the agent → Preview tab, then copy the address bar.
  // Looks like:
  //   https://orgfarm-0ef5099dc6.lightning.force.com/AgentAuthoring/agentAuthoringBuilder.app#/project?projectId=1bYak000000ANY1EA...
  agentforceUrl:
    "https://orgfarm-0ef5099dc6.lightning.force.com/AgentAuthoring/agentAuthoringBuilder.app#/project?projectId=1bYak000000ANY1EAO&projectVersionId=1bZak000000JHmjEAG",

  // Dedicated Chrome profile dir so Salesforce + Slack logins persist between
  // runs. First run: log in once in the launched window; later runs reuse it.
  profileDir: "./demo/.profile",

  // Placeholder text of the Agentforce preview chat box (used to find it).
  agentInputPlaceholder: "Describe your task or ask a question...",

  // If pressing Enter only adds a newline instead of sending, set this to a CSS
  // selector for the send button (leave null to send with Enter).
  agentSendButtonSelector: null,

  // The five demo prompts (Phases 2-5 of the script), run in order.
  prompts: [
    "Pull a health snapshot on SiliconEdge Corp. Please include their new Total Score and their registered contact email.",
    "Are there any monopoly risks tied to SiliconEdge Corp for our semiconductor supply?",
    "Take this customs hold into account and run a simulation. If SiliconEdge Corp faces a full 4-week delay, what is the projected production drop and revenue impact for this quarter?",
    "That revenue impact is too high. Find alternative semiconductor suppliers who do not route through India. Rank them by their Quality Score and Total Score.",
    "Let's pivot to NanoChip Semiconductors. Draft an urgent email to our internal procurement team summarizing the Mumbai port strike, the simulated revenue loss, and our recommendation to initiate onboarding with NanoChip immediately.",
  ],

  // Auto-pacing delays (ms). Ignored when MANUAL=1. Tune to your narration.
  pacing: {
    afterDashboard: 4000, // linger on the baseline dashboard
    afterAlert: 5000, // after firing the Slack alert, before showing Slack
    afterSlack: 5000, // linger on the Slack DM
    afterEscalate: 6000, // after DB update + dashboard reload
    typeDelayMs: 18, // per-character typing speed in the agent chat
    betweenPrompts: 26000, // wait for the agent to finish answering each prompt
    afterStabilize: 8000, // linger on the stabilized dashboard at the end
  },
};
