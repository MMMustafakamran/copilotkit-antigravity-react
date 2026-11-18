// Doc: https://docs.copilotkit.ai/google-antigravity/generative-ui/a2ui/styling -- src/app/layout.tsx: `import "@/a2ui/theme.css";` (verbatim import)
// HARNESS: a route layout instead of the root layout, so the theme only reaches this page; the file sits at ./a2ui/theme.css (doc: src/a2ui/theme.css).
import "./a2ui/theme.css";

export default function StylingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
