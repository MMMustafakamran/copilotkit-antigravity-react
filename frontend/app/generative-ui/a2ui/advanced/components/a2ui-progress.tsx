"use client";
// Doc: https://docs.copilotkit.ai/google-antigravity/generative-ui/a2ui/advanced -- src/components/a2ui-progress.tsx (verbatim)

export function A2UIProgress() {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        <span>Building interface...</span>
      </div>
    </div>
  );
}
