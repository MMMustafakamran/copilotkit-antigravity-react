# Headless Interrupts

> Resolve agent interrupts from any UI, without a useInterrupt render slot.

> **Not available for Google Antigravity yet.** The code on this page comes from the showcase's `interrupt-headless` demo, and Google Antigravity doesn't have it yet. See this page for [CopilotKit's Built-in Agent](/human-in-the-loop/headless), [LangGraph (Python)](/langgraph-python/human-in-the-loop/headless), [LangGraph (TypeScript)](/langgraph-typescript/human-in-the-loop/headless).

## What is this? [#what-is-this]

Sometimes the agent's question belongs outside the chat, in a dashboard, a
side panel, or a modal. A headless interrupt lets any component show the
question and resume the run with the answer. No chat needs to be mounted.

This page shows how to resolve an interrupt without the chat. You build the
resolver from the same hooks that `useInterrupt` uses. It can be a button
grid, a form, a modal, or a keyboard shortcut.

For promise-based agent frameworks there is no native interrupt primitive,
so the headless variant uses `useFrontendTool` with a Promise-based
handler. The handler exposes its pending payload via React state, so
a separate "app surface" can render the picker outside the chat. It
resolves the Promise once the user interacts. Same UX, different
mechanism.

## When should I use this? [#when-should-i-use-this]

- **Testing / Playwright fixtures**: a deterministic, chat-less button
  grid is easier to drive than a chat surface where the picker only
  appears after an LLM call.
- **Non-chat UIs**: dashboards, side panels, inspector surfaces, or
  any place where you want the _agent's interrupt_ without the _chat
  transcript_.
- **Custom flow control**: when you need to know exactly when the
  interrupt arrived (e.g. to gate other UI) and when it was resolved.
- **Research / debugging**: when you want to observe the raw AG-UI
  custom events without the abstraction layer.

If you just want "a picker in chat", just use
[`useInterrupt`](./useInterrupt). For pauses that the model decides on, use
[`useHumanInTheLoop`](../human-in-the-loop).

## The primitives [#the-primitives]

The render callback intentionally returns `null`. The picker UI lives
in the app surface, not in the chat transcript. The handler's pending
state drives whether the picker is shown:

A few things this pattern is careful about:

- The handler stages its `resolve` callback in a ref keyed by tool-call
  id, so concurrent tool calls don't trample each other's resolvers.
- `setPending` is called from inside the handler so the app surface
  re-renders the picker as soon as the agent calls the tool, and again
  with `null` after the user interacts so the picker disappears.
- `render: () => null` keeps the chat transcript clean. The headless
  variant deliberately bypasses inline rendering.
