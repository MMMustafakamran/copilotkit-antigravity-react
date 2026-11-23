"use client"; // HARNESS: the doc snippets have no "use client"; useState/useThreads need it.

// --- Doc: https://docs.copilotkit.ai/google-antigravity/headless-threads (ThreadSidebar.tsx, verbatim) ---
import { useThreads } from "@copilotkit/react-core/v2"; // [!code highlight]

function ThreadSidebar({
  onSelectThread,
}: {
  onSelectThread: (threadId: string) => void;
}) {
  const { // [!code highlight:6]
    threads,
    isLoading,
    renameThread,
    archiveThread,
    deleteThread,
  } = useThreads({ agentId: "default" });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {threads.map((thread) => (
        <div key={thread.id}>
          <button onClick={() => onSelectThread(thread.id)}>
            {thread.name ?? "New conversation"}
          </button>
          <button onClick={() => renameThread(thread.id, "Renamed")}>
            Rename
          </button>
          <button onClick={() => archiveThread(thread.id)}>
            Archive
          </button>
        </div>
      ))}
    </div>
  );
}

// --- Doc: same page (App.tsx, verbatim) ---
import { CopilotChat } from "@copilotkit/react-core/v2"; // [!code highlight]
import { useState } from "react";

function App() {
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();

  return (
    <div className="flex">
      <ThreadSidebar onSelectThread={setActiveThreadId} />
      <CopilotChat threadId={activeThreadId} agentId="default" /> {/* [!code highlight] */} {/* HARNESS: agentId="default" is the doc default; without it the chat picks up the harness root layout agent antigravity_agent, which the doc never has, and the list (agentId "default") stays empty */}
    </div>
  );
}

// HARNESS: the page shows no export or provider. Mounted under CopilotKitProvider pointing at the doc's server.ts
// runtime with CopilotKitIntelligence (app/api/copilotkit-threads; `agent` and verifyAppSession stubbed there, FINDINGS.md #69).
import { CopilotKitProvider } from "@copilotkit/react-core/v2";

export default function HeadlessThreadsPage() {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit-threads">
      <App />
    </CopilotKitProvider>
  );
}
