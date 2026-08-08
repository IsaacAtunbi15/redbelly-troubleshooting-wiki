#!/usr/bin/env node
/**
 * Merges the outputs of the three verification stages into one artifact.
 *
 *   node merge-evidence.mjs <evidenceDir> <pragueCompileExit> <osakaCompileExit>
 *
 * Reads:  verification-log.json (read-only checks), deep-checks.json (on-chain),
 *         verify-output.txt (hardhat verify)
 * Writes: verification-log.json — the file that ships with the submission.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const [dir, pragueExit = "", osakaExit = ""] = process.argv.slice(2);

if (!dir) {
  console.error("usage: node merge-evidence.mjs <evidenceDir> [pragueExit] [osakaExit]");
  process.exit(1);
}

const logPath = join(dir, "verification-log.json");
if (!existsSync(logPath)) {
  console.log("no verification-log.json to merge into — run `node verify.mjs` first");
  process.exit(0);
}

const log = JSON.parse(readFileSync(logPath, "utf8"));

// --- compilation evidence (wiki entry E1) ----------------------------------
if (pragueExit !== "") {
  log.compilation = {
    prague: {
      profile: "default",
      solc: "0.8.30",
      evmVersion: "prague",
      exitCode: Number(pragueExit),
      pass: Number(pragueExit) === 0,
      note: "The configuration the wiki tells developers to use.",
    },
    osaka: {
      profile: "osakaMismatch",
      solc: "0.8.31",
      evmVersion: "osaka",
      exitCode: Number(osakaExit),
      note:
        "Compiled only to demonstrate that a toolchain left on defaults targets an EVM " +
        "revision newer than Redbelly implements. Solidity 0.8.31 set the default EVM " +
        "version to osaka; Redbelly's SEVM implements prague. Not deployed.",
    },
  };
}

// --- on-chain evidence -----------------------------------------------------
const deepPath = join(dir, "deep-checks.json");
if (existsSync(deepPath)) {
  const deep = JSON.parse(readFileSync(deepPath, "utf8"));
  log.onChain = {
    signer: deep.signer,
    network: deep.network,
    chainId: deep.chainId,
    deployedProbe: deep.deployedProbe,
    deployTxHash: deep.deployTxHash,
    constructorLabel: deep.constructorLabel,
    explorer: deep.deployedProbe
      ? `https://redbelly.testnet.routescan.io/address/${deep.deployedProbe}`
      : null,
    summary: deep.summary,
  };
  log.checks.push(...(deep.checks ?? []).map((c) => ({ ...c, source: "deep-checks" })));
}

// --- contract verification evidence ----------------------------------------
const verifyPath = join(dir, "verify-output.txt");
if (existsSync(verifyPath)) {
  const out = readFileSync(verifyPath, "utf8");
  const succeeded = /successfully verified|already verified/i.test(out);
  log.checks.push({
    id: "F1.5",
    entry: "F1",
    description: "hardhat verify reaches Routescan via the documented chainDescriptors entry",
    expected: "verification accepted by the explorer",
    observed: out.trim().slice(0, 2000),
    status: succeeded ? "PASS" : "FAIL",
    source: "hardhat-verify",
    at: new Date().toISOString(),
  });
}

// --- recount ---------------------------------------------------------------
const summary = { total: log.checks.length, pass: 0, fail: 0, skip: 0 };
for (const c of log.checks) {
  if (c.status === "PASS") summary.pass++;
  else if (c.status === "SKIP") summary.skip++;
  else summary.fail++;
}
log.summary = summary;
log.finishedAt = new Date().toISOString();

writeFileSync(logPath, JSON.stringify(log, null, 2));

console.log(`merged -> ${logPath}`);
console.log(`PASS ${summary.pass}  FAIL ${summary.fail}  SKIP ${summary.skip}  (of ${summary.total})`);

const failures = log.checks.filter((c) => c.status === "FAIL");
if (failures.length) {
  console.log("\nFailed checks — each one means a wiki entry needs correcting or cutting:");
  for (const f of failures) console.log(`  ${f.id} (${f.entry}): ${f.description}`);
}
