# Components as Tools

> Let your agent render rich React components directly in the chat by calling them as tools.

<!-- interactive demo: gen-ui-tool-based -->

## What is this? [#what-is-this]

Tool-based Generative UI is the simplest form of Generative UI: you register
a React component with `useComponent`, and CopilotKit exposes it to the
agent as a tool. When the agent calls the tool, CopilotKit renders your
component inline in the chat, passing the tool's arguments straight through
as typed props.

Unlike [tool rendering](/google-antigravity/generative-ui/tool-rendering), which wraps a
real backend tool in a custom UI, tool-based GenUI is the component. There
is no handler, no user interaction, no server-side execution. The agent
decides when to show it, populates the data, and CopilotKit renders it.

## When should I use this? [#when-should-i-use-this]

Use `useComponent` when you want to:

- Display rich UI (cards, charts, tables, dashboards) inline in the chat
- Show structured data the agent has derived from its reasoning
- Render previews, status indicators, or visual summaries
- Let the agent present information beyond plain text

For components that need user interaction, see
[Human-in-the-loop](/google-antigravity/human-in-the-loop). For operational transparency
around a real backend tool, see [Tool rendering](/google-antigravity/generative-ui/tool-rendering).

## How it works in code [#how-it-works-in-code]

<Steps>
  <Step>
    ### Nothing to wire on the agent

    The Antigravity AG-UI adapter turns every tool the frontend registers into
    a custom Antigravity tool on each run, so the agent declares no tools of
    its own for this. A component registered with `useComponent` reaches the
    model through the AG-UI request payload; when the model calls it, the
    adapter parks the call until the browser answers and hands the result back
    to the model as the tool's return value.

  </Step>
  <Step>
    ### Tell the model when to call it

    This is the part that is easy to miss. The tool arrives on every run, but a
    model with no instruction about it will answer in prose and never call it.
    Name the tool in the system instructions and say what it is for.

~~~~python title="gen_ui_tool_based.py"
from agents._common import build

SYSTEM_PROMPT = """You are a data visualization assistant.

When the user asks for a chart, call `render_bar_chart` or `render_pie_chart`
with a concise title, short description, and a `data` array of
`{label, value}` items. Pick bar for comparisons over a small set of
categories; pick pie for composition / share-of-whole.

If the user names a chart subject but does NOT supply concrete numbers
(e.g. "show me a pie chart of website traffic by source"), do NOT ask
them for data. Invent plausible illustrative sample values yourself,
call the appropriate `render_*` tool immediately, and briefly note in
the follow-up that the values are illustrative samples. Always render
the chart on the first turn -- never reply with a clarifying question
asking for the data.

Keep chat responses brief -- let the chart do the talking."""


def gen_ui_tool_based_agent():
    return build(system_instructions=SYSTEM_PROMPT)


~~~~

  </Step>
</Steps>

The built-in agent needs no backend step. Import the hook and Zod in the
component that registers the tool:

```tsx
import { useComponent } from "@copilotkit/react-core/v2";
import { z } from "zod";
```

`useComponent` takes a name, a Zod schema for its props, and the component
to render. The hook registers it as a frontend tool, so the agent can call
it. The schema becomes the tool's parameters, which tell the model which
arguments to send.

<Callout type="warn">
  `parameters` is optional, but leaving it out advertises the tool with an
  empty parameter schema (`{ "type": "object", "properties": {} }`). The model
  then has nothing to fill in, so it calls the tool with no arguments and your
  component renders with no props. Pass a schema for any component that needs
  data.
</Callout>

Define the props of your component as a Zod schema:

```tsx title="bar-chart.tsx"
import { z } from "zod";

export const barChartPropsSchema = z.object({
  title: z.string().describe("Chart title"),
  description: z.string().describe("Brief description or subtitle"),
  data: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
    }),
  ),
});
```

Pass the schema and your component to `useComponent`:

```typescript title="src/app/demos/gen-ui-tool-based/page.tsx"
  useComponent({
    name: "render_bar_chart",
    description: "Display a bar chart with labeled numeric values.",
    parameters: barChartPropsSchema,
    render: BarChart,
  });
```

`BarChart` is your own React component. It reads only its props and can
stream in as the agent fills the payload. The demo builds it with
[Recharts](https://recharts.org). It does not know anything about CopilotKit.

<Callout type="info">
  The `name` you pass to `useComponent` is what the agent sees as the tool
  name. Make it a verb like `render_bar_chart` or `show_weather` so the LLM
  reliably picks it when the user asks for that visualization.
</Callout>

To check it, ask the agent for a bar chart of quarterly sales. The bar chart
renders inline in the chat with the data from the agent.

## Rendering in a headless chat [#rendering-in-a-headless-chat]

CopilotKit's built-in chat components render registered components for you. A
headless or custom chat renders the message list itself, so no tool call
renders unless you render it. The component is registered and the agent
calls it, but the chat stays empty.

Render the tool calls on each assistant message with
`CopilotChatToolCallsView`:

```tsx
import { CopilotChatToolCallsView } from "@copilotkit/react-core/v2";

<CopilotChatToolCallsView message={assistantMessage} messages={allMessages} />;
```

It looks up the sibling `tool`-role message for each tool call and hands both
to the registered renderer. For finer placement, call `useRenderToolCall()` and
render each tool call yourself. See
[Headless UI](/google-antigravity/custom-look-and-feel/headless-ui).

<IntegrationGrid path="generative-ui/tool-based" />
