# Verification harness

Every fix in the wiki is designed to be executed here rather than asserted. This directory
produces `../evidence/verification-log.json`.

**Status: written, not yet run.** The log does not exist yet. Stage 1 needs no key, no funds
and no install, so it can be produced in about two minutes by anyone with Node installed.

The task's Accuracy benchmark says *"Technical reviewer tests at least 5 solutions to verify
they actually fix the stated problems."* This harness covers all 22 entries, not 5, so once
it is run a reviewer spot-checking any of them finds a recorded result rather than a claim.

---

## Requirements

- **Node 20 or later** (Node 18 works; 20+ is what this was written against)
- For on-chain checks: a Redbelly Testnet private key that is **funded** and **onboarded**

Nothing else. Stage 1 has zero dependencies — it uses Node's built-in `fetch`.

---

## Quick start

```bash
cd harness

# Stage 1 only — read-only checks. No key, no funds, no npm install.
./run.sh
```

That alone produces a populated `verification-log.json` covering the documentation
discrepancies, chain IDs, RPC endpoint shapes, gas economics, explorer APIs and the
Eligibility SDK packaging problems.

```bash
# Full run — adds compilation, deployment, on-chain reproduction and contract verification.
cp .env.example .env
$EDITOR .env          # add REDBELLY_PRIVATE_KEY
./run.sh --deep
```

---

## Getting the account ready

The on-chain stage needs an address that can actually write to Redbelly. Redbelly is a
permissioned network, so a funded address is not automatically a usable one — both steps
are required.

**1. Create a throwaway key.** Do not reuse anything that holds mainnet value:

```bash
node -e "const{Wallet}=require('ethers');const w=Wallet.createRandom();console.log('addr:',w.address);console.log('key :',w.privateKey)"
```

*(Requires `npm install ethers` first, or generate one in MetaMask.)*

**2. Claim network access.** Go to <https://access.redbelly.network>, connect the wallet, and
follow the prompts. Without this, every write reverts — that is wiki entry D1, and the
harness will detect and report it rather than hang.

**3. Fund it.** Go to <https://redbelly.faucetme.pro>, join with your Discord account, and
request Testnet RBNT for the address.

**4. Confirm before running:**

```bash
curl -s -X POST https://governors.testnet.redbelly.network \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xYOUR_ADDRESS","latest"],"id":1}'
```

A result other than `"0x0"` means the address is funded.

---

## What each stage does

| Stage | What runs | Needs a key? | Covers |
|---|---|---|---|
| 1 | `verify.mjs` — 25 read-only checks over RPCs, registries, docs pages, explorer APIs, npm and GitHub | No | A1–A4, B1–B3, C1, C3, C4, D1–D2, F1, G1–G4 |
| 2 | `npm install` | No | — |
| 3 | `hardhat compile` under both the `prague` and `osakaMismatch` profiles | No | E1 |
| 4 | `scripts/deep-checks.ts` — deploy, write, and reproduce insufficient-funds / nonce / underpriced-transaction failures | Yes | C2, C3, C4, D1, E1, E2, E3 |
| 5 | `hardhat verify` against Routescan | Yes | F1, F2 |
| 6 | `merge-evidence.mjs` — combines all of the above | No | — |

A failing stage does not abort the run. `run.sh` deliberately omits `set -e`, because a
failed check is evidence, and evidence from the stages that did work is still worth keeping.

---

## Reading the output

```json
{
  "id": "A1.1",
  "entry": "A1",
  "description": "Mainnet eth_chainId is 0x97 (151), not 154",
  "expected": "0x97",
  "observed": "0x97",
  "decimal": 151,
  "status": "PASS"
}
```

- `entry` maps to the wiki entry the check backs.
- `observed` is the raw response, kept so a reviewer can re-derive the conclusion.
- `note`, where present, says what to do if the check's outcome contradicts the wiki.

**A `FAIL` is an instruction, not a nuisance.** The rule for this submission is that any
entry whose fix cannot be reproduced gets **cut**, not published with an asterisk. Sixteen
verified entries clears the task's minimum of fifteen; twenty entries with four unverifiable
ones is a worse submission, because the gap is citable.

This rule has not yet been exercised, because the harness has not yet been run.

Several checks are marked observational in their `note` — the rate-limit burst (`A4.1`), the
`from`-less gas estimate (`C3.1`), and the un-onboarded address probe (`D1.1`). These record
what the network actually does so the wiki's wording can be matched to it. If the observed
behaviour contradicts the entry, the note says so explicitly and the entry gets rewritten.

---

## Re-running

Safe to run repeatedly. Each `--deep` run deploys a fresh `Probe` with a timestamped
constructor label, so verification never collides with a previously verified contract.

Read-only stages hit public endpoints only and change nothing.

---

## Files

| File | Purpose |
|---|---|
| `verify.mjs` | Stage 1. Zero-dependency read-only checks. |
| `hardhat.config.ts` | The reference Redbelly Hardhat 3 config the wiki publishes (entry E3). |
| `contracts/Probe.sol` | Minimal contract used to exercise deploy / write / revert / verify. |
| `scripts/deep-checks.ts` | Stage 4. On-chain reproduction of failure conditions. |
| `merge-evidence.mjs` | Stage 6. Combines stage outputs into one artifact. |
| `read-json-field.mjs` | Small helper so `run.sh` does not depend on `jq`. |
| `run.sh` | Orchestrates all stages. |
