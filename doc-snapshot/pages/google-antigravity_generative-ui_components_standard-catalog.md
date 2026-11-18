# Standard catalog

> Use the 69 standard components, drop the ones you do not want, and replace any of them with your own.

## What is this? [#what-is-this]

You want the agent to answer with tables, charts, and forms today, not after you build a component library. `standardUI` is a catalog of 69 ready-made components that the agent already knows how to use. The 18 components of the A2UI 1.0 basic catalog are in it under their A2UI names and props (`Image.url`, `CheckBox.value`, `Row.justify: "spaceBetween"`, `weight` for flex-grow); the rest extend the catalog.

<Callout type="info" title="React Native">
  The standard components render DOM, so React Native has no `standardUI` yet. Build a catalog of your own native components with `createGenerativeUI`; see [Catalogs](/google-antigravity/generative-ui/components/catalogs) and [Generative UI with your own components](/react-native#generative-ui-with-your-own-components).
</Callout>

Use it as it is:

<Tabs groupId="frontend_framework" items={["React", "Angular", "Vue"]} persist>
  <Tab value="React">
    ```tsx
    import { standardUI } from "@copilotkit/react-core/v2/generative-ui";

    <CopilotKitProvider runtimeUrl="/api/copilotkit" generativeUI={{ ui: standardUI }}>
    ```
  </Tab>
  <Tab value="Angular">
    ```ts title="src/app/app.config.ts"
    import { provideGenerativeUI, standardUI } from "@copilotkit/angular/generative-ui";

    providers: [
      provideCopilotKit({ runtimeUrl: "/api/copilotkit" }),
      provideGenerativeUI({ ui: standardUI }),
    ],
    ```
  </Tab>
  <Tab value="Vue">
    ```vue
    <script setup lang="ts">
    import { CopilotKitProvider } from "@copilotkit/vue/v2";
    import { standardUI } from "@copilotkit/vue/v2/generative-ui";
    </script>

    <template>
      <CopilotKitProvider runtime-url="/api/copilotkit" :generativeUI="{ ui: standardUI }">
        <slot />
      </CopilotKitProvider>
    </template>
    ```
  </Tab>
</Tabs>

## What is in it [#what-is-in-it]

| Group | Components |
| --- | --- |
| <span id="catalog-layout" className="block scroll-mt-24" /> [Layout](#catalog-layout) | [`Box`](/google-antigravity/generative-ui/components/standard-catalog/box), [`Column`](/google-antigravity/generative-ui/components/standard-catalog/column), [`Row`](/google-antigravity/generative-ui/components/standard-catalog/row), [`Grid`](/google-antigravity/generative-ui/components/standard-catalog/grid), [`GridItem`](/google-antigravity/generative-ui/components/standard-catalog/grid#grid-item), [`Card`](/google-antigravity/generative-ui/components/standard-catalog/card), [`Flow`](/google-antigravity/generative-ui/components/standard-catalog/flow), [`FlowItem`](/google-antigravity/generative-ui/components/standard-catalog/flow#flow-item), [`Carousel`](/google-antigravity/generative-ui/components/standard-catalog/carousel), [`CarouselItem`](/google-antigravity/generative-ui/components/standard-catalog/carousel#carousel-item), [`CarouselMediaItem`](/google-antigravity/generative-ui/components/standard-catalog/carousel#carousel-media-item), [`Spacer`](/google-antigravity/generative-ui/components/standard-catalog/spacer), [`Divider`](/google-antigravity/generative-ui/components/standard-catalog/divider), [`Tabs`](/google-antigravity/generative-ui/components/standard-catalog/tabs) |
| <span id="catalog-text" className="block scroll-mt-24" /> [Text](#catalog-text) | [`Title`](/google-antigravity/generative-ui/components/standard-catalog/title), [`Text`](/google-antigravity/generative-ui/components/standard-catalog/text), [`Caption`](/google-antigravity/generative-ui/components/standard-catalog/caption), [`Label`](/google-antigravity/generative-ui/components/standard-catalog/label), [`Bold`](/google-antigravity/generative-ui/components/standard-catalog/bold), [`Italic`](/google-antigravity/generative-ui/components/standard-catalog/italic), [`Underline`](/google-antigravity/generative-ui/components/standard-catalog/underline), [`Strikethrough`](/google-antigravity/generative-ui/components/standard-catalog/strikethrough), [`Badge`](/google-antigravity/generative-ui/components/standard-catalog/badge), [`Blockquote`](/google-antigravity/generative-ui/components/standard-catalog/blockquote), [`Code`](/google-antigravity/generative-ui/components/standard-catalog/code), [`Markdown`](/google-antigravity/generative-ui/components/standard-catalog/markdown), [`Math`](/google-antigravity/generative-ui/components/standard-catalog/math), [`ShimmerText`](/google-antigravity/generative-ui/components/standard-catalog/shimmer-text), [`Link`](/google-antigravity/generative-ui/components/standard-catalog/link), [`Tooltip`](/google-antigravity/generative-ui/components/standard-catalog/tooltip) |
| <span id="catalog-inputs" className="block scroll-mt-24" /> [Inputs](#catalog-inputs) | [`Button`](/google-antigravity/generative-ui/components/standard-catalog/button), [`Pressable`](/google-antigravity/generative-ui/components/standard-catalog/pressable), [`Form`](/google-antigravity/generative-ui/components/standard-catalog/form), [`TextField`](/google-antigravity/generative-ui/components/standard-catalog/text-field), [`TextArea`](/google-antigravity/generative-ui/components/standard-catalog/text-area), [`Select`](/google-antigravity/generative-ui/components/standard-catalog/select), [`CheckBox`](/google-antigravity/generative-ui/components/standard-catalog/check-box), [`Radio`](/google-antigravity/generative-ui/components/standard-catalog/radio), [`RadioGroup`](/google-antigravity/generative-ui/components/standard-catalog/radio-group), [`Slider`](/google-antigravity/generative-ui/components/standard-catalog/slider), [`SegmentedControl`](/google-antigravity/generative-ui/components/standard-catalog/segmented-control), [`ChoicePicker`](/google-antigravity/generative-ui/components/standard-catalog/choice-picker), [`DateTimeInput`](/google-antigravity/generative-ui/components/standard-catalog/date-time-input) |
| <span id="catalog-data" className="block scroll-mt-24" /> [Data](#catalog-data) | [`Table`](/google-antigravity/generative-ui/components/standard-catalog/table), [`TableSection`](/google-antigravity/generative-ui/components/standard-catalog/table#table-section), [`TableRow`](/google-antigravity/generative-ui/components/standard-catalog/table#table-row), [`TableCell`](/google-antigravity/generative-ui/components/standard-catalog/table#table-cell), [`List`](/google-antigravity/generative-ui/components/standard-catalog/list), [`ListItem`](/google-antigravity/generative-ui/components/standard-catalog/list#list-item), [`Chart`](/google-antigravity/generative-ui/components/standard-catalog/chart), [`Map`](/google-antigravity/generative-ui/components/standard-catalog/map) |
| <span id="catalog-media" className="block scroll-mt-24" /> [Media](#catalog-media) | [`Image`](/google-antigravity/generative-ui/components/standard-catalog/image), [`Icon`](/google-antigravity/generative-ui/components/standard-catalog/icon), [`Favicon`](/google-antigravity/generative-ui/components/standard-catalog/favicon), [`Svg`](/google-antigravity/generative-ui/components/standard-catalog/svg), [`Video`](/google-antigravity/generative-ui/components/standard-catalog/video), [`AudioPlayer`](/google-antigravity/generative-ui/components/standard-catalog/audio-player), [`HtmlView`](/google-antigravity/generative-ui/components/standard-catalog/html-view) |
| <span id="catalog-feedback" className="block scroll-mt-24" /> [Feedback and overlay](#catalog-feedback) | [`PulseIndicator`](/google-antigravity/generative-ui/components/standard-catalog/pulse-indicator), [`FlashcardFlip`](/google-antigravity/generative-ui/components/standard-catalog/flashcard-flip), [`Popover`](/google-antigravity/generative-ui/components/standard-catalog/popover), [`PopoverTrigger`](/google-antigravity/generative-ui/components/standard-catalog/popover#popover-trigger), [`PopoverContent`](/google-antigravity/generative-ui/components/standard-catalog/popover#popover-content), [`Modal`](/google-antigravity/generative-ui/components/standard-catalog/modal) |
| <span id="catalog-composites" className="block scroll-mt-24" /> [Composites](#catalog-composites) | [`LinkCard`](/google-antigravity/generative-ui/components/standard-catalog/link-card), [`Citation`](/google-antigravity/generative-ui/components/standard-catalog/citation), [`FollowUp`](/google-antigravity/generative-ui/components/standard-catalog/follow-up), [`EntityCard`](/google-antigravity/generative-ui/components/standard-catalog/entity-card), [`ImageGrid`](/google-antigravity/generative-ui/components/standard-catalog/image-grid) |

<StandardCatalog />

A few things to know:

- **Inputs keep what users type.** When the agent binds an input to a value, what the user types stays. A later agent update cannot write over it.
- **`Button` and `Pressable` can act in the browser.** `href` opens a URL, and `Button` with `copy` copies text, with no message to the agent.
- **`Map` needs one package.** Run `npm install maplibre-gl` if your agent draws maps. Without it, the map shows a list of the places. In Angular, also add `provideGenerativeUIMap()` from `@copilotkit/angular/generative-ui/map` to the root providers. In Vue, also add `app.use(GenerativeUIMap)` from `@copilotkit/vue/v2/generative-ui/map`.
- **`Chart` needs no extra install in React.** It uses `recharts`, which comes with CopilotKit. In Angular, `Chart` draws with `chart.js` and `Icon` with `lucide`: install them and add `provideGenerativeUIChart()` and `provideGenerativeUIIcons()` from the `/chart` and `/icons` entries of `@copilotkit/angular/generative-ui`. Without them, a chart shows its data as a table and an icon shows nothing. In Vue, `Chart` draws with `chart.js`: install it and add `app.use(GenerativeUIChart)` from `@copilotkit/vue/v2/generative-ui/chart`. Without it, a chart shows its data as a table. Icons work with no setup.

Component details:

- **Every input validates.** `checks` holds the `Checkable` rules of A2UI 1.0: `[{ "condition": { "@call": "email", "args": { "value": { "@path": "/form/email" } } }, "message": "Enter a valid email" }]`. An input shows the first failed message once the user has been in it, and a `Button` with the same checks is disabled while one fails. A failed check gives an A2UI `ValidationResult`. The built-in validators set a `code`: `required`, `pattern`, `tooShort`, `tooLong`, `notANumber`, `tooSmall`, `tooLarge`, or `email`. A result with `severity: "warning"` or `"info"` (from a bound result or your own validator) shows its message in its own color. It does not make the input invalid or disable the `Button`.
- **`Video` takes any URL.** A video file plays in the native player, with `captions` as WebVTT tracks; a YouTube link shows a poster until the user presses play, then loads the privacy-enhanced embed. A page on another video site (Vimeo, Loom, TikTok, …) and a file that fails to load show a link card instead of a dead player. YouTube is the only provider that embeds; to embed another one, [replace the component](#replace-a-component).
- **`Tabs` takes a list of panels.** `tabs: [{ "title", "child" }]`, with the id of each panel.

Each standalone component has a dedicated page with the existing live examples, copyable surface operations, and API reference. Structural parts are documented on their parent component's page. Previews use local sample data and do not require a model connection.

For the positional order of each component in A2UI Express, see [Positional parameter order](/google-antigravity/generative-ui/components/catalogs#positional-parameter-order).

## Add your own components [#add-your-own-components]

Put your components on top of the standard ones with `extends`:

<Tabs groupId="frontend_framework" items={["React", "Angular", "Vue"]} persist>
  <Tab value="React">
    ```ts
    import { createGenerativeUI, standardUI } from "@copilotkit/react-core/v2/generative-ui";

    export const appUI = createGenerativeUI({
      id: "acme/app@1",
      extends: [standardUI],
      components: {
        ProductCard: { component: ProductCard, props: productSchema },
      },
    });
    ```
  </Tab>
  <Tab value="Angular">
    ```ts
    import { createGenerativeUI, standardUI } from "@copilotkit/angular/generative-ui";

    export const appUI = createGenerativeUI({
      id: "acme/app@1",
      extends: [standardUI],
      components: {
        ProductCard: { component: ProductCard, props: productSchema },
      },
    });
    ```
  </Tab>
  <Tab value="Vue">
    ```ts
    import { createGenerativeUI, standardUI } from "@copilotkit/vue/v2/generative-ui";

    export const appUI = createGenerativeUI({
      id: "acme/app@1",
      extends: [standardUI],
      components: {
        ProductCard: { component: ProductCard, props: productSchema },
      },
    });
    ```
  </Tab>
</Tabs>

See [Catalogs](/google-antigravity/generative-ui/components/catalogs) for how to declare a component.

## Drop components [#drop-components]

Every component makes the prompt a little longer. If your app never needs a map or a video, remove them. `omit` returns a copy of the catalog without them, and the agent does not see them:

```ts
export const appUI = createGenerativeUI({
  id: "acme/app@1",
  extends: [standardUI.omit(["Map", "Video", "HtmlView"])],
  components: {},
});
```

The names are typed, so a typo is a type error. Call `omit` once, at module level.

## Replace a component [#replace-a-component]

Your app has its own card, with your shadows and spacing. `overrides` swaps the component of a standard component. The agent sees the same component as before, with the same props:

<Tabs groupId="frontend_framework" items={["React", "Angular", "Vue"]} persist>
  <Tab value="React">
    ```tsx
    import {
      createGenerativeUI,
      standardUI,
      type GenerativeUIComponentProps,
    } from "@copilotkit/react-core/v2/generative-ui";

    function MyCard({ children }: GenerativeUIComponentProps<typeof standardUI, "Card">) {
      return <div className="rounded-2xl border p-6 shadow-sm">{children}</div>;
    }

    export const appUI = createGenerativeUI({
      id: "acme/app@1",
      extends: [standardUI],
      overrides: { Card: { component: MyCard } },
      components: {},
    });
    ```
  </Tab>
  <Tab value="Angular">
    ```ts
    import { Component, input } from "@angular/core";
    import {
      CopilotGenerativeUIChildren,
      createGenerativeUI,
      standardUI,
      type GenerativeUIChildren,
    } from "@copilotkit/angular/generative-ui";

    @Component({
      selector: "app-card",
      imports: [CopilotGenerativeUIChildren],
      template: `
        <div class="rounded-2xl border p-6 shadow-sm">
          <ng-container *copilotGenerativeUIChildren="child()" />
          <ng-container *copilotGenerativeUIChildren="children()" />
        </div>
      `,
    })
    export class MyCard {
      readonly child = input<GenerativeUIChildren>();
      readonly children = input<GenerativeUIChildren>();
    }

    export const appUI = createGenerativeUI({
      id: "acme/app@1",
      extends: [standardUI],
      overrides: { Card: { component: MyCard } },
      components: {},
    });
    ```

    Declare an `input()` for each prop that your component reads. `GenerativeUIComponentInputs<typeof standardUI, "Card">` has their types.
  </Tab>
  <Tab value="Vue">
    `Card` has two slots: `child` and `children`. Render both as named slots:

    ```vue title="src/components/MyCard.vue"
    <template>
      <div class="rounded-2xl border p-6 shadow-sm">
        <slot name="child" />
        <slot name="children" />
      </div>
    </template>
    ```

    ```ts
    import { createGenerativeUI, standardUI } from "@copilotkit/vue/v2/generative-ui";
    import MyCard from "./components/MyCard.vue";

    export const appUI = createGenerativeUI({
      id: "acme/app@1",
      extends: [standardUI],
      overrides: { Card: { component: MyCard } },
      components: {},
    });
    ```

    MyCard is not in its own catalog, so it can read its prop types from `GenerativeUIComponentProps<typeof standardUI, "Card">`. Declare each prop that it reads in `defineProps`.
  </Tab>
</Tabs>

- Your component gets the props of the component it replaces. The types check this.
- Only components of the catalogs in `extends` can be overridden. An unknown name is a type error.
- You can combine both: `extends: [standardUI.omit(["Map"])]` with `overrides: { Card: ... }`.

Next: make the standard components match your brand with a [theme](/google-antigravity/generative-ui/components/theming).
