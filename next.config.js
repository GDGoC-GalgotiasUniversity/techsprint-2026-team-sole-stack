/** @type {import('next').NextConfig} */
// Detect if the dev server was started with the `--turbo` flag so we can
// disable plugins that rely on Webpack (like next-pwa) when running with
// Turbopack in development. We also allow forcing via the NEXT_DEV_TURBO env var.
const isTurbopack =
    (process.argv && process.argv.includes("--turbo")) ||
    process.env.NEXT_DEV_TURBO === "1";

const withPWA = require("next-pwa")({
    dest: "public",
    register: true,
    skipWaiting: true,
    // Disable PWA during development or when running with Turbopack to avoid
    // webpack-specific plugin errors. Production builds will still enable PWA.
    disable: process.env.NODE_ENV === "development" || isTurbopack,
});

module.exports = withPWA({
    reactStrictMode: true,
});