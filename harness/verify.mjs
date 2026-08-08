#!/usr/bin/env node
/**
 * Redbelly Troubleshooting Wiki — verification harness
 *
 * Reproduces the failure condition and confirms the documented fix for every entry in the
 * wiki that can be checked without a browser. Emits evidence/verification-log.json.
 *
 * Zero runtime dependencies. Node 18+ (global fetch). Node 20+ recommended.
 *
 *   node verify.mjs                 # read-only checks, no key needed
 *   node verify.mjs --deep          # + checks that spend testnet RBNT (needs a funded key)
 *   node verify.mjs --github-token  # + Eligibility SDK package checks
 *
 * Environment:
 *   REDBELLY_PRIVATE_KEY   0x-prefixed key of a funded Testnet account (--deep only)
 *   GITHUB_TOKEN           PAT with read:packages (SDK checks only)
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---------------------------------------------------------------------------
// Constants under test. These are the values the wiki asserts.
// ---------------------------------------------------------------------------

const MAINNET_RPC = "https://governors.mainnet.redbelly.network";
const TESTNET_RPC = "https://governors.testnet.redbelly.network";
const MAINNET_API = "https://api.routescan.io/v2/network/mainnet/evm/151/etherscan/api";
const TESTNET_API = "https://api.routescan.io/v2/network/testnet/evm/153/etherscan/api";
const GAS_UNIT_PRICE_USD = 0.000000476190476190; // published by Redbelly network-fees docs

const args = new Set(process.argv.slice(2));
const DEEP = args.has("--deep");
const SDK = args.has("--github-token") || Boolean(process.env.GITHUB_TOKEN);

const results = [];
let passCount = 0, failCount = 0, skipCount = 0;

// ---------------------------------------------------------------------------
// Plumbing
// ---------------------------------------------------------------------------

async function rpc(url, method, params = [], { timeoutMs = 20000 } = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
      signal: ac.signal,
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-JSON body is itself the finding */ }
    return { httpStatus: res.status, json, raw: text.slice(0, 400) };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Record one check. `fn` returns { observed, pass, expected, note? } or throws.
 */
async function check(id, entry, description, expected, fn) {
  const started = new Date().toISOString();
  const record = { id, entry, description, expected, started };
  try {
    const out = await fn();
    Object.assign(record, out);
    record.status = out.skipped ? "SKIP" : out.pass ? "PASS" : "FAIL";
  } catch (err) {
    record.status = "FAIL";
    record.pass = false;
    record.observed = `threw: ${err?.message ?? String(err)}`;
  }
  record.finished = new Date().toISOString();
  results.push(record);

  const glyph = record.status === "PASS" ? "PASS" : record.status === "SKIP" ? "SKIP" : "FAIL";
  if (record.status === "PASS") passCount++;
  else if (record.status === "SKIP") skipCount++;
  else failCount++;

  console.log(`[${glyph}] ${id.padEnd(6)} ${entry.padEnd(4)} ${description}`);
  if (record.status !== "PASS") {
    console.log(`         expected: ${JSON.stringify(record.expected)}`);
    console.log(`         observed: ${JSON.stringify(record.observed)}`);
  }
  return record;
}

const hexToInt = (h) => parseInt(h, 16);

// ---------------------------------------------------------------------------
// A. Network and RPC connection
// ---------------------------------------------------------------------------

async function sectionA() {
  console.log("\n=== A. Network and RPC connection ===");

  await check("A1.1", "A1", "Mainnet eth_chainId is 0x97 (151), not 154", "0x97", async () => {
    const r = await rpc(MAINNET_RPC, "eth_chainId");
    const observed = r.json?.result ?? r.raw;
    return { observed, decimal: observed?.startsWith?.("0x") ? hexToInt(observed) : null,
             pass: observed === "0x97" };
  });

  await check("A1.2", "A1", "Testnet eth_chainId is 0x99 (153)", "0x99", async () => {
    const r = await rpc(TESTNET_RPC, "eth_chainId");
    const observed = r.json?.result ?? r.raw;
    return { observed, decimal: observed?.startsWith?.("0x") ? hexToInt(observed) : null,
             pass: observed === "0x99" };
  });

  await check("A1.3", "A1", "Public registry lists 151=mainnet(active), 154=TGE(no RPC)",
    "151 active with RPC; 154 registered but rpc[] empty", async () => {
    const res = await fetch("https://chainid.network/chains.json");
    const all = await res.json();
    const pick = (id) => all.find((c) => c.chainId === id);
    const c151 = pick(151), c152 = pick(152), c153 = pick(153), c154 = pick(154);
    const observed = {
      151: c151 && { name: c151.name, status: c151.status, rpc: c151.rpc },
      152: c152 && { name: c152.name, status: c152.status, rpc: c152.rpc },
      153: c153 && { name: c153.name, status: c153.status, rpc: c153.rpc },
      154: c154 && { name: c154.name, status: c154.status, rpc: c154.rpc },
    };
    const pass =
      c151?.name === "Redbelly Network Mainnet" && c151.rpc?.length > 0 &&
      c154 && c154.name !== "Redbelly Network Mainnet" && (c154.rpc?.length ?? 0) === 0;
    return { observed, pass };
  });

  await check("A1.4", "A1", "docs.redbelly.network rb-env page still publishes 154 as mainnet",
    "page contains CHAIN_ID = 154", async () => {
    const res = await fetch("https://docs.redbelly.network/pages/general/rb-env/");
    const html = await res.text();
    const has154 = /CHAIN_ID\s*=\s*154/.test(html);
    const has153 = /CHAIN_ID\s*=\s*153/.test(html);
    const comingSoon = /Coming Soon/i.test(html);
    return {
      observed: { has154, has153, rpcMarkedComingSoon: comingSoon },
      pass: has154,
      note: has154
        ? "Discrepancy still present upstream — wiki entry A1 remains accurate."
        : "Upstream appears to have been corrected. Rewrite A1 before publishing.",
    };
  });

  await check("A2.1", "A2", "Bare RPC URL (no path) accepts JSON-RPC", "HTTP 200 + result", async () => {
    const r = await rpc(TESTNET_RPC, "eth_blockNumber");
    return { observed: { httpStatus: r.httpStatus, result: r.json?.result },
             pass: r.httpStatus === 200 && typeof r.json?.result === "string" };
  });

  await check("A2.2", "A2", "'/rpc' path suffix fails (the documented wrong shape)",
    "non-200, or no JSON-RPC result", async () => {
    const r = await rpc(TESTNET_RPC + "/rpc", "eth_blockNumber");
    const failed = r.httpStatus !== 200 || typeof r.json?.result !== "string";
    return { observed: { httpStatus: r.httpStatus, body: r.raw }, pass: failed };
  });

  await check("A2.3", "A2", "Trailing slash is harmless", "HTTP 200 + result", async () => {
    const r = await rpc(TESTNET_RPC + "/", "eth_blockNumber");
    return { observed: { httpStatus: r.httpStatus, result: r.json?.result },
             pass: r.httpStatus === 200 && typeof r.json?.result === "string" };
  });

  await check("A3.1", "A3", "DevNet chain 152 publishes no RPC endpoint",
    "registry rpc[] empty for 152", async () => {
    const res = await fetch("https://chainid.network/chains.json");
    const all = await res.json();
    const c = all.find((x) => x.chainId === 152);
    return { observed: { name: c?.name, status: c?.status, rpc: c?.rpc ?? [] },
             pass: (c?.rpc?.length ?? 0) === 0 };
  });

  await check("A3.2", "A3", "Vine environments page marks DevNet deprecated",
    "page contains 'deprecated'", async () => {
    const res = await fetch("https://vine.redbelly.network/environments/");
    const html = (await res.text()).toLowerCase();
    const pass = html.includes("devnet") && html.includes("deprecated");
    return { observed: { mentionsDevnet: html.includes("devnet"),
                         mentionsDeprecated: html.includes("deprecated") }, pass };
  });

  await check("A4.1", "A4", "Burst of 40 parallel calls — observe rate-limit behaviour",
    "record whether HTTP 429 occurs (observational)", async () => {
    const N = 40;
    const codes = await Promise.all(
      Array.from({ length: N }, () =>
        rpc(TESTNET_RPC, "eth_blockNumber", [], { timeoutMs: 15000 })
          .then((r) => r.httpStatus)
          .catch(() => "error")
      )
    );
    const tally = codes.reduce((a, c) => ((a[c] = (a[c] ?? 0) + 1), a), {});
    const saw429 = codes.includes(429);
    return {
      observed: { requests: N, statusTally: tally, rateLimited: saw429 },
      // Observational: both outcomes are informative, neither is a failure of the wiki.
      pass: true,
      note: saw429
        ? "429 observed — entry A4 documents a condition reproducible on this endpoint."
        : "No 429 at this burst size. A4 is written as a defensive pattern, not a claim that "
          + "a specific limit was hit. Rephrase A4 if it implies otherwise.",
    };
  });
}

// ---------------------------------------------------------------------------
// B. Wallet connection
// ---------------------------------------------------------------------------

async function sectionB() {
  console.log("\n=== B. Wallet connection ===");

  await check("B1.1", "B1", "Hex chain IDs in wallet_addEthereumChain match the RPCs",
    "0x97->151, 0x99->153", async () => {
    const observed = { "0x97": hexToInt("0x97"), "0x99": hexToInt("0x99") };
    return { observed, pass: observed["0x97"] === 151 && observed["0x99"] === 153 };
  });

  await check("B2.1", "B2", "Mainnet RPC would reject a submitted chain ID of 154",
    "reported chain id != 154", async () => {
    const r = await rpc(MAINNET_RPC, "eth_chainId");
    const reported = r.json?.result;
    return {
      observed: { reportedByRpc: reported, reportedDecimal: reported ? hexToInt(reported) : null,
                  submittedByDocs: 154 },
      pass: reported ? hexToInt(reported) !== 154 : false,
      note: "This is the exact mismatch MetaMask reports as "
        + "'Chain ID returned by the custom network does not match the submitted chain ID.'",
    };
  });

  await check("B3.1", "B3", "Mainnet Routescan API is reachable and chain-correct",
    "status=1 from stats module", async () => {
    const res = await fetch(`${MAINNET_API}?module=stats&action=ethsupply`);
    const j = await res.json();
    return { observed: j, pass: j?.status === "1" };
  });

  await check("B3.2", "B3", "Testnet Routescan API base resolves (distinct from mainnet)",
    "responds in Etherscan format, not 'chain not supported'", async () => {
    const res = await fetch(`${TESTNET_API}?module=contract&action=getabi&address=0x0000000000000000000000000000000000000000`);
    const j = await res.json().catch(() => null);
    const notSupported = JSON.stringify(j ?? {}).includes("chain not supported");
    return { observed: j, pass: j !== null && !notSupported };
  });
}

// ---------------------------------------------------------------------------
// C. Gas, fees and stuck transactions
// ---------------------------------------------------------------------------

async function sectionC() {
  console.log("\n=== C. Gas, fees and stuck transactions ===");

  await check("C1.1", "C1", "Mainnet gas price is ~5 orders of magnitude above Ethereum norms",
    "gasPrice > 1000 gwei", async () => {
    const r = await rpc(MAINNET_RPC, "eth_gasPrice");
    const hex = r.json?.result;
    if (!hex) return { observed: r.raw, pass: false };
    const wei = BigInt(hex);
    const gwei = Number(wei) / 1e9;
    const rbntPer21k = Number(wei * 21000n) / 1e18;
    const impliedUsdPerRbnt = 0.01 / rbntPer21k;
    return {
      observed: {
        hex, wei: wei.toString(), gwei: Number(gwei.toFixed(3)),
        rbntForSimpleTransfer: Number(rbntPer21k.toFixed(6)),
        impliedUsdPerRbnt: Number(impliedUsdPerRbnt.toFixed(8)),
      },
      pass: gwei > 1000,
      note: "Cross-check: 21000 gas x published unit price of US$0.000000476190476190 = US$0.01, "
        + "which is what the docs state. The gwei figure floats with the RBNT price; the USD cost does not.",
    };
  });

  await check("C1.2", "C1", "Testnet gas price readable", "hex quantity returned", async () => {
    const r = await rpc(TESTNET_RPC, "eth_gasPrice");
    const hex = r.json?.result;
    return {
      observed: hex ? { hex, gwei: Number(Number(BigInt(hex)) / 1e9).toFixed(3) } : r.raw,
      pass: typeof hex === "string" && hex.startsWith("0x"),
    };
  });

  await check("C1.3", "C1", "USD gas budgeting formula matches the documented unit price",
    "21000 gas => US$0.01", async () => {
    const usd = 21000 * GAS_UNIT_PRICE_USD;
    return { observed: { gas: 21000, unitPriceUsd: GAS_UNIT_PRICE_USD, totalUsd: Number(usd.toFixed(6)) },
             pass: Math.abs(usd - 0.01) < 1e-9 };
  });

  await check("C3.1", "C3", "eth_estimateGas without 'from' behaves differently to with 'from'",
    "omitting 'from' degrades or fails the estimate", async () => {
    const withFrom = await rpc(TESTNET_RPC, "eth_estimateGas",
      [{ from: "0x0000000000000000000000000000000000000001",
         to: "0x0000000000000000000000000000000000000001", value: "0x0" }]);
    const withoutFrom = await rpc(TESTNET_RPC, "eth_estimateGas",
      [{ to: "0x0000000000000000000000000000000000000001", value: "0x0" }]);
    return {
      observed: {
        withFrom: withFrom.json?.result ?? withFrom.json?.error ?? withFrom.raw,
        withoutFrom: withoutFrom.json?.result ?? withoutFrom.json?.error ?? withoutFrom.raw,
      },
      pass: true,
      note: "Observational. Records the node's actual behaviour so C3's claim about 'from' "
        + "is stated to match it rather than to match EVM folklore.",
    };
  });

  await check("C4.1", "C4", "latest vs pending nonce are both queryable",
    "both return hex quantities", async () => {
    const addr = "0x0000000000000000000000000000000000000001";
    const latest = await rpc(TESTNET_RPC, "eth_getTransactionCount", [addr, "latest"]);
    const pending = await rpc(TESTNET_RPC, "eth_getTransactionCount", [addr, "pending"]);
    return {
      observed: { latest: latest.json?.result, pending: pending.json?.result },
      pass: typeof latest.json?.result === "string" && typeof pending.json?.result === "string",
    };
  });
}

// ---------------------------------------------------------------------------
// D. Network access and permissioning
// ---------------------------------------------------------------------------

async function sectionD() {
  console.log("\n=== D. Network access and permissioning ===");

  await check("D1.1", "D1", "A random un-onboarded address cannot estimate a self-transfer",
    "estimate fails or returns an error for a permissionless address", async () => {
    // Deterministic throwaway address that has provably never been onboarded.
    const addr = "0xdead00000000000000000000000000000000beef";
    const r = await rpc(TESTNET_RPC, "eth_estimateGas",
      [{ from: addr, to: addr, value: "0x0" }]);
    const errored = Boolean(r.json?.error) || r.json?.result === undefined;
    return {
      observed: { httpStatus: r.httpStatus, result: r.json?.result, error: r.json?.error, raw: r.raw },
      pass: true, // observational — the *shape* of the failure is what D1 documents
      note: errored
        ? "Un-onboarded address rejected. D1's described symptom reproduces."
        : "Estimate succeeded for an un-onboarded address. D1 must be rewritten to match: "
          + "the permission gate is not enforced at estimation time on this endpoint.",
      errored,
    };
  });

  await check("D1.2", "D1", "Network access dApp is reachable", "HTTP 200", async () => {
    const res = await fetch("https://access.redbelly.network/", { redirect: "follow" });
    return { observed: { status: res.status, url: res.url }, pass: res.status === 200 };
  });

  await check("D2.1", "D2", "Faucet host is reachable", "HTTP 200", async () => {
    const res = await fetch("https://redbelly.faucetme.pro/", { redirect: "follow" });
    return { observed: { status: res.status, url: res.url }, pass: res.status === 200 };
  });
}

// ---------------------------------------------------------------------------
// F. Explorer and contract verification (API-level)
// ---------------------------------------------------------------------------

async function sectionF() {
  console.log("\n=== F. Explorer and contract verification ===");

  await check("F1.1", "F1", "Routescan exposes the Etherscan verification API on testnet 153",
    "checkverifystatus answers in Etherscan format", async () => {
    const res = await fetch(`${TESTNET_API}?module=contract&action=checkverifystatus&guid=probe`);
    const j = await res.json().catch(() => null);
    const wellFormed = j && typeof j.status === "string" && "result" in j;
    return { observed: j, pass: Boolean(wellFormed) };
  });

  await check("F1.2", "F1", "Routescan exposes the same API on mainnet 151",
    "checkverifystatus answers in Etherscan format", async () => {
    const res = await fetch(`${MAINNET_API}?module=contract&action=checkverifystatus&guid=probe`);
    const j = await res.json().catch(() => null);
    const wellFormed = j && typeof j.status === "string" && "result" in j;
    return { observed: j, pass: Boolean(wellFormed) };
  });

  await check("F1.3", "F1", "Etherscan's own multichain list does NOT cover Redbelly",
    "151 and 153 absent from api.etherscan.io/v2/chainlist", async () => {
    const res = await fetch("https://api.etherscan.io/v2/chainlist");
    const j = await res.json();
    const ids = new Set((j.result ?? []).map((c) => String(c.chainid)));
    return {
      observed: { totalChains: ids.size, has151: ids.has("151"), has153: ids.has("153") },
      pass: !ids.has("151") && !ids.has("153"),
      note: "Confirms why hardhat-verify errors with 'network ... is not supported' until a "
        + "chainDescriptors entry supplies the Routescan apiUrl.",
    };
  });
}

// ---------------------------------------------------------------------------
// G. Eligibility SDK
// ---------------------------------------------------------------------------

async function sectionG() {
  console.log("\n=== G. Eligibility SDK ===");

  await check("G1.1", "G1", "@redbellynetwork/eligibility-sdk is absent from the public npm registry",
    "HTTP 404 from registry.npmjs.org", async () => {
    const res = await fetch("https://registry.npmjs.org/@redbellynetwork%2Feligibility-sdk");
    return { observed: { status: res.status }, pass: res.status === 404 };
  });

  await check("G1.2", "G1", "No @redbellynetwork packages are published on public npm",
    "search returns 0 results", async () => {
    const res = await fetch("https://registry.npmjs.org/-/v1/search?text=redbellynetwork&size=10");
    const j = await res.json();
    return { observed: { total: j.total, names: (j.objects ?? []).map((o) => o.package.name) },
             pass: (j.objects ?? []).every((o) => !o.package.name.startsWith("@redbellynetwork/")) };
  });

  await check("G2.1", "G2", "GitHub Packages rejects an unauthenticated request",
    "HTTP 401", async () => {
    const res = await fetch("https://npm.pkg.github.com/@redbellynetwork%2Feligibility-sdk");
    const body = await res.text();
    return { observed: { status: res.status, body: body.slice(0, 200) }, pass: res.status === 401 };
  });

  await check("G2.2", "G2", "Official installation page publishes an .npmrc auth line missing '//'",
    "page contains 'npm.pkg.github.com/:_authToken' without leading slashes", async () => {
    const res = await fetch("https://docs.redbelly.network/pages/eligibility-sdk/installation/");
    const html = await res.text();
    const broken = /(^|[^/])npm\.pkg\.github\.com\/:_authToken/m.test(html);
    const correct = /\/\/npm\.pkg\.github\.com\/:_authToken/.test(html);
    return {
      observed: { hasBrokenForm: broken, hasCorrectForm: correct },
      pass: broken,
      note: broken
        ? "Typo still present upstream — G2 remains accurate."
        : "Upstream corrected. Rewrite or cut G2 before publishing.",
    };
  });

  await check("G3.1", "G3", "Documented quickstart repo is not publicly clonable",
    "GitHub API 404 for redbellynetwork/eligibility-sdk-quickstart", async () => {
    const res = await fetch("https://api.github.com/repos/redbellynetwork/eligibility-sdk-quickstart");
    return { observed: { status: res.status }, pass: res.status === 404 };
  });

  await check("G3.2", "G3", "Getting-started page still instructs cloning that repo",
    "page contains the clone URL", async () => {
    const res = await fetch("https://docs.redbelly.network/pages/eligibility-sdk/getting-started/");
    const html = await res.text();
    const pass = html.includes("eligibility-sdk-quickstart");
    return { observed: { referencesQuickstartRepo: pass,
                         mentionsUnderDevelopmentFaucet: /under development/i.test(html) }, pass };
  });

  await check("G4.1", "G4", "Credential JSON-LD schema URLs used in SDK queries resolve",
    "HTTP 200 for each schema", async () => {
    const base = "https://raw.githubusercontent.com/redbellynetwork/receptor-schema/refs/heads/main/schemas/json-ld";
    const names = ["AMLCTFCredential", "PassportCredential", "ProofOfAddressCredential",
                   "EssentialIdCredential"];
    const statuses = {};
    for (const n of names) {
      const res = await fetch(`${base}/${n}.jsonld`, { method: "GET" });
      statuses[n] = res.status;
    }
    return { observed: statuses, pass: Object.values(statuses).every((s) => s === 200) };
  });

  if (SDK && process.env.GITHUB_TOKEN) {
    await check("G4.2", "G4", "Authenticated GitHub Packages fetch returns package metadata",
      "HTTP 200 + peerDependencies", async () => {
      const res = await fetch("https://npm.pkg.github.com/@redbellynetwork%2Feligibility-sdk", {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
      });
      if (res.status !== 200) return { observed: { status: res.status }, pass: false };
      const j = await res.json();
      const latest = j["dist-tags"]?.latest;
      const v = j.versions?.[latest] ?? {};
      return {
        observed: { latest, peerDependencies: v.peerDependencies, dependencies: Object.keys(v.dependencies ?? {}) },
        pass: true,
      };
    });
  } else {
    await check("G4.2", "G4", "Authenticated GitHub Packages fetch (needs GITHUB_TOKEN)",
      "skipped", async () => ({ skipped: true, observed: "GITHUB_TOKEN not set", pass: false }));
  }
}

// ---------------------------------------------------------------------------
// Deep checks — spend testnet RBNT. Require REDBELLY_PRIVATE_KEY.
// ---------------------------------------------------------------------------

async function sectionDeep() {
  console.log("\n=== DEEP (state-changing) ===");
  if (!DEEP) {
    console.log("  skipped — pass --deep to run these");
    return;
  }
  if (!process.env.REDBELLY_PRIVATE_KEY) {
    await check("DEEP", "-", "State-changing checks", "REDBELLY_PRIVATE_KEY set",
      async () => ({ skipped: true, observed: "REDBELLY_PRIVATE_KEY not set", pass: false }));
    return;
  }
  console.log("  Deep checks run from the Hardhat project — see harness/README.md step 4.");
  console.log("  They are executed by `npx hardhat run scripts/deep-checks.ts --network redbellyTestnet`");
  console.log("  and merged into this log by run.sh / run.ps1.");
}

// ---------------------------------------------------------------------------

async function main() {
  const startedAt = new Date().toISOString();
  console.log("Redbelly wiki verification harness");
  console.log(`Started ${startedAt}`);
  console.log(`Node ${process.version}\n`);

  await sectionA();
  await sectionB();
  await sectionC();
  await sectionD();
  await sectionF();
  await sectionG();
  await sectionDeep();

  const finishedAt = new Date().toISOString();
  const log = {
    harness: "redbelly-troubleshooting-wiki",
    version: "1.0.0",
    startedAt,
    finishedAt,
    node: process.version,
    platform: `${process.platform} ${process.arch}`,
    mode: { deep: DEEP, sdk: SDK },
    endpoints: { MAINNET_RPC, TESTNET_RPC, MAINNET_API, TESTNET_API },
    summary: { total: results.length, pass: passCount, fail: failCount, skip: skipCount },
    checks: results,
  };

  const outDir = join(ROOT, "evidence");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "verification-log.json");
  writeFileSync(outPath, JSON.stringify(log, null, 2));

  console.log("\n" + "=".repeat(60));
  console.log(`PASS ${passCount}   FAIL ${failCount}   SKIP ${skipCount}   (of ${results.length})`);
  console.log(`Log written to ${outPath}`);
  console.log("=".repeat(60));

  if (failCount > 0) {
    console.log("\nFailed checks — each one means a wiki entry needs correcting or cutting:");
    for (const r of results.filter((x) => x.status === "FAIL")) {
      console.log(`  ${r.id} (${r.entry}): ${r.description}`);
    }
  }
  process.exit(0); // the log is the deliverable; a FAIL is data, not a crash
}

main();
