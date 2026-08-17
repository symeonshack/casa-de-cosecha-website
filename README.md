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
  illustrations/                       Watercolor botanical art, as served
    orange-branch.webp                   Our Story arch
    blood-orange-illustration.webp       Product card art
    key-lime-illustration.webp           Product card art
    orange-blossom-illustration.webp     Product card art
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
  **It is mirrored horizontally relative to its master** — the master in
  `assets/originals/` is the original orientation, so a re-export has to flip it
  again or the wedge will silently face the wrong way.

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
