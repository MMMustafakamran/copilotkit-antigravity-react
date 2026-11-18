# Slots (Subcomponents)

> Customize any part of the chat UI by overriding individual sub-components via slots.

<!-- interactive demo: chat-slots -->

## What is this? [#what-is-this]

Every CopilotKit chat component is built from composable **slots**, named sub-components you can override individually. The slot system gives you three levels of customization without needing to rebuild the entire UI:

1. **Tailwind classes**: pass a string to add/override CSS classes
2. **Props override**: pass an object to override specific props on the default component
3. **Custom component**: pass your own React component to fully replace a slot

Slots are recursive: you can drill into nested sub-components at any depth.

## What it looks like in code [#what-it-looks-like-in-code]

The demo above overrides many slots on `<CopilotChat>` and outlines each one.
The three examples below show the welcome screen, the assistant message, and the input disclaimer.
Each slot is just a prop; the demo extracts them into locals so the override
points are easy to see.

### Welcome screen slot [#welcome-screen-slot]

The `welcomeScreen` prop replaces the empty-state view shown before the first
message is sent. The demo swaps in a gradient card that still renders the
default input and suggestions:

```typescript title="src/app/demos/chat-slots/slot-overrides.tsx"
import type {
  CopilotChatAssistantMessage,
  CopilotChatInput,
  CopilotChatView,
} from "@copilotkit/react-core/v2";

declare const CustomWelcomeScreen: React.ComponentType;
declare const CustomAssistantMessage: React.ComponentType;
declare const CustomDisclaimer: React.ComponentType;

export function ChatSlotsTeachingExtracts() {
  const welcomeScreen =
    CustomWelcomeScreen as unknown as typeof CopilotChatView.WelcomeScreen;
```

### Assistant message slot [#assistant-message-slot]

Drill into `messageView={{ assistantMessage: ... }}` to wrap every assistant
response. The demo wraps the default component with a tinted card and a small
"slot" badge so you can see the override is active during the message flow:

```typescript title="src/app/demos/chat-slots/slot-overrides.tsx"
import type {
  CopilotChatAssistantMessage,
  CopilotChatInput,
  CopilotChatView,
} from "@copilotkit/react-core/v2";

declare const CustomWelcomeScreen: React.ComponentType;
declare const CustomAssistantMessage: React.ComponentType;
declare const CustomDisclaimer: React.ComponentType;

export function ChatSlotsTeachingExtracts() {
  const welcomeScreen =
    CustomWelcomeScreen as unknown as typeof CopilotChatView.WelcomeScreen;

  const messageView = {
    assistantMessage:
      CustomAssistantMessage as unknown as typeof CopilotChatAssistantMessage,
  };
```

### Disclaimer slot [#disclaimer-slot]

The `input={{ disclaimer: ... }}` sub-slot lets you replace the small text
shown below the input. The demo tags its disclaimer, so you can see that the
override stays after the first message:

```typescript title="src/app/demos/chat-slots/slot-overrides.tsx"
import type {
  CopilotChatAssistantMessage,
  CopilotChatInput,
  CopilotChatView,
} from "@copilotkit/react-core/v2";

declare const CustomWelcomeScreen: React.ComponentType;
declare const CustomAssistantMessage: React.ComponentType;
declare const CustomDisclaimer: React.ComponentType;

export function ChatSlotsTeachingExtracts() {
  const welcomeScreen =
    CustomWelcomeScreen as unknown as typeof CopilotChatView.WelcomeScreen;

  const messageView = {
    assistantMessage:
      CustomAssistantMessage as unknown as typeof CopilotChatAssistantMessage,
  };

  const input = {
    disclaimer:
      CustomDisclaimer as unknown as typeof CopilotChatInput.Disclaimer,
  };
```

## Tailwind Classes [#tailwind-classes]

Pass a Tailwind class string. CopilotKit merges it with the classes of the default component.

```tsx title="page.tsx"
import { CopilotChat } from "@copilotkit/react-core/v2";

export function Chat() {
  return (
    <CopilotChat
      messageView="bg-gray-50 dark:bg-gray-900 p-4"
      input="border-2 border-blue-400 rounded-xl"
    />
  );
}
```

Reload the page. The message list has a gray background and the input has a blue border.

## Props Override [#props-override]

Pass an object to override specific props on the default component. This is useful for adding `className`, event handlers, data attributes, or any other prop the default component accepts.

```tsx title="page.tsx"
<CopilotChat
  messageView={{
    className: "my-custom-messages",
    "data-testid": "message-view",
  }}
  input={{ autoFocus: true }}
/>
```

## Custom Components [#custom-components]

For full control, pass your own React component. It receives all the same props as the default component. The slot type is the default component, so cast your component to that type.

```tsx title="page.tsx"
import {
  CopilotChat,
  CopilotChatMessageView,
  type CopilotChatMessageViewProps,
} from "@copilotkit/react-core/v2";

const CustomMessageView = ({ messages, isRunning }: CopilotChatMessageViewProps) => (
  <div className="space-y-4 p-6">
    {messages?.map((msg) => (
      <div key={msg.id} className={msg.role === "user" ? "text-right" : "text-left"}>
        {typeof msg.content === "string" ? msg.content : null}
      </div>
    ))}
    {isRunning && <div className="animate-pulse">Thinking...</div>}
  </div>
);

export function Chat() {
  return <CopilotChat messageView={CustomMessageView as typeof CopilotChatMessageView} />;
}
```

## Nested Slots (Drill-Down) [#nested-slots-drill-down]

Slots are recursive. You can customize sub-components at any depth by nesting objects.

### Two levels deep [#two-levels-deep]

Override the assistant message's toolbar within the message view:

```tsx title="page.tsx"
<CopilotChat
  messageView={{
    assistantMessage: {
      toolbar: CustomToolbar,
      copyButton: CustomCopyButton,
    },
    userMessage: CustomUserMessage,
  }}
/>
```

### One toolbar button [#one-toolbar-button]

Override a specific button inside the assistant message toolbar:

```tsx title="page.tsx"
<CopilotChat
  messageView={{
    assistantMessage: {
      copyButton: ({ onClick }) => (
        <button onClick={onClick}>Copy</button>
      ),
    },
  }}
/>
```

### Tool calls [#tool-calls]

The `assistantMessage` slot holds `toolCallsView`, which renders the tool calls
of one assistant message. Wrap the default `CopilotChatToolCallsView` to change
the container while keeping your registered tool renderers:

```tsx title="page.tsx"
import {
  CopilotChat,
  CopilotChatToolCallsView,
  type CopilotChatToolCallsViewProps,
} from "@copilotkit/react-core/v2";

const CustomToolCallsView = (props: CopilotChatToolCallsViewProps) => (
  <div className="rounded-lg border border-dashed p-2">
    <CopilotChatToolCallsView {...props} />
  </div>
);

export function Chat() {
  return (
    <CopilotChat
      messageView={{
        assistantMessage: { toolCallsView: CustomToolCallsView },
      }}
    />
  );
}
```

To see `CopilotChatToolCallsView` in progress, complete, expanded, and failed
states, open the
[`CopilotChatToolCallsView` stories](https://github.com/CopilotKit/CopilotKit/blob/main/examples/v2/react/storybook/stories/CopilotChatToolCallsView.stories.tsx)
in the React Storybook.

To change how calls are grouped (a card, a line of text, a stack, or one
summary per turn) without writing a component, set `toolCallDisplay` on the
message view. See [Grouping tool calls](/google-antigravity/generative-ui/tool-rendering#grouping-tool-calls).

The `assistantMessage` slot also holds `markdownRenderer`, which controls how
assistant markdown is rendered. It has its own guide:
[Markdown Rendering](/google-antigravity/custom-look-and-feel/markdown).

## Labels [#labels]

Customize any text string in the UI via the `labels` prop. This is a separate convenience prop on `CopilotChat`, `CopilotSidebar`, and `CopilotPopup`, not part of the slot system.

```tsx title="page.tsx"
<CopilotChat
  labels={{
    chatInputPlaceholder: "Ask your agent anything...",
    welcomeMessageText: "How can I help you today?",
    chatDisclaimerText: "AI responses may be inaccurate.",
  }}
/>
```

## Available Slots [#available-slots]

### `CopilotChat` / `CopilotSidebar` / `CopilotPopup` [#copilotchat--copilotsidebar--copilotpopup]

These are the root-level slot props available on all chat components:

| Slot | Description |
|------|-------------|
| `messageView` | The message list container. |
| `scrollView` | The scroll container with auto-scroll behavior. |
| `input` | The text input area with send/transcribe controls. |
| `suggestionView` | The suggestion pills shown below messages. |
| `welcomeScreen` | The initial empty-state screen (pass `false` to disable). |

`CopilotSidebar` and `CopilotPopup` also have:

| Slot | Description |
|------|-------------|
| `header` | The modal header bar. |
| `toggleButton` | The open/close toggle button. |
