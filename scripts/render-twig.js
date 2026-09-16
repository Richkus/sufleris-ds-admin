/**
 * Compiles templates/*.html.twig into static HTML in public/.
 *
 * There is no PHP/Symfony backend here yet, so this is a lightweight
 * Node-based Twig renderer (using `twing`, a faithful Twig implementation
 * for Node/JS) that stands in for server-side rendering at build time.
 * Templates written here are meant to be portable back into the real
 * Symfony/Twig product later with little to no change.
 *
 * Only top-level *.html.twig files (i.e. actual pages, not layouts like
 * base.html.twig that are only ever `{% extends %}`-ed) are rendered.
 */
const fs = require('node:fs');
const path = require('node:path');
const { createFilesystemLoader, createEnvironment } = require('twing');

const templatesDir = path.join(__dirname, '..', 'templates');
const outputDir = path.join(__dirname, '..', 'public');

// Layout/partial templates that must never be rendered on their own.
const SKIP = new Set(['base.html.twig', 'content-base.html.twig', 'home-base.html.twig']);

async function main() {
    // Node's `fs.stat`/`fs.readFile` already match Twing's minimal
    // filesystem-adapter interface, so it can be passed straight through.
    const loader = createFilesystemLoader(fs);
    loader.addPath(templatesDir);
    // Twing's filesystem loader treats the first path segment of any
    // template name containing "/" as a namespace (Twig namespace syntax,
    // without requiring the "@" prefix) — so `{% include "partials/_x..." %}`
    // needs the "partials" namespace explicitly registered here, pointing
    // at templates/partials/, or it 404s looking relative to process.cwd().
    loader.addPath(path.join(templatesDir, 'partials'), 'partials');
    const env = createEnvironment(loader);

    fs.mkdirSync(outputDir, { recursive: true });

    const pages = fs
        .readdirSync(templatesDir)
        .filter((file) => file.endsWith('.html.twig') && !SKIP.has(file));

    if (pages.length === 0) {
        console.warn('[render-twig] No page templates found in templates/.');
        return;
    }

    // DD.MM.YYYY, used by the shared footer partial ("Updated on ...").
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const buildDate = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;

    for (const page of pages) {
        const html = await env.render(page, { buildDate });
        const outputFile = path.join(outputDir, page.replace(/\.twig$/, ''));
        fs.writeFileSync(outputFile, html);
        console.log(`[render-twig] ${page} -> ${path.relative(process.cwd(), outputFile)}`);
    }
}

main().catch((error) => {
    console.error('[render-twig] Failed to render templates:', error);
    process.exitCode = 1;
});
