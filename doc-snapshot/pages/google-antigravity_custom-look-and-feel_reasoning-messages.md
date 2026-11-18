# Reasoning Messages

> Customize how reasoning (thinking) tokens from models like `gpt-6-luna` are displayed.

<!-- interactive demo: reasoning-default -->

Some models (like `gpt-6-luna`) emit **reasoning tokens**: internal
"thinking" traces that show the model's chain-of-thought before it produces a final
answer. CopilotKit surfaces these tokens automatically with a collapsible
**Reasoning Message** card.

## Default Behavior [#default-behavior]

When reasoning events arrive from the agent, CopilotKit renders them inside a
built-in card that:

- Shows a **"Thinking…"** label with a pulsating indicator while the model is
  reasoning.
- Expands automatically so you can follow the model's thought process in
  real-time.
- Collapses and switches to **"Thought for X seconds"** once reasoning finishes.
- Renders the reasoning content as **Markdown**.
- Includes a chevron toggle so users can re-expand and review the reasoning
  at any time.

Connect your agent to CopilotKit. You do not need extra props or configuration:

```typescript title="src/app/demos/reasoning-default/page.tsx"
const AGENT_ID = "reasoning-default";

export default function ReasoningDefaultDemo() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent={AGENT_ID}>
      <div className="flex justify-center items-center h-screen w-full">
        <div className="h-full w-full max-w-4xl">
          <Chat />
        </div>
      </div>
    </CopilotKit>
  );
}

function Chat() {
  useReasoningDefaultSuggestions();
  return <CopilotChat agentId={AGENT_ID} className="h-full rounded-2xl" />;
}
```

If no card appears, your agent does not stream reasoning. For OpenAI models,
ask for a reasoning summary in the model options, for example
`reasoning: { effort: "high", summary: "auto" }`.

## Customizing the Reasoning Message [#customizing-the-reasoning-message]

The reasoning message has three parts. You can replace each part with a
**slot prop**:

| Sub-component | Slot prop | Description |
| --- | --- | --- |
| `Header` | `header` | The clickable bar with the label and the chevron |
| `Content` | `contentView` | The reasoning text area (Markdown) |
| `Toggle` | `toggle` | The expand/collapse animation wrapper |

You pass custom sub-components through the `messageView` prop on
`CopilotChat`, `CopilotPopup`, or `CopilotSidebar`:

```tsx
<CopilotChat
  messageView={{
    reasoningMessage: {
      header: CustomHeader,
      contentView: CustomContent,
    },
  }}
/>
```

### Custom Header [#custom-header]

Replace the header to change the icon, label text, or styling. The header
receives these props:

| Prop | Type | Description |
| --- | --- | --- |
| `isOpen` | `boolean` | Whether the content panel is currently expanded |
| `label` | `string` | `labels.reasoningMessageThinkingLabel` (`"Thinking…"`) while streaming, `"Thought for X seconds"` after |
| `hasContent` | `boolean` | Whether any reasoning text has been received |
| `isStreaming` | `boolean` | Whether reasoning is actively streaming |
| `elapsedSeconds` | `number` | Seconds spent reasoning, for building a localized label |
| `onClick` | `() => void` | Toggle handler (only present when `hasContent` is `true`) |

```tsx
import { CopilotChat } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

function CustomHeader({
  isOpen,
  label,
  hasContent,
  isStreaming,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isOpen?: boolean;
  label?: string;
  hasContent?: boolean;
  isStreaming?: boolean;
}) {
  return (
    <button
      className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium"
      {...props}
    >
      {isStreaming ? "🧠" : "💡"}
      <span>{label}</span>
      {hasContent && (
        <span className="ml-auto text-xs">{isOpen ? "Hide" : "Show"}</span>
      )}
    </button>
  );
}

<CopilotChat
  messageView={{
    reasoningMessage: { header: CustomHeader },
  }}
/>
```

To check it, ask the agent a question that needs reasoning. While the model
thinks, the header shows 🧠 and "Thinking…". When it finishes, the header shows
💡 and "Thought for N seconds".

### Custom Content [#custom-content]

Replace the content area to change how reasoning text is displayed:

| Prop | Type | Description |
| --- | --- | --- |
| `isStreaming` | `boolean` | Whether reasoning tokens are still arriving |
| `hasContent` | `boolean` | Whether any reasoning text has been received |
| `children` | `string` | The raw reasoning text |

```tsx
function CustomContent({
  isStreaming,
  hasContent,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  isStreaming?: boolean;
  hasContent?: boolean;
}) {
  if (!hasContent && !isStreaming) return null;

  return (
    <div className="px-4 pb-3 text-sm text-gray-500 font-mono" {...props}>
      {children}
      {isStreaming && <span className="animate-pulse ml-1">▊</span>}
    </div>
  );
}

<CopilotChat
  messageView={{
    reasoningMessage: { contentView: CustomContent },
  }}
/>
```

## Fully Custom Reasoning Message [#fully-custom-reasoning-message]

For complete control over the entire reasoning card, pass a **component** instead of
slot props. Your component receives the same top-level props as the built-in one:

| Prop | Type | Description |
| --- | --- | --- |
| `message` | `ReasoningMessage` | The reasoning message object (`.content` holds the text) |
| `messages` | `Message[]` | All messages in the conversation |
| `isRunning` | `boolean` | Whether the agent is currently running |

<!-- interactive demo: reasoning-custom -->

`ReasoningBlock` shows the reasoning text in a tagged banner. Replace it with
your own component:

```typescript title="src/app/demos/reasoning-custom/page.tsx"
const AGENT_ID = "reasoning-custom";

export default function ReasoningCustomDemo() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent={AGENT_ID}>
      <div className="flex justify-center items-center h-screen w-full">
        <div className="h-full w-full max-w-4xl">
          <Chat />
        </div>
      </div>
    </CopilotKit>
  );
}

function Chat() {
  useReasoningCustomSuggestions();
  return (
    <CopilotChat
      agentId={AGENT_ID}
      className="h-full rounded-2xl"
      messageView={{
        reasoningMessage:
          ReasoningBlock as unknown as typeof CopilotChatReasoningMessage,
      }}
    />
  );
}
```

`ReasoningBlock` reads the `message`, `messages`, and `isRunning` props:

```typescript title="src/app/demos/reasoning-custom/reasoning-block.tsx"
"use client";

// Custom `reasoningMessage` slot renderer.
//
// Receives the `ReasoningMessage` plus (optionally) the full message list and
// the running state from the slot system. Renders the content inline with a
// visibly tagged amber banner so the user can always see the agent's thinking
// chain — this is the focal UI of the demo.

import React from "react";
import type { ReasoningMessage, Message } from "@ag-ui/core";

export function ReasoningBlock({
  message,
  messages,
  isRunning,
}: {
  message: ReasoningMessage;
  messages?: Message[];
  isRunning?: boolean;
}) {
  const isLatest = messages?.[messages.length - 1]?.id === message.id;
  const isStreaming = !!(isRunning && isLatest);
  const hasContent = !!(message.content && message.content.length > 0);

  return (
    <div
      data-testid="reasoning-block"
      className="my-2 rounded-xl border border-[#DBDBE5] bg-[#BEC2FF1A] px-3.5 py-2.5 text-sm dark:border-border"
    >
      <div className="flex items-center gap-2 font-medium text-[#010507] dark:text-foreground">
        <span className="inline-block rounded-full border border-[#BEC2FF] bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#57575B] dark:bg-card dark:text-muted-foreground">
          Reasoning
        </span>
        <span className="text-[#57575B] dark:text-muted-foreground">
          {isStreaming ? "Thinking…" : hasContent ? "Agent reasoning" : "…"}
        </span>
      </div>
      {hasContent && (
        <div className="mt-1.5 whitespace-pre-wrap italic text-[#57575B] dark:text-muted-foreground">
          {message.content}
        </div>
      )}
    </div>
  );
}
```

## Render-Prop Children [#render-prop-children]

The built-in `CopilotChatReasoningMessage` also supports a **render-prop**
pattern for cases where you want to rearrange the built-in sub-components
without reimplementing them:

```tsx
import {
  CopilotChatReasoningMessage,
} from "@copilotkit/react-core/v2";
import { CopilotChat } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

function MyReasoningLayout(props: React.ComponentProps<typeof CopilotChatReasoningMessage>) {
  return (
    <CopilotChatReasoningMessage {...props}>
      {({ header, toggle }) => (
        <div className="rounded-lg border bg-yellow-50 my-2">
          {header}
          {toggle}
        </div>
      )}
    </CopilotChatReasoningMessage>
  );
}

<CopilotChat
  messageView={{
    reasoningMessage: MyReasoningLayout as typeof CopilotChatReasoningMessage,
  }}
/>
```

The render-prop callback receives:

| Property | Description |
| --- | --- |
| `header` | Pre-rendered header element |
| `contentView` | Pre-rendered content element |
| `toggle` | Pre-rendered expand/collapse wrapper (contains `contentView`) |
| `message` | The reasoning message object |
| `messages` | All messages |
| `isRunning` | Whether the agent is running |
