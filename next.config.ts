import path from 'path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Pin the workspace root to this project. Without this, Next.js infers the
// root from the highest lockfile it finds walking up the tree — with sibling
// projects under C:\Work (affiliate-dashboard, trustpilot_crawl, ...), it can
// pick C:\Work itself, which then makes webpack resolve packages like
// tailwindcss relative to C:\Work\node_modules (which doesn't exist) instead
// of this project's node_modules.
const nextConfig: NextConfig = {
    outputFileTracingRoot: path.resolve(__dirname),
};

export default withNextIntl(nextConfig);
