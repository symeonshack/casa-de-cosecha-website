# Casa de Cosecha

Marketing site for Casa de Cosecha — small-batch soap made with grass-fed
tallow and real Florida citrus, Tampa, FL.

Static site: hand-written HTML and CSS, with a small zero-dependency build step.
`node build.js` stitches the sources in `src/` into flat HTML files in `_site/`,
which is what gets deployed. Nothing is installed, and the output has no runtime
dependency on the script — it is plain static files.

## Structure

```
build.js                               The build: src/ -> _site/
package.json                           No dependencies; `npm run build`
src/
  index.html                           Homepage — hero, story, 3-bar teaser, ethos
  shop.html                            Shop page — the full catalogue
  data/
    products.json                      Every bar: copy, price, art, status
  partials/
    head.html                            <head> contents
    header.html                          Nav, shared by both pages
    footer.html                          Footer, shared by both pages
    card.html                            One product card
_site/                                 Build output — git-ignored, deployed
assets/
  css/
    site.css                           All styles, shared by every page
  illustrations/                       Watercolor art, as served
    orange-branch.webp                   Our Story arch
    lemongrass-mint-illustration.webp    Product card art
    blood-orange-illustration.webp       Product card art
    key-lime-illustration.webp           Product card art
    orange-blossom-illustration.webp     Product card art
    bahiagrass-illustration.webp         Product card art (Bare)
    orange-icon.webp                     "What Goes In The Pot" medallion
    cow-icon.webp                        "What Goes In The Pot" medallion
    hand-soap-icon.webp                  "What Goes In The Pot" medallion (see below)
  patterns/                            Mexican tile mosaics (section backgrounds)
    tiles-divider.webp                   1x8 bold medallions, hero -> Our Story
    tiles-band.webp                      3x8 leaf motifs, behind the pull-quote
  originals/                           Full-resolution PNG masters — git-ignored,
                                       local editing sources only (see Images)
images/
  logo-mark.webp                       Full badge lockup — hero only
  logo-wedge.webp                      Citrus wedge mark — header and footer
```

The styles live in `assets/css/site.css` rather than a `<style>` block so that
both pages share one stylesheet instead of each carrying a copy, and so a
visitor moving between them gets it from cache. Section comments in that file
mirror the order of the sections on the page.

`assets/` and `images/` stay at the repo root rather than moving under `src/`.
They are served verbatim, so the build just copies them across; relocating them
would rewrite the path of every binary in git history for no benefit.

### The build

Three placeholder forms, resolved in this order so that a partial's own
placeholders are filled by whichever page pulled it in:

| Form | Does |
| --- | --- |
| `{{> name }}` | include `src/partials/name.html` |
| `{{{ name }}}` | substitute raw HTML, for values that are already markup |
| `{{ name }}` | substitute an HTML-escaped value |

An unknown partial or variable fails the build rather than emitting an empty
string — a silently blank nav is exactly the sort of thing that reaches
production.

Each page opens with a JSON block inside an HTML comment, which keeps the file
valid HTML that an editor still highlights:

```html
<!--page
{
  "title": "Casa de Cosecha — Small-batch soap",
  "products": ["lemongrass-mint", "blood-orange-zest", "bare"]
}
-->
```

`products` is that page's own curation: an ordered list of slugs, or `"all"`.
Keeping the list here rather than flagging products in `products.json` means the
page controls both membership *and* order, and a product record stays a
description of the soap rather than a record of where it is marketed.
`eagerImages: n` drops `loading="lazy"` from the first n cards, which the shop
page uses because its first row is above the fold.

The build validates as it goes and exits non-zero on: a missing required field,
a `status` outside the known set, a duplicate slug, a page listing a slug that
does not exist, or a product pointing at an image file that is not there. That
last one turns a renamed illustration into a failed build instead of a broken
image in production.

`status` is on every product and reaches the markup as `data-status`, but
nothing renders differently yet. It exists so that a later "coming soon" or
"sold out" treatment is pure CSS — `.card[data-status="sold-out"] { … }` — with
no change to the data or the template.

### Pages are flat, and that is deliberate

Both pages land at the output root: `index.html` and `shop.html`, not
`shop/index.html`. GitHub Pages serves this repo from a **subpath**
(`/casa-de-cosecha-website/`, since there is no custom domain), which rules out
root-relative `/assets/...` — that would resolve outside the site entirely. Flat
output keeps every asset path in the templates relative, identical on both
pages, and correct under a subpath. Putting the shop page one directory down
would need a per-page depth prefix on every single asset URL.

The one thing that does vary is the nav. `#story` and `#ethos` only exist on the
homepage, so `build.js` gives the shared header partial a `home` variable —
empty on the homepage (a plain in-page scroll, as before) and `index.html`
elsewhere. Without it those two nav links would silently do nothing on the shop
page.

### Images

Everything the page loads is WebP. The masters in `assets/originals/` are the
PNGs to edit; re-export to WebP after any change, or the page won't pick it up.

Those masters are **git-ignored** — roughly 7 MB that the site never serves, and
committing them would put them in history permanently. They exist only on the
machine that made them, so back them up somewhere. If you'd rather version them,
drop the `assets/originals/` line from `.gitignore` and consider Git LFS.

Resolution is deliberate, not arbitrary. The three citrus scans stay at their
native 1408x768 because the card crops to the centre square — that discards 45%
of the width, so the panel only gets ~2.1x pixel density at desktop size and
there is no room to shrink them. They are encoded lossy at quality 92.

The two botanical illustrations are square instead, at 940x940 and quality 86,
because their sources were square to begin with and the card crops nothing.
Neither ships as generated. `lemongrass-mint` was a plant on flat white carrying
faint paper tone *only inside its subject's bounding box*, which rendered as a
hard rectangle floating in the panel; it is cropped to subject, flattened to
clean white, and composited onto the card-stock colour. `bahiagrass` was a
full-bleed scan on much cooler paper than the citrus ones, so it is blended 70%
toward `--paper`. Re-exporting either from its master without redoing that will
put a cold rectangle back in the middle of a warm card.

There are two brand marks, and they are encoded by different rules:

- **`logo-mark.webp`** — the full badge lockup, hero only, 1000px wide (2.5x the
  400px it renders at). Flat-colour art with hard edges, where lossy WebP rings
  visibly, so it is quantized to 256 colours and encoded **lossless**. That came
  out both smaller and cleaner than lossy at the same width: at 800px it measured
  60 KB / 46.6 dB against 123 KB / 31.6 dB for lossy quality 96.
- **`logo-wedge.webp`** — the citrus wedge, header and footer, 400px wide (3.7x
  the 108px footer, its larger use). This one is a painterly watercolour with
  smooth gradients, so quantizing bands it; it is plain lossy at quality 94.
  **It is flipped vertically relative to its master** so the rind dome sits at
  the top, echoing the arch of the badge. The master in `assets/originals/` is
  dome-down, so a re-export has to flip it again or the wedge lands upside down.

`hand-soap-icon.webp` is composed rather than simply trimmed. Its master has a
long forearm, which inside a circular medallion would end in mid-air. The asset
is instead a square canvas centred on the hand and soap, with the forearm running
off its left edge, and the CSS renders it at 115% so that cut edge lands outside
the circle and the arm disappears behind the border. Replacing it means redoing
that composition — a plain trim will put the cut back inside the frame.

Two things to preserve when replacing either mark:

- **Trim the transparent padding first.** The CSS sizes a mark by its box, so
  padding inside the file shrinks the artwork everywhere it appears. The badge
  master was 2000x2000 with the mark filling only 39% of it; the wedge master was
  1408x768 filling 22%.
- If a mark carries `width`/`height` attributes, its CSS rule needs `width:auto`
  alongside the `height`. Without it the attribute drives the width and the mark
  renders stretched — this is why `.nav-mark img` and `.foot-brand img` both set
  it explicitly.

If you swap in a new illustration, check the crop still clears the subject:
the square panel shows only the middle 768px of the source, and the 4/3 mobile
panel the middle 1024px.

### Tile fields

The two dark bands are cut from one concept sheet (`assets/originals/tile-concept-sheet.png`,
an 18-tile grid) and recoloured to brand tokens. Two things make them work:

- **Grout is baked into the cell, not added between cells.** Each cell is 216px
  of tile plus 6px of grout on all four sides, so a repeat seam lays down 12px —
  exactly the internal spacing. Change that symmetry and a visible join appears
  every repeat.
- **The clay maps to `--orange-dark`, not `--orange`.** At field scale the
  brighter orange reads neon; the deeper one keeps the ceramic warmth. Both are
  brand tokens, so this is a scale decision, not a palette exception.

The quote band's mosaic is **three rows tall on purpose**, sized `auto 100%` so
its height equals the band's — three whole rows then land at any content height
and any width. Sizing it in pixels cut the bottom row the moment the quote
rewrapped. Row count per breakpoint is just 300/rows as a percentage: `100%` is
3 rows, `60%` is 5. Keep the mosaic three rows tall or that arithmetic breaks.

Density differs between the two by design. The divider sits near 1.9x; the band
renders its tiles larger and sits near 1.3x, because the concept sheet caps each
tile around 218px and upscaling past that only synthesises detail — measured at
381 KB against 152 KB for no real gain, so the native pixels ship.

The band's arrangement is constrained, not shuffled. Every row is a full
permutation of the eight tiles, and no tile touches itself in any of the eight
directions **on a torus** — the mosaic repeats, so column 7 really does sit
against column 0, and at the mobile row count row 2 sits against row 0. An
earlier version checked adjacency only inside the grid and shipped a pair of
identical tiles meeting across the horizontal seam.

Two of the eighteen tiles are deliberately unused — the orange lattice and the
interlocking circles are cream-dominant and read as holes in a dark field.

Recolouring uses five anchors, not three: the source has a darker navy carrying
the tiles' internal shading, and dropping it flattens them. Each pixel is
projected onto the segment between its two nearest anchors, which keeps
anti-aliased edges clean — roughly a quarter of pixels are edge blends, and a
naive nearest-colour swap fringes every motif.

## Local preview

Build first, then serve the output. From the project root:

```
node build.js
python -m http.server 8899 --directory _site
```

Then open http://127.0.0.1:8899/.

Re-run `node build.js` after editing anything under `src/`. Editing files in
`_site/` does nothing useful — the next build deletes and rewrites the whole
directory.

Opening `_site/index.html` via `file://` works for a quick look, but some
browser extensions and tooling refuse to interact with `file://` pages, so the
local server is the more reliable path.

## Adding pages

The header and footer are partials, so a new page is a new file in `src/` with
front matter and a couple of includes:

```html
<!--page
{ "title": "Wholesale — Casa de Cosecha" }
-->
<!DOCTYPE html>
<html lang="en">
<head>
{{> head }}
</head>
<body>

{{> header }}

<!-- your markup -->

{{> footer }}

</body>
</html>
```

`build.js` picks up every `.html` file in `src/` automatically; there is no
manifest to update. Add `"products": "all"` or a list of slugs if the page shows
product cards.

Two things to keep in mind. Pages must stay flat at the output root, for the
subpath reason above. And any nav link to a homepage-only anchor needs the
`{{ home }}` prefix, or it will quietly do nothing everywhere except the
homepage.

This was the open question in earlier versions of this file — whether to accept
copy-pasted headers, inject them with client-side JS, or add a template step.
The build step won: JS injection would have cost the no-JavaScript guarantee and
flashed a missing nav, and duplication was going to compound right as the page
count started growing. A full static site generator was more machinery than
"substitute some strings and copy some folders" deserves.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which sets up Node,
runs `node build.js`, and publishes `_site/` to GitHub Pages via
`actions/deploy-pages`. There is nothing to install, so there is no cache step
and no lockfile.

Because the build also validates the product data, a bad slug, an unknown
status, or a missing illustration fails the deploy instead of shipping.

One-time setup (already done if you're reading this after the first push):
in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.

## License

All rights reserved. Site content and the Casa de Cosecha brand mark are
proprietary; this repository is not open source.
