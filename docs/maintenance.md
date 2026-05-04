# Maintenance Strategy

Chromeless is maintained as a focused macOS fork. Refactoring work should reduce the
unsupported surface area first, then add checks that keep the reduced surface stable.

Maintenance changes should follow these patterns:

- remove unsupported or unreachable behavior instead of preserving it as untested compatibility;
- treat README content, issue templates, CI secrets, package metadata, and app links as public
  surface;
- introduce quality gates in stages: observe first, make the current tree pass, then prevent new
  regressions;
- keep checks scoped to the risk of the change so feedback stays useful.

Current quality gates:

- `bun run lint` checks formatting, import organization, and Biome lint rules;
- `bun run typecheck` checks the migrated TypeScript boundaries;
- `bun run test` runs the Vitest suite with coverage output for octocov;
- `bun audit` checks dependency advisories;
- `bun run build` verifies the Vite renderer and tsdown Electron bundles;
- `bun run dist-dev` verifies unsigned macOS development packaging, including the arm64 app output.

Coverage and debt counters are intentionally observational at this stage. They should help identify
where to add tests and where maintenance comments concentrate, without blocking unrelated cleanup
until the baseline is more mature.

Debt counters should include markers that are mechanically recognizable as maintenance risk, such
as type escapes, lint suppressions, and insecure Electron webPreferences. A counter does not mean
each occurrence must be removed immediately; it keeps the debt visible while related refactors are
planned.

Security-sensitive surfaces are tracked in [Security Hardening Plan](security-hardening.md). Update
that plan before changing helper extension permissions, preload bridges, or Electron
`webPreferences`.
