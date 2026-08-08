/**
 * State-changing verification checks against Redbelly Testnet (chain 153).
 *
 * These spend testnet RBNT. They reproduce each failure condition documented in the wiki
 * and then confirm the documented fix — a passing run is the evidence that the entry is
 * real, not just plausible.
 *
 *   npx hardhat run scripts/deep-checks.ts --network redbellyTestnet
 *
 * Requires REDBELLY_PRIVATE_KEY (a funded Testnet account whose address has completed
 * network access at https://access.redbelly.network).
 *
 * Writes evidence/deep-checks.json. run.sh / run.ps1 merges it into verification-log.json.
 */

import { network } from "hardhat";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const { ethers } = await network.create({
  network: "redbellyTestnet",
  chainType: "l1",
});

type Result = {
  id: string;
  entry: string;
  description: string;
  expected: string;
  observed: unknown;
  status: "PASS" | "FAIL" | "SKIP";
  note?: string;
  at: string;
};

const results: Result[] = [];

function record(
  id: string,
  entry: string,
  description: string,
  expected: string,
  observed: unknown,
  pass: boolean | "skip",
  note?: string,
) {
  const status: Result["status"] = pass === "skip" ? "SKIP" : pass ? "PASS" : "FAIL";
  results.push({ id, entry, description, expected, observed, status, note, at: new Date().toISOString() });
  console.log(`[${status}] ${id.padEnd(6)} ${entry.padEnd(4)} ${description}`);
  if (status === "FAIL") console.log(`         observed: ${JSON.stringify(observed)}`);
}

/** Pull the most useful identifying string out of whatever the provider threw. */
function errText(err: unknown): string {
  const e = err as Record<string, any>;
  return [e?.shortMessage, e?.reason, e?.info?.error?.message, e?.error?.message, e?.message]
    .filter(Boolean)
    .join(" | ")
    .slice(0, 500);
}

const [signer] = await ethers.getSigners();
const provider = signer.provider!;
const address = await signer.getAddress();

// Declared up front: writeOut() closes over these and may run before deployment happens.
let probeAddress: string | null = null;
let deployTxHash: string | null = null;
const LABEL = `wiki-harness-${Date.now()}`;

console.log("=== Redbelly deep checks ===");
console.log("signer:", address);

// ---------------------------------------------------------------------------
// Preconditions
// ---------------------------------------------------------------------------

const net = await provider.getNetwork();
record(
  "D0.1", "A1", "Connected network reports chain 153",
  "153", { chainId: Number(net.chainId) }, Number(net.chainId) === 153,
);

const balance = await provider.getBalance(address);
const gasPrice = (await provider.getFeeData()).gasPrice ?? 0n;
record(
  "D0.2", "C1", "Signer holds RBNT and live gas price is readable",
  "balance > 0",
  {
    balanceWei: balance.toString(),
    balanceRBNT: ethers.formatEther(balance),
    gasPriceWei: gasPrice.toString(),
    gasPriceGwei: Number(ethers.formatUnits(gasPrice, "gwei")).toFixed(3),
    costOfSimpleTransferRBNT: ethers.formatEther(gasPrice * 21000n),
  },
  balance > 0n,
  "If this fails, fund the address at https://redbelly.faucetme.pro before rerunning.",
);

if (balance === 0n) {
  console.log("\nAborting deep checks: signer has no RBNT.");
  writeOut();
  process.exit(0);
}

// ---------------------------------------------------------------------------
// D1 — permissioned network: can this address actually write?
// ---------------------------------------------------------------------------

let canWrite = false;
try {
  const est = await provider.estimateGas({ from: address, to: address, value: 0n });
  canWrite = true;
  record(
    "D1.3", "D1", "Onboarded address can estimate a self-transfer",
    "estimate succeeds", { gas: est.toString() }, true,
  );
} catch (err) {
  record(
    "D1.3", "D1", "Onboarded address can estimate a self-transfer",
    "estimate succeeds", { error: errText(err) }, false,
    "The signing address appears not to have network access. Complete onboarding at "
    + "https://access.redbelly.network, then rerun. This is exactly the symptom wiki entry D1 describes.",
  );
}

// ---------------------------------------------------------------------------
// E2 — insufficient funds: reproduce the literal error
// ---------------------------------------------------------------------------

try {
  await signer.sendTransaction({ to: address, value: balance * 1000n });
  record("E2.1", "E2", "Sending more than the balance is rejected",
    "insufficient funds error", { note: "transaction was accepted — unexpected" }, false);
} catch (err) {
  const text = errText(err);
  record(
    "E2.1", "E2", "Sending more than the balance produces the documented error",
    "error mentions insufficient funds", { error: text },
    /insufficient funds/i.test(text),
    "Captured verbatim so the wiki's error-message index matches what Redbelly actually returns.",
  );
}

// ---------------------------------------------------------------------------
// C3 — revert reasons: eth_call surfaces what estimateGas hides
// ---------------------------------------------------------------------------
// Deployed further down; C3 checks run after deployment.

// ---------------------------------------------------------------------------
// E1/E3 — deploy with the prague profile
// ---------------------------------------------------------------------------

if (canWrite) {
  try {
    const Probe = await ethers.getContractFactory("Probe");
    const probe = await Probe.deploy(LABEL);
    const tx = probe.deploymentTransaction();
    deployTxHash = tx?.hash ?? null;
    await probe.waitForDeployment();
    probeAddress = await probe.getAddress();
    const receipt = deployTxHash ? await provider.getTransactionReceipt(deployTxHash) : null;

    record(
      "E3.1", "E3", "Documented Hardhat 3 config deploys to Redbelly Testnet",
      "contract deployed, receipt status 1",
      {
        address: probeAddress,
        txHash: deployTxHash,
        gasUsed: receipt?.gasUsed?.toString(),
        estimatedUsdCost: receipt ? Number(receipt.gasUsed) * 0.000000476190476190 : null,
        explorer: `https://redbelly.testnet.routescan.io/address/${probeAddress}`,
      },
      receipt?.status === 1,
    );

    record(
      "E1.1", "E1", "Contract compiled with evmVersion=prague executes on chain",
      "state-changing call succeeds",
      await (async () => {
        const bumpTx = await probe.bump();
        const r = await bumpTx.wait();
        const v = await probe.value();
        return { bumpTx: bumpTx.hash, status: r?.status, valueAfterBump: v.toString() };
      })(),
      true,
      "Confirms the prague target in hardhat.config.ts produces bytecode Redbelly accepts.",
    );
  } catch (err) {
    record("E3.1", "E3", "Documented Hardhat 3 config deploys to Redbelly Testnet",
      "contract deployed", { error: errText(err) }, false);
  }
} else {
  record("E3.1", "E3", "Deployment", "contract deployed", { skipped: "no write permission" }, "skip");
}

// ---------------------------------------------------------------------------
// C3 — revert reason visible via eth_call, hidden by estimateGas
// ---------------------------------------------------------------------------

if (probeAddress) {
  const probe = await ethers.getContractAt("Probe", probeAddress);

  let estimateError = "";
  try {
    await probe.alwaysReverts.estimateGas({ from: address });
  } catch (err) {
    estimateError = errText(err);
  }

  let callError = "";
  let reason = "";
  try {
    await probe.alwaysReverts.staticCall({ from: address });
  } catch (err) {
    callError = errText(err);
    reason = (err as any)?.reason ?? "";
  }

  record(
    "C3.2", "C3", "eth_call surfaces the revert reason for a call that reverts",
    'reason string "Probe: intentional revert" recoverable',
    { estimateGasError: estimateError, staticCallError: callError, reason },
    /intentional revert/.test(callError) || /intentional revert/.test(reason),
    "Demonstrates the C3 debugging step: replay the failing call with eth_call to get the reason.",
  );
}

// ---------------------------------------------------------------------------
// C4 — nonce too low: reproduce the literal error
// ---------------------------------------------------------------------------

if (canWrite) {
  try {
    const usedNonce = (await provider.getTransactionCount(address, "latest")) - 1;
    if (usedNonce < 0) {
      record("C4.2", "C4", "Reusing a spent nonce is rejected", "nonce too low",
        { skipped: "account has sent no transactions yet" }, "skip");
    } else {
      await signer.sendTransaction({ to: address, value: 0n, nonce: usedNonce });
      record("C4.2", "C4", "Reusing a spent nonce is rejected", "nonce too low",
        { note: "transaction was accepted — unexpected" }, false);
    }
  } catch (err) {
    const text = errText(err);
    record(
      "C4.2", "C4", "Reusing a spent nonce produces the documented error",
      "error mentions nonce", { error: text },
      /nonce/i.test(text),
      "Captured verbatim for the error-message index.",
    );
  }
}

// ---------------------------------------------------------------------------
// C2 — underpriced transaction and its replacement
// ---------------------------------------------------------------------------

if (canWrite) {
  const live = (await provider.getFeeData()).gasPrice ?? 0n;
  const underpriced = live / 1000n; // ~3 orders of magnitude below the oracle price

  try {
    const nonce = await provider.getTransactionCount(address, "pending");
    const stuck = await signer.sendTransaction({
      to: address, value: 0n, nonce, gasPrice: underpriced, gasLimit: 21000,
    });

    // Give it a short window to mine. If it does, Redbelly accepts underpriced txs and
    // wiki entry C2 needs rewriting.
    const mined = await Promise.race([
      stuck.wait(1).then(() => true).catch(() => false),
      new Promise<boolean>((r) => setTimeout(() => r(false), 45_000)),
    ]);

    if (mined) {
      record(
        "C2.1", "C2", "Underpriced transaction behaviour",
        "underpriced tx does not mine",
        { txHash: stuck.hash, gasPriceUsed: underpriced.toString(), livePrice: live.toString(), mined: true },
        false,
        "It mined anyway. Rewrite C2 — this endpoint accepts prices well below eth_gasPrice.",
      );
    } else {
      // Now apply the documented fix: replace at a bumped price derived from the live one.
      const bumped = (live * 130n) / 100n;
      const replacement = await signer.sendTransaction({
        to: address, value: 0n, nonce, gasPrice: bumped, gasLimit: 21000,
      });
      const r = await replacement.wait();
      record(
        "C2.1", "C2", "Underpriced tx stalls; replacement at a bumped live price clears it",
        "replacement mines, nonce advances",
        {
          stuckTx: stuck.hash,
          stuckGasPrice: underpriced.toString(),
          livePrice: live.toString(),
          replacementTx: replacement.hash,
          replacementGasPrice: bumped.toString(),
          replacementStatus: r?.status,
        },
        r?.status === 1,
        "This is the exact recovery procedure documented in wiki entry C2.",
      );
    }
  } catch (err) {
    const text = errText(err);
    record(
      "C2.1", "C2", "Underpriced transaction rejected outright",
      "underpriced / replacement error", { error: text },
      /underpriced|too low|fee/i.test(text),
      "Node rejected the underpriced transaction at submission rather than queuing it. "
      + "C2 should describe both outcomes.",
    );
  }
}

// ---------------------------------------------------------------------------
// F1 — verification through Routescan
// ---------------------------------------------------------------------------

if (probeAddress) {
  record(
    "F1.4", "F1", "Deployed contract is ready for `hardhat verify`",
    "address + constructor args recorded",
    {
      address: probeAddress,
      constructorArgs: [LABEL],
      command:
        `npx hardhat verify --network redbellyTestnet ${probeAddress} "${LABEL}"`,
      explorer: `https://redbelly.testnet.routescan.io/address/${probeAddress}#code`,
    },
    true,
    "run.sh executes this command next and captures the result as F1.5.",
  );
}

writeOut();

function writeOut() {
  const dir = join(process.cwd(), "..", "evidence");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const out = {
    startedAt: results[0]?.at ?? new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    signer: address,
    network: "redbellyTestnet",
    chainId: 153,
    deployedProbe: probeAddress,
    deployTxHash,
    constructorLabel: LABEL,
    summary: {
      total: results.length,
      pass: results.filter((r) => r.status === "PASS").length,
      fail: results.filter((r) => r.status === "FAIL").length,
      skip: results.filter((r) => r.status === "SKIP").length,
    },
    checks: results,
  };
  writeFileSync(join(dir, "deep-checks.json"), JSON.stringify(out, null, 2));
  console.log(`\nWrote ${join(dir, "deep-checks.json")}`);
  console.log(
    `PASS ${out.summary.pass}  FAIL ${out.summary.fail}  SKIP ${out.summary.skip}`,
  );
  if (probeAddress) {
    console.log(`\nDeployed Probe at ${probeAddress}`);
    console.log(`Next: npx hardhat verify --network redbellyTestnet ${probeAddress} "${LABEL}"`);
  }
}
