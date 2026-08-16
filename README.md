# Casa de Cosecha

Marketing site for Casa de Cosecha — small-batch soap made with grass-fed
tallow and real Florida citrus, Tampa, FL.

Static site: one HTML file with inlined CSS, no build step, no dependencies.

## Structure

```
index.html          Entire site — markup + styles (single page)
images/
  logo-mark.png      Brand mark, trimmed to its visible content box
```

## Local preview

Any static file server works. From the project root:

```
python -m http.server 8899
```

Then open http://127.0.0.1:8899/.

Opening `index.html` directly via `file://` also works for a quick look, but
some browser extensions and tooling refuse to interact with `file://` pages,
so the local server is the more reliable path.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which publishes
the repo root to GitHub Pages via `actions/deploy-pages`.

One-time setup (already done if you're reading this after the first push):
in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.

## License

All rights reserved. Site content and the Casa de Cosecha brand mark are
proprietary; this repository is not open source.
