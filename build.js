#!/usr/bin/env node
/* Casa de Cosecha — site build.
 *
 * Stitches the partials in src/partials/ and the product records in
 * src/data/products.json into flat HTML files in _site/, then copies the
 * static asset directories alongside them. Output is plain static files with
 * no runtime dependency on this script, so GitHub Pages serves _site/ exactly
 * the way it used to serve the repo root.
 *
 * Deliberately zero-dependency. The whole job is "substitute some strings and
 * copy some folders", and a template engine would be more machinery than that
 * is worth — plus it keeps `node build.js` working on a clean checkout with no
 * install step.
 *
 * Every page lands at the output root (index.html, shop.html) rather than in
 * per-page directories. That keeps every asset path in the templates relative
 * and identical across pages, which matters because GitHub Pages serves this
 * repo from a subpath — root-relative "/assets/..." would resolve outside the
 * site.
 *
 *   node build.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, '_site');

/* Copied verbatim into the output. These stay at the repo root rather than
 * moving under src/ — they are served as-is, and relocating them would rewrite
 * the path of every binary in git history for no benefit. */
const COPY = ['assets', 'images', '.nojekyll'];

/* Skipped inside those directories. assets/originals/ is the full-resolution
 * PNG masters — roughly 7 MB the site never serves. They are git-ignored, so a
 * CI checkout has none, but a local build would otherwise copy them into the
 * output and they are one .gitignore edit away from being published. */
const EXCLUDE = new Set([path.join(ROOT, 'assets', 'originals')]);

/* The vocabulary for a product's `status`. Only "available" is used today and
 * nothing renders differently yet, but the value reaches the markup as
 * data-status so a later pass can style the others in CSS alone. Anything
 * outside this set fails the build rather than shipping a typo. */
const STATUSES = new Set(['available', 'coming-soon', 'sold-out']);

function fail(message) {
  console.error(`build: ${message}`);
  process.exit(1);
}

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const indent = (text, spaces) => text.replace(/^(?=.)/gm, ' '.repeat(spaces));

// ---------- partials ----------

const partials = {};
for (const file of fs.readdirSync(path.join(SRC, 'partials'))) {
  if (!file.endsWith('.html')) continue;
  const name = path.basename(file, '.html');
  partials[name] = fs.readFileSync(path.join(SRC, 'partials', file), 'utf8').trimEnd();
}

// ---------- templating ----------

/* Three forms, resolved in this order so that a partial's own placeholders are
 * filled by the variables of whatever page pulled it in:
 *
 *   {{> name }}     include a partial
 *   {{{ name }}}    substitute raw HTML — for values that are already markup
 *   {{ name }}      substitute an escaped value
 *
 * An unknown partial or variable is an error, not an empty string. A silently
 * blank nav is exactly the kind of thing that reaches production.
 */
function render(template, vars, depth = 0) {
  if (depth > 8) fail('partials nested more than 8 deep — is one including itself?');

  let out = template.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
    if (!(name in partials)) fail(`unknown partial {{> ${name} }}`);
    return render(partials[name], vars, depth + 1);
  });

  out = out.replace(/\{\{\{\s*([\w-]+)\s*\}\}\}/g, (_, name) => {
    if (!(name in vars)) fail(`unknown variable {{{ ${name} }}}`);
    return vars[name];
  });

  return out.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (_, name) => {
    if (!(name in vars)) fail(`unknown variable {{ ${name} }}`);
    return escapeHtml(vars[name]);
  });
}

// ---------- products ----------

const products = JSON.parse(fs.readFileSync(path.join(SRC, 'data', 'products.json'), 'utf8'));
const bySlug = new Map();
const REQUIRED = ['slug', 'name', 'category', 'description', 'price', 'unit', 'accent', 'status', 'image'];

for (const product of products) {
  const id = product.slug || '(product with no slug)';
  for (const key of REQUIRED) {
    if (!(key in product)) fail(`product ${id} is missing "${key}"`);
  }
  if (!STATUSES.has(product.status)) {
    fail(`product ${id} has unknown status "${product.status}" — expected one of ${[...STATUSES].join(', ')}`);
  }
  if (bySlug.has(product.slug)) fail(`duplicate product slug "${product.slug}"`);
  /* Catches a renamed or misspelled illustration here rather than as a broken
   * image in production. */
  if (!fs.existsSync(path.join(ROOT, product.image.src))) {
    fail(`product ${id} points at a missing image: ${product.image.src}`);
  }
  bySlug.set(product.slug, product);
}

function renderCard(product, loading) {
  return render(partials.card, {
    accent: product.accent,
    status: product.status,
    imageSrc: product.image.src,
    imageAlt: product.image.alt,
    imageWidth: product.image.width,
    imageHeight: product.image.height,
    loading,
    category: product.category,
    name: product.name,
    description: product.description,
    price: product.price,
    unit: product.unit,
  });
}

// ---------- pages ----------

/* Each page source opens with a JSON block in an HTML comment, which keeps the
 * file valid HTML that an editor will still highlight:
 *
 *   <!--page
 *   { "title": "...", "products": ["slug", ...] | "all", "eagerImages": 3 }
 *   -->
 *
 * `products` is the page's own curation: an ordered list of slugs, or "all".
 * Listing them here rather than flagging them in products.json means the
 * homepage controls both membership and order, and a product record stays a
 * description of the soap.
 */
const FRONT_MATTER = /^<!--page\s*([\s\S]*?)-->\s*/;

function buildPage(file) {
  const source = fs.readFileSync(path.join(SRC, file), 'utf8');
  const match = source.match(FRONT_MATTER);
  if (!match) fail(`${file} has no <!--page ... --> front matter`);

  let meta;
  try {
    meta = JSON.parse(match[1]);
  } catch (error) {
    fail(`${file} front matter is not valid JSON: ${error.message}`);
  }
  if (!meta.title) fail(`${file} front matter has no "title"`);

  let selected;
  if (meta.products === 'all') {
    selected = products;
  } else if (Array.isArray(meta.products)) {
    selected = meta.products.map((slug) => {
      const product = bySlug.get(slug);
      if (!product) fail(`${file} lists unknown product "${slug}"`);
      return product;
    });
  } else {
    selected = [];
  }

  const eager = meta.eagerImages || 0;
  const cards = selected
    .map((product, i) => indent(renderCard(product, i < eager ? 'eager' : 'lazy'), 4))
    .join('\n\n');

  const html = render(source.slice(match[0].length), {
    title: meta.title,
    /* The header is shared, but #story and #ethos only exist on the homepage.
     * From anywhere else those anchors have to carry the homepage with them,
     * or the nav silently does nothing. */
    home: file === 'index.html' ? '' : 'index.html',
    products: cards,
  });

  fs.writeFileSync(path.join(OUT, file), html);
  console.log(`build: ${file} — ${selected.length} product${selected.length === 1 ? '' : 's'}`);
}

// ---------- run ----------

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (const item of COPY) {
  const from = path.join(ROOT, item);
  if (!fs.existsSync(from)) continue;
  fs.cpSync(from, path.join(OUT, item), {
    recursive: true,
    filter: (src) => !EXCLUDE.has(src),
  });
}

const pages = fs.readdirSync(SRC).filter((file) => file.endsWith('.html'));
if (pages.length === 0) fail('no page sources found in src/');
for (const page of pages) buildPage(page);

console.log(`build: wrote ${pages.length} page${pages.length === 1 ? '' : 's'} to _site/`);
