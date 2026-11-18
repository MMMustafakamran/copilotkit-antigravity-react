# Shared State

> Create a two-way connection between your UI and agent state.

## What is shared state? [#what-is-shared-state]

Agentic Copilots maintain a shared state that connects your UI with the agent's execution. This shared state lets you:

- Display the agent's current progress and intermediate results
- Update the agent's state through UI interactions
- React to state changes in real-time across your application

<ImageZoom
  src="https://cdn.copilotkit.ai/docs/copilotkit/images/coagents/SharedStateCoAgents.gif"
  alt="Shared State Demo"
  width={1000}
  height={1000}
  className="rounded-lg shadow-lg border mt-0"
/>

<Callout type="info" title="See this in Inspector">
  Open Inspector on localhost. Go to **Inspect**, then **Agent**.
  The **Current State** section shows the agent state as the run proceeds.
  With Intelligence on, you can also open a thread in **Rich Threads** and
  click **State** to see its saved state.

  More detail: [Inspector](/google-antigravity/inspector).
</Callout>

## When should I use this? [#when-should-i-use-this]

Use shared state when you want the agent and the user to collaborate through the
same application state. The UI shows what the agent writes. The agent reads what
the user changes in the UI.

<OpsPlatformCTA
  variant="inline"
  title="Building stateful agents?"
  body="Persistent threads ship with CopilotKit Intelligence on the free Developer tier."
  surface="docs_shared_state"
/>

## Reading agent state [#reading-agent-state]

<Steps>
  <Step>
    ### Turn on `get_shared_state` and tell the model to read it

    Antigravity sets an agent's instructions once, when the harness session
    starts, and the adapter forwards only the user's messages. Shared state
    therefore never reaches the prompt on its own. Instead, pass
    `experimental_app_state=True` to `AntigravityAgent`. It gives the agent a
    built-in `get_shared_state()` tool that returns the thread's shared state: what the UI sent with the current run (including edits made
    with `agent.setState`), or what a server tool last stored, whichever is
    newer. Say in the system instructions when to call it:

~~~~python title="shared_state.py"
READ_WRITE_PROMPT = (
    "You are a helpful, concise assistant. Call `get_shared_state` before "
    "every answer. Its `preferences` object holds the user's name, preferred "
    "tone, language and interests, which the user edits in the app: always "
    "respect them, and address the user by name when you know it. Its "
    "`notes` list holds what you have remembered so far. "
    "When the user asks you to remember something, or when you observe "
    "something worth surfacing in the UI, call `set_notes` with the FULL "
    "updated list of short note strings (existing notes + new)."
)


def shared_state_read_write_agent():
    return build(
        system_instructions=READ_WRITE_PROMPT,
        tools=[set_notes],
        experimental_app_state=True,
    )


~~~~

    The tool is silent: it emits no `TOOL_CALL_*` events, so no tool card
    appears in the chat. A tool of your own with the same name replaces it.

  </Step>
  <Step>
    ### Write state from a server tool

    Server tools are plain Python functions passed as `tools=[...]`. Inside
    one, the adapter's `experimental_get_state()` returns the thread's shared state and
    `experimental_set_state()` replaces it. `experimental_set_state()` streams a `STATE_SNAPSHOT` to the
    browser straight away, before the tool's own result, so any component
    subscribed with `useAgent` re-renders while the agent is still running.

~~~~python title="shared_state.py"
def set_notes(notes: list[str]) -> str:
    """Replace the notes array in shared state with the full updated list.

    Use this tool whenever the user asks you to "remember" something, or
    when you have an observation about the user worth surfacing in the
    UI's notes panel. Always pass the FULL notes list (existing notes +
    any new ones), not a diff. Keep each note short (< 120 chars).
    """
    experimental_set_state({**experimental_get_state(), "notes": notes})
    return "Notes updated."


~~~~

    Spread `experimental_get_state()` into the new value, as above: `experimental_set_state()` replaces
    the whole object, so leaving it out drops the keys the UI owns, such as
    `preferences`. Both helpers work only inside a server tool, where the
    adapter knows which thread the call belongs to. Called anywhere else, they
    raise.

  </Step>
</Steps>

<Callout type="warn" title="The model sees state only when it asks">
  Other frameworks can fold the UI's state into the system prompt on every
  run. With Antigravity the model has to call `get_shared_state`. If the
  instructions do not tell it to, UI edits do not reach that answer.
</Callout>

<Callout type="info" title="Experimental">
  `experimental_app_state`, `experimental_get_state()` and
  `experimental_set_state()` are experimental. Their names and behaviour may
  change in a later release of the adapter.
</Callout>

Subscribe a component to the agent's state with `useAgent`. Any time the agent
mutates its state, for example via a tool call, the hook fires and your UI
re-renders with the new values.

```typescript title="src/app/demos/shared-state-read-write/page.tsx"
  // Subscribe the component to agent state changes. Any time the agent
  // mutates its state (e.g. via its `set_notes` tool) this hook fires,
  // we re-render, and the sidebar panels reflect the new values.
  const { agent } = useAgent({
    agentId: "shared-state-read-write",
    updates: [UseAgentUpdate.OnStateChanged],
  });
```

The returned `agent.state` is just a plain object. Read it like any other
piece of React state and render the parts you care about: agent-written
notes, structured outputs, progress indicators, anything the agent has put
there.

## Writing agent state [#writing-agent-state]

The same `agent` object exposes a `setState` setter. Calling it from a UI
event handler pushes the new value into shared state, and the agent reads it
back on its next turn. The UI's writes visibly steer the model.

```typescript title="src/app/demos/shared-state-read-write/page.tsx"
  // WRITE: every edit in the sidebar goes straight into agent state.
  // On the agent's next turn, the model reads this back out of state
  // through the adapter's built-in `get_shared_state` tool — so the UI's
  // writes visibly steer the model.
  const handlePreferencesChange = (next: Preferences) => {
    agent.setState({
      preferences: next,
      notes, // preserve what the agent has written
    } as RWAgentState);
  };
```

This makes shared state two-way. The UI can also send the agent new inputs,
such as preferences, selections, or partial work. These inputs do not go
through the chat.

The agent reads the new state on its next run. To run it right away, call
`copilotkit.runAgent({ agent })` (from `useCopilotKit`) after `setState`.
Running through `copilotkit` also sends your frontend tools and context with
the run. To tell the model what changed, add a hint message first:

```tsx
const { copilotkit } = useCopilotKit();

agent.setState({ language: newLanguage });
agent.addMessage({
  id: crypto.randomUUID(),
  role: "user",
  content: `the language has been updated to ${newLanguage}`,
});
await copilotkit.runAgent({ agent });
```

See [Programmatic control](/google-antigravity/programmatic-control) for more ways to run the
agent from code.

## Rendering shared state in the UI [#rendering-shared-state-in-the-ui]

Because `agent.state` is plain React data, the UI layer is whatever you'd
normally build. The demo on this page wires the agent's outputs into a
small card component and feeds user edits back through `setState`.

```typescript title="src/app/demos/shared-state-read-write/notes-card.tsx"
// Read-side render: this card reflects the agent-authored `notes` slice
// of shared state. The parent page passes `state.notes` in; we never
// touch agent state ourselves — we just render it. The Clear button is
// a small write-back, exposed as an `onClear` prop.
export function NotesCard({ notes, onClear }: NotesCardProps) {
  return (
    <Card data-testid="notes-card" className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Agent Scratch pad</CardTitle>
            <CardDescription>
              The agent writes here via its{" "}
              <code className="font-mono text-[11px] text-[#010507] dark:text-foreground">
                set_notes
              </code>{" "}
              tool. The UI re-renders from shared state.
            </CardDescription>
          </div>
          {notes.length > 0 && (
            <Button
              type="button"
              onClick={onClear}
              data-testid="notes-clear-button"
              variant="destructive"
              size="sm"
              className="uppercase tracking-[0.14em] text-[10px]"
            >
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {notes.length === 0 ? (
          <div
            data-testid="notes-empty"
            className="text-sm text-[#838389] italic min-h-[160px] flex items-center justify-center text-center px-4 border border-dashed border-[#E9E9EF] rounded-xl bg-[#FAFAFC] dark:text-muted-foreground dark:border-border dark:bg-muted"
          >
            the agent will make observations about you and note them here!
          </div>
        ) : (
          <ul
            data-testid="notes-list"
            className="space-y-2 text-sm text-[#010507] dark:text-foreground"
          >
            {notes.map((note, i) => (
              <li
                key={i}
                data-testid="note-item"
                className="flex gap-2 rounded-lg border border-[#E9E9EF] bg-[#FAFAFC] px-3 py-2 dark:border-border dark:bg-muted"
              >
                <span className="text-[#838389] font-mono text-xs leading-5 select-none dark:text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">{note}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
```

Nothing about this is chat-specific: `useAgent` works in any component under
`<CopilotKit>`, so you can render `agent.state` in your main view or canvas,
not just inside the chat panel. See
**[Render agent state in your app](/google-antigravity/shared-state/rendering-in-app)** for the
full main-view pattern.

## Streaming partial state updates [#streaming-partial-state-updates]

By default, agent state only updates *between* backend checkpoints, so a
long-running tool call appears as one big burst at the end. State streaming
copies one tool argument into a state key while the model writes it. The UI
shows the answer token by token.

<WhenFrameworkSupports feature="shared-state-streaming">

> **Not available for Google Antigravity yet.** The Shared State: Streaming demo for Google Antigravity can't run yet, so its code isn't shown here.

See **[State streaming](/google-antigravity/shared-state/streaming)** for the full walkthrough,
including the corresponding `useAgent` subscription on the frontend.

</WhenFrameworkSupports>

<WhenFrameworkSupports feature="shared-state-streaming" not>

State streaming isn't available on this framework yet. The UI gets the
agent's state between checkpoints.

</WhenFrameworkSupports>

## Read-only context [#read-only-context]

When the value is **UI-owned** and the agent should read it but never write
it back, such as current user, selected record, or scroll position, reach for
`useAgentContext` instead of full shared state. It publishes values as a
one-way UI-to-agent channel that auto-unregisters on unmount.

See **[Agent read-only context](/google-antigravity/shared-state/agent-readonly)** for the
full pattern.

<IntegrationGrid path="shared-state" exclude={["agno", "agent-spec", "spring-ai", "langroid"]} />
