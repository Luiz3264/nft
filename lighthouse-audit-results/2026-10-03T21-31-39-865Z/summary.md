# Lighthouse audit report

- Audit run: 2026-10-03T21-31-39-865Z
- Configuration: 1.0.0
- Build SHA-256: c4099123d7c3934266204f30c5a1d09830c7771c05a9906fac68eb4b9ac6d70c
- Git revision: unavailable (working tree dirty)
- Lighthouse: 12.6.1; Chrome: Chrome/152.0.7977.84
- Runtime: Node v24.14.1; win32 10.0.26200 (x64)
- Execution: 3 sequential runs per page/profile; 2026-10-03T21:31:39.866Z to 2026-10-03T21:35:02.582Z
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
| mobile | home | 74 | 95 | 96 | 83 | 43067 | 0 | 75 |
| mobile | nft-detail | 73 | 100 | 96 | 83 | 26084 | 0 | 93 |
| desktop | home | 76 | 91 | 100 | 67 | 6339 | 0 | 14 |
| desktop | nft-detail | 78 | 100 | 100 | 83 | 4407 | 0 | 0 |

## Target status and recurring findings

### mobile — home (/)

Below target: performance 74 < 90; seo 83 < 90.

Metrics use the median of three samples. Raw LCP: 42969.7494 ms, 43067.2773 ms, 43066.9899 ms; CLS: 0, 0, 0; TBT: 53 ms, 108 ms, 75 ms.

Repeated Lighthouse findings from the measured reports:
- Largest Contentful Paint (largest-contentful-paint), present in 3/3 runs — 43.0 s.
- Time to Interactive (interactive), present in 3/3 runs — 43.0 s.
- Largest Contentful Paint element (largest-contentful-paint-element), present in 3/3 runs — 42,970 ms.
- Preload Largest Contentful Paint image (prioritize-lcp-image), present in 3/3 runs — Est savings of 2,460 ms.
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

Metrics use the median of three samples. Raw LCP: 26039.093699999998 ms, 26084.2336 ms, 26098.0941 ms; CLS: 0, 0, 0; TBT: 28 ms, 93 ms, 158 ms.

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

Metrics use the median of three samples. Raw LCP: 6336.10475 ms, 6339.4383 ms, 6356.26735 ms; CLS: 0, 0.0003353100099175814, 0; TBT: 24 ms, 14.000000000000057 ms, 2.999999999999943 ms.

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

Metrics use the median of three samples. Raw LCP: 4406.24935 ms, 4411.75115 ms, 4406.692050000001 ms; CLS: 0, 0, 0; TBT: 0 ms, 0 ms, 0 ms.

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

