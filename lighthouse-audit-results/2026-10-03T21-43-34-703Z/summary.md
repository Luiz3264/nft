# Lighthouse audit report

- Audit run: 2026-10-03T21-43-34-703Z
- Configuration: 1.0.0
- Build SHA-256: 851746806974de948a7aadc10b5e0b2b28a6c5fa94bfc720189927ef64afff10
- Git revision: unavailable (working tree unavailable (workspace has no .git metadata))
- Lighthouse: 12.6.1; Chrome: Chrome/152.0.7977.84
- Runtime: Node v24.14.1; win32 10.0.26200 (x64)
- Execution: 3 sequential runs per page/profile; 2026-10-03T21:43:34.704Z to 2026-10-03T21:46:48.679Z
- Scenario: production Vite preview, standard built-in NFT mock catalog, home `/` and direct detail `/nft/1`; no assets or app features blocked.
- Throttling: Lighthouse simulated mobile/desktop profiles specified in the versioned configuration; fresh headless Chrome process and Lighthouse storage reset for each sample.

## Targets

| Category | Target |
|---|---:|
| performance | 90 |
| accessibility | 95 |
| best-practices | 95 |
| seo | 90 |

## Median category scores and field metrics

| Profile | Page | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| mobile | home | 74 | 95 | 96 | 83 | 42967 | 0 | 15 |
| mobile | nft-detail | 73 | 100 | 96 | 83 | 26044 | 0 | 75 |
| desktop | home | 76 | 91 | 100 | 67 | 6341 | 0 | 11 |
| desktop | nft-detail | 78 | 100 | 100 | 83 | 4434 | 0 | 0 |

## Target status and recurring findings

### mobile — home (/)

Below target: performance 74 < 90; seo 83 < 90.

Metrics use the median of three samples. Raw LCP: 42967.30375 ms, 43077.60015 ms, 42911.3637 ms; CLS: 0, 0, 0; TBT: 18 ms, 11 ms, 15 ms.

LCP element: Emerald Ape #042; source Image-3LZgOEu9.png. Median LCP phases: TTFB 457 ms, Load Delay 9868 ms, Load Time 3991 ms, Render Delay 27451 ms.
Naturally loaded unique assets: 7.59 MiB of images (Image-3LZgOEu9.png, Image2-CfwfEi4n.png, Image3-4rfD07eb.png, Image4-uhJLsIjn.png) and 0.0 KiB of fonts.

Repeated Lighthouse findings from the measured reports:
- Largest Contentful Paint (largest-contentful-paint), present in 3/3 runs — 43.0 s.
- Time to Interactive (interactive), present in 3/3 runs — 43.0 s.
- Largest Contentful Paint element (largest-contentful-paint-element), present in 3/3 runs — 42,970 ms.
- Preload Largest Contentful Paint image (prioritize-lcp-image), present in 3/3 runs — Est savings of 2,450 ms.
- Elements use prohibited ARIA attributes (aria-prohibited-attr), present in 3/3 runs.
- Reduce unused JavaScript (unused-javascript), present in 3/3 runs — Est savings of 71 KiB.
- Serve images in next-gen formats (modern-image-formats), present in 3/3 runs — Est savings of 7,196 KiB.
- Properly size images (uses-responsive-images), present in 3/3 runs — Est savings of 7,356 KiB.

Observed shipped assets across samples: 4 image URL(s), 0 font URL(s); 0 unique failed request(s).

Reports:
- Run 1: [HTML](mobile/home/run-01.report.html) · [JSON](mobile/home/run-01.report.json)
- Run 2: [HTML](mobile/home/run-02.report.html) · [JSON](mobile/home/run-02.report.json)
- Run 3: [HTML](mobile/home/run-03.report.html) · [JSON](mobile/home/run-03.report.json)

### mobile — nft-detail (/nft/1)

Below target: performance 73 < 90; seo 83 < 90.

Metrics use the median of three samples. Raw LCP: 26043.6159 ms, 26103.6688 ms, 26035.604699999996 ms; CLS: 0, 0, 0; TBT: 91 ms, 75 ms, 42 ms.

LCP element: Emerald Ape #042; source Image-3LZgOEu9.png. Median LCP phases: TTFB 456 ms, Load Delay 9658 ms, Load Time 3027 ms, Render Delay 11560 ms.
Naturally loaded unique assets: 7.59 MiB of images (Image-3LZgOEu9.png, Image2-CfwfEi4n.png, Image3-4rfD07eb.png, Image4-uhJLsIjn.png) and 29.0 KiB of fonts.

Repeated Lighthouse findings from the measured reports:
- Largest Contentful Paint (largest-contentful-paint), present in 3/3 runs — 26.0 s.
- Time to Interactive (interactive), present in 3/3 runs — 27.5 s.
- Largest Contentful Paint element (largest-contentful-paint-element), present in 3/3 runs — 26,040 ms.
- Preload Largest Contentful Paint image (prioritize-lcp-image), present in 3/3 runs — Est savings of 2,410 ms.
- Elements with visible text labels do not have matching accessible names. (label-content-name-mismatch), present in 3/3 runs.
- Reduce unused JavaScript (unused-javascript), present in 3/3 runs — Est savings of 65 KiB.
- Serve images in next-gen formats (modern-image-formats), present in 3/3 runs — Est savings of 7,196 KiB.
- Properly size images (uses-responsive-images), present in 3/3 runs — Est savings of 7,070 KiB.

Observed shipped assets across samples: 4 image URL(s), 1 font URL(s); 0 unique failed request(s).

Reports:
- Run 1: [HTML](mobile/nft-detail/run-01.report.html) · [JSON](mobile/nft-detail/run-01.report.json)
- Run 2: [HTML](mobile/nft-detail/run-02.report.html) · [JSON](mobile/nft-detail/run-02.report.json)
- Run 3: [HTML](mobile/nft-detail/run-03.report.html) · [JSON](mobile/nft-detail/run-03.report.json)

### desktop — home (/)

Below target: performance 76 < 90; accessibility 91 < 95; seo 67 < 90.

Metrics use the median of three samples. Raw LCP: 6340.65515 ms, 6348.88465 ms, 6339.70955 ms; CLS: 0, 0.0003353100099175814, 0; TBT: 11 ms, 10 ms, 17 ms.

LCP element: NFT cover; source Image-3LZgOEu9.png. Median LCP phases: TTFB 127 ms, Load Delay 3762 ms, Load Time 1256 ms, Render Delay 1140 ms.
Naturally loaded unique assets: 7.59 MiB of images (Image-3LZgOEu9.png, Image4-uhJLsIjn.png, Image3-4rfD07eb.png, Image2-CfwfEi4n.png) and 0.0 KiB of fonts.

Repeated Lighthouse findings from the measured reports:
- Largest Contentful Paint element (largest-contentful-paint-element), present in 3/3 runs — 6,340 ms.
- Preload Largest Contentful Paint image (prioritize-lcp-image), present in 3/3 runs — Est savings of 490 ms.
- Image elements do not have `[alt]` attributes (image-alt), present in 3/3 runs.
- Form elements do not have associated labels (label), present in 3/3 runs.
- Reduce unused JavaScript (unused-javascript), present in 3/3 runs — Est savings of 58 KiB.
- Serve images in next-gen formats (modern-image-formats), present in 3/3 runs — Est savings of 7,196 KiB.
- Properly size images (uses-responsive-images), present in 3/3 runs — Est savings of 7,207 KiB.
- Document does not have a meta description (meta-description), present in 3/3 runs.

Observed shipped assets across samples: 4 image URL(s), 0 font URL(s); 0 unique failed request(s).

Reports:
- Run 1: [HTML](desktop/home/run-01.report.html) · [JSON](desktop/home/run-01.report.json)
- Run 2: [HTML](desktop/home/run-02.report.html) · [JSON](desktop/home/run-02.report.json)
- Run 3: [HTML](desktop/home/run-03.report.html) · [JSON](desktop/home/run-03.report.json)

### desktop — nft-detail (/nft/1)

Below target: performance 78 < 90; seo 83 < 90.

Metrics use the median of three samples. Raw LCP: 4435.5928 ms, 4434.30775 ms, 4411.97135 ms; CLS: 0, 0, 0; TBT: 0 ms, 0 ms, 0 ms.

LCP element: Emerald Ape #042; source Image-3LZgOEu9.png. Median LCP phases: TTFB 125 ms, Load Delay 1644 ms, Load Time 451 ms, Render Delay 2214 ms.
Naturally loaded unique assets: 7.59 MiB of images (Image-3LZgOEu9.png, Image2-CfwfEi4n.png, Image3-4rfD07eb.png, Image4-uhJLsIjn.png) and 29.0 KiB of fonts.

Repeated Lighthouse findings from the measured reports:
- Largest Contentful Paint element (largest-contentful-paint-element), present in 3/3 runs — 4,440 ms.
- Preload Largest Contentful Paint image (prioritize-lcp-image), present in 3/3 runs — Est savings of 490 ms.
- Elements with visible text labels do not have matching accessible names. (label-content-name-mismatch), present in 3/3 runs.
- Reduce unused JavaScript (unused-javascript), present in 3/3 runs — Est savings of 65 KiB.
- Serve images in next-gen formats (modern-image-formats), present in 3/3 runs — Est savings of 7,196 KiB.
- Properly size images (uses-responsive-images), present in 3/3 runs — Est savings of 7,250 KiB.
- Document does not have a meta description (meta-description), present in 3/3 runs.
- robots.txt is not valid (robots-txt), present in 3/3 runs — 14 errors found.

Observed shipped assets across samples: 4 image URL(s), 1 font URL(s); 0 unique failed request(s).

Reports:
- Run 1: [HTML](desktop/nft-detail/run-01.report.html) · [JSON](desktop/nft-detail/run-01.report.json)
- Run 2: [HTML](desktop/nft-detail/run-02.report.html) · [JSON](desktop/nft-detail/run-02.report.json)
- Run 3: [HTML](desktop/nft-detail/run-03.report.html) · [JSON](desktop/nft-detail/run-03.report.json)

## Interpretation notes

LCP is the largest contentful paint audit metric, CLS is cumulative layout shift, and TBT is total blocking time. Lighthouse reports these as lab measurements; they are not field CrUX data. The HTML and JSON reports contain per-run opportunities, diagnostics, network requests, and asset transfer sizes used to explain any shortfall.

