// Build the UltraCalcPal Fuel Calculator browser extension into extension/dist/ (docs/TOOLS.md).
//   node scripts/build-extension.mjs     needs extension/icons (node scripts/build-icons.mjs)
// Writes three zips: chrome (also for Edge), firefox, and firefox-source (AMO asks for the source).
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { copyFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const SRC = "extension/src";
const ICONS = "extension/icons";
const DIST = "extension/dist";
const MATHS = "packages/nutrition/src";
const manifest = JSON.parse(readFileSync(`${SRC}/manifest.json`, "utf8"));
const version = manifest.version;
rmSync(DIST, { recursive: true, force: true });

for (const target of ["chrome", "firefox"]) {
  const dir = `${DIST}/${target}`;
  mkdirSync(`${dir}/icons`, { recursive: true });
  for (const size of [16, 32, 48, 128])
    copyFileSync(`${ICONS}/icon-${size}.png`, `${dir}/icons/icon-${size}.png`);
  for (const f of ["popup.html", "popup.css"]) copyFileSync(`${SRC}/${f}`, `${dir}/${f}`);
  // Not minified, so reviewers can read it.
  await build({
    entryPoints: [`${SRC}/popup.js`],
    bundle: true,
    format: "iife",
    target: "es2020",
    outfile: `${dir}/popup.js`,
  });
  const m = structuredClone(manifest);
  if (target === "firefox") {
    m.browser_specific_settings = {
      gecko: {
        id: "fuel-calculator@ultracalcpal.com",
        strict_min_version: "140.0",
        data_collection_permissions: { required: ["none"] },
      },
      // Firefox for Android only knows data_collection_permissions from 142.
      gecko_android: { strict_min_version: "142.0" },
    };
  }
  writeFileSync(`${dir}/manifest.json`, JSON.stringify(m, null, 2) + "\n");
  execFileSync("zip", ["-qr", `../ultracalcpal-fuel-calculator-${target}-${version}.zip`, "."], {
    cwd: dir,
  });
}

// Source for Firefox review: everything needed to rebuild, plus build steps.
const srcDir = `${DIST}/source`;
mkdirSync(`${srcDir}/scripts`, { recursive: true });
cpSync(SRC, `${srcDir}/extension/src`, { recursive: true });
cpSync(ICONS, `${srcDir}/extension/icons`, { recursive: true });
cpSync(MATHS, `${srcDir}/${MATHS}`, { recursive: true });
copyFileSync("scripts/build-extension.mjs", `${srcDir}/scripts/build-extension.mjs`);
writeFileSync(
  `${srcDir}/package.json`,
  JSON.stringify(
    {
      name: "ultracalcpal-fuel-calculator-source",
      private: true,
      type: "module",
      devDependencies: { esbuild: "*" },
    },
    null,
    2,
  ) + "\n",
);
writeFileSync(
  `${srcDir}/README.md`,
  `# Build steps (UltraCalcPal Fuel Calculator ${version})\n\n1. Node 18 or newer.\n2. \`npm install\`\n3. \`node scripts/build-extension.mjs\`\n\nThe script bundles extension/src/popup.js with esbuild (no minification) together with the maths in packages/nutrition/src, and writes the add-on to extension/dist/firefox. It needs \`zip\` on the PATH. The add-on makes no network calls.\n`,
);
execFileSync("zip", ["-qr", `../ultracalcpal-fuel-calculator-source-${version}.zip`, "."], {
  cwd: srcDir,
});
rmSync(srcDir, { recursive: true, force: true });
console.log(`Built ${DIST}: chrome, firefox and source zips (${version})`);
