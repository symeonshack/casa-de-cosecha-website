# Casa de Cosecha

Marketing site for Casa de Cosecha — small-batch soap made with grass-fed
tallow and real Florida citrus, Tampa, FL.

Static site: hand-written HTML and CSS, no build step, no dependencies. Open a
file, edit it, reload the browser.

## Structure

```
index.html                             Markup for the single page
assets/
  css/
    site.css                           All styles, shared by every page
  illustrations/                       Watercolor art, as served
    orange-branch.webp                   Our Story arch
    blood-orange-illustration.webp       Product card art
    key-lime-illustration.webp           Product card art
    orange-blossom-illustration.webp     Product card art
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
pages added later share one stylesheet instead of each carrying a copy, and so
a visitor moving between pages gets it from cache. Section comments in that file
mirror the order of the sections on the page.

### Images

Everything the page loads is WebP. The masters in `assets/originals/` are the
PNGs to edit; re-export to WebP after any change, or the page won't pick it up.

Those masters are **git-ignored** — roughly 7 MB that the site never serves, and
committing them would put them in history permanently. They exist only on the
machine that made them, so back them up somewhere. If you'd rather version them,
drop the `assets/originals/` line from `.gitignore` and consider Git LFS.

Resolution is deliberate, not arbitrary. The product illustrations stay at their
native 1408x768 because the card crops to the centre square — that discards 45%
of the width, so the panel only gets ~2.1x pixel density at desktop size and
there is no room to shrink them. They are encoded lossy at quality 92.

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

Any static file server works. From the project root:

```
python -m http.server 8899
```

Then open http://127.0.0.1:8899/.

Opening `index.html` directly via `file://` also works for a quick look, but
some browser extensions and tooling refuse to interact with `file://` pages,
so the local server is the more reliable path.

## Adding pages

The site is one page today. When a second one arrives (shop, product detail,
cart, contact, login), the first thing to decide is what to do about the header
and footer, which would otherwise be copy-pasted into every file and drift apart.
There are three honest options, in increasing order of cost:

- **Accept the duplication** while the page count is small, and keep the shared
  markup identical by editing every copy in one pass.
- **Inject the shared chunks with a little vanilla JS** on page load. No build
  step, but the header arrives after first paint and it costs you the
  no-JavaScript guarantee the site currently has.
- **Add a static site generator or template step.** Solves it properly, and
  gives up "clone it and open a file" simplicity.

Nothing here is decided yet, deliberately — the right answer depends on whether
the shop stays static or starts talking to a backend.

Whatever comes next, `assets/css/site.css` is already shared, so new pages only
need their own markup.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which publishes
the repo root to GitHub Pages via `actions/deploy-pages`.

One-time setup (already done if you're reading this after the first push):
in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.

## License

All rights reserved. Site content and the Casa de Cosecha brand mark are
proprietary; this repository is not open source.
