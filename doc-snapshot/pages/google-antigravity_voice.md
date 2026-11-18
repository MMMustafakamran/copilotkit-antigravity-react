# Voice

> Real-time speech-to-text in the chat composer. The user speaks, the runtime transcribes, the agent runs the resulting prompt.

<!-- interactive demo: voice -->

You have a working chat surface and you want users to be able to speak instead of type. By the end of this guide, the chat composer will sprout a mic button, recorded audio will be transcribed by the runtime, and the transcript will appear in the composer, ready to send.

## When to use this [#when-to-use-this]

- **Hands-free or accessibility flows** where typing isn't the right input modality.
- **Mobile or kiosk surfaces** where a long voice query is faster than thumb-typing.
- **Demo and test loops** where you want canned audio to drive the chat without a microphone.

If you only need file uploads (audio, images, video, documents), use [Multimodal Attachments](/google-antigravity/multimodal-attachments) instead. Voice is specifically about live transcription of recorded speech into chat input.

## Frontend [#frontend]

Render `<CopilotChat />` from `@copilotkit/react-core/v2`. It shows the mic button when the runtime advertises `audioFileTranscriptionEnabled: true` on its `/info` endpoint. You turn that on in the [Backend](#backend) section.

```typescript title="src/app/demos/voice/page.tsx"
import { CopilotKit } from "@copilotkit/react-core/v2";
import { VoiceChat } from "./voice-chat";

export default function VoiceDemoPage() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit-voice"
      agent="voice-demo"
      useSingleEndpoint={false}
      // The dev-only `<cpk-web-inspector>` overlay (auto-enabled on
      // localhost via shouldShowDevConsole) intercepts pointer events
      // on top of the voice sample-audio button, so dev/D5 probe runs
      // can't click it through Playwright. Production isn't localhost
      // so the inspector never mounts there — voice is D5 in prod and
      // D4 locally for this reason alone. Disable explicitly here so
      // the demo behaves the same in both environments.
      enableInspector={false}
    >
      <VoiceChat />
    </CopilotKit>
  );
}
```

If the snippet renders `<VoiceChat />`, that is a demo wrapper around `<CopilotChat />` and a sample-audio button. In your app, render `<CopilotChat />` in its place.

The `runtimeUrl="/api/copilotkit-voice"` points the browser to your Next.js API route. When the user clicks the mic, the chat captures audio, POSTs it to that runtime route's `/transcribe` endpoint, and puts the resulting transcript into the composer. The user reviews the text and sends it.

## Backend [#backend]

### Next.js API route [#nextjs-api-route]

1. Create the route file `app/api/copilotkit-voice/[[...slug]]/route.ts`. The `[[...slug]]` catch-all lets the runtime serve `/info`, `/agent/:id/run`, and `/transcribe` under the `/api/copilotkit-voice` base path.
2. In that file, create a `CopilotRuntime` with a `transcriptionService`. Serve it with `createCopilotRuntimeHandler` from `@copilotkit/runtime/v2`. The V1 wrapper drops the `transcriptionService` option.
3. Set `basePath` to `/api/copilotkit-voice`, the directory path of the route.

```typescript title="src/app/api/copilotkit-voice/[[...slug]]/route.ts"
import type { NextRequest } from "next/server";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";
import { createTranscriptionService } from "@/lib/transcription-service";

const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000";

const voiceDemoAgent = new HttpAgent({ url: `${AGENT_URL}/voice` });

let cachedHandler: ((req: Request) => Promise<Response>) | null = null;
function getHandler(): (req: Request) => Promise<Response> {
  if (cachedHandler) return cachedHandler;

  const runtime = new CopilotRuntime({
    // @ts-ignore -- see main route.ts; published agents type generic mismatch
    agents: {
      "voice-demo": voiceDemoAgent,
      default: voiceDemoAgent,
    },
    transcriptionService: createTranscriptionService(),
  });

  cachedHandler = createCopilotRuntimeHandler({
    runtime,
    basePath: "/api/copilotkit-voice",
  });
  return cachedHandler;
}

export const POST = (req: NextRequest) => getHandler()(req);
export const GET = (req: NextRequest) => getHandler()(req);
export const PUT = (req: NextRequest) => getHandler()(req);
export const DELETE = (req: NextRequest) => getHandler()(req);
```

Imports from local paths that start with `@/` are demo helpers. In your app, replace them with your own agent and transcription service. The guarded service in [Custom transcription backends](#custom-transcription-backends) is one example.

With `transcriptionService` set, the runtime advertises `audioFileTranscriptionEnabled: true` on `/info` (which is what tells the chat to render the mic button) and routes `POST /transcribe` to the service.

<Callout type="warn" title="Without a service, `/transcribe` answers 503">
A runtime with no `transcriptionService` still serves the route, and answers every request
`503` with `{ "error": "service_not_configured" }`. The mic button never appears, and no server
error shows. If the mic button does not appear, open `/info` and make sure that
`audioFileTranscriptionEnabled` is `true`.
</Callout>

### Custom transcription backends [#custom-transcription-backends]

`TranscriptionService` from `@copilotkit/runtime/v2` is an abstract class. Subclass it to plug in any transcription provider: Whisper, AssemblyAI, Deepgram, or your own model. `@copilotkit/voice` ships `TranscriptionServiceOpenAI`, which uses OpenAI Whisper.

<Callout type="info" title="TranscriptionServiceOpenAI takes an openai 5.x client">
`@copilotkit/voice` depends on `openai` `^5.9.0`, and the `openai` option of
`TranscriptionServiceOpenAI` is typed against the copy of `openai` that
`@copilotkit/voice` resolves. Pass an `OpenAI` instance created from that same
installed copy. The `OpenAI` class has private (`#private`) members, so an
instance from another copy or another major version fails type-checking, even
when it looks the same.

If your app uses an `openai` major version other than 5, either:

- align your app on `openai` 5.x, so your app and `@copilotkit/voice` share one
  copy, or
- subclass `TranscriptionService` and call your own client inside
  `transcribeFile`.
</Callout>

<Callout type="warn" title="Return a string, and let provider errors through">
`transcribeFile` returns the transcript as a string, so returning a richer object
is a type error. The handler sends it to the client as `{ text, size, type }`.

Let the provider's own errors propagate unchanged. The runtime classifies failures by reading
the error text for markers like `rate`, `429`, `auth` and `too long`, so a provider message
such as `OpenAI returned 429 rate limited` maps to the right error code on its own. Replacing
it with your own wording bypasses that and everything lands as a generic provider error.
</Callout>

Create the service only when its API key is set. If the key is missing, omit `transcriptionService`. The runtime then reports the capability as disabled and hides the mic. A direct call to `/transcribe` returns the 503 described above:

```typescript title="src/lib/transcription-service.ts"
import { TranscriptionServiceOpenAI } from "@copilotkit/voice";
import { OpenAI } from "openai";

const OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1";

export function createTranscriptionService(
  env: NodeJS.ProcessEnv = process.env,
): TranscriptionServiceOpenAI | undefined {
  const apiKey = env.OPENAI_TRANSCRIPTION_API_KEY;
  if (!apiKey) return undefined;

  return new TranscriptionServiceOpenAI({
    openai: new OpenAI({
      apiKey,
      baseURL: env.OPENAI_TRANSCRIPTION_BASE_URL ?? OPENAI_TRANSCRIPTION_URL,
    }),
  });
}
```

Open the chat. Click the mic, say "What is the weather in Tokyo?", and click the mic again. The text appears in the composer, ready to send.

## Testing and calling `/transcribe` directly [#testing-and-calling-transcribe-directly]

### Driving the demo without a mic [#driving-the-demo-without-a-mic]

For Playwright runs, screenshots, or any flow where prompting for mic permissions is awkward, ship a button that emits a canned sample phrase through an `onTranscribed` callback, bypassing the transcription endpoint entirely:

```typescript title="src/app/demos/voice/sample-audio-button.tsx"
export function SampleAudioButton({
  onTranscribed,
  sampleText,
}: SampleAudioButtonProps) {
  return (
    <button
      type="button"
      data-testid="voice-sample-audio-button"
      onClick={() => onTranscribed(sampleText)}
      title={`Inserts: "${sampleText}"`}
      className="inline-flex w-fit items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/10 dark:bg-black/30 dark:hover:bg-white/10"
    >
      <span aria-hidden>🎙</span>
      <span>Try a sample audio</span>
    </button>
  );
}
```

The parent chat component can then drop that text into the composer's textarea (matched via `data-testid="copilot-chat-textarea"`) using the native value setter and a synthetic `input` event so React's managed state updates correctly.

<Callout type="warn" title="Calling `/transcribe` yourself">
The chat handles this for you; these are the rules if you post to the route directly. As
multipart, the audio field must be named `audio`. Any other name reads as absent and the
route answers `invalid_request`. As JSON, `mimeType` is required alongside the base64
`audio`, and a payload without it is rejected the same way.
</Callout>

<IntegrationGrid path="voice" />
