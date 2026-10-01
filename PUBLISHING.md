# Publishing this sketch to Design Playground

How to get this prototype onto `homebase-design.vercel.app`, the design team's shared Vercel deploy on Homebase's
enterprise account. There, colleagues can open it with their Homebase Google login, and engineers can review it,
instead of it living on Bryce's personal Vercel. Read the whole file before starting; the four gotchas under
**Adapting this sketch** each break the deploy on their own.

Followed for the first publish on 2026-10-01 (playground branch `bryce/android-widget`); corrections from that
run are folded in. Written 2026-10-01 from the playground repo (`origin/main` at `130b46eb`) and this repo. If the playground's
own docs disagree with this file, theirs win: re-read them and update this file.

## What Design Playground is

- **Repo:** `pioneerworks/design-playground`, cloned at `~/Sandbox/design-playground`. That checkout is behind,
  so `git -C ~/Sandbox/design-playground pull` first. Ask Bryce before pulling if it has uncommitted changes.
- **Deploy:** every push to `main` auto-deploys the whole repo. Vercel runs only the Portal build
  (`pnpm --filter @homebase/portal build`) and serves the **committed** files. It never builds prototypes. So a
  React prototype's built `index.html` and `assets/` must be committed, and its `src/` is excluded from deploy by
  `.vercelignore`.
- **Access:** the whole site is behind Google sign-in for `joinhomebase.com` accounts (`middleware.ts`,
  `AUTH-SETUP.md`). Anyone at Homebase can open a link; nobody outside can.
- **URL:** a prototype at `prototypes/<id>/` is served at `https://homebase-design.vercel.app/prototypes/<id>/`.
- **Pre-push hook:** `pnpm install` in the playground installs `.githooks/`, which blocks a push containing
  secrets, stray `console.log` or TypeScript errors. Fix what it reports. Don't `--no-verify` without asking Bryce.

The docs to read in the playground: `README.md`, `prototypes/README.md`, and `tooling/prototype-builder/README.md`.

## Where this sketch goes

`prototypes/2026-09-30-android-widget/`, dated by this repo's first commit (`2558648`, 2026-09-30). The folder name is the prototype's `id`.

This sketch **brings its own stack** (Vite 8, React 19, Tailwind v4, react-three, shaders) rather than the
playground's shared `protoConfig()`. The builder README allows that: the gallery only needs `meta.json` and
doesn't care how the artifacts were built. Keep it **out of the pnpm workspace**, the way
`prototypes/2026-05-20-cashout-2026` is: add a `'!prototypes/<id>'` line with a one-line reason to the
playground's `pnpm-workspace.yaml`. Otherwise its dependencies enter the Portal's frozen-lockfile install on
Vercel and can break the deploy for everyone.

Copy the sources, not the build output and not local state: `src/`, `public/`, `index.html`, `vite.config.ts`,
`vite-plugins/`, the `tsconfig*.json` files, `package.json`, `pnpm-lock.yaml`, `components.json`,
`.oxlintrc.json`, `README.md`, `DESIGN.md`, `_preview.png`, `pnpm-workspace.yaml` (its pnpm settings). Leave
out `public/images/` (the template's third-party album art, 5 MB, used only by hidden demo pages). **Never copy** `.env.local` (it holds Bryce's
Anthropic key), `.vercel/`, `node_modules/`, `dist/` or `.mcp.json`.

## meta.json

The gallery card, at `prototypes/<id>/meta.json`. Match the shape of the existing React prototypes:

```json
{
  "id": "2026-09-30-android-widget",
  "title": "Android Widget",
  "description": "Android home-screen widget redesign. Own Vite/React 19 stack. Sources in <code>src/</code>.",
  "date": "2026-09-30",
  "status": "wip",
  "icon": "layout-dashboard",
  "entry": "index.html",
  "kind": "react",
  "src": "src"
}
```

Run `pnpm proto:validate` from the playground root after writing it.

## Adapting this sketch

All four are needed. Each one works fine on `pnpm dev` here and only fails once deployed.

1. **Build into the prototype folder, under its sub-path.** The playground serves committed `index.html` +
   `assets/` from `prototypes/<id>/`, not a `dist/` folder, and not from the site root. In `vite.config.ts`, set
   `base: "/prototypes/<id>/"` and point `build.outDir` at the prototype root, with `emptyOutDir: false` so it
   never deletes `src/` or `meta.json`. The built `index.html` at the folder root is the deploy entry. The source
   `index.html` therefore has to move into `src/`, the way the builder layout does it (`src/index.html` as the Vite
   root). That's why `meta.json` says `"src": "src"`.
2. **Routing.** `src/main.tsx` uses `BrowserRouter`. Under a sub-path, with no SPA rewrite (this repo's
   `vercel.json` rewrite does not come along), deep links and refreshes on any route but the first will 404.
   Switch to `HashRouter`. (Done in this repo: `src/main.tsx` uses `HashRouter` whenever `BASE_URL` isn't `/`.) It needs no server config, and links still work when shared. If Bryce wants clean URLs
   instead, use `BrowserRouter basename={import.meta.env.BASE_URL}` and accept that refreshing a sub-route 404s.
3. **Absolute asset paths.** Files under `public/` are referenced as `"/images/..."` (e.g.
   `src/pages/components/LiquidGlassPage.tsx`, `src/pages/demos/color-thief.tsx`). On the deploy those resolve to
   the site root and 404. Prefix them with `import.meta.env.BASE_URL` (done in this repo for `widget/` and `images/`), and grep `src/` and `index.html` for any
   other `"/` asset paths.
4. **Live Claude calls have no backend there.** `src/lib/anthropic.ts` talks to `/api/anthropic`, which exists
   only as the Vite **dev** proxy in `vite.config.ts`. That proxy injects `ANTHROPIC_API_KEY` from `.env.local`.
   The deployed site has no such endpoint, so the AI-generated widget subtitles (`src/widgets/subtitles.ts`) would
   fail. Since 2026-10-01 nothing calls it (the Generate button went with the old time panel), so the widgets
   always show the built-in lines; the playground copy's `vite.config.ts` also drops the dev proxy. **Do not** add a key to the
   playground, a `VITE_`-prefixed variable, or a new `api/` function. Homebase routes model traffic through its
   Vercel AI Gateway with IT-issued keys, and any live-AI version is a question for Bryce to take to IT
   (`#it-helpdesk`, `#ai-gateway`).

## Build, check, ship

From `prototypes/<id>/`:

```bash
pnpm install        # not --ignore-workspace: the folder's own pnpm-workspace.yaml (flat node_modules,
                    # build allowlist) is what makes the build resolve; with --ignore-workspace it fails
pnpm build          # writes index.html + assets/ into this folder
pnpm preview        # open the printed URL and click through every route
```

Then from the playground root, `pnpm proto:validate` and `pnpm --filter @homebase/portal dev`. Find the card in
the gallery and open it from there, so the sub-path is exercised the way the deploy will.

Commit the sources, the built `index.html`, `assets/`, `meta.json` and the `pnpm-workspace.yaml` exclusion.
**Ask Bryce before pushing.** A push to `main` deploys the shared site for the whole design team. He should also
confirm whether the team pushes straight to `main` or goes through a pull request. Taylor Emmerson and Chris
Wallace maintain the repo.

After it's live, the link to share is `https://homebase-design.vercel.app/prototypes/<id>/`. Post it on
Draftboard (`draftboard.external.homebase.systems`) if it should be findable later. Leave the personal Vercel
project alone unless Bryce says to delete it.
