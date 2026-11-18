# CopilotPopup

> Floating chat bubble that toggles open an overlay chat window.

<!-- interactive demo: prebuilt-popup -->

## What is this? [#what-is-this]

`<CopilotPopup>` is a prebuilt floating launcher that opens an overlay chat
window on top of your page content. It adds a copilot to an existing app
without changing your page layout. Drop it in once and a bubble appears in the
corner ready to chat.

## When should I use this? [#when-should-i-use-this]

Use the popup when you want:

- A minimal-footprint copilot that overlays existing content on demand
- A launcher you can place on top of any page without reflowing the layout
- A quick assistant bubble that users open for short, task-focused chats

If you need chat to live alongside your content rather than on top of it,
use [CopilotSidebar](/google-antigravity/prebuilt-components/sidebar). For a fully embedded
chat pane, use [`<CopilotChat>`](/google-antigravity/prebuilt-components/chat) directly.

## Basic setup [#basic-setup]

Wrap your app in `<CopilotKit>` once (the provider wires the runtime,
session, and agent registry) and render `<CopilotPopup>` as a sibling of
your main content. The example below opens the popup by default and
customizes the input placeholder via `labels`:

```tsx
import { CopilotKit, CopilotPopup } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
```

Import from `@copilotkit/react-core/v2`. The `CopilotPopup` in `@copilotkit/react-ui` is the [deprecated v1 popup](/google-antigravity/migrate/v2).

```typescript title="src/app/demos/prebuilt-popup/page.tsx"
    <CopilotKit runtimeUrl="/api/copilotkit" agent="prebuilt-popup">
      <MainContent />
      <CopilotPopup
        agentId="prebuilt-popup"
        defaultOpen={true}
        labels={{
          chatInputPlaceholder: "Ask the popup anything...",
        }}
      />
      <Suggestions />
    </CopilotKit>
```

`<MainContent />` and `<Suggestions />` are demo components. Replace them with your own content.

## Configuring the popup [#configuring-the-popup]

`<CopilotPopup>` accepts the same props as `<CopilotChat>` plus a few of
its own. Commonly used options:

| Prop | Description |
|------|-------------|
| `defaultOpen` | Whether the popup starts open on first render. |
| `open` / `onOpenChange` | Control the open state from your own UI. See [Open, close, and feedback](/google-antigravity/prebuilt-components/chat-controls). |
| `agentId` | Agent slug the popup should talk to (must match an agent configured on the runtime). |
| `labels` | User-facing copy for the header, placeholder, and disclaimer. |
| `header` | Slot for the popup header bar. See the [slot system](/google-antigravity/custom-look-and-feel/slots). |
| `toggleButton` | Slot for the floating launcher button. |

## Styling [#styling]

`CopilotPopup` participates in the slot system, so every piece of its UI
is customizable, from Tailwind classes on the message view to a full
component swap for the header or toggle button. See
[custom look and feel](/google-antigravity/custom-look-and-feel/slots) for the full slot
reference.
