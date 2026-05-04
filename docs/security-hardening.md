# Security Hardening Plan

Chromeless still carries security-sensitive surfaces from the original Electron app and its helper
browser extensions. This plan keeps those surfaces visible and gives future hardening work a small,
reviewable order.

The current goal is not to remove features in one large change. The goal is to separate each trust
boundary, reduce broad permissions when the replacement path is clear, and keep every behavior
change behind a focused verification step.

## Active Boundaries

| Boundary | Current surface | Risk | Hardening target |
| --- | --- | --- | --- |
| Helper extension for site-specific apps | `public/chromeless-helper/manifest.json` grants `sessions`, `tabs`, `webRequest`, `webRequestBlocking`, `<all_urls>`, and `*://*/`. | A broad extension permission set can observe or modify more traffic than the Google sign-in user-agent workaround needs. | Split the Google sign-in header rewrite and session restore responsibilities, then narrow host access to the sites each responsibility needs. |
| Helper extension for browser instances | `public/chromeless-helper-browser-instances/manifest.json` grants `webRequest`, `webRequestBlocking`, `<all_urls>`, and `*://*/`. | Browser-instance helpers inherit broad request visibility without a documented reason for every host pattern. | Document which requests must be intercepted, then remove unused host patterns or move the helper to a narrower manifest. |
| Main renderer window | `main-src/libs/windows/main.ts` creates the main window with `enableRemoteModule: true`, `contextIsolation: false`, and `nodeIntegration: true`. | Renderer compromise gets a larger Electron and Node.js surface than needed for normal UI actions. | Move renderer calls to a typed preload bridge, then switch to `contextIsolation: true` and `nodeIntegration: false`. |
| Menubar renderer window | `main-src/libs/windows/main.ts` creates the menubar window with the same risky `webPreferences`. | The menubar path can drift from the main window if it is hardened separately without a shared contract. | Share the same preload contract as the main window, then harden both window types with the same defaults. |
| Preload bridge | `main-src/libs/windows/preload-shared.ts` exposes `ipcRenderer` and `remote` globally. | A broad bridge makes it hard to review which renderer actions can reach the main process. | Replace global passthroughs with named, typed operations that match existing sender and listener channels. |

## Migration Order

1. Keep this boundary inventory current when a helper manifest, preload script, or `BrowserWindow`
   option changes.
2. Add a narrow renderer-to-main contract for one feature area at a time, starting with existing
   sender and listener channels.
3. Remove direct renderer use of `remote` and unrestricted `ipcRenderer` for that feature area.
4. Switch the main window and menubar window to the hardened `webPreferences` only after the renderer
   route is covered by the preload contract.
5. Reduce helper extension permissions only after the specific intercepted URLs and session restore
   behavior are documented and manually smoke-tested.

## Verification

Use the smallest check that covers the changed boundary:

- `bun run lint` for formatting, import organization, and changed TypeScript files.
- `bun run typecheck` when preload, sender, listener, or Electron window contracts change.
- `bun run test` when a changed sender, listener, state transition, or helper function has unit
  coverage.
- `bun run dist-dev` before changing packaged Electron behavior or helper extension contents.
- Manual smoke testing for Google sign-in, browser instance restore, app creation, and the menubar
  window whenever the relevant helper or window boundary changes.

## Non-goals

- This plan does not remove helper extensions in one step.
- This plan does not change OAuth or Google sign-in behavior without a dedicated regression path.
- This plan does not change signing, notarization, publishing, or auto-update credentials.
