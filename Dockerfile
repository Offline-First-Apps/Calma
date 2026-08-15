# Calma — the website (apps/web).
#
# Build from the monorepo root: docker build -t calma-web .
#
# Adapted from the static-wave, excuseless, viraltiktokslideshows, theseosaas and CMLP web
# images — same stack and monorepo shape (pnpm workspaces using the `catalog:` protocol, a
# Next.js app fed by shared packages/). Those files carry fixes for failures already hit in
# real deployments, so the reasoning behind some lines isn't visible from this codebase alone;
# each is commented rather than left to look like cruft.
#
# Three things about Calma specifically:
#
#   1. This app is database-free. apps/web depends only on @calma/tokens (dependency) and
#      @calma/config (devDependency) — see apps/web/package.json. There is a packages/db, but
#      it is the native app's encrypted MMKV layer and the website never touches it, so there
#      is no schema copy, no `prisma generate` and no openssl here.
#   2. apps/native's *source* is never copied. The Expo app shares packages/ with the web app
#      but is not part of this image; pulling it in would drag the whole React Native and Expo
#      dependency tree into a build that doesn't use it. `--filter web...` is what actually
#      keeps it out of the install — see the note on that line.
#   3. Every packages/* manifest is copied even though only two of them are installed. pnpm
#      resolves the whole workspace before it applies the filter, and a workspace project whose
#      package.json is missing is a different workspace from the one that wrote pnpm-lock.yaml.
#      Copying seven small manifests is cheaper than debugging --frozen-lockfile.
FROM node:22-slim AS builder

WORKDIR /app

# corepack rather than `npm install -g pnpm@11`: package.json pins packageManager to
# pnpm@11.4.0, and a floating `@11` can resolve to a newer patch than the one that wrote
# pnpm-lock.yaml, which makes --frozen-lockfile fail for no useful reason.
RUN corepack enable && corepack prepare pnpm@11.4.0 --activate

# Some platforms (Coolify, Dokku and similar) inject NODE_ENV=production as a *build-time*
# variable. pnpm reads that the same as `--prod` and silently skips devDependencies — here that
# would drop typescript, tailwindcss and @tailwindcss/postcss, all of which `next build` needs.
#
# Scoped to the install step only, and flipped back to production before `next build` below:
# leaving it as development through the build makes Next warn about a non-standard NODE_ENV and
# then fail prerendering /_global-error, because the build runs against React's development
# bundle. NODE_ENV only affects what pnpm *installs*, so switching it afterwards is safe —
# devDependencies are already on disk by then.
ENV NODE_ENV=development

# Workspace manifests + lockfile first, so the install layer survives source edits.
#
# .npmrc matters here: it sets node-linker=isolated, and installing without it produces a
# different node_modules layout than the one the app is developed against.
#
# pnpm-workspace.yaml carries the catalog *and* the `overrides` block pinning react and
# react-dom to 19.2.3 — the pin exists for the native app's second-copy-of-React crash, but it
# applies to this install too, so the lockfile only verifies with the file present.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/domain/package.json packages/domain/
COPY packages/env/package.json packages/env/
COPY packages/i18n/package.json packages/i18n/
COPY packages/tokens/package.json packages/tokens/
COPY packages/ui/package.json packages/ui/
COPY apps/web/package.json apps/web/

# `--filter web...` installs the web app and everything it depends on, and nothing else. Without
# it pnpm would also resolve apps/native, which pulls in Expo, React Native, reanimated,
# react-native-mmkv and react-native-purchases for an image that never builds them. It scopes
# this install to 3 of 9 workspace projects: web, @calma/tokens, @calma/config.
#
# No build ARGs: the site is a landing page plus legal and support pages, with no API calls and
# no network layer of any kind (that is the whole product promise), so nothing needs injecting.
# apps/web does not import @calma/env at all. If a NEXT_PUBLIC_* var is ever added, it must also
# be added here as an ARG/ENV pair — env-nextjs validates at build time and bakes the value into
# the client bundle, so a missing one fails the build rather than the run.
#
# The one thing this step *does* need the network for beyond the registry: `next/font/google`
# downloads Figtree and Newsreader at build time and self-hosts them (see apps/web/src/app/
# layout.tsx — it is a privacy claim, not a performance one). A build behind a proxy that
# blocks fonts.googleapis.com fails here rather than at runtime.
RUN pnpm install --frozen-lockfile --filter web...

# Source after install for better layer caching. Only the three projects in the filter scope —
# the other packages keep the bare manifest copied above, which is all pnpm asked for.
COPY packages/config/ packages/config/
COPY packages/tokens/ packages/tokens/
COPY apps/web/ apps/web/

# Back to production for the build itself — see the NODE_ENV note above.
ENV NODE_ENV=production

RUN pnpm --filter web build

# ---- Runner ----
FROM node:22-slim AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.4.0 --activate

# next.config.ts doesn't set `output: "standalone"`, so `next start` needs the full node_modules
# tree rather than a pruned bundle — copied wholesale from the builder instead of reinstalled
# here (a fresh `pnpm install --prod` would drop next itself from the workspace links).
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/.npmrc ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/packages ./packages

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

WORKDIR /app/apps/web

EXPOSE 3001

CMD ["pnpm", "start"]
