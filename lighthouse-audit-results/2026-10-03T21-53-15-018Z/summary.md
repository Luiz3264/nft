# Lighthouse audit report

- Audit run: 2026-10-03T21-53-15-018Z
- Configuration: 1.0.1
- Build SHA-256: 1121e8ce683865650af2cfa4a17c2b8771ff458625be04a695cee96a9227c8cb
- Git revision: unavailable (working tree unavailable (workspace has no .git metadata))
- Lighthouse: 12.6.1; Chrome: Chrome/152.0.7977.84
- Runtime: Node v24.14.1; win32 10.0.26200 (x64)
- Execution: 3 sequential runs per page/profile; 2026-10-03T21:53:15.018Z to 2026-10-03T21:56:14.461Z
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
| mobile | home | 74 | 95 | 96 | 83 | 42974 | 0 | 24 |
| mobile | nft-detail | 73 | 100 | 96 | 83 | 26045 | 0 | 55 |
| desktop | home | 76 | 91 | 100 | 67 | 6360 | 0 | 14 |
| desktop | nft-detail | 78 | 100 | 100 | 83 | 4416 | 0 | 0 |

## Target status and recurring findings

### mobile — home (/)

Below target: performance 74 < 90; seo 83 < 90.

Weighted failing audits for the below-target categories:
- performance: Largest Contentful Paint [largest-contentful-paint] (43.1 s); First Contentful Paint [first-contentful-paint] (1.7 s).
- seo: Document does not have a meta description [meta-description]; robots.txt is not valid [robots-txt] (14 errors found).

Metrics use the median of three samples. Raw LCP: 42973.5227 ms, 42972.898 ms, 43067.00925 ms; CLS: 0, 0, 0; TBT: 26 ms, 22 ms, 24 ms.

LCP element: Emerald Ape #042; source Image-3LZgOEu9.png. Median LCP phases: TTFB 456 ms, Load Delay 11557 ms, Load Time 3982 ms, Render Delay 26803 ms.
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

Weighted failing audits for the below-target categories:
- performance: Largest Contentful Paint [largest-contentful-paint] (26.0 s); First Contentful Paint [first-contentful-paint] (2.0 s); Speed Index [speed-index] (2.0 s); Total Blocking Time [total-blocking-time] (90 ms).
- seo: Document does not have a meta description [meta-description]; robots.txt is not valid [robots-txt] (14 errors found).

Metrics use the median of three samples. Raw LCP: 26083.33575 ms, 26044.612350000003 ms, 26040.20055 ms; CLS: 0, 0, 0; TBT: 14 ms, 55 ms, 86.00000000000023 ms.

LCP element: Emerald Ape #042; source Image-3LZgOEu9.png. Median LCP phases: TTFB 455 ms, Load Delay 12291 ms, Load Time 3139 ms, Render Delay 10955 ms.
Naturally loaded unique assets: 7.59 MiB of images (Image-3LZgOEu9.png, Image2-CfwfEi4n.png, Image3-4rfD07eb.png, Image4-uhJLsIjn.png) and 29.0 KiB of fonts.

Repeated Lighthouse findings from the measured reports:
- Largest Contentful Paint (largest-contentful-paint), present in 3/3 runs — 26.1 s.
- Time to Interactive (interactive), present in 3/3 runs — 27.6 s.
- Largest Contentful Paint element (largest-contentful-paint-element), present in 3/3 runs — 26,080 ms.
- Preload Largest Contentful Paint image (prioritize-lcp-image), present in 3/3 runs — Est savings of 2,600 ms.
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

Metrics use the median of three samples. Raw LCP: 6375.9643 ms, 6355.98895 ms, 6360.37405 ms; CLS: 0, 0, 0.0003353100099175814; TBT: 13.999999999999943 ms, 7 ms, 14.000000000000057 ms.

LCP element: NFT cover; source Image-3LZgOEu9.png. Median LCP phases: TTFB 127 ms, Load Delay 3786 ms, Load Time 939 ms, Render Delay 1486 ms.
Naturally loaded unique assets: 7.59 MiB of images (Image-3LZgOEu9.png, Image4-uhJLsIjn.png, Image3-4rfD07eb.png, Image2-CfwfEi4n.png) and 0.0 KiB of fonts.

Repeated Lighthouse findings from the measured reports:
- Largest Contentful Paint element (largest-contentful-paint-element), present in 3/3 runs — 6,380 ms.
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

Metrics use the median of three samples. Raw LCP: 4407.04465 ms, 4430.6918 ms, 4415.92305 ms; CLS: 0, 0, 0; TBT: 0 ms, 0 ms, 0 ms.

LCP element: Emerald Ape #042; source Image-3LZgOEu9.png. Median LCP phases: TTFB 128 ms, Load Delay 1525 ms, Load Time 526 ms, Render Delay 2282 ms.
Naturally loaded unique assets: 7.59 MiB of images (Image-3LZgOEu9.png, Image2-CfwfEi4n.png, Image3-4rfD07eb.png, Image4-uhJLsIjn.png) and 29.0 KiB of fonts.

Repeated Lighthouse findings from the measured reports:
- Largest Contentful Paint element (largest-contentful-paint-element), present in 3/3 runs — 4,410 ms.
- Preload Largest Contentful Paint image (prioritize-lcp-image), present in 3/3 runs — Est savings of 460 ms.
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

