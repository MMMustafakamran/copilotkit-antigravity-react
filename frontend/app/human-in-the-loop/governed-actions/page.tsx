"use client"; // HARNESS: needed in the App Router; the doc never shows a page.
// HARNESS: the doc shows GovernedActionApproval / GovernedActionCard / GovernedActionTool but no page,
// provider, chat or agent. Mounted here on the quickstart agent (antigravity_agent, :8040).
// The doc's only backend for the useInterrupt path is a LangGraph agent.py (interrupt()); no Antigravity backend raises one, so useInterrupt never fires here.
// --- Doc (verbatim) ---
type GovernedAction = {
  id: string;
  summary: string;
  tool: string;
  reference: string;
  verdict: "allow" | "deny" | "require_approval";
  arguments: Record<string, unknown>;
};
// --- end doc ---

// --- Doc (verbatim) ---
import { useEffect } from "react";
import { useInterrupt } from "@copilotkit/react-core/v2";

function GovernedActionApproval() {
  useInterrupt({
    render: ({ event, interrupt, resolve, cancel }) => {
      const action = (interrupt?.metadata?.action ??
        parseInterruptValue(event.value)?.action) as GovernedAction | undefined;

      if (!action) {
        return null;
      }

      return (
        <GovernedActionCard
          action={action}
          onApprove={() =>
            resolve({
              approved: true,
              actionId: action.id,
              reference: action.reference,
            })
          }
          onReject={() =>
            resolve({
              approved: false,
              actionId: action.id,
              reference: action.reference,
            })
          }
          onBlock={() => cancel()}
        />
      );
    },
  });

  return null;
}

// A custom-event interrupt can send its value as a JSON string.
function parseInterruptValue(value: unknown): { action?: unknown } | undefined {
  if (typeof value !== "string") return value as { action?: unknown } | undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function GovernedActionCard({
  action,
  onApprove,
  onReject,
  onBlock,
}: {
  action: GovernedAction;
  onApprove: () => void;
  onReject: () => void;
  onBlock: () => void;
}) {
  useEffect(() => {
    if (action.verdict === "allow") onApprove();
    if (action.verdict === "deny") onBlock();
  }, [action.id, action.verdict]);

  const status =
    action.verdict === "allow"
      ? "Allowed by policy"
      : action.verdict === "deny"
        ? "Blocked by policy"
        : "User approval required";

  return (
    <section className="rounded-lg border p-4 shadow-sm">
      <div className="space-y-1">
        <p className="text-sm font-medium">{status}</p>
        <h3 className="text-base font-semibold">{action.summary}</h3>
        <p className="text-sm text-muted-foreground">Tool: {action.tool}</p>
        <p className="text-sm text-muted-foreground">
          Reference: {action.reference}
        </p>
      </div>

      <pre className="mt-3 overflow-auto rounded bg-muted p-3 text-xs">
        {JSON.stringify(action.arguments, null, 2)}
      </pre>

      {action.verdict === "require_approval" && (
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onApprove}>
            Approve and run
          </button>
          <button type="button" onClick={onReject}>
            Reject
          </button>
        </div>
      )}
    </section>
  );
}
// --- end doc ---

// --- Doc (verbatim) ---
import { ToolCallStatus, useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";

const governedActionSchema = z.object({
  id: z.string(),
  summary: z.string(),
  tool: z.string(),
  reference: z.string(),
  verdict: z.enum(["allow", "deny", "require_approval"]),
  arguments: z.record(z.unknown()),
});

function GovernedActionTool() {
  useHumanInTheLoop(
    {
      name: "approve_governed_action",
      description:
        "Ask the user to approve a governed side-effect action before it runs.",
      parameters: governedActionSchema,
      render: ({ args, status, respond }) => {
        if (status !== ToolCallStatus.Executing || !respond) {
          return null;
        }

        return (
          <GovernedActionCard
            action={args}
            onApprove={() =>
              respond({
                approved: true,
                actionId: args.id,
                reference: args.reference,
              })
            }
            onReject={() =>
              respond({
                approved: false,
                actionId: args.id,
                reference: args.reference,
              })
            }
            onBlock={() =>
              respond({
                approved: false,
                actionId: args.id,
                reference: args.reference,
              })
            }
          />
        );
      },
    },
    [],
  );

  return null;
}
// --- end doc ---

import { CopilotKit, CopilotChat } from "@copilotkit/react-core/v2"; // HARNESS

export default function Page() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="antigravity_agent">
      <GovernedActionApproval />
      <GovernedActionTool />
      <div style={{ height: "100vh" }}>
        <CopilotChat agentId="antigravity_agent" />
      </div>
    </CopilotKit>
  );
}
