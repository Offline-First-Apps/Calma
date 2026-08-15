import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  /**
   * A self-contained server in `.next/standalone`, tracing only the modules
   * this app actually imports at runtime rather than shipping the whole
   * pnpm workspace's `node_modules` into the container.
   *
   * Without this, the root `Dockerfile`'s runner stage had to copy the
   * builder's full `node_modules` wholesale — every devDependency `next
   * build` itself needed (Turbopack, TypeScript, Tailwind's engine, PostCSS)
   * but the running server never touches. 598 packages, several GB once
   * exported as image layers, and the deploy that surfaced this died mid
   * `unpacking` with no error text — the shape of a host running out of
   * disk, not a code problem. Standalone tracing drops that to what the
   * server process actually requires.
   */
  output: 'standalone',
};

export default nextConfig;
