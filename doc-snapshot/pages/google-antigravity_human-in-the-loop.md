# HITL Overview

> Allow your agent and users to collaborate on complex tasks.

<!-- interactive demo: hitl-in-chat -->

<Callout type="info" title="See this in Inspector">
  Open Inspector on localhost. Go to **Inspect**, then **Frontend Tools**.
  Your tool and its schema are listed.

  More detail: [Inspector](/google-antigravity/inspector).
</Callout>

## What is this? [#what-is-this]

Human-in-the-loop (HITL) lets an agent pause mid-run to collect input,
confirmation, or a choice from the user, then resume with that answer
folded back into its reasoning. It's what turns an autonomous workflow
into a collaborative one: the agent keeps its context, the user keeps
the steering wheel.

<video
  src="https://cdn.copilotkit.ai/docs/copilotkit/images/coagents/human-in-the-loop-example.mp4"
  className="rounded-lg shadow-xl"
  loop
  playsInline
  controls
  autoPlay
  muted
/>

## When should I use this? [#when-should-i-use-this]

Use HITL when you need:

- **Quality control**: a human gate at high-stakes decision points.
- **Missing input**: the agent needs a value only the user knows, such as a meeting time.
- **Risky actions**: the agent must get a yes before it sends, pays, or deletes.
- **Expert input**: the user supplies domain knowledge the model lacks.

## Two patterns for HITL in CopilotKit [#two-patterns-for-hitl-in-copilotkit]

CopilotKit ships two complementary ways to pause an agent turn and ask
the human something. They look similar from the outside (the chat
pauses, a custom component appears, the user answers, the run resumes)
but they're wired differently on the backend, and each has its own niche.

| Pattern | Who decides to pause? | Backend surface |
| --- | --- | --- |
| `useHumanInTheLoop` | The **LLM**, by calling a registered client-side tool | A frontend-only tool description (Zod schema + `render`) |
| `useInterrupt` | Your **agent code**, at a step that must stop for a person | An interrupt your agent emits, for example LangGraph `interrupt()` or Mastra `suspend()` |

**Pick `useHumanInTheLoop`** when the pause is an _agent-initiated_
decision (the model chose to ask the user) and you want the picker UI
inlined into the normal tool-call flow.

**Pick `useInterrupt`** when the pause is a checkpoint in your agent code:
the code path always requires a human answer, and the server-side contract is
an interrupt. On the Built-in Agent, interrupts are temporarily unavailable, so
use `useHumanInTheLoop` there.

<Steps>
  <Step>
    ### Install the Antigravity AG-UI adapter

    ```bash
    pip install ag-ui-antigravity google-antigravity
    ```

  </Step>
  <Step>
    ### Ask for the human with a frontend tool

    The simplest route is an ordinary frontend tool. Register it in the
    browser with `useHumanInTheLoop`, or with `useFrontendTool` and an `async`
    handler that resolves once the user has answered. Each run carries that
    tool definition to the agent, the adapter rebuilds it as a custom
    Antigravity tool, and when the model calls it the call parks as an awaited
    coroutine — the SSE response for that run closes, and the adapter resolves
    the parked call from a later HTTP run with whatever the handler returned.
    The model receives that value as the tool's real return value, so there is
    no proxy tool and no fire-and-forget long-running-tool workaround.

  </Step>
  <Step>
    ### Or pause a server tool with `experimental_interrupt()`

    When the backend decides it needs the user, a Python server tool can pause
    itself on an AG-UI interrupt with the adapter's experimental
    `experimental_interrupt()` and carry on with the answer:

    ```python
    from ag_ui_antigravity import experimental_interrupt

    async def schedule_meeting(topic: str, attendee: str) -> str:
        """Books a meeting once the user picks a time."""
        answer = await experimental_interrupt(
            "schedule_meeting",
            message=f"Pick a time for {topic}",
            metadata={"topic": topic, "attendee": attendee},
        )
        if not answer.resolved:
            return f"Not scheduled ({answer.status})."
        return f"Scheduled for {answer.payload['chosen_label']}."
    ```

    The run ends with `RUN_FINISHED` carrying an interrupt outcome, which
    `useInterrupt` renders; the payload the user resolves it with comes back
    unchanged in `answer.payload`. `answer.status` is `"resolved"`,
    `"cancelled"` or `"abandoned"` (the user sent a new message instead).

  </Step>
  <Step>
    ### Name the tool in the agent's instructions

    That leaves the agent with one job: knowing the tool exists and when to
    call it. A model that is never told about `book_call` will answer in prose
    and the picker will never mount.

~~~~python title="hitl.py"
from agents._common import build

HITL_IN_CHAT_PROMPT = (
    "You help users book an onboarding call with the sales team. "
    "When they ask to book a call, call the frontend-provided "
    "`book_call` tool with a short topic and the user's name. "
    "Keep any chat reply to one short sentence."
)


def hitl_in_chat_agent():
    return build(system_instructions=HITL_IN_CHAT_PROMPT)


~~~~

    The frontend tool is dispatched to the browser at most once per turn
    (`deduplicate_tool_calls`, on by default), so a model that re-issues the
    same call after the harness backgrounds it does not ask the user twice.

  </Step>
</Steps>

<Callout type="info" title="ask_question is off in this showcase">
  Antigravity's own `ask_question` built-in tool — the one primitive that would
  park on a real AG-UI interrupt — is disabled here with
  `CapabilitiesConfig(enabled_tools=[BuiltinTools.FINISH])`. The CopilotKit
  demos answer a tool call with a `ToolMessage`, not an interrupt `resume`, so
  a turn that parked on `ask_question` would wait forever. `FINISH` has to stay
  enabled: it is how the harness ends a turn.
</Callout>

## Pattern 1: `useHumanInTheLoop` (tool-based) [#pattern-1-usehumanintheloop-tool-based]

Register a HITL tool in your React app with `useHumanInTheLoop`.
When the LLM calls that tool, CopilotKit routes the call through your
`render` function, which shows a custom component and calls `respond`
with the user's answer. The agent sees the answer as the tool result and
continues from there.

```typescript title="src/app/demos/hitl-in-chat/page.tsx"
import React from "react";
import {
  CopilotKit,
  CopilotChat,
  useHumanInTheLoop,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import type { TimeSlot } from "./time-picker-card";
import { TimePickerCard } from "./time-picker-card";

const DEFAULT_SLOTS: TimeSlot[] = [
  { label: "Tomorrow 10:00 AM", iso: "2026-04-19T10:00:00-07:00" },
  { label: "Tomorrow 2:00 PM", iso: "2026-04-19T14:00:00-07:00" },
  { label: "Monday 9:00 AM", iso: "2026-04-21T09:00:00-07:00" },
  { label: "Monday 3:30 PM", iso: "2026-04-21T15:30:00-07:00" },
];

export default function HitlInChatDemo() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="hitl-in-chat">
      <div className="flex justify-center items-center h-screen w-full">
        <div className="h-full w-full max-w-4xl">
          <Chat />
        </div>
      </div>
    </CopilotKit>
  );
}

function Chat() {
  useConfigureSuggestions({
    suggestions: [
      {
        title: "Book a call with sales",
        message:
          "Please book an intro call with the sales team to discuss pricing.",
      },
      {
        title: "Schedule a 1:1 with Alice",
        message: "Schedule a 1:1 with Alice next week to review Q2 goals.",
      },
    ],
    available: "always",
  });

  useHumanInTheLoop({
    agentId: "hitl-in-chat",
    name: "book_call",
    description:
      "Ask the user to pick a time slot for a call. The picker UI presents fixed candidate slots; the user's choice is returned to the agent.",
    parameters: z.object({
      topic: z
        .string()
        .describe("What the call is about (e.g. 'Intro with sales')"),
      attendee: z
        .string()
        .describe("Who the call is with (e.g. 'Alice from Sales')"),
    }),
    render: ({ args, status, respond }: any) => (
      <TimePickerCard
        topic={args?.topic ?? "a call"}
        attendee={args?.attendee}
        slots={DEFAULT_SLOTS}
        status={status}
        onSubmit={(result) => respond?.(result)}
      />
    ),
  });
```

The sample imports `TimePickerCard` from its own file. The card renders the
slots and calls `onSubmit` with the user's choice. These are its props:

```typescript title="src/app/demos/hitl-in-chat/time-picker-card.tsx"
export interface TimePickerCardProps {
  topic: string;
  attendee?: string;
  slots: TimeSlot[];
  status: TimePickerStatus;
  onSubmit: (
    result: { chosen_time: string; chosen_label: string } | { cancelled: true },
  ) => void;
}
```

Each slot button calls `onSubmit({ chosen_time: s.iso, chosen_label: s.label })`.
The "None of these work" button calls `onSubmit({ cancelled: true })`. The full
file is in the Code view of the demo at the top of this page.

The picker UI is fed a static list of candidate slots. This is just
data the demo page owns, so you can swap in real availability, a
calendar API, or anything else:

```typescript title="src/app/demos/hitl-in-chat/page.tsx"
import React from "react";
import {
  CopilotKit,
  CopilotChat,
  useHumanInTheLoop,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import type { TimeSlot } from "./time-picker-card";
import { TimePickerCard } from "./time-picker-card";

const DEFAULT_SLOTS: TimeSlot[] = [
  { label: "Tomorrow 10:00 AM", iso: "2026-04-19T10:00:00-07:00" },
  { label: "Tomorrow 2:00 PM", iso: "2026-04-19T14:00:00-07:00" },
  { label: "Monday 9:00 AM", iso: "2026-04-21T09:00:00-07:00" },
  { label: "Monday 3:30 PM", iso: "2026-04-21T15:30:00-07:00" },
];
```

## Pattern 2: `useInterrupt` (agent-paused) [#pattern-2-useinterrupt-agent-paused]

With an interrupt, your agent code enforces the pause, for example with
LangGraph's `interrupt()`:

1. A node calls `interrupt({...})`, and the run stops.
2. The client receives the payload and renders your UI.
3. The user answers, and the run resumes with the answer.

CopilotKit's `useInterrupt` hook is the render contract.

See the [`useInterrupt` deep dive](/google-antigravity/human-in-the-loop/useInterrupt) for
the full walkthrough, including the backend tool and render-prop wiring.

## Going headless [#going-headless]

Both patterns above ship with a `render` prop. CopilotKit handles the
"when to show the picker" logic for you. If you want to drive
interrupt resolution from a custom UI that lives anywhere in the tree
(not necessarily inside a chat), see the
[headless interrupts guide](/google-antigravity/human-in-the-loop/headless). It shows
how to compose `useAgent`, `agent.subscribe`, and `copilotkit.runAgent`
to build your own `useInterrupt` equivalent.

<IntegrationGrid path="human-in-the-loop" />
