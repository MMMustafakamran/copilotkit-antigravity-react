# CopilotSidebar

> Drop-in collapsible sidebar chat that docks beside your main content.

<!-- interactive demo: prebuilt-sidebar -->

## What is this? [#what-is-this]

`<CopilotSidebar>` is a prebuilt chat surface that docks to the side of your
app. It sits beside your main content and slides out on demand, making it a good fit for in-app copilots that need to stay accessible without taking over the entire viewport.

## When should I use this? [#when-should-i-use-this]

Use the sidebar when you want:

- A persistent, collapsible chat attached to your app shell
- Chat to live alongside your main content rather than on top of it
- A launcher the user can toggle without losing their place

For a floating bubble that overlays content, see
[CopilotPopup](/google-antigravity/prebuilt-components/popup). For a fully embedded chat pane,
use [`<CopilotChat>`](/google-antigravity/prebuilt-components/chat) directly. For saved
conversations and switching between them, the sidebar hosts the
[Threads Drawer](/google-antigravity/prebuilt-components/copilot-threads-drawer).

## Basic setup [#basic-setup]

Wrap your app in `<CopilotKit>` once (it wires the runtime, session, and
agent registry) and drop `<CopilotSidebar>` alongside your main content.
The sidebar renders as a sibling. On screens 768px and wider, the open
sidebar adds a margin to the page body to make room for the chat:

```tsx
import { CopilotKit, CopilotSidebar } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
```

Import from `@copilotkit/react-core/v2`. The `CopilotSidebar` in `@copilotkit/react-ui` is the [deprecated v1 sidebar](/google-antigravity/migrate/v2).

```typescript title="src/app/demos/prebuilt-sidebar/page.tsx"
    <CopilotKit runtimeUrl="/api/copilotkit" agent="prebuilt-sidebar">
      <MainContent />
      <CopilotSidebar agentId="prebuilt-sidebar" defaultOpen={true} />
      <Suggestions />
    </CopilotKit>
```

`<MainContent />` and `<Suggestions />` are demo components. Replace them with your own content.

## Configuring the sidebar [#configuring-the-sidebar]

`<CopilotSidebar>` accepts the same props as `<CopilotChat>` plus a few of
its own. The example below opens the sidebar by default and targets a named
agent:

```typescript title="src/app/demos/prebuilt-sidebar/page.tsx"
      <CopilotSidebar agentId="prebuilt-sidebar" defaultOpen={true} />
```

Common sidebar-specific props:

| Prop | Description |
|------|-------------|
| `defaultOpen` | Whether the sidebar starts open on first render. |
| `open` / `onOpenChange` | Control the open state from your own UI. See [Open, close, and feedback](/google-antigravity/prebuilt-components/chat-controls). |
| `agentId` | Agent slug the sidebar should talk to (must match an agent configured on the runtime). |
| `labels` | User-facing copy for the header, placeholder, and disclaimer. |
| `header` | Slot for the sidebar header bar. See the [slot system](/google-antigravity/custom-look-and-feel/slots). |
| `toggleButton` | Slot for the open/close launcher button. |

## Styling [#styling]

`CopilotSidebar` participates in the slot system, so every piece of its UI
is customizable, from Tailwind classes on the message view to a full
component swap for the header or toggle button. See
[custom look and feel](/google-antigravity/custom-look-and-feel/slots) for the full slot
reference.
