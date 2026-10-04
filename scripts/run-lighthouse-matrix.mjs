import { execSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  copyFile,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import chromeLauncher from "chrome-launcher";
import lighthouse, { desktopConfig, generateReport } from "lighthouse";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const configPath = path.join(projectRoot, "lighthouse-audit.config.json");
const config = JSON.parse(await readFile(configPath, "utf8"));
const stamp = new Date()
  .toISOString()
  .replaceAll(":", "-")
  .replaceAll(".", "-");
const outputRoot = path.join(projectRoot, "lighthouse-audit-results", stamp);
const host = config.execution.serverHost;
const port = config.execution.serverPort;
const origin = `http://${host}:${port}`;
const viteCli = fileURLToPath(
  new URL("../node_modules/vite/bin/vite.js", import.meta.url),
);
const reports = [];
let preview;
let stopping = false;

const readPackageVersion = async (packageName) => {
  const packageJsonPath = fileURLToPath(
    import.meta.resolve(`${packageName}/package.json`),
  );
  return JSON.parse(await readFile(packageJsonPath, "utf8")).version;
};

const optionalCommand = (command) => {
  try {
    return execSync(command, {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unavailable";
  }
};

const killChrome = async (chrome) => {
  try {
    await chrome.kill();
  } catch (error) {
    try {
      const response = await fetch(
        `http://127.0.0.1:${chrome.port}/json/version`,
      );
      if (response.ok) throw error;
    } catch (probeError) {
      if (probeError === error) throw error;
      console.warn(
        `Chrome process ${chrome.pid} had already exited; launcher cleanup reported a Windows child-process warning.`,
      );
    }
  }
};

const getBuildFingerprint = async () => {
  const distPath = path.join(projectRoot, "dist");
  const fileNames = await readdir(path.join(distPath, "assets"));
  const hash = createHash("sha256");
  const relevantFiles = [
    path.join(distPath, "index.html"),
    ...fileNames
      .filter((fileName) => /\.(js|css|svg|png|woff2)$/.test(fileName))
      .map((fileName) => path.join(distPath, "assets", fileName)),
  ];

  for (const filePath of relevantFiles.sort()) {
    hash.update(path.relative(distPath, filePath));
    hash.update(await readFile(filePath));
  }

  return hash.digest("hex");
};

const stopPreview = () => {
  if (preview && !stopping) {
    stopping = true;
    preview.kill();
  }
};

const waitForPreview = async () => {
  preview = spawn(
    process.execPath,
    [
      viteCli,
      "preview",
      "--host",
      host,
      "--port",
      String(port),
      "--strictPort",
    ],
    { cwd: projectRoot, stdio: "inherit" },
  );

  preview.on("exit", (code) => {
    if (!stopping && code !== 0) {
      console.error(`Vite preview exited unexpectedly (${code ?? "unknown"}).`);
    }
  });

  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (preview.exitCode !== null) {
      throw new Error(
        `Vite preview exited before becoming ready (${preview.exitCode}).`,
      );
    }

    try {
      const response = await fetch(`${origin}/`);
      if (response.ok) return;
    } catch {
      // Preview has not begun listening yet.
    }

    await delay(250);
  }

  throw new Error(`Vite preview did not become available at ${origin}.`);
};

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

const round = (value, digits = 2) => {
  if (value === null || !Number.isFinite(value)) return null;
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
};

const extractAssetTransfers = (lhr) => {
  const requestItems = lhr.audits["network-requests"]?.details?.items ?? [];
  return requestItems
    .filter((request) =>
      /\.(png|jpe?g|webp|avif|woff2?)(?:\?|$)/i.test(request.url ?? ""),
    )
    .map((request) => ({
      url: request.url,
      resourceType: request.resourceType ?? "unknown",
      transferBytes: request.transferSize ?? 0,
      resourceBytes: request.resourceSize ?? 0,
      statusCode: request.statusCode ?? null,
    }));
};

const extractFailedRequests = (lhr) => {
  const requestItems = lhr.audits["network-requests"]?.details?.items ?? [];
  return requestItems
    .filter(
      (request) =>
        request.failed || (request.statusCode && request.statusCode >= 400),
    )
    .map((request) => ({
      url: request.url,
      statusCode: request.statusCode ?? null,
      failed: Boolean(request.failed),
    }));
};

const makeAuditFlags = (profileId, profile, chromePort) => ({
  logLevel: "error",
  output: "json",
  onlyCategories: config.categories,
  port: chromePort,
  formFactor: profile.formFactor,
  screenEmulation: profile.screenEmulation,
  throttling: profile.throttling,
  throttlingMethod: profile.throttlingMethod,
  disableStorageReset: false,
  locale: "en-US",
  channel: "node",
});

const sampleAudits = async () => {
  let sampleNumber = 0;
  let chromeVersion = "unknown";

  for (const profileId of ["mobile", "desktop"]) {
    const profile = config.profiles[profileId];
    for (const page of config.pages) {
      for (let run = 1; run <= config.runsPerPageAndProfile; run += 1) {
        sampleNumber += 1;
        const url = `${origin}${page.path}`;
        const sampleName = `${profileId}/${page.id}/run-${String(run).padStart(2, "0")}`;
        const sampleDir = path.join(outputRoot, profileId, page.id);
        await mkdir(sampleDir, { recursive: true });

        console.log(`[${sampleNumber}/12] ${sampleName}: ${url}`);
        const chrome = await chromeLauncher.launch({
          chromeFlags: [
            "--headless=new",
            "--no-first-run",
            "--no-default-browser-check",
          ],
        });

        try {
          if (chromeVersion === "unknown") {
            const versionResponse = await fetch(
              `http://127.0.0.1:${chrome.port}/json/version`,
            );
            const versionInfo = await versionResponse.json();
            chromeVersion = versionInfo.Browser ?? "unknown";
          }

          const runnerResult = await lighthouse(
            url,
            makeAuditFlags(profileId, profile, chrome.port),
            profileId === "desktop" ? desktopConfig : undefined,
          );
          const lhr = runnerResult.lhr;
          const baseName = `run-${String(run).padStart(2, "0")}`;
          const htmlReport = await generateReport(lhr, "html");
          const jsonReport = await generateReport(lhr, "json");
          await writeFile(
            path.join(sampleDir, `${baseName}.report.html`),
            htmlReport,
          );
          await writeFile(
            path.join(sampleDir, `${baseName}.report.json`),
            jsonReport,
          );

          const getMetric = (auditId) =>
            lhr.audits[auditId]?.numericValue ?? null;
          const categoryScores = Object.fromEntries(
            config.categories.map((category) => [
              category,
              lhr.categories[category]?.score === null ||
              lhr.categories[category]?.score === undefined
                ? null
                : round(lhr.categories[category].score * 100, 1),
            ]),
          );
          const categoryFindings = Object.fromEntries(
            config.categories.map((category) => [
              category,
              (lhr.categories[category]?.auditRefs ?? [])
                .filter((reference) => reference.weight > 0)
                .map((reference) => ({
                  id: reference.id,
                  title: lhr.audits[reference.id]?.title ?? reference.id,
                  score: lhr.audits[reference.id]?.score ?? null,
                  displayValue: lhr.audits[reference.id]?.displayValue ?? "",
                }))
                .filter(
                  (finding) => finding.score !== null && finding.score < 1,
                ),
            ]),
          );
          const lcpTables =
            lhr.audits["largest-contentful-paint-element"]?.details?.items ??
            [];
          const lcpRows = lcpTables.flatMap((table) => table.items ?? []);
          const lcpNode = lcpRows.find((item) => item.node)?.node;
          const lcpPhases = Object.fromEntries(
            lcpRows
              .filter((item) => item.phase)
              .map((item) => [item.phase, item.timing]),
          );

          reports.push({
            profile: profileId,
            page: page.id,
            path: page.path,
            run,
            url,
            fetchTime: lhr.fetchTime,
            reportHtml: path
              .relative(
                outputRoot,
                path.join(sampleDir, `${baseName}.report.html`),
              )
              .replaceAll("\\", "/"),
            reportJson: path
              .relative(
                outputRoot,
                path.join(sampleDir, `${baseName}.report.json`),
              )
              .replaceAll("\\", "/"),
            categories: categoryScores,
            categoryFindings,
            metrics: {
              lcpMs: getMetric("largest-contentful-paint"),
              cls: getMetric("cumulative-layout-shift"),
              tbtMs: getMetric("total-blocking-time"),
            },
            lcpElement: lcpNode
              ? {
                  label: lcpNode.nodeLabel ?? "",
                  selector: lcpNode.selector ?? "",
                  source: lcpNode.snippet?.match(/src="([^"]+)"/)?.[1] ?? "",
                  phases: lcpPhases,
                }
              : null,
            assets: extractAssetTransfers(lhr),
            failedRequests: extractFailedRequests(lhr),
            failedAudits: Object.entries(lhr.audits)
              .filter(
                ([, audit]) =>
                  audit.score !== null &&
                  audit.score < 0.9 &&
                  audit.scoreDisplayMode !== "manual" &&
                  audit.scoreDisplayMode !== "notApplicable",
              )
              .map(([id, audit]) => ({
                id,
                title: audit.title,
                score: audit.score,
                displayValue: audit.displayValue ?? "",
                description: audit.description ?? "",
              })),
          });
        } finally {
          await killChrome(chrome);
        }
      }
    }
  }

  return chromeVersion;
};

const makeGroups = () => {
  const groups = [];
  for (const profile of ["mobile", "desktop"]) {
    for (const page of config.pages) {
      const samples = reports.filter(
        (sample) => sample.profile === profile && sample.page === page.id,
      );
      const categoryMedians = Object.fromEntries(
        config.categories.map((category) => [
          category,
          round(
            median(
              samples
                .map((sample) => sample.categories[category])
                .filter(Number.isFinite),
            ),
            1,
          ),
        ]),
      );
      const metricMedians = {
        lcpMs: round(
          median(
            samples
              .map((sample) => sample.metrics.lcpMs)
              .filter(Number.isFinite),
          ),
          0,
        ),
        cls: round(
          median(
            samples.map((sample) => sample.metrics.cls).filter(Number.isFinite),
          ),
          3,
        ),
        tbtMs: round(
          median(
            samples
              .map((sample) => sample.metrics.tbtMs)
              .filter(Number.isFinite),
          ),
          0,
        ),
      };
      const lcpPhases = Object.fromEntries(
        ["TTFB", "Load Delay", "Load Time", "Render Delay"].map((phase) => [
          phase,
          round(
            median(
              samples
                .map((sample) => sample.lcpElement?.phases?.[phase])
                .filter(Number.isFinite),
            ),
            0,
          ),
        ]),
      );

      const issueIds = new Set(
        samples.flatMap((sample) =>
          sample.failedAudits.map((audit) => audit.id),
        ),
      );
      const recurringIssues = [...issueIds]
        .map((id) => {
          const occurrences = samples.flatMap((sample) =>
            sample.failedAudits.filter((audit) => audit.id === id),
          );
          return {
            id,
            title: occurrences[0]?.title ?? id,
            occurrences: occurrences.length,
            medianScore: round(
              median(occurrences.map((audit) => audit.score)),
              2,
            ),
            displayValue:
              occurrences.find((audit) => audit.displayValue)?.displayValue ??
              "",
            description:
              occurrences.find((audit) => audit.description)?.description ?? "",
          };
        })
        .filter((issue) => issue.occurrences >= 2)
        .sort((a, b) => a.medianScore - b.medianScore)
        .slice(0, 8);
      const categoryFindings = Object.fromEntries(
        config.categories.map((category) => {
          const findings = new Map();
          for (const sample of samples) {
            for (const finding of sample.categoryFindings[category] ?? []) {
              const existing = findings.get(finding.id) ?? {
                ...finding,
                scores: [],
                occurrences: 0,
              };
              existing.scores.push(finding.score);
              existing.occurrences += 1;
              if (finding.displayValue)
                existing.displayValue = finding.displayValue;
              findings.set(finding.id, existing);
            }
          }
          return [
            category,
            [...findings.values()]
              .map((finding) => ({
                id: finding.id,
                title: finding.title,
                occurrences: finding.occurrences,
                medianScore: round(median(finding.scores), 2),
                displayValue: finding.displayValue,
              }))
              .sort((a, b) => a.medianScore - b.medianScore),
          ];
        }),
      );

      groups.push({
        profile,
        page: page.id,
        path: page.path,
        scenario: page.scenario,
        samples: samples.map((sample) => ({
          run: sample.run,
          categories: sample.categories,
          metrics: sample.metrics,
          lcpElement: sample.lcpElement,
          reportHtml: sample.reportHtml,
          reportJson: sample.reportJson,
        })),
        categoryMedians,
        metricMedians,
        lcpElement:
          samples.find((sample) => sample.lcpElement)?.lcpElement ?? null,
        lcpPhases,
        passedTargets: Object.fromEntries(
          Object.entries(config.targets).map(([category, target]) => [
            category,
            categoryMedians[category] >= target,
          ]),
        ),
        recurringIssues,
        categoryFindings,
        assets: [
          ...new Map(
            samples
              .flatMap((sample) => sample.assets)
              .map((asset) => [asset.url, asset]),
          ).values(),
        ],
        uniqueImageTransferBytes: [
          ...new Map(
            samples
              .flatMap((sample) => sample.assets)
              .filter((asset) =>
                /\.(png|jpe?g|webp|avif)(?:\?|$)/i.test(asset.url),
              )
              .map((asset) => [asset.url, asset]),
          ).values(),
        ].reduce((sum, asset) => sum + asset.transferBytes, 0),
        uniqueFontTransferBytes: [
          ...new Map(
            samples
              .flatMap((sample) => sample.assets)
              .filter((asset) => /\.woff2?(?:\?|$)/i.test(asset.url))
              .map((asset) => [asset.url, asset]),
          ).values(),
        ].reduce((sum, asset) => sum + asset.transferBytes, 0),
        failedRequests: [
          ...new Map(
            samples
              .flatMap((sample) => sample.failedRequests)
              .map((request) => [request.url, request]),
          ).values(),
        ],
      });
    }
  }
  return groups;
};

const markdownReport = (metadata, groups) => {
  const lines = [
    "# Lighthouse audit report",
    "",
    `- Audit run: ${metadata.runId}`,
    `- Configuration: ${metadata.configurationVersion}`,
    `- Build SHA-256: ${metadata.buildFingerprint}`,
    `- Git revision: ${metadata.gitRevision} (working tree ${metadata.gitWorkingTree})`,
    `- Lighthouse: ${metadata.tools.lighthouse}; Chrome: ${metadata.tools.chrome}`,
    `- Runtime: Node ${metadata.environment.node}; ${metadata.environment.platform} ${metadata.environment.release} (${metadata.environment.arch})`,
    `- Execution: ${config.runsPerPageAndProfile} sequential runs per page/profile; ${metadata.execution.startedAt} to ${metadata.execution.finishedAt}`,
    "- Scenario: production Vite preview, standard built-in NFT mock catalog, home `/` and direct detail `/nft/1`; the app renders its mobile detail component below 768 CSS px and desktop detail component at/above 768 CSS px. No assets or app features blocked.",
    "- Throttling: Lighthouse simulated mobile/desktop profiles specified in the versioned configuration; fresh headless Chrome process and Lighthouse storage reset for each sample.",
    "",
    "## Targets",
    "",
    "| Category | Target |",
    "|---|---:|",
    ...Object.entries(config.targets).map(
      ([category, target]) => `| ${category} | ${target} |`,
    ),
    "",
    "## Median category scores and field metrics",
    "",
    "| Profile | Page | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |",
    "|---|---|---:|---:|---:|---:|---:|---:|---:|",
    ...groups.map(
      (group) =>
        `| ${group.profile} | ${group.page} | ${group.categoryMedians.performance} | ${group.categoryMedians.accessibility} | ${group.categoryMedians["best-practices"]} | ${group.categoryMedians.seo} | ${group.metricMedians.lcpMs} | ${group.metricMedians.cls} | ${group.metricMedians.tbtMs} |`,
    ),
    "",
    "## Target status and recurring findings",
    "",
  ];

  for (const group of groups) {
    const failedTargets = Object.entries(config.targets)
      .filter(([category, target]) => group.categoryMedians[category] < target)
      .map(
        ([category, target]) =>
          `${category} ${group.categoryMedians[category]} < ${target}`,
      );
    lines.push(`### ${group.profile} — ${group.page} (${group.path})`);
    lines.push("");
    lines.push(
      failedTargets.length
        ? `Below target: ${failedTargets.join("; ")}.`
        : "All category targets met.",
    );
    lines.push("");
    if (failedTargets.length) {
      lines.push("Weighted failing audits for the below-target categories:");
      for (const [category, target] of Object.entries(config.targets)) {
        if (group.categoryMedians[category] >= target) continue;
        const findings = group.categoryFindings[category] ?? [];
        const findingText = findings
          .map((finding) => {
            const detail = finding.displayValue
              ? ` (${finding.displayValue})`
              : "";
            return `${finding.title} [${finding.id}]${detail}`;
          })
          .join("; ");
        lines.push(
          `- ${category}: ${findingText || "no individual weighted audit below 1.0"}.`,
        );
      }
      lines.push("");
    }
    lines.push(
      `Metrics use the median of three samples. Raw LCP: ${group.samples.map((sample) => `${sample.metrics.lcpMs} ms`).join(", ")}; CLS: ${group.samples.map((sample) => sample.metrics.cls).join(", ")}; TBT: ${group.samples.map((sample) => `${sample.metrics.tbtMs} ms`).join(", ")}.`,
    );
    lines.push("");
    if (group.lcpElement) {
      const imageNames = group.assets
        .filter((asset) => /\.(png|jpe?g|webp|avif)(?:\?|$)/i.test(asset.url))
        .map((asset) => path.basename(new URL(asset.url).pathname))
        .join(", ");
      lines.push(
        `LCP element: ${group.lcpElement.label || group.lcpElement.selector}; source ${path.basename(new URL(group.lcpElement.source, origin).pathname)}. Median LCP phases: ${Object.entries(
          group.lcpPhases,
        )
          .map(([phase, timing]) => `${phase} ${timing} ms`)
          .join(", ")}.`,
      );
      lines.push(
        `Naturally loaded unique assets: ${(group.uniqueImageTransferBytes / (1024 * 1024)).toFixed(2)} MiB of images (${imageNames || "none"}) and ${(group.uniqueFontTransferBytes / 1024).toFixed(1)} KiB of fonts.`,
      );
      lines.push("");
    }
    if (group.recurringIssues.length) {
      lines.push("Repeated Lighthouse findings from the measured reports:");
      for (const issue of group.recurringIssues) {
        const detail = issue.displayValue ? ` — ${issue.displayValue}` : "";
        lines.push(
          `- ${issue.title} (${issue.id}), present in ${issue.occurrences}/3 runs${detail}.`,
        );
      }
    } else {
      lines.push(
        "No scored audit below 0.9 recurred in at least two samples. Inspect the linked HTML reports for individual-run warnings.",
      );
    }
    lines.push("");
    const images = group.assets.filter((asset) =>
      /\.(png|jpe?g|webp|avif)(?:\?|$)/i.test(asset.url),
    );
    const fonts = group.assets.filter((asset) =>
      /\.woff2?(?:\?|$)/i.test(asset.url),
    );
    lines.push(
      `Observed shipped assets across samples: ${new Set(images.map((asset) => asset.url)).size} image URL(s), ${new Set(fonts.map((asset) => asset.url)).size} font URL(s); ${group.failedRequests.length} unique failed request(s).`,
    );
    lines.push("");
    lines.push("Reports:");
    for (const sample of group.samples) {
      lines.push(
        `- Run ${sample.run}: [HTML](${sample.reportHtml}) · [JSON](${sample.reportJson})`,
      );
    }
    lines.push("");
  }

  lines.push("## Interpretation notes", "");
  lines.push(
    "LCP is the largest contentful paint audit metric, CLS is cumulative layout shift, and TBT is total blocking time. Lighthouse reports these as lab measurements; they are not field CrUX data. The HTML and JSON reports contain per-run opportunities, diagnostics, network requests, and asset transfer sizes used to explain any shortfall.",
    "",
  );
  return `${lines.join("\n")}\n`;
};

const startedAt = new Date().toISOString();
await mkdir(outputRoot, { recursive: true });
await copyFile(configPath, path.join(outputRoot, "audit-config.json"));

const packageVersions = {};
for (const packageName of [
  "lighthouse",
  "chrome-launcher",
  "vite",
  "@playwright/test",
]) {
  packageVersions[packageName] = await readPackageVersion(packageName);
}

const gitRevision = optionalCommand("git rev-parse HEAD");
const gitStatus = optionalCommand("git status --porcelain");
const hasGitMetadata =
  gitRevision !== "unavailable" && gitStatus !== "unavailable";
const metadata = {
  runId: path.basename(outputRoot),
  configurationVersion: config.configVersion,
  configurationFile: "audit-config.json",
  buildFingerprint: await getBuildFingerprint(),
  gitRevision,
  gitWorkingTree: hasGitMetadata
    ? gitStatus
      ? "dirty"
      : "clean"
    : "unavailable (workspace has no .git metadata)",
  gitStatus: hasGitMetadata
    ? gitStatus
    : "unavailable (workspace has no .git metadata)",
  tools: { ...packageVersions, chrome: "pending" },
  environment: {
    node: process.version,
    npm: optionalCommand("npm --version"),
    platform: process.platform,
    release: os.release(),
    arch: process.arch,
    cpuCount: os.cpus().length,
    cpuModels: [...new Set(os.cpus().map((cpu) => cpu.model))],
    totalMemoryBytes: os.totalmem(),
    locale: "en-US",
  },
  execution: {
    startedAt,
    finishedAt: null,
    auditCount: 0,
    order:
      "sequential: mobile home, mobile NFT detail, desktop home, desktop NFT detail; three samples each",
    chromeFlags: [
      "--headless=new",
      "--no-first-run",
      "--no-default-browser-check",
    ],
    storageReset: true,
    appAssetsBlocked: false,
  },
};

const shutdown = () => stopPreview();
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

try {
  await waitForPreview();
  metadata.tools.chrome = await sampleAudits();
  metadata.execution.auditCount = reports.length;
  metadata.execution.finishedAt = new Date().toISOString();

  const groups = makeGroups();
  const summary = {
    metadata,
    configuration: config,
    measurements: reports,
    medians: groups,
  };

  await writeFile(
    path.join(outputRoot, "environment.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
  );
  await writeFile(
    path.join(outputRoot, "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  await writeFile(
    path.join(outputRoot, "summary.md"),
    markdownReport(metadata, groups),
  );
  console.log(
    `Completed ${reports.length} audits. Results: ${path.relative(projectRoot, outputRoot)}`,
  );
} finally {
  stopPreview();
}
