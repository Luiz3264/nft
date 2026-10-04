# Lighthouse audit report

- Audit run: 2026-10-03T22-05-09-149Z
- Configuration: 1.0.1
- Build SHA-256: 1121e8ce683865650af2cfa4a17c2b8771ff458625be04a695cee96a9227c8cb
- Git revision: unavailable (working tree unavailable (workspace has no .git metadata))
- Lighthouse: 12.6.1; Chrome: Chrome/152.0.7977.84
- Runtime: Node v24.14.1; win32 10.0.26200 (x64)
- Execution: 3 sequential runs per page/profile; 2026-10-03T22:05:09.150Z to 2026-10-03T22:08:07.189Z
- Scenario: production Vite preview, standard built-in NFT mock catalog, home `/` and direct detail `/nft/1`; the app renders its mobile detail component below 768 CSS px and desktop detail component at/above 768 CSS px. No assets or app features blocked.
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
| mobile | home | 74 | 95 | 96 | 83 | 43066 | 0 | 14 |
| mobile | nft-detail | 73 | 100 | 96 | 83 | 26045 | 0 | 27 |
| desktop | home | 76 | 91 | 100 | 67 | 6355 | 0 | 0 |
| desktop | nft-detail | 78 | 100 | 100 | 83 | 4432 | 0 | 0 |

## Target status and recurring findings

### mobile — home (/)

Below target: performance 74 < 90; seo 83 < 90.

Weighted failing audits for the below-target categories:
- performance: Largest Contentful Paint [largest-contentful-paint] (43.1 s); First Contentful Paint [first-contentful-paint] (1.7 s); Total Blocking Time [total-blocking-time] (90 ms).
- seo: Document does not have a meta description [meta-description]; robots.txt is not valid [robots-txt] (14 errors found).

Metrics use the median of three samples. Raw LCP: 43068.8847 ms, 43066.1268 ms, 43061.61555 ms; CLS: 0, 0, 0; TBT: 93.99999999999977 ms, 6 ms, 14 ms.

LCP element: Emerald Ape #042; source Image-3LZgOEu9.png. Median LCP phases: TTFB 455 ms, Load Delay 10893 ms, Load Time 3198 ms, Render Delay 27958 ms.
Naturally loaded unique assets: 7.59 MiB of images (Image-3LZgOEu9.png, Image2-CfwfEi4n.png, Image3-4rfD07eb.png, Image4-uhJLsIjn.png) and 0.0 KiB of fonts.

Repeated Lighthouse findings from the measured reports:
- Largest Contentful Paint (largest-contentful-paint), present in 3/3 runs — 43.1 s.
- Time to Interactive (interactive), present in 3/3 runs — 43.1 s.
- Largest Contentful Paint element (largest-contentful-paint-element), present in 3/3 runs — 43,070 ms.
- Preload Largest Contentful Paint image (prioritize-lcp-image), present in 3/3 runs — Est savings of 2,560 ms.
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

Weighted failing audits for the below-target categories:
- performance: Largest Contentful Paint [largest-contentful-paint] (26.0 s); First Contentful Paint [first-contentful-paint] (2.0 s); Speed Index [speed-index] (2.0 s).
- seo: Document does not have a meta description [meta-description]; robots.txt is not valid [robots-txt] (14 errors found).

Metrics use the median of three samples. Raw LCP: 26039.4216 ms, 26082.664600000004 ms, 26045.240850000002 ms; CLS: 0, 0, 0; TBT: 22 ms, 43 ms, 27 ms.

LCP element: Emerald Ape #042; source Image-3LZgOEu9.png. Median LCP phases: TTFB 455 ms, Load Delay 11533 ms, Load Time 3759 ms, Render Delay 11113 ms.
Naturally loaded unique assets: 7.59 MiB of images (Image-3LZgOEu9.png, Image2-CfwfEi4n.png, Image3-4rfD07eb.png, Image4-uhJLsIjn.png) and 29.0 KiB of fonts.

Repeated Lighthouse findings from the measured reports:
- Largest Contentful Paint (largest-contentful-paint), present in 3/3 runs — 26.0 s.
- Time to Interactive (interactive), present in 3/3 runs — 27.5 s.
- Largest Contentful Paint element (largest-contentful-paint-element), present in 3/3 runs — 26,040 ms.
- Preload Largest Contentful Paint image (prioritize-lcp-image), present in 3/3 runs — Est savings of 2,400 ms.
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

Weighted failing audits for the below-target categories:
- performance: Largest Contentful Paint [largest-contentful-paint] (6.4 s).
- accessibility: Image elements do not have `[alt]` attributes [image-alt]; Form elements do not have associated labels [label].
- seo: Document does not have a meta description [meta-description]; Links are not crawlable [crawlable-anchors]; robots.txt is not valid [robots-txt] (14 errors found); Image elements do not have `[alt]` attributes [image-alt].

Metrics use the median of three samples. Raw LCP: 6360.5902 ms, 6343.8914 ms, 6355.10785 ms; CLS: 0.0003353100099175814, 0.0003353100099175814, 0; TBT: 0 ms, 0 ms, 6 ms.

LCP element: NFT cover; source Image-3LZgOEu9.png. Median LCP phases: TTFB 127 ms, Load Delay 3636 ms, Load Time 1113 ms, Render Delay 1320 ms.
Naturally loaded unique assets: 7.59 MiB of images (Image-3LZgOEu9.png, Image4-uhJLsIjn.png, Image3-4rfD07eb.png, Image2-CfwfEi4n.png) and 0.0 KiB of fonts.

Repeated Lighthouse findings from the measured reports:
- Largest Contentful Paint element (largest-contentful-paint-element), present in 3/3 runs — 6,360 ms.
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

Weighted failing audits for the below-target categories:
- performance: Largest Contentful Paint [largest-contentful-paint] (4.4 s).
- seo: Document does not have a meta description [meta-description]; robots.txt is not valid [robots-txt] (14 errors found).

Metrics use the median of three samples. Raw LCP: 4431.568749999999 ms, 4433.59 ms, 4430.2507000000005 ms; CLS: 0, 0, 0; TBT: 0 ms, 0 ms, 0 ms.

LCP element: Emerald Ape #042; source Image-3LZgOEu9.png. Median LCP phases: TTFB 124 ms, Load Delay 1616 ms, Load Time 420 ms, Render Delay 2239 ms.
Naturally loaded unique assets: 7.59 MiB of images (Image-3LZgOEu9.png, Image2-CfwfEi4n.png, Image3-4rfD07eb.png, Image4-uhJLsIjn.png) and 29.0 KiB of fonts.

Repeated Lighthouse findings from the measured reports:
- Largest Contentful Paint element (largest-contentful-paint-element), present in 3/3 runs — 4,430 ms.
- Preload Largest Contentful Paint image (prioritize-lcp-image), present in 3/3 runs — Est savings of 480 ms.
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

