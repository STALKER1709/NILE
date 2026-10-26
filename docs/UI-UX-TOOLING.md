# UI/UX tooling for NILE (Codex)

This setup adds Motion for React, the official Motion agent skill, 21st.dev agent skills/CLI configuration for Codex, and a project-specific UI/UX skill.

## Compatibility checked
NILE currently uses Next.js 15, React 19, TypeScript, Tailwind CSS 3 and pnpm. Motion supports React 18.2+, so the current React version is compatible. Use Motion only in client components that animate; do not convert server components unnecessarily.

21st.dev is a component registry rather than one monolithic dependency: selected components are copied into the repository. Review each component and its dependencies before adding it.

## Install on Windows
1. Open PowerShell in the NILE repository root.
2. Run:
   ```powershell
   Set-ExecutionPolicy -Scope Process Bypass
   .\scripts\setup-design-tools.ps1
   ```
3. If needed, authenticate to 21st.dev with `npx @21st-dev/cli login`.
4. Restart Codex so it reloads the installed skills/MCP configuration.
5. Review `git status`; commit the generated `package.json`, `pnpm-lock.yaml`, and agent configuration files as appropriate.

The script intentionally does not install an arbitrary 21st.dev UI component. Search for the component needed, review its source and dependencies, then add it to the relevant page.

## Validation
Run `pnpm typecheck`, `pnpm test`, and `pnpm build`. Verify reduced-motion behavior and mobile responsiveness before merging UI changes.