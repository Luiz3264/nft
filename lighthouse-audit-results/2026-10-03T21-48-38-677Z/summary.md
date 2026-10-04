# Lighthouse audit report

- Audit run: 2026-10-03T21-48-38-677Z
- Configuration: 1.0.0
- Build SHA-256: 851746806974de948a7aadc10b5e0b2b28a6c5fa94bfc720189927ef64afff10
- Git revision: unavailable (working tree unavailable (workspace has no .git metadata))
- Lighthouse: 12.6.1; Chrome: Chrome/152.0.7977.84
- Runtime: Node v24.14.1; win32 10.0.26200 (x64)
- Execution: 3 sequential runs per page/profile; 2026-10-03T21:48:38.678Z to 2026-10-03T21:51:46.300Z
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
| mobile | home | 74 | 95 | 96 | 83 | 42961 | 0 | 20 |
| mobile | nft-detail | 74 | 100 | 96 | 83 | 26089 | 0 | 89 |
| desktop | home | 76 | 91 | 100 | 67 | 6340 | 0 | 9 |
| desktop | nft-detail | 78 | 100 | 100 | 83 | 4407 | 0 | 0 |

## Target status and recurring findings

### mobile — home (/)

Below target: performance 74 < 90; seo 83 < 90.

Weighted failing audits for the below-target categories:
- performance: Largest Contentful Paint [largest-contentful-paint] (43.0 s); First Contentful Paint [first-contentful-paint] (1.7 s).
- seo: Document does not have a meta description [meta-description]; robots.txt is not valid [robots-txt] (14 errors found).

Metrics use the median of three samples. Raw LCP: 42961.09105 ms, 43063.5588 ms, 42956.260949999996 ms; CLS: 0, 0, 0; TBT: 20 ms, 8 ms, 52 ms.

LCP element: Emerald Ape #042; source Image-3LZgOEu9.png. Median LCP phases: TTFB 455 ms, Load Delay 10964 ms, Load Time 3068 ms, Render Delay 27407 ms.
Naturally loaded unique assets: 7.59 MiB of images (Image-3LZgOEu9.png, Image2-CfwfEi4n.png, Image3-4rfD07eb.png, Image4-uhJLsIjn.png) and 0.0 KiB of fonts.

Repeated Lighthouse findings from the measured reports:
- Largest Contentful Paint (largest-contentful-paint), present in 3/3 runs — 43.0 s.
- Time to Interactive (interactive), present in 3/3 runs — 43.0 s.
- Largest Contentful Paint element (largest-contentful-paint-element), present in 3/3 runs — 42,960 ms.
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

Below target: performance 74 < 90; seo 83 < 90.

Weighted failing audits for the below-target categories:
- performance: Largest Contentful Paint [largest-contentful-paint] (26.3 s); Total Blocking Time [total-blocking-time] (420 ms); First Contentful Paint [first-contentful-paint] (1.9 s).
- seo: Document does not have a meta description [meta-description]; robots.txt is not valid [robots-txt] (14 errors found).

Metrics use the median of three samples. Raw LCP: 26086.6509 ms, 26089.09265 ms, 26298.45945 ms; CLS: 0, 0, 0; TBT: 62 ms, 89 ms, 424 ms.

LCP element: Emerald Ape #042; source Image-3LZgOEu9.png. Median LCP phases: TTFB 456 ms, Load Delay 10032 ms, Load Time 3366 ms, Render Delay 12043 ms.
Naturally loaded unique assets: 7.59 MiB of images (Image-3LZgOEu9.png, Image2-CfwfEi4n.png, Image3-4rfD07eb.png, Image4-uhJLsIjn.png) and 29.0 KiB of fonts.

Repeated Lighthouse findings from the measured reports:
- Largest Contentful Paint (largest-contentful-paint), present in 3/3 runs — 26.1 s.
- Time to Interactive (interactive), present in 3/3 runs — 27.6 s.
- Largest Contentful Paint element (largest-contentful-paint-element), present in 3/3 runs — 26,090 ms.
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
- performance: Largest Contentful Paint [largest-contentful-paint] (6.3 s).
- accessibility: Image elements do not have `[alt]` attributes [image-alt]; Form elements do not have associated labels [label].
- seo: Document does not have a meta description [meta-description]; Links are not crawlable [crawlable-anchors]; robots.txt is not valid [robots-txt] (14 errors found); Image elements do not have `[alt]` attributes [image-alt].

Metrics use the median of three samples. Raw LCP: 6340.8688 ms, 6329.581 ms, 6340.36355 ms; CLS: 0.0003353100099175814, 0, 0; TBT: 9 ms, 0 ms, 32 ms.

LCP element: NFT cover; source Image-3LZgOEu9.png. Median LCP phases: TTFB 130 ms, Load Delay 3978 ms, Load Time 1527 ms, Render Delay 882 ms.
Naturally loaded unique assets: 7.59 MiB of images (Image-3LZgOEu9.png, Image4-uhJLsIjn.png, Image3-4rfD07eb.png, Image2-CfwfEi4n.png) and 0.0 KiB of fonts.

Repeated Lighthouse findings from the measured reports:
- Largest Contentful Paint element (largest-contentful-paint-element), present in 3/3 runs — 6,340 ms.
- Preload Largest Contentful Paint image (prioritize-lcp-image), present in 3/3 runs — Est savings of 460 ms.
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

Metrics use the median of three samples. Raw LCP: 4433.07355 ms, 4392.90375 ms, 4406.5874 ms; CLS: 0, 0, 0; TBT: 0 ms, 0 ms, 0 ms.

LCP element: Emerald Ape #042; source Image-3LZgOEu9.png. Median LCP phases: TTFB 124 ms, Load Delay 1742 ms, Load Time 372 ms, Render Delay 2182 ms.
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

