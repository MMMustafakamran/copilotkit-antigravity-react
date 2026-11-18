# Fixed Schema A2UI

> Pre-defined A2UI schema with dynamic data. The fastest approach, with no LLM schema generation needed.

<!-- interactive demo: a2ui-fixed-schema -->

Use a fixed schema when your agent always shows the same kind of card,
such as a flight or an order. You design the layout once (by hand, or
with the [A2UI Composer](https://a2ui-composer.ag-ui.com/)) and keep it
on the agent side. The agent tool supplies only the *data*, so the card
appears as soon as the tool returns.

How the schema is *delivered* to the runtime is the only thing that
varies between integrations:

- **Schema-loading** (including Strands TypeScript), the schema is saved
  as a `.json` file next to the agent and loaded once at startup.
- **Schema-inline** (spring-ai, ms-agent-dotnet), the schema is
  declared inline as a typed literal in source. The host language
  doesn't ship a `load_schema` JSON loader, so the structure is
  compiled in directly.
- **LLM-driven** (Mastra and Strands Python), the agent runs a secondary
  LLM call to produce the operations container per-request. The catalog
  is still fixed; the schema is generated on demand.

The examples on this page use a flight card. Use your own components
and tool.

## How it works [#how-it-works]

1. The schema is made available to the agent, either loaded from a
   JSON file at startup, declared inline, or generated per-request,
   depending on the integration.
2. The agent's `display_flight` tool receives data from the primary LLM
   (origin / destination / airline / price).
3. The tool returns an operations container with `createSurface` +
   `updateComponents` + `updateDataModel` operations.
4. The A2UI middleware intercepts the tool result and the frontend
   renders the surface using the matching 5-component client catalog
   (Title, Airport, Arrow, AirlineBadge, PriceTag, plus the built-ins).

## Compositional schemas [#compositional-schemas]

The example below ships a flight card assembled compositionally from
small sub-components rather than one monolithic `FlightCard`:

```
Card
 └─ Column
     ├─ Title        ("Flight Details")
     ├─ Row          (Airport → Arrow → Airport)
     ├─ Row          (AirlineBadge · PriceTag)
     └─ Button       (Book)
```

That tree lives backend-side, as a JSON file, an inline literal, or
a per-request LLM output, depending on the integration. Components
without data bindings (like `Title` or `Arrow`) carry their value
inline; components bound to the LLM's data (like `Airport`) reference
fields via JSON Pointer paths such as `{ "path": "/origin" }`. The
binder resolves each path before your renderer runs. Your renderer gets
the value, not the path. To declare a bound prop, see [Declare the
component definitions](#declare-the-component-definitions).

## The 5-component custom catalog [#the-5-component-custom-catalog]

The frontend catalog declares just the domain-specific primitives
(Title, Airport, Arrow, AirlineBadge, PriceTag) and merges in
CopilotKit's basic catalog (Card, Column, Row, Text, Button, …) via
`includeBasicCatalog: true`.

<Steps>
<Step>
### Install the renderer package [#install-the-renderer-package]

The catalog, definitions and renderers below all import from
`@copilotkit/a2ui-renderer`. It ships separately from
`@copilotkit/react-core`, and the definitions use `zod` for prop schemas:

```npm
npm install @copilotkit/a2ui-renderer zod
```
</Step>

<Step>
### Declare the component definitions [#declare-the-component-definitions]

Declare every prop that the schema binds to data as `DynString` (a
string or a `{ path }` object). With a plain `z.string()`, the binder
does not resolve the prop, and the raw `{ path }` object reaches your
renderer.

<Callout type="warn" title="Plain `z.string()` on a bound prop crashes the render">
  Because the unresolved object reaches the renderer, the first thing
  that renders it as text throws React's
  [error #31](https://react.dev/errors/31):
  `Objects are not valid as a React child (found: object with keys {path})`.
  Nothing in that message points at the schema, so it reads as a renderer
  bug rather than a missing union. If you hit it, check the prop's
  declared type first.

  Props that are never bound (`Arrow`, or a `variant` enum) are fine as
  plain types. This applies only to props the schema binds.
</Callout>

`@copilotkit/a2ui-renderer` also exports `DynamicStringSchema`,
`DynamicNumberSchema`, and `DynamicBooleanSchema`. Use them in place of
a hand-written union:

```ts
import { DynamicStringSchema } from "@copilotkit/a2ui-renderer";
```

```typescript title="src/app/demos/a2ui-fixed-schema/a2ui/definitions.ts"
import { z } from "zod";
import type { CatalogDefinitions } from "@copilotkit/a2ui-renderer";

/**
 * Dynamic string: literal OR a data-model path binding. The GenericBinder
 * resolves path bindings to the actual value at render time.
 */
const DynString = z.union([z.string(), z.object({ path: z.string() })]);

export const definitions = {
  /**
   * Card override: gives the outer flight-card container a ShadCN look
   * (rounded-xl, neutral-200 border, soft shadow). The basic catalog's
   * Card uses inline styles; overriding here lets the demo's renderer
   * adopt the demo's Tailwind aesthetic without touching the schema JSON.
   */
  Card: {
    description: "A container card with a single child.",
    props: z.object({
      child: z.string(),
    }),
  },
  Title: {
    description: "A prominent heading for the flight card.",
    props: z.object({
      text: DynString,
    }),
  },
  Airport: {
    description: "A 3-letter airport code, displayed large.",
    props: z.object({
      code: DynString,
    }),
  },
  Arrow: {
    description: "A right-pointing arrow used between airports.",
    props: z.object({}),
  },
  AirlineBadge: {
    description: "A pill-styled airline name tag.",
    props: z.object({
      name: DynString,
    }),
  },
  PriceTag: {
    description: "A stylized price display (e.g. '$289').",
    props: z.object({
      amount: DynString,
    }),
  },
  /**
   * Button override: swaps in an ActionButton renderer that tracks
   * its own `done` state so clicking "Book flight" visually updates to
   * a "Booked ✓" confirmation. The basic catalog's Button is stateless,
   * so without this override the click fires the action but the button
   * looks unchanged. Mirrors the pattern in beautiful-chat
   * (src/app/demos/beautiful-chat/declarative-generative-ui/renderers.tsx).
   */
  Button: {
    description:
      "An interactive button with an action event. Use 'child' with a Text component ID for the label. After click, the button shows a confirmation state.",
    props: z.object({
      child: z
        .string()
        .describe(
          "The ID of the child component (e.g. a Text component for the label).",
        ),
      variant: z.enum(["primary", "secondary", "ghost"]).optional(),
      // Union with { event } so GenericBinder resolves this as ACTION → callable () => void.
      action: z
        .union([
          z.object({
            event: z.object({
              name: z.string(),
              context: z.record(z.any()).optional(),
            }),
          }),
          z.null(),
        ])
        .optional(),
    }),
  },
} satisfies CatalogDefinitions;
```
</Step>

<Step>
### Implement the React renderers [#implement-the-react-renderers]

TypeScript enforces that the renderer map's keys and prop shapes
match the definitions exactly, so refactors stay safe. The demo
renderers use the demo's own `Card`, `Badge`, `Button`, and `Separator`
components. They also call an `s()` helper,
`(v) => (typeof v === "string" ? v : "")`, that narrows a value to a
string. Use your own components in their place:

```typescript title="src/app/demos/a2ui-fixed-schema/a2ui/renderers.tsx"
export const renderers: CatalogRenderers<Definitions> = {
  /**
   * Card override: ShadCN-style outer container. The basic catalog's Card
   * uses inline styles; overriding here keeps the demo's tailwind aesthetic.
   * The flight schema renders Card > Column > [Title, Row, …]; the inner
   * Column adds the vertical spacing.
   */
  Card: ({ props, children }) => (
    <Card className="w-full max-w-md p-5" data-testid="a2ui-fixed-card">
      {props.child ? children(props.child) : null}
    </Card>
  ),
  Title: ({ props }) => (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500 dark:text-muted-foreground">
          Itinerary
        </p>
        <h3 className="text-base font-semibold leading-none tracking-tight text-neutral-900 dark:text-foreground">
          {s(props.text)}
        </h3>
      </div>
      <Badge variant="outline" className="font-mono">
        1-stop · economy
      </Badge>
    </div>
  ),
  Airport: ({ props }) => (
    <div className="flex flex-col items-center">
      <span className="font-mono text-2xl font-semibold tracking-wider text-neutral-900 dark:text-foreground">
        {s(props.code)}
      </span>
    </div>
  ),
  Arrow: () => (
    <div className="flex flex-1 items-center px-3">
      <Separator className="flex-1 bg-neutral-200 dark:bg-border" />
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mx-1 text-neutral-400 dark:text-muted-foreground"
        aria-hidden
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
      <Separator className="flex-1 bg-neutral-200 dark:bg-border" />
    </div>
  ),
  AirlineBadge: ({ props }) => (
    <Badge variant="secondary" className="uppercase tracking-[0.08em]">
      {s(props.name)}
    </Badge>
  ),
  PriceTag: ({ props }) => (
    <div className="flex items-baseline gap-1">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500 dark:text-muted-foreground">
        Total
      </span>
      <span className="font-mono text-base font-semibold text-neutral-900 dark:text-foreground">
        {s(props.amount)}
      </span>
    </div>
  ),
  /**
   * Button override: this is a pure-presentation demo, so the button just
   * renders its label. The schema declares an `action` for visual fidelity,
   * but the click handler is inert until the Python SDK exposes
   * `action_handlers=` on `a2ui.render` (see `src/agents/a2ui_fixed.py`).
   */
  Button: ({ props, children }) => (
    <UIButton className="w-full">
      {props.child ? children(props.child) : null}
    </UIButton>
  ),
};
```
</Step>

<Step>
### Wire the catalog [#wire-the-catalog]

`createCatalog(..., { includeBasicCatalog: true })` merges the custom
renderers with CopilotKit's built-ins so the schema can reference
`Card`, `Column`, `Row`, `Button` alongside the domain primitives:

```typescript title="src/app/demos/a2ui-fixed-schema/a2ui/catalog.ts"
import { createCatalog } from "@copilotkit/a2ui-renderer";

import { definitions } from "./definitions";
import { renderers } from "./renderers";

export const CATALOG_ID = "copilotkit://flight-fixed-catalog";

export const catalog = createCatalog(definitions, renderers, {
  catalogId: CATALOG_ID,
  includeBasicCatalog: true,
});
```
</Step>

<Step>
### Pass the catalog to the provider [#pass-the-catalog-to-the-provider]

Passing a catalog on the provider is enough to enable A2UI:

```tsx title="app/page.tsx"
import { catalog } from "./a2ui/catalog";

<CopilotKit runtimeUrl="/api/copilotkit" a2ui={{ catalog }}>
  {children}
</CopilotKit>
```
</Step>

<Step>
### Turn off tool injection on the runtime [#turn-off-tool-injection-on-the-runtime]

Your agent owns the tool in the fixed-schema approach. A catalog
auto-injects the A2UI tool by default, so set `injectA2UITool: false`
on the runtime. Then your agent's own tool is the only one in play. The
middleware still finds the operations that the tool returns and renders
the surface, with no subagent involved:

```typescript title="app/api/copilotkit/route.ts"
const runtime = new CopilotRuntime({
  agents: { "a2ui-fixed-schema": agent },
  a2ui: { injectA2UITool: false, agents: ["a2ui-fixed-schema"] },
});
```

</Step>

<Step>
### Ask about a flight [#ask-about-a-flight]

Send `Find me a flight from SFO to JFK on United for $289` in the chat.
The flight card renders in the chat with the two airports, the airline,
and the price.
</Step>
</Steps>

## Why compositional beats monolithic [#why-compositional-beats-monolithic]

A single big `FlightCard` component would be faster to write but would
lock the design in place. Assembling the card from Card / Column /
Row / Title / Airport / Arrow / AirlineBadge / PriceTag gives you:

- **Reusable primitives** the same `Airport` renderer works in
  search results, booking confirmations, and future seat maps.
- **Schema-level design iteration** re-arranging rows or swapping a
  badge requires only a JSON edit; the renderer code is untouched.
- **A2UI Composer compatibility** hand-written and Composer-built
  schemas share the same primitive vocabulary.

## Action handlers (reference) [#action-handlers-reference]

The flight card's **Book flight** button declares its action in the schema:

```json
{
  "id": "bookButton",
  "component": "Button",
  "variant": "primary",
  "child": "bookButtonLabel",
  "action": {
    "event": {
      "name": "book_flight",
      "context": {
        "origin": { "path": "/origin" },
        "destination": { "path": "/destination" },
        "airline": { "path": "/airline" },
        "price": { "path": "/price" }
      }
    }
  }
}
```

When the user clicks the button, CopilotKit sends the action to the agent
in a new run. To handle the click in the browser instead, pass `onAction`
to `createA2UIMessageRenderer`. See
[Action Handlers](/google-antigravity/generative-ui/a2ui/advanced#action-handlers).

## When should I use fixed schemas? [#when-should-i-use-fixed-schemas]

- The surface is well-known: flight cards, product tiles, order
  summaries, dashboards.
- You want deterministic, designer-controlled UI. No LLM schema drift.
- You want the fastest possible first paint; no secondary LLM call.

If the UI must adapt per prompt, reach for
**[dynamic schemas](./dynamic-schema)** instead.

<IntegrationGrid path="generative-ui/a2ui" />
