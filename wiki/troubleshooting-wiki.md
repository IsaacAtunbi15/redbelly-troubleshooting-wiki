---
title: "Redbelly Network Troubleshooting Guide: 22 Common Developer Errors and Their Fixes"
description: "Fixes for the 22 errors developers hit most often on Redbelly Network — RPC and chain ID conflicts, MetaMask setup, USD-pegged gas, permissioned-network reverts, Hardhat deployment, Routescan verification, and the Eligibility SDK."
tags: blockchain, web3, ethereum, solidity
canonical_url:
cover_image:
published: false
---

# Redbelly Network Troubleshooting Guide

**22 common developer errors, with the exact command that fixes each one.**

Redbelly Network is an EVM-compatible L1 built for compliant asset tokenisation. "EVM
compatible" gets you most of the way, but three things about Redbelly are genuinely
different from every other EVM chain, and they account for most of the time developers
lose here:

1. **It is a permissioned network.** An address that has not claimed a network access
   credential cannot write to the chain. Transactions from it fail in a way that looks
   like an ordinary revert.
2. **Gas is priced in US dollars, not gwei.** `eth_gasPrice` returns roughly
   **165,000 gwei**. That is about four orders of magnitude above Ethereum, it is correct,
   and it breaks any tool with a hardcoded fee cap or a "that can't be right" sanity check.
3. **The two official documentation sites disagree with each other**, including on the
   mainnet chain ID. One of them is stale.

Every entry below follows the same shape — **Symptom → Root Cause → Solution →
Prevention** — and every command is copy-pasteable. Every chain ID, URL, contract address
and package name was read from a live source on the date in the footer, not from memory.

> **Sources read:** 8 August 2026. Every chain ID, URL, contract address and package name
> below was read from a live source on that date and is traced in
> [`sources.md`](../evidence/sources.md).
>
> **Execution status:** the fixes here are derived from those sources and from the documented
> behaviour of the tooling; they have **not yet been executed end-to-end against Redbelly
> Testnet**. A verification harness that does exactly that ships in [`harness/`](../harness/)
> and can be run by anyone — see [Verification and evidence](#verification-and-evidence).
> Entries that fail once it is run will be corrected or removed.

---

## How to use this guide

- **You have an error string:** jump to the [Error message index](#error-message-index) and
  search for it literally. Every literal error string in this guide is listed there.
- **You know the area but not the error:** use the table of contents below.
- **You are setting up from scratch:** read [A1](#a1), [A2](#a2), [C1](#c1) and [B1](#b1)
  in that order. Those four cover the configuration that everything else depends on.

## Table of contents

**A. Network and RPC connection**
- [A1 — Official docs disagree on the mainnet chain ID: 151 or 154?](#a1)
- [A2 — `could not detect network` / 404 from the RPC endpoint](#a2)
- [A3 — Tutorials point at DevNet (chain 152), which is deprecated](#a3)
- [A4 — RPC returns HTTP 429 under load](#a4)

**B. Wallet connection**
- [B1 — MetaMask does not list Redbelly Network](#b1)
- [B2 — `Chain ID returned by the custom network does not match the submitted chain ID`](#b2)
- [B3 — Wrong block explorer URL in wallet config](#b3)

**C. Gas, fees and stuck transactions**
- [C1 — Gas price looks absurd (~165,000 gwei) and the wallet shows a huge fee](#c1)
- [C2 — Transaction stuck pending forever / `replacement transaction underpriced`](#c2)
- [C3 — Gas estimation returns `null` or reverts during estimation](#c3)
- [C4 — `nonce too low` / `nonce has already been used`](#c4)

**D. Network access and permissioning** *(Redbelly-specific — no equivalent on other EVM chains)*
- [D1 — Transactions revert because the address has no network access credential](#d1)
- [D2 — Testnet faucet does not distribute RBNT](#d2)

**E. Contract deployment and compilation**
- [E1 — Contract compiles but misbehaves or fails to deploy: EVM version mismatch](#e1)
- [E2 — Hardhat deployment fails with `insufficient funds for gas * price + value`](#e2)
- [E3 — No official Hardhat config exists for Redbelly](#e3)

**F. Explorer and contract verification**
- [F1 — `The network "..." with chain id "153" is not supported`](#f1)
- [F2 — Verification submitted but the contract shows no source](#f2)

**G. Eligibility SDK integration**
- [G1 — `npm install @redbellynetwork/eligibility-sdk` fails with 404](#g1)
- [G2 — `.npmrc` configured but install still fails with 401](#g2)
- [G3 — Quickstart `git clone` fails: the starter repo is private](#g3)
- [G4 — SDK components render nothing / `window is not defined`](#g4)

---

## Reference card

Copy this. Everything in the guide is consistent with it.

| | Mainnet | Testnet |
|---|---|---|
| Network name | `Redbelly Network Mainnet` | `Redbelly Testnet` |
| Chain ID (decimal) | `151` | `153` |
| Chain ID (hex, for wallets) | `0x97` | `0x99` |
| RPC URL | `https://governors.mainnet.redbelly.network` | `https://governors.testnet.redbelly.network` |
| Currency symbol | `RBNT` (18 decimals) | `RBNT` (18 decimals) |
| Block explorer | `https://redbelly.routescan.io` | `https://redbelly.testnet.routescan.io` |
| Explorer API (Etherscan-compatible) | `https://api.routescan.io/v2/network/mainnet/evm/151/etherscan` | `https://api.routescan.io/v2/network/testnet/evm/153/etherscan` |
| Network access dApp | `https://access.redbelly.network` | `https://access.redbelly.network` |
| Faucet | — | `https://redbelly.faucetme.pro` |

**Chain 152 (DevNet) is deprecated. Chain 154 is not mainnet** — see [A1](#a1) and [A3](#a3).

**EVM version: `prague`. Solidity: `0.8.30`.** Pin both — see [E1](#e1).

---

# A. Network and RPC connection

<a id="a1"></a>
## A1 — Official docs disagree on the mainnet chain ID: 151 or 154?

**Category:** Network/RPC · **Severity:** High — silently connects you to nothing

### Symptom

You configure mainnet with chain ID `154` because that is what the technical documentation
says, and one of the following happens:

```
Error: could not detect network (event="noNetwork", code=NETWORK_ERROR)
```
```
Chain ID returned by the custom network does not match the submitted chain ID.
```
```
Error HH110: Invalid JSON-RPC response received: <html>...
```

Or nothing happens at all: your provider connects, but every read returns empty and no
transaction ever confirms.

### Root Cause

Redbelly publishes two documentation sites, and they do not agree:

| Source | Mainnet chain ID | RPC URL published? |
|---|---|---|
| Vine developer portal — `vine.redbelly.network/environments/` | **151** | Yes |
| Technical docs — `docs.redbelly.network/pages/general/rb-env/` | **154** | No — "Coming Soon" |
| `chainid.network` / ethereum-lists registry | **151** | Yes |

**151 is correct.** Three independent confirmations:

1. The Vine portal — the current developer portal — publishes 151 with a working RPC URL.
2. The `chainid.network` registry lists chain 151 as `Redbelly Network Mainnet`, status
   `active`, with the same RPC URL and the Routescan explorer.
3. **The technical docs site contradicts itself.** Its own Eligibility SDK backend page
   registers the mainnet DID method with `chainId: 151`, on the same domain as the page
   that claims 154.

**Chain 154 is a real registration, but it is not mainnet.** In the `chainid.network`
registry, 154 is `Redbelly Network TGE` — a separate network, with an empty `rpc` array and
no explorer. Pointing a mainnet deployment at 154 aims it at a network that publishes no
endpoint, which is why the failure is so quiet.

The `rb-env` page is stale: it also lists both RPC URLs as "Coming Soon", although both have
been live and published on Vine and in the public registry for some time.

### Solution

**1. Use 151 for mainnet and 153 for testnet.** Do not take the chain ID from
`docs.redbelly.network/pages/general/rb-env/`.

**2. Confirm it yourself in one command** rather than trusting any document, including this
one:

```bash
curl -s -X POST https://governors.mainnet.redbelly.network \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

Expected response — `0x97` is 151:

```json
{"jsonrpc":"2.0","id":1,"result":"0x97"}
```

And for testnet — `0x99` is 153:

```bash
curl -s -X POST https://governors.testnet.redbelly.network \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

```json
{"jsonrpc":"2.0","id":1,"result":"0x99"}
```

**3. Convert the hex yourself if you want a third opinion:**

```bash
python3 -c "print(int('0x97', 16), int('0x99', 16))"
# 151 153
```

### Prevention

Make the chain ID an assertion rather than a constant. In Hardhat, set `chainId` explicitly
in the network config — Hardhat compares it to what the node reports and aborts on a
mismatch instead of proceeding against the wrong chain:

```ts
networks: {
  redbellyTestnet: {
    type: "http",
    chainType: "l1",
    url: "https://governors.testnet.redbelly.network",
    chainId: 153,          // Hardhat verifies this against eth_chainId
    accounts: [configVariable("REDBELLY_PRIVATE_KEY")],
  },
}
```

In application code with ethers v6:

```js
const provider = new ethers.JsonRpcProvider(
  "https://governors.testnet.redbelly.network",
  { chainId: 153, name: "redbelly-testnet" },
  { staticNetwork: true }   // fail fast instead of auto-detecting
);
```

Treat `vine.redbelly.network` as authoritative for environment values, and
`docs.redbelly.network` as authoritative for Receptor and Eligibility SDK material. Where
they overlap, Vine is the one that is current.

---

<a id="a2"></a>
## A2 — `could not detect network` / 404 from the RPC endpoint

**Category:** Network/RPC · **Severity:** High

### Symptom

```
Error: could not detect network (event="noNetwork", code=NETWORK_ERROR, version=6.17.0)
```
```
HttpProviderError: Invalid JSON-RPC response received
```
```
404 page not found
```

The endpoint resolves in a browser but every JSON-RPC call fails.

### Root Cause

The RPC path is wrong. Redbelly's public endpoints take JSON-RPC POSTs **at the domain
root** — there is no `/rpc` path segment and no port suffix:

```
https://governors.mainnet.redbelly.network      ✅
https://governors.testnet.redbelly.network      ✅

https://governors.testnet.redbelly.network/rpc  ❌ 404
https://governors.testnet.redbelly.network:8545 ❌ connection refused
```

The `/rpc` suffix is a reasonable guess for two reasons, and both appear in Redbelly's own
material. Many EVM chains do use `/rpc`. And the Eligibility SDK backend documentation
contains a leftover example pointing at an internal staging host in exactly that shape:

```js
// From docs.redbelly.network — a staging host, not a public endpoint. Do not copy this.
"redbelly:mainnet": new resolver.EthStateResolver(
  "https://rbn9bb267fa.staging.redbelly.network/rpc",
  "0xEd5604a53971cB4e7f51A351b5d93Eef50517a7e"
),
```

That staging hostname is not reachable publicly, and the `/rpc` shape it uses does not apply
to the `governors.*` endpoints.

A trailing slash is harmless — `https://governors.testnet.redbelly.network/` works, and
Redbelly's own network-fees page uses that form.

### Solution

**1. Test the bare endpoint directly.** A working endpoint answers this in under a second:

```bash
curl -s -X POST https://governors.testnet.redbelly.network \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

```json
{"jsonrpc":"2.0","id":1,"result":"0x2f9e23"}
```

**2. If that returns HTML or a 404**, print the status code and body to see what you
actually hit:

```bash
curl -s -o /dev/null -w 'HTTP %{http_code}  ->  %{url_effective}\n' \
  -X POST https://governors.testnet.redbelly.network \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

`HTTP 200` means the endpoint is correct and the problem is elsewhere in your config.
`HTTP 404` means the path has an extra segment on it.

**3. Strip any path segment from the URL** in your `.env`, `hardhat.config.ts`, wallet
config and frontend chain definition. The value is the bare hostname with `https://`.

### Prevention

Define the URL once, in one file, and import it everywhere:

```js
// src/chains.js — single source of truth
export const REDBELLY_TESTNET = {
  id: 153,
  rpcUrl: "https://governors.testnet.redbelly.network",
  explorer: "https://redbelly.testnet.routescan.io",
};
```

Add a startup assertion that fails loudly on a bad endpoint rather than degrading:

```js
const net = await provider.getNetwork();
if (net.chainId !== 153n) {
  throw new Error(`Expected chain 153, got ${net.chainId} from ${rpcUrl}`);
}
```

---

<a id="a3"></a>
## A3 — Tutorials point at DevNet (chain 152), which is deprecated

**Category:** Network/RPC · **Severity:** Medium — wastes hours before it announces itself

### Symptom

You follow a Redbelly tutorial or a community post that references DevNet, and:

- the DevNet RPC URL does not resolve, or resolves and never answers;
- the faucet has no DevNet option;
- the DevNet block explorer link 404s;
- `eth_chainId` never returns `0x98`.

### Root Cause

**Redbelly DevNet (chain ID 152) is deprecated.** The Vine portal states it directly:

> "Redbelly DevNet is now deprecated. Any testing of smart contracts should be done on the
> Redbelly Testnet."

Its environment table lists both the RPC URL and the block explorer as `Deprecated` rather
than giving values. The public `chainid.network` registry corroborates this: chain 152 is
registered as `Redbelly Network Devnet` with status `incubating` and an **empty `rpc`
array** — no endpoint is published for it anywhere.

The reason this keeps catching people is that DevNet references survive in older tutorials,
blog posts and Discord history, and there is no redirect or deprecation banner on the
endpoints themselves. Material written while DevNet was current still reads as current.

Some Redbelly documentation also still refers to DevNet in passing — the testing-coins page,
for instance, describes the faucet as serving "DevNet or Testnet accounts". Testnet is the
live half of that sentence.

### Solution

Substitute Testnet for DevNet everywhere. The mapping is one-to-one:

| DevNet (dead) | Testnet (use this) |
|---|---|
| Chain ID `152` | Chain ID `153` |
| *(no published RPC)* | `https://governors.testnet.redbelly.network` |
| *(deprecated explorer)* | `https://redbelly.testnet.routescan.io` |
| `RedbellyDevNet` | `Redbelly Testnet` |

Find every DevNet reference in your project in one pass:

```bash
grep -rniE 'devnet|\b152\b|0x98' \
  --include='*.js' --include='*.ts' --include='*.json' \
  --include='*.env*' --include='*.sol' --include='*.md' .
```

Then confirm what you switched to is live:

```bash
curl -s -X POST https://governors.testnet.redbelly.network \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# {"jsonrpc":"2.0","id":1,"result":"0x99"}
```

### Prevention

Date-check any Redbelly tutorial before following it. If it mentions DevNet as a live
target, it predates the deprecation and its other values — endpoints, contract addresses,
package names — are the same age.

Cross-check any environment value you find in a third-party post against
`https://vine.redbelly.network/environments/` before you paste it into a config.

---

<a id="a4"></a>
## A4 — RPC returns HTTP 429 under load

**Category:** Network/RPC · **Severity:** Medium

### Symptom

```
Error: server response 429 Too Many Requests
```
```
code=SERVER_ERROR, status=429
```

Typically during an indexer backfill, a test suite that fires many parallel calls, or a
frontend that polls per-component.

### Root Cause

The public `governors.*` endpoints are shared infrastructure with request-rate limits.
Redbelly does not publish a numeric limit, so the practical approach is to treat 429 as
expected under burst load and handle it, rather than to design against a specific published
threshold.

> **Basis for this entry.** No 429 was observed while writing this guide — the limit is
> inferred from the endpoints being shared public infrastructure, not measured. This entry is
> therefore a defensive pattern rather than a report of a confirmed threshold. The harness
> fires a 40-request burst (`A4.1`) and records what actually happens; if no rate limiting
> appears, this entry will be reworded or removed.

Two client-side patterns trigger it far more often than raw transaction volume:

- **Per-component polling.** Each React component creating its own provider and polling
  independently multiplies request count by component count.
- **Unbatched historical reads.** `for (let i = from; i <= to; i++) await provider.getBlock(i)`
  issues one HTTP round trip per block.

### Solution

**1. Retry with exponential backoff and jitter.** Drop-in, no dependencies:

```js
async function rpcWithRetry(fn, { retries = 5, baseMs = 250 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status ?? err?.info?.responseStatus;
      const is429 = status === 429 || String(err?.message ?? "").includes("429");
      if (!is429 || attempt >= retries) throw err;
      const delay = baseMs * 2 ** attempt + Math.random() * 100;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// usage
const block = await rpcWithRetry(() => provider.getBlock("latest"));
```

**2. Batch reads into a single HTTP request.** ethers v6 batches automatically when you
give `JsonRpcProvider` a batching config:

```js
const provider = new ethers.JsonRpcProvider(
  "https://governors.testnet.redbelly.network",
  { chainId: 153, name: "redbelly-testnet" },
  {
    staticNetwork: true,
    batchMaxCount: 25,   // up to 25 calls per HTTP request
    batchStallTime: 20,  // ms to wait while collecting calls to batch
  }
);
```

**3. Share one provider across the whole app** instead of constructing one per component:

```js
// src/provider.js
import { ethers } from "ethers";
let _provider;
export function getProvider() {
  _provider ??= new ethers.JsonRpcProvider(
    "https://governors.testnet.redbelly.network",
    { chainId: 153, name: "redbelly-testnet" },
    { staticNetwork: true, batchMaxCount: 25, batchStallTime: 20 }
  );
  return _provider;
}
```

**4. Cap concurrency on bulk jobs.** For a backfill, process in fixed-size chunks rather
than mapping over the whole range at once:

```js
async function inChunks(items, size, worker) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(worker))));
  }
  return out;
}

const blocks = await inChunks(range, 10, (n) =>
  rpcWithRetry(() => provider.getBlock(n))
);
```

### Prevention

Set `staticNetwork: true` on every provider. Without it, ethers re-issues `eth_chainId`
to detect the network on reconnection, which adds request volume precisely when you are
already being throttled.

For production indexing and sustained high-volume reads, use the Routescan API for
historical queries and reserve the RPC for live state — historical range queries are what
the explorer API is built for.

---

# B. Wallet connection

<a id="b1"></a>
## B1 — MetaMask does not list Redbelly Network

**Category:** Wallet · **Severity:** High — first thing every new developer hits

### Symptom

Redbelly does not appear in MetaMask's network list, and adding it by hand produces a
network that shows a zero balance and cannot send transactions. Or your dApp's "Switch
network" button throws:

```
Unrecognized chain ID "0x99". Try adding the chain using wallet_addEthereumChain first.
```

### Root Cause

Redbelly is not in MetaMask's built-in network list, so it has to be added manually or
programmatically. The manual route fails most often on the chain ID field, because
MetaMask's "Chain ID" input takes a **decimal** value while the `wallet_addEthereumChain`
RPC method takes a **hex** string — and because the technical docs publish a stale mainnet
chain ID (see [A1](#a1)).

### Solution

**Option 1 — Add it programmatically.** This is the payload; both networks are given in
full, with no placeholders to substitute:

```js
// Redbelly Testnet — chain 153 (0x99)
await window.ethereum.request({
  method: "wallet_addEthereumChain",
  params: [{
    chainId: "0x99",
    chainName: "Redbelly Testnet",
    nativeCurrency: { name: "Redbelly Network Coin", symbol: "RBNT", decimals: 18 },
    rpcUrls: ["https://governors.testnet.redbelly.network"],
    blockExplorerUrls: ["https://redbelly.testnet.routescan.io"],
  }],
});
```

```js
// Redbelly Network Mainnet — chain 151 (0x97)
await window.ethereum.request({
  method: "wallet_addEthereumChain",
  params: [{
    chainId: "0x97",
    chainName: "Redbelly Network Mainnet",
    nativeCurrency: { name: "Redbelly Network Coin", symbol: "RBNT", decimals: 18 },
    rpcUrls: ["https://governors.mainnet.redbelly.network"],
    blockExplorerUrls: ["https://redbelly.routescan.io"],
  }],
});
```

Add-then-switch, handling the "already added" case:

```js
const TESTNET = { /* the params object above */ };

async function connectRedbellyTestnet() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x99" }],
    });
  } catch (err) {
    if (err.code === 4902) {              // 4902 = chain not added yet
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [TESTNET],
      });
    } else {
      throw err;
    }
  }
}
```

**Option 2 — Add it by hand.** MetaMask → Settings → Networks → Add a network manually.
Enter these values exactly, noting that **Chain ID is decimal here, not hex**:

| Field | Testnet | Mainnet |
|---|---|---|
| Network name | `Redbelly Testnet` | `Redbelly Network Mainnet` |
| New RPC URL | `https://governors.testnet.redbelly.network` | `https://governors.mainnet.redbelly.network` |
| Chain ID | `153` | `151` |
| Currency symbol | `RBNT` | `RBNT` |
| Block explorer URL | `https://redbelly.testnet.routescan.io` | `https://redbelly.routescan.io` |

**A zero balance after adding the network is expected** and does not mean the config is
wrong — a new address holds no RBNT. Fund it via the faucet ([D2](#d2)). Separately, an
address needs a network access credential before it can *send* anything ([D1](#d1)).

### Prevention

Ship the network config in your dApp instead of asking users to type it. Every value the
user would otherwise enter by hand is a value they can get wrong.

For wagmi / viem, define the chain once:

```ts
import { defineChain } from "viem";

export const redbellyTestnet = defineChain({
  id: 153,
  name: "Redbelly Testnet",
  nativeCurrency: { name: "Redbelly Network Coin", symbol: "RBNT", decimals: 18 },
  rpcUrls: { default: { http: ["https://governors.testnet.redbelly.network"] } },
  blockExplorers: {
    default: { name: "Routescan", url: "https://redbelly.testnet.routescan.io" },
  },
  testnet: true,
});
```

---

<a id="b2"></a>
## B2 — `Chain ID returned by the custom network does not match the submitted chain ID`

**Category:** Wallet · **Severity:** High

### Symptom

MetaMask refuses to add the network:

```
Chain ID returned by the custom network does not match the submitted chain ID.
```

Some wallet versions phrase it as:

```
Error: Chain ID returned by RPC URL https://... does not match 0x9a
```

### Root Cause

The wallet calls `eth_chainId` against the RPC URL you supplied and compares the answer to
the chain ID you typed. A mismatch means one of the two is wrong. In practice there are
three causes, in descending order of frequency:

1. **Chain ID `154` entered for mainnet**, taken from
   `docs.redbelly.network/pages/general/rb-env/`, against the mainnet RPC — which reports
   `0x97` (151). This is [A1](#a1) surfacing in the wallet.
2. **Hex and decimal confused.** `153` typed into a field expecting hex, or `0x99` typed
   into MetaMask's decimal Chain ID field.
3. **Testnet and mainnet values crossed** — mainnet RPC paired with `153`, or testnet RPC
   paired with `151`.

### Solution

**1. Ask the endpoint what it is,** and use that answer rather than any document:

```bash
curl -s -X POST https://governors.testnet.redbelly.network \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# {"jsonrpc":"2.0","id":1,"result":"0x99"}   -> 0x99 = 153
```

**2. Enter the value in the representation the field expects:**

| Where | Testnet | Mainnet |
|---|---|---|
| MetaMask "Chain ID" field (manual add) | `153` | `151` |
| `wallet_addEthereumChain` `chainId` param | `"0x99"` | `"0x97"` |
| Hardhat `chainId` | `153` | `151` |
| viem / wagmi `defineChain` `id` | `153` | `151` |

**3. Convert with certainty** instead of by eye:

```bash
printf '0x%x\n' 153     # 0x99
printf '0x%x\n' 151     # 0x97
python3 -c "print(int('0x99',16))"   # 153
```

### Prevention

Never type a chain ID twice. Derive the hex form from the decimal one:

```js
const CHAIN_ID = 153;
const CHAIN_ID_HEX = `0x${CHAIN_ID.toString(16)}`;  // "0x99"
```

---

<a id="b3"></a>
## B3 — Wrong block explorer URL in wallet config

**Category:** Wallet · **Severity:** Low — cosmetic, but it makes debugging much harder

### Symptom

"View on block explorer" from the wallet opens a page reading `Transaction not found`, or a
404. The transaction succeeded and is visible if you search the correct explorer by hand.

### Root Cause

Redbelly's two Routescan explorers differ by a hostname segment that is easy to drop:

```
https://redbelly.routescan.io           <- MAINNET  (chain 151)
https://redbelly.testnet.routescan.io   <- TESTNET  (chain 153)
```

A testnet network configured with the mainnet explorer sends every lookup to a chain that
has never seen the transaction. The explorer answers honestly that it does not exist, which
reads as "my transaction failed" rather than "I am looking in the wrong place".

### Solution

**1. Pair the explorer with the chain ID:**

| Chain ID | Explorer URL |
|---|---|
| `151` (mainnet) | `https://redbelly.routescan.io` |
| `153` (testnet) | `https://redbelly.testnet.routescan.io` |

**2. Confirm a transaction hash resolves before blaming the transaction.** The
Etherscan-compatible API answers without a browser:

```bash
# Testnet
curl -s "https://api.routescan.io/v2/network/testnet/evm/153/etherscan/api\
?module=transaction&action=gettxreceiptstatus&txhash=0xYOUR_TX_HASH"
```

```bash
# Mainnet
curl -s "https://api.routescan.io/v2/network/mainnet/evm/151/etherscan/api\
?module=transaction&action=gettxreceiptstatus&txhash=0xYOUR_TX_HASH"
```

`"status":"1"` in `result` means the transaction executed successfully.

**3. Correct the wallet entry:** MetaMask → Settings → Networks → select the network →
update "Block explorer URL" → Save.

### Prevention

Keep chain ID, RPC URL and explorer URL in one object so they cannot drift apart:

```js
export const CHAINS = {
  151: {
    name: "Redbelly Network Mainnet",
    rpc: "https://governors.mainnet.redbelly.network",
    explorer: "https://redbelly.routescan.io",
    api: "https://api.routescan.io/v2/network/mainnet/evm/151/etherscan",
  },
  153: {
    name: "Redbelly Testnet",
    rpc: "https://governors.testnet.redbelly.network",
    explorer: "https://redbelly.testnet.routescan.io",
    api: "https://api.routescan.io/v2/network/testnet/evm/153/etherscan",
  },
};
```

---

# C. Gas, fees and stuck transactions

<a id="c1"></a>
## C1 — Gas price looks absurd (~165,000 gwei) and the wallet shows a huge fee

**Category:** Gas · **Severity:** High — the most misdiagnosed issue on Redbelly

### Symptom

`eth_gasPrice` returns a number roughly four orders of magnitude larger than you expect:

```bash
curl -s -X POST https://governors.mainnet.redbelly.network \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}'
```

```json
{"jsonrpc":"2.0","id":1,"result":"0x962477744fe0"}
```

That is `165,083,367,100,384` wei — about **165,083 gwei**. MetaMask displays a fee that
looks like a misconfiguration, and code with a sanity check rejects it:

```
Error: gas price too high
```
```
Error: max fee per gas less than block base fee
```

### Root Cause

**This is correct behaviour, not a bug.** Redbelly fixes gas prices in **US dollar** terms
rather than in gwei. From the network fees documentation:

> "The gas model ensures that a simple native transaction on Redbelly costs US$0.01. A
> simple native transaction on Redbelly costs 21000 gas, thus fixing the unit gas price at
> US$0.000000476190476190."

An on-chain price oracle feeds a USD/RBNT rate to the nodes, which deduct the RBNT needed to
meet the gas cost *in dollars* at execution time. The consequence is the opposite of every
other EVM chain: **the dollar cost is constant and the gwei number floats.** As the RBNT
price falls, the gwei figure rises to keep the dollar cost pegged.

The measured value above is internally consistent with the documented model:

```
21,000 gas x 165,083,367,100,384 wei  =  3.4668 RBNT per simple transfer
US$0.01 / 3.4668 RBNT                 =  US$0.00288 per RBNT
```

So a 165,000 gwei gas price and a one-cent transaction are the same statement.

Redbelly's own documentation flags the tooling consequence directly:

> "for most wallets, gas related information may not be handled accurately since they have
> not been configured to account for Redbelly's fixed unit gas cost in US dollar terms."

### Solution

**Do not hardcode a gas price, and do not cap it.** Read it from the chain every time:

```js
// ethers v6 — correct on Redbelly
const feeData = await provider.getFeeData();
const tx = await contract.someMethod(args, {
  gasPrice: feeData.gasPrice,   // whatever the oracle currently says
});
```

**Remove any of these patterns from your code:**

```js
// ❌ orders of magnitude too low on Redbelly — transaction never mines
{ gasPrice: ethers.parseUnits("20", "gwei") }

// ❌ a cap that Redbelly's real price exceeds by ~4 orders of magnitude
{ maxFeePerGas: ethers.parseUnits("100", "gwei") }

// ❌ sanity check calibrated for Ethereum
if (gasPrice > 500_000_000_000n) throw new Error("gas price too high");
```

**In Hardhat, leave `gasPrice` unset** so it is fetched per transaction. Setting
`gasPrice: "auto"` or omitting the field both work; a numeric literal does not:

```ts
networks: {
  redbellyTestnet: {
    type: "http",
    chainType: "l1",
    url: "https://governors.testnet.redbelly.network",
    chainId: 153,
    accounts: [configVariable("REDBELLY_PRIVATE_KEY")],
    // no gasPrice key — Hardhat calls eth_gasPrice per transaction
  },
}
```

**Budget in dollars, not in gwei.** The documented unit price is `US$0.000000476190476190`
per gas, so:

```
estimated cost (USD) = gasUsed x 0.000000476190476190
```

A 1,200,000-gas deployment costs about **US$0.57**, regardless of what the gwei figure looks
like on the day.

**To see the live RBNT price the network is using**, read the price feed oracle through the
bootstrap registry — the address is the same on both networks:

```
Bootstrap registry: 0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5
```

### Prevention

Assert on the *dollar* cost in tests, not the gwei price:

```js
const GAS_UNIT_PRICE_USD = 0.000000476190476190;   // published, fixed
const estimated = await contract.someMethod.estimateGas(args);
const usd = Number(estimated) * GAS_UNIT_PRICE_USD;
if (usd > 1.00) throw new Error(`Call would cost $${usd.toFixed(2)}`);
```

That assertion stays valid as the RBNT price moves. A gwei-denominated one does not.

---

<a id="c2"></a>
## C2 — Transaction stuck pending forever / `replacement transaction underpriced`

**Category:** Gas · **Severity:** High

### Symptom

A transaction is accepted by the node, returns a hash, and never mines. Later attempts to
replace it fail:

```
Error: replacement transaction underpriced
```
```
Error: transaction underpriced
```

Every subsequent transaction from the same address also stays pending, because they queue
behind the stuck nonce.

### Root Cause

Almost always an underpriced first transaction — a hardcoded gwei gas price left over from
another chain, which on Redbelly is far below what the oracle currently requires
([C1](#c1)). The node accepts it into the pool but it is never economically viable to
include.

Replacement then fails because a replacement must **exceed** the original's gas price by a
margin, and a replacement built from the same hardcoded constant does not.

### Solution

**1. Find the stuck nonce** — the gap between `latest` (mined) and `pending` (accepted):

```bash
ADDR=0xYOUR_ADDRESS
RPC=https://governors.testnet.redbelly.network

echo -n "latest:  "; curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getTransactionCount\",\"params\":[\"$ADDR\",\"latest\"],\"id\":1}"
echo -n "pending: "; curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getTransactionCount\",\"params\":[\"$ADDR\",\"pending\"],\"id\":1}"
```

If `pending` is higher than `latest`, the first stuck nonce is the `latest` value.

**2. Replace it with a zero-value self-transfer at a raised gas price.** This clears the
nonce without moving funds anywhere:

```js
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(
  "https://governors.testnet.redbelly.network",
  { chainId: 153, name: "redbelly-testnet" },
  { staticNetwork: true }
);
const wallet = new ethers.Wallet(process.env.REDBELLY_PRIVATE_KEY, provider);

const stuckNonce = await provider.getTransactionCount(wallet.address, "latest");
const current = (await provider.getFeeData()).gasPrice;
const bumped = (current * 130n) / 100n;   // +30% over the live oracle price

const tx = await wallet.sendTransaction({
  to: wallet.address,
  value: 0,
  nonce: stuckNonce,
  gasPrice: bumped,
  gasLimit: 21000,
});
console.log("replacement sent:", tx.hash);
await tx.wait();
console.log("nonce cleared");
```

The bump is applied to the **live** price from `getFeeData()`, not to the price of the stuck
transaction — that is the part that fixes `replacement transaction underpriced`.

**3. If several nonces are stuck**, repeat from the lowest and work upward. Nonces clear in
order; a gap blocks everything behind it.

### Prevention

Remove every hardcoded `gasPrice` and `maxFeePerGas` from the codebase ([C1](#c1)) — that
single change prevents the great majority of stuck transactions on Redbelly.

Add a timeout so a stuck transaction announces itself instead of hanging:

```js
const tx = await contract.someMethod(args);
const receipt = await Promise.race([
  tx.wait(),
  new Promise((_, rej) =>
    setTimeout(() => rej(new Error(`Tx ${tx.hash} pending >120s — likely underpriced`)), 120_000)
  ),
]);
```

---

<a id="c3"></a>
## C3 — Gas estimation returns `null` or reverts during estimation

**Category:** Gas · **Severity:** High

### Symptom

```
Error: cannot estimate gas; transaction may fail or may require manual gas limit
```
```
UNPREDICTABLE_GAS_LIMIT
```
```
execution reverted (no reason string)
```

Or `estimateGas` resolves to `null`, and passing that value onward throws a type error.

### Root Cause

`eth_estimateGas` executes the transaction against current state without committing it. A
`null` or reverting estimate means **the call would fail if sent** — the estimator is
reporting a real problem, not failing at its job. On Redbelly there are four causes, and the
first is specific to this chain:

1. **The sender has no network access credential.** Redbelly is permissioned; a
   non-enabled address cannot write. Estimation reverts with no reason string. See
   [D1](#d1) — this is the cause that has no equivalent on other EVM chains, and it is the
   one people rule out last.
2. **The sender cannot cover `gas x price + value`.** At ~165,000 gwei ([C1](#c1)), an
   RBNT balance that looks generous by Ethereum intuition may not be. See [E2](#e2).
3. **The contract call genuinely reverts** — failed `require`, wrong arguments, wrong
   contract address.
4. **`from` is missing.** Without it the node estimates from the zero address, which holds
   no balance and no permission, so the estimate fails for reasons unrelated to your code.

### Solution

**1. Always send `from`.** This alone resolves a large share of `null` estimates:

```js
const gas = await contract.someMethod.estimateGas(args, { from: wallet.address });
```

Raw JSON-RPC equivalent:

```bash
curl -s -X POST https://governors.testnet.redbelly.network \
  -H 'Content-Type: application/json' \
  --data '{
    "jsonrpc":"2.0","method":"eth_estimateGas",
    "params":[{"from":"0xYOUR_ADDRESS","to":"0xCONTRACT","data":"0xENCODED_CALLDATA"}],
    "id":1
  }'
```

**2. Get the revert reason** by replaying the same call with `eth_call`, which returns the
reason string that `eth_estimateGas` swallows:

```bash
curl -s -X POST https://governors.testnet.redbelly.network \
  -H 'Content-Type: application/json' \
  --data '{
    "jsonrpc":"2.0","method":"eth_call",
    "params":[{"from":"0xYOUR_ADDRESS","to":"0xCONTRACT","data":"0xENCODED_CALLDATA"},"latest"],
    "id":1
  }'
```

In ethers, the same information arrives as structured fields:

```js
try {
  await contract.someMethod.staticCall(args, { from: wallet.address });
} catch (err) {
  console.log("reason:", err.reason);      // require() message, if any
  console.log("data:  ", err.data);        // raw revert data
}
```

**3. Rule out the three chain-level preconditions in order**, before debugging contract
logic:

```bash
ADDR=0xYOUR_ADDRESS
RPC=https://governors.testnet.redbelly.network

# a. Does the address hold RBNT?
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$ADDR\",\"latest\"],\"id\":1}"

# b. Does a plain self-transfer estimate? If this fails, the problem is the
#    address (permission or balance), not the contract.
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_estimateGas\",\"params\":[{\"from\":\"$ADDR\",\"to\":\"$ADDR\",\"value\":\"0x0\"}],\"id\":1}"

# c. Is there code at the target address? "0x" means nothing is deployed there.
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"0xCONTRACT\",\"latest\"],\"id\":1}"
```

Step (b) is the discriminator. If a zero-value self-transfer will not estimate, no contract
call from that address will either, and the fix is [D1](#d1) or [D2](#d2).

**4. Set a manual gas limit only after the cause is known.** Overriding the limit on a
transaction that genuinely reverts converts a free failed estimate into a paid failed
transaction:

```js
const tx = await contract.someMethod(args, { gasLimit: 500_000 });
```

### Prevention

Keep a preflight that runs before any write path and fails with a specific message:

```js
async function preflight(provider, address) {
  const balance = await provider.getBalance(address);
  if (balance === 0n) throw new Error(`${address} holds no RBNT — fund via the faucet`);

  try {
    await provider.estimateGas({ from: address, to: address, value: 0n });
  } catch {
    throw new Error(
      `${address} cannot transact — most likely no network access credential. ` +
      `Enable it at https://access.redbelly.network`
    );
  }
}
```

---

<a id="c4"></a>
## C4 — `nonce too low` / `nonce has already been used`

**Category:** Gas · **Severity:** Medium

### Symptom

```
Error: nonce too low
```
```
Error: nonce has already been used
```
```
ProviderError: invalid nonce; got 7, expected 9
```

Common when re-running a deployment script, or after a wallet has been used from two tools
at once.

### Root Cause

The nonce you sent is at or below the account's confirmed transaction count — that nonce is
already spent. Three usual causes:

1. **A cached nonce.** A long-lived signer computed the nonce once and reused it after
   other transactions confirmed.
2. **`latest` versus `pending` confusion.** `latest` counts mined transactions only. With
   transactions in flight, building from `latest` reuses a nonce that is already claimed in
   the pool.
3. **Two clients, one key** — MetaMask and a Hardhat script both signing from the same
   address, each unaware of the other's transactions.

### Solution

**1. Read both counts and compare:**

```bash
ADDR=0xYOUR_ADDRESS
RPC=https://governors.testnet.redbelly.network

for TAG in latest pending; do
  echo -n "$TAG: "
  curl -s -X POST $RPC -H 'Content-Type: application/json' \
    --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getTransactionCount\",\"params\":[\"$ADDR\",\"$TAG\"],\"id\":1}"
  echo
done
```

- Equal → nothing in flight; send with the `pending` value.
- `pending` > `latest` → transactions are queued; sending at `latest` triggers this error.
  Either use `pending`, or clear the queue first ([C2](#c2)).

**2. Let the library manage the nonce.** Omitting `nonce` makes ethers fetch `pending`
before each send, which is correct for sequential scripts:

```js
// ✅ no explicit nonce
const tx = await wallet.sendTransaction({ to, value });
await tx.wait();
```

**3. For a batch from one address, assign nonces explicitly from a single base** so they do
not collide:

```js
let nonce = await provider.getTransactionCount(wallet.address, "pending");
const sent = [];
for (const call of calls) {
  sent.push(await wallet.sendTransaction({ ...call, nonce: nonce++ }));
}
await Promise.all(sent.map((t) => t.wait()));
```

**4. Reset MetaMask's cached nonce** if the wallet is the one out of step:
Settings → Advanced → **Clear activity tab data**. This clears MetaMask's local transaction
history and nonce cache. It does not touch on-chain state, funds or keys.

### Prevention

Use a dedicated deployment key that no wallet has imported. Nonce collisions overwhelmingly
come from one key being driven by two tools at once.

In scripts, `await tx.wait()` before sending the next transaction. Fire-and-forget sends
from a loop race each other for nonces.

---

# D. Network access and permissioning

> This category has no equivalent on Ethereum, Polygon, Arbitrum or any other permissionless
> EVM chain. If you are debugging a transaction that fails for no visible reason, read
> [D1](#d1) before anything else.

<a id="d1"></a>
## D1 — Transactions revert because the address has no network access credential

**Category:** Permissioning · **Severity:** Critical — and almost always diagnosed last

### Symptom

Everything looks correct and nothing works. The address holds RBNT. The contract is
deployed. The ABI matches. And yet:

```
Error: cannot estimate gas; transaction may fail or may require manual gas limit
```
```
execution reverted
```
```
Error: transaction execution reverted (no reason string)
```

The tell is that **even a zero-value transfer to yourself fails**. That rules out your
contract entirely — the address itself cannot write to the chain.

### Root Cause

**Redbelly is a permissioned network.** Holding RBNT is not sufficient to transact. From the
Vine portal:

> "Before being granted access to Redbelly Network, each user must claim their access
> credential from a network accredited issuer before they self enable their account with
> write access to the network through a specific network smart contract."

> **Scope note.** A Redbelly team member stated in the project Discord on 5 August 2026 that
> building on Redbelly is permissionless. That is not necessarily a contradiction — deploying
> and interacting as a *developer* may sit under a different access path than end-user
> onboarding, and the two statements may be answering different questions. This entry
> reflects the documented credential requirement above. The harness probes an un-onboarded
> address directly (checks `D1.1`, `D1.3`); if that address transacts successfully, this entry
> is wrong and will be rewritten. Until that run happens, treat the symptom checklist as the
> reliable part and the scope of the requirement as open.

Write access is gated on-chain. An address that has not completed that flow can read state
all day and cannot send a transaction. Because the gate is enforced at execution, the
failure surfaces as a bare revert with no reason string — indistinguishable, at a glance,
from a failed `require` in your own contract.

This is confirmed by the Eligibility SDK's public API, which ships a hook for exactly this
question:

```jsx
import { useHasChainPermission } from "@redbellynetwork/eligibility-sdk";

const { data, error, isLoading } = useHasChainPermission(userAddress);
// data === true  -> address may transact
// data === false -> address is not enabled
```

A dedicated hook exists because unpermissioned addresses are a routine, expected state on
this network — not an edge case.

Getting the credential requires proving a valid photo identity document, verified by
biometric check, through a network-accredited issuer. It is a real identity process, not a
checkbox, so it cannot be completed inside a script or a CI job.

### Solution

**1. Establish whether the address is the problem.** Run this before debugging anything
else:

```bash
ADDR=0xYOUR_ADDRESS
RPC=https://governors.testnet.redbelly.network

curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_estimateGas\",\"params\":[{\"from\":\"$ADDR\",\"to\":\"$ADDR\",\"value\":\"0x0\"}],\"id\":1}"
```

- Returns a gas quantity (e.g. `{"result":"0x5208"}`) → the address can write. The problem is
  in your contract or arguments; go to [C3](#c3).
- Returns an error → the address cannot write. Continue below.

**2. Confirm the balance is not the cause**, so you are not chasing the wrong one of two
possible reasons:

```bash
curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$ADDR\",\"latest\"],\"id\":1}"
```

A non-zero result with a failing estimate points at permissioning.

**3. Claim the credential and enable the account.** Go to
**<https://access.redbelly.network>**, connect the wallet holding that address, and complete
the prompts. The flow issues the access credential and then submits the on-chain
transaction that enables write access for the address.

**4. Re-run step 1.** A gas quantity where there was previously an error confirms the
address is enabled.

### Prevention

**Onboard the address before writing any code against it.** Network access is a
prerequisite, in the same category as having a funded account — not something to discover
midway through debugging.

**Detect the state in your dApp and tell the user**, rather than letting a transaction fail
in front of them:

```jsx
import { useHasChainPermission } from "@redbellynetwork/eligibility-sdk";

function TransactButton({ address }) {
  const { data: hasPermission, isLoading } = useHasChainPermission(address);

  if (isLoading) return <button disabled>Checking access…</button>;
  if (!hasPermission) {
    return (
      <a href="https://access.redbelly.network" target="_blank" rel="noreferrer">
        Enable your account on Redbelly to continue
      </a>
    );
  }
  return <button onClick={submit}>Submit</button>;
}
```

**Without the SDK**, the same preflight in plain ethers:

```js
async function assertCanTransact(provider, address) {
  try {
    await provider.estimateGas({ from: address, to: address, value: 0n });
  } catch {
    throw new Error(
      `${address} cannot transact on Redbelly. Claim network access at ` +
      `https://access.redbelly.network, then retry.`
    );
  }
}
```

**Every address you use needs its own credential** — deployer keys, CI keys, relayer keys and
test accounts included. There is no way to delegate write access from one enabled address to
an arbitrary un-enabled one. *(Verified businesses are the exception: a Business Identifier
contract can authorise external wallets to act on the company's behalf without each one
completing KYB separately.)*

---

<a id="d2"></a>
## D2 — Testnet faucet does not distribute RBNT

**Category:** Faucet · **Severity:** High — blocks all testnet work

### Symptom

The faucet does not pay out. Symptoms vary: the request button does nothing, the claim
appears to succeed but the balance stays `0x0`, or the site refuses to let you request at
all.

### Root Cause

Four distinct causes, and the error surface does not reliably distinguish them:

1. **No Discord account linked.** The faucet is **FAUCETME**, and Redbelly's documentation
   states you "join with your Discord account". Discord authentication is the gate, not an
   optional convenience.
2. **Wrong network selected.** FAUCETME serves multiple networks. A DevNet selection is
   dead ([A3](#a3)); the target is Testnet.
3. **Cooldown.** Faucets rate-limit per account and per address. A repeat request inside
   the window is refused, sometimes silently.
4. **Balance checked on the wrong chain.** A funded testnet address shows zero when queried
   against mainnet — a common consequence of [B3](#b3).

Separately: Redbelly's docs note that a nominal amount of RBNT is granted automatically
**when you receive access to testing environments** — so completing network access
([D1](#d1)) may fund the address without the faucet at all.

### Solution

**1. Request from the faucet:**

- Go to **<https://redbelly.faucetme.pro>**
- Authenticate with Discord when prompted
- Select **Redbelly Testnet** — not DevNet
- Paste the address and submit

**2. Confirm the balance against the testnet RPC specifically**, rather than trusting a
wallet UI that may be pointed elsewhere:

```bash
curl -s -X POST https://governors.testnet.redbelly.network \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xYOUR_ADDRESS","latest"],"id":1}'
```

Anything other than `"0x0"` means funds arrived. Convert to RBNT:

```bash
python3 -c "print(int('0xPASTE_RESULT_HERE', 16) / 1e18, 'RBNT')"
```

**3. If the balance is zero**, work through the causes in order:

| Check | Command or action |
|---|---|
| Discord linked? | Re-authenticate at <https://redbelly.faucetme.pro> |
| Right network? | Re-select Redbelly Testnet, not DevNet |
| Cooldown? | Wait and retry; faucets rate-limit per account |
| Address enabled? | Complete <https://access.redbelly.network> — this also grants a nominal starting balance |
| Right chain queried? | The command above targets `governors.testnet` — confirm you are not querying mainnet |

**4. Work out how much you actually need.** Redbelly's gas is priced in USD
([C1](#c1)), so budget by the published unit price rather than by RBNT intuition:

```
cost in USD = gas units x 0.000000476190476190
```

A simple transfer is US$0.01. A typical contract deployment at ~1.2M gas is about US$0.57.
Faucet-scale amounts go a long way; a zero balance is far more often a delivery problem than
an insufficiency problem.

### Prevention

Fund and enable the deployment address once, at project setup, and keep the key stable.
Rotating keys means repeating both the faucet request and the network access flow.

Add a balance assertion to your deploy script so a drained account fails with a clear message
instead of an opaque `insufficient funds` further in:

```js
const balance = await provider.getBalance(deployer.address);
if (balance === 0n) {
  throw new Error(
    `${deployer.address} has no RBNT. Fund at https://redbelly.faucetme.pro`
  );
}
```

---

# E. Contract deployment and compilation

<a id="e1"></a>
## E1 — Contract compiles but misbehaves or fails to deploy: EVM version mismatch

**Category:** Deployment · **Severity:** Critical · **Affects every project started today**

### Symptom

The contract compiles without complaint locally and passes its tests against the in-process
Hardhat network, then on Redbelly:

- deployment reverts with no reason;
- the contract deploys but a function reverts on a code path that works locally;
- `eth_estimateGas` fails on a call your tests cover.

Nothing points at the compiler, because the compiler was happy.

### Root Cause

**Redbelly's EVM implements the `prague` revision. Modern Solidity does not target `prague`
by default.**

Redbelly's EVM compatibility page pins two values:

| Setting | Redbelly |
|---|---|
| EVM version | `Prague` |
| Solidity version | `v0.8.30` |

And Solidity's own default EVM target has moved twice since:

| Solidity release | Date | Default EVM version |
|---|---|---|
| 0.8.28 | Oct 2024 | `cancun` |
| **0.8.30** | May 2025 | **`prague`** ← matches Redbelly |
| **0.8.31** | Dec 2025 | **`osaka`** ← newer than Redbelly |
| 0.8.36 | Jul 2026 | `osaka` (adds `amsterdam` support) |

So a project started today, on a current toolchain, **compiles for `osaka` by default**,
targeting an EVM revision newer than the chain implements. Bytecode that assumes opcodes or
semantics the network does not provide fails at deployment or at the first call that reaches
the affected code path — and it fails on-chain, not at compile time, which is why it presents
as a contract bug.

There is a second, quieter version of the same problem. `npx hardhat --init` scaffolds a
project pinned to **Solidity 0.8.28**, whose default target is `cancun`. Cancun is *older*
than Prague, so it runs — but you silently lose access to everything Prague added, and your
build no longer matches the version Redbelly documents.

Neither default is correct for Redbelly. Only an explicit setting is.

### Solution

**Pin both the compiler version and the EVM version. Never rely on the default.**

Hardhat 3:

```ts
// hardhat.config.ts
import { defineConfig } from "hardhat/config";

export default defineConfig({
  solidity: {
    profiles: {
      default: {
        version: "0.8.30",
        settings: {
          evmVersion: "prague",           // must match Redbelly's EVM
          optimizer: { enabled: true, runs: 200 },
        },
      },
    },
  },
});
```

Hardhat 2:

```js
// hardhat.config.js
module.exports = {
  solidity: {
    version: "0.8.30",
    settings: {
      evmVersion: "prague",
      optimizer: { enabled: true, runs: 200 },
    },
  },
};
```

Foundry:

```toml
# foundry.toml
[profile.default]
solc_version = "0.8.30"
evm_version = "prague"
optimizer = true
optimizer_runs = 200
```

Pin the pragma in the contract too, so the file cannot be built by a different compiler:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;   // exact, not ^0.8.30
```

**Confirm what you actually built.** The compiler records its settings in the build output:

```bash
# Hardhat 3
npx hardhat compile --force
grep -r '"evmVersion"' artifacts/build-info/*.json | head -1
# expect: "evmVersion": "prague"
```

```bash
# Foundry
forge build --force
jq '.metadata.settings.evmVersion' out/YourContract.sol/YourContract.json
# expect: "prague"
```

If that prints `osaka` or `cancun`, the setting has not taken effect — most often because a
second `solidity` block elsewhere in the config is overriding it.

### Prevention

Treat `evmVersion` as a required field in any Redbelly project, in the same way as the chain
ID. Leaving it unset means the target moves whenever the compiler is upgraded, and it moves
without warning.

Add a build assertion so a toolchain upgrade cannot silently retarget your contracts:

```bash
# scripts/assert-evm-version.sh
set -e
FOUND=$(grep -ho '"evmVersion": *"[a-z]*"' artifacts/build-info/*.json | head -1 | grep -o '[a-z]*"$' | tr -d '"')
if [ "$FOUND" != "prague" ]; then
  echo "ERROR: compiled for evmVersion=$FOUND, Redbelly requires prague" >&2
  exit 1
fi
echo "OK: evmVersion=prague"
```

Re-read <https://vine.redbelly.network/consensus/evm-compatibility/> when upgrading the
compiler. Redbelly will move to newer EVM revisions over time, and the correct value is
whatever that page says — not whatever the compiler defaults to.

---

<a id="e2"></a>
## E2 — Hardhat deployment fails with `insufficient funds for gas * price + value`

**Category:** Deployment · **Severity:** High

### Symptom

```
Error: insufficient funds for intrinsic transaction cost
```
```
ProviderError: insufficient funds for gas * price + value
```

Often surprising, because the balance looks healthy by the standards of other chains.

### Root Cause

The account cannot cover `gasLimit x gasPrice + value`. On Redbelly the `gasPrice` term is
the one that catches people: `eth_gasPrice` returns roughly **165,000 gwei** ([C1](#c1)),
so an RBNT balance that would fund hundreds of Ethereum transactions may fund very few here
— in RBNT terms. In dollar terms it is cheap; the two intuitions disagree, and RBNT is what
the balance check uses.

Two other causes present identically:

- **Deploying from the wrong account.** Hardhat uses the first entry in `accounts`, which is
  not necessarily the address you funded.
- **The address was never funded on this network.** A balance on testnet is not a balance on
  mainnet, and vice versa.

### Solution

**1. Read the actual numbers rather than estimating them:**

```bash
ADDR=0xYOUR_DEPLOYER
RPC=https://governors.testnet.redbelly.network

echo -n "balance:  "; curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$ADDR\",\"latest\"],\"id\":1}"
echo; echo -n "gasPrice: "; curl -s -X POST $RPC -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}'
echo
```

**2. Compute what the deployment needs**, in RBNT and in USD:

```js
// scripts/estimate-deploy.mjs
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(
  "https://governors.testnet.redbelly.network",
  { chainId: 153, name: "redbelly-testnet" },
  { staticNetwork: true }
);

const address  = process.env.DEPLOYER_ADDRESS;
const gasPrice = (await provider.getFeeData()).gasPrice;
const balance  = await provider.getBalance(address);
const gasLimit = 1_500_000n;                    // replace with your estimate

const needed = gasLimit * gasPrice;
console.log("balance :", ethers.formatEther(balance), "RBNT");
console.log("needed  :", ethers.formatEther(needed), "RBNT");
console.log("in USD  :", (Number(gasLimit) * 0.000000476190476190).toFixed(4));
console.log(needed > balance ? "SHORTFALL" : "sufficient");
```

**3. Confirm Hardhat is using the account you funded:**

```bash
npx hardhat console --network redbellyTestnet
```
```js
const [signer] = await ethers.getSigners();
console.log(signer.address);
console.log(ethers.formatEther(await signer.provider.getBalance(signer.address)));
```

If that address is not the one you funded, the key in `REDBELLY_PRIVATE_KEY` is not the one
you think it is.

**4. Top up** at <https://redbelly.faucetme.pro> ([D2](#d2)).

**5. If the balance is genuinely sufficient and it still fails**, the error is misleading and
the real cause is permissioning — [D1](#d1). A zero-value self-transfer distinguishes them in
one call.

### Prevention

Fail early, with a message that names the shortfall:

```js
const gasPrice = (await provider.getFeeData()).gasPrice;
const estimated = await deployTx.estimateGas();
const needed = (estimated * gasPrice * 120n) / 100n;   // 20% headroom
const balance = await provider.getBalance(deployer.address);

if (balance < needed) {
  throw new Error(
    `Deployer ${deployer.address} needs ${ethers.formatEther(needed)} RBNT, ` +
    `has ${ethers.formatEther(balance)}. Fund at https://redbelly.faucetme.pro`
  );
}
```

Budget in dollars. Gas costs the same USD amount regardless of what the RBNT figure does,
which makes the dollar number the stable one to plan against.

---

<a id="e3"></a>
## E3 — No official Hardhat config exists for Redbelly

**Category:** Deployment · **Severity:** Medium — a documentation gap, not a bug

### Symptom

Redbelly's developer portal recommends Hardhat, then links to hardhat.org without giving any
Redbelly-specific settings. There is no network block, no chain ID, no RPC URL, and no
verification configuration anywhere in the official documentation. Everyone writes their own
and gets a slightly different one.

The deployment page compounds it by recommending **Remix** as the primary tool, which is
workable for a single contract and does not scale to a project with tests and CI.

Redbelly's testing page recommends **Waffle**. `ethereum-waffle` last published version
4.0.10 on **15 February 2023** — over three years ago. It is not the current recommendation
for new Hardhat projects.

### Root Cause

Redbelly's smart-contract documentation is written as a tour of the ecosystem rather than as
a setup guide. Each page names a tool and links to that tool's own site: Hardhat for the
development environment, Waffle for testing, Remix for deployment. None of them carries the
Redbelly-specific values those tools need — network name, chain ID, RPC URL, explorer API —
because those live on a separate page (`/environments/`) that the tooling pages do not
reproduce.

The result is that every developer assembles the config themselves from two or three pages,
and each one makes an independent decision about the settings the documentation never
mentions at all: `evmVersion` ([E1](#e1)), the `chainDescriptors` block needed for
verification ([F1](#f1)), and whether to set a `gasPrice` ([C1](#c1)). Those three are
exactly the settings that are wrong by default on this chain, so the gap is not merely
inconvenient — it reliably produces broken projects.

The tool recommendations have also aged at different rates. Hardhat has since released a
major version with a different config format, and Waffle has not published since February
2023, so following the pages literally produces a stack that does not match either the
current tooling or the current chain.

### Solution

Use this configuration. Every value in it is traced to a live source in
[`sources.md`](../evidence/sources.md), and the harness that ships with this wiki re-checks
each one against the chain when run.

**Hardhat 3** (`npm install --save-dev hardhat` gives you 3.x):

```ts
// hardhat.config.ts
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatEthers, hardhatVerify],

  solidity: {
    profiles: {
      default: {
        version: "0.8.30",
        settings: {
          evmVersion: "prague",                 // see E1
          optimizer: { enabled: true, runs: 200 },
        },
      },
    },
  },

  // Hardhat 3 replaced hardhat-verify's `customChains` with `chainDescriptors`. See F1.
  chainDescriptors: {
    151: {
      name: "Redbelly Network Mainnet",
      blockExplorers: {
        etherscan: {
          name: "Routescan",
          url: "https://redbelly.routescan.io",
          apiUrl: "https://api.routescan.io/v2/network/mainnet/evm/151/etherscan",
        },
      },
    },
    153: {
      name: "Redbelly Testnet",
      blockExplorers: {
        etherscan: {
          name: "Routescan",
          url: "https://redbelly.testnet.routescan.io",
          apiUrl: "https://api.routescan.io/v2/network/testnet/evm/153/etherscan",
        },
      },
    },
  },

  verify: {
    etherscan: { apiKey: "routescan" },         // placeholder; Routescan needs no key
  },

  networks: {
    redbellyTestnet: {
      type: "http",
      chainType: "l1",
      url: "https://governors.testnet.redbelly.network",
      chainId: 153,
      accounts: [configVariable("REDBELLY_PRIVATE_KEY")],
      // no gasPrice — Redbelly's is USD-pegged and must be read per transaction. See C1.
    },
    redbellyMainnet: {
      type: "http",
      chainType: "l1",
      url: "https://governors.mainnet.redbelly.network",
      chainId: 151,
      accounts: [configVariable("REDBELLY_PRIVATE_KEY")],
    },
  },
});
```

**Hardhat 2** (`npm install --save-dev hardhat@hh2`):

```js
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.30",
    settings: { evmVersion: "prague", optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    redbellyTestnet: {
      url: "https://governors.testnet.redbelly.network",
      chainId: 153,
      accounts: [process.env.REDBELLY_PRIVATE_KEY],
    },
    redbellyMainnet: {
      url: "https://governors.mainnet.redbelly.network",
      chainId: 151,
      accounts: [process.env.REDBELLY_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: { redbellyTestnet: "routescan", redbellyMainnet: "routescan" },
    customChains: [
      {
        network: "redbellyTestnet",
        chainId: 153,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/testnet/evm/153/etherscan/api",
          browserURL: "https://redbelly.testnet.routescan.io",
        },
      },
      {
        network: "redbellyMainnet",
        chainId: 151,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/mainnet/evm/151/etherscan/api",
          browserURL: "https://redbelly.routescan.io",
        },
      },
    ],
  },
};
```

**Supplying the key.** Hardhat 3's `configVariable` reads from the encrypted keystore or the
environment:

```bash
npx hardhat keystore set REDBELLY_PRIVATE_KEY     # stored encrypted, preferred
# or
export REDBELLY_PRIVATE_KEY=0xyourkey             # process env
```

**Deploy and confirm:**

```bash
npx hardhat compile
npx hardhat run scripts/deploy.ts --network redbellyTestnet
```

### Prevention

Keep chain ID, RPC URL, explorer URL and explorer API URL in the config rather than scattered
across scripts. Redbelly's two documentation sites disagree on some of these values
([A1](#a1)), so a single definition per project means one place to correct if a value moves.

---

# F. Explorer and contract verification

<a id="f1"></a>
## F1 — `The network "..." with chain id "153" is not supported`

**Category:** Verification · **Severity:** High

### Symptom

```
Error HHE80000: The network "redbellyTestnet" with chain id "153" is not supported.
```
```
No Etherscan block explorer is configured for the 153 chain in the chain descriptors.
```

Hardhat 2 produces the equivalent:

```
Error HH303: Unrecognized task verify
```
```
The chain id 153 is not supported. To see the list of supported chains, run npx hardhat verify --list-networks
```

### Root Cause

`hardhat-verify` resolves an explorer API URL from Etherscan's multichain chain list, then
falls back to whatever the config supplies. **Redbelly is not on Etherscan's list** — chains
151 and 153 do not appear in `https://api.etherscan.io/v2/chainlist` — so unless you supply
the explorer yourself, the plugin has nowhere to send the verification request.

Redbelly's explorer is **Routescan**, which exposes an Etherscan-compatible API at a
different base URL. Supplying that URL is all that is required; Routescan accepts
verification without an API key.

The second trap is version-specific: **Hardhat 3 removed `customChains`.** A config carried
over from Hardhat 2 has an `etherscan.customChains` array that Hardhat 3 ignores entirely,
so the error persists and appears not to respond to the fix. Hardhat 3's replacement is a
top-level `chainDescriptors` map.

### Solution

**Hardhat 3 — add `chainDescriptors`:**

```ts
export default defineConfig({
  plugins: [hardhatEthers, hardhatVerify],

  chainDescriptors: {
    153: {
      name: "Redbelly Testnet",
      blockExplorers: {
        etherscan: {
          name: "Routescan",
          url: "https://redbelly.testnet.routescan.io",
          apiUrl: "https://api.routescan.io/v2/network/testnet/evm/153/etherscan",
        },
      },
    },
    151: {
      name: "Redbelly Network Mainnet",
      blockExplorers: {
        etherscan: {
          name: "Routescan",
          url: "https://redbelly.routescan.io",
          apiUrl: "https://api.routescan.io/v2/network/mainnet/evm/151/etherscan",
        },
      },
    },
  },

  verify: { etherscan: { apiKey: "routescan" } },
});
```

The `apiKey` looks redundant because Routescan does not require one — but `hardhat-verify`
raises `The Etherscan API key is empty.` if the field is missing or blank, so a placeholder
string is required.

**Hardhat 2 — use `customChains`** (see the full block in [E3](#e3)). Note that the Hardhat 2
`apiURL` ends in `/api` and the Hardhat 3 `apiUrl` does not — the plugin appends it in v3:

```js
apiURL: "https://api.routescan.io/v2/network/testnet/evm/153/etherscan/api"   // HH2
apiUrl: "https://api.routescan.io/v2/network/testnet/evm/153/etherscan"       // HH3
```

**Then verify:**

```bash
npx hardhat verify --network redbellyTestnet 0xYOUR_CONTRACT "constructor arg"
```

**Confirm the API endpoint is reachable before blaming your config:**

```bash
curl -s "https://api.routescan.io/v2/network/testnet/evm/153/etherscan/api?module=contract&action=checkverifystatus&guid=probe"
# {"status":"0","message":"NOTOK","result":"Verification not found"}
```

That response is the *good* outcome — an Etherscan-format reply proves the endpoint is live
and speaking the right protocol.

**If `hardhat verify` remains awkward, verify over the API directly.** Routescan accepts the
standard Etherscan `verifysourcecode` call:

```bash
curl -X POST "https://api.routescan.io/v2/network/testnet/evm/153/etherscan/api" \
  -d "module=contract" \
  -d "action=verifysourcecode" \
  -d "contractaddress=0xYOUR_CONTRACT" \
  -d "sourceCode=$(cat artifacts/build-info/*.json | jq -c '.input')" \
  -d "codeformat=solidity-standard-json-input" \
  -d "contractname=contracts/YourContract.sol:YourContract" \
  -d "compilerversion=v0.8.30+commit.73712a01" \
  -d "constructorArguements=YOUR_ABI_ENCODED_ARGS"
```

Poll the returned GUID:

```bash
curl -s "https://api.routescan.io/v2/network/testnet/evm/153/etherscan/api?module=contract&action=checkverifystatus&guid=YOUR_GUID"
```

### Prevention

Put both chain descriptors in the config at project setup, before the first deployment.
Verification is far more painful to retrofit once you have contracts deployed and have moved
on from the exact compiler settings that produced them.

---

<a id="f2"></a>
## F2 — Verification submitted but the contract shows no source

**Category:** Verification · **Severity:** Medium

### Symptom

```
Fail - Unable to verify
```
```
Error! Unable to locate ContractCode at 0x...
```

Or verification reports success and the explorer's Contract tab still shows only bytecode.

### Root Cause

Verification recompiles your source and compares the result byte-for-byte with what is
deployed. Any difference in compiler input produces different bytecode and the match fails.
Four causes account for nearly all of it:

1. **Compiler settings drift.** Compiler version, `evmVersion`, optimizer enabled/disabled,
   or optimizer `runs` differing from the deployment build. On Redbelly, `evmVersion` is the
   likeliest offender because it is the setting people do not realise they had to set
   ([E1](#e1)).
2. **Constructor arguments wrong or missing.** They are part of the deployment payload and
   must be supplied exactly.
3. **Verifying too early.** The explorer has not indexed the deployment yet, and reports the
   address as having no bytecode:
   ```
   The request to ... failed because the address "0x..." does not have bytecode.
   ```
4. **Wrong chain.** A testnet contract submitted to the mainnet API — see [B3](#b3).

### Solution

**1. Wait for indexing before verifying.** Five confirmations is a reliable threshold:

```js
const contract = await Factory.deploy(...args);
await contract.deploymentTransaction().wait(5);   // then verify
```

Or from the shell, confirm the explorer can see the bytecode:

```bash
curl -s "https://api.routescan.io/v2/network/testnet/evm/153/etherscan/api\
?module=proxy&action=eth_getCode&address=0xYOUR_CONTRACT&tag=latest"
```

A result longer than `"0x"` means it is indexed.

**2. Read the settings that were actually used** — not the ones you believe you configured:

```bash
jq '.input.settings | {optimizer, evmVersion}' artifacts/build-info/*.json
```

```json
{
  "optimizer": { "enabled": true, "runs": 200 },
  "evmVersion": "prague"
}
```

**3. Pass constructor arguments exactly as deployed:**

```bash
npx hardhat verify --network redbellyTestnet 0xYOUR_CONTRACT "MyToken" "MTK" 18
```

For complex or nested arguments, use a file so quoting cannot corrupt them:

```js
// arguments.js
module.exports = ["MyToken", "MTK", 18, ["0xabc...", "0xdef..."]];
```
```bash
npx hardhat verify --network redbellyTestnet --constructor-args arguments.js 0xYOUR_CONTRACT
```

**4. Confirm the result rather than trusting the CLI message:**

```bash
curl -s "https://api.routescan.io/v2/network/testnet/evm/153/etherscan/api\
?module=contract&action=getsourcecode&address=0xYOUR_CONTRACT" | jq '.result[0] | {ContractName, CompilerVersion, EVMVersion, OptimizationUsed}'
```

A populated `ContractName` means the source is published. An `EVMVersion` that reads
`Default` rather than `prague` indicates the settings did not travel with the submission.

### Prevention

Deploy and verify from the same command, so the settings cannot drift between them:

```json
{
  "scripts": {
    "deploy:testnet": "hardhat run scripts/deploy.ts --network redbellyTestnet && npm run verify:testnet",
    "verify:testnet": "hardhat verify --network redbellyTestnet --constructor-args arguments.js $CONTRACT_ADDRESS"
  }
}
```

Commit `hardhat.config.ts` and the lockfile together. Verification failures months later are
almost always a compiler version that moved underneath an unpinned dependency range.

---

# G. Eligibility SDK integration

<a id="g1"></a>
## G1 — `npm install @redbellynetwork/eligibility-sdk` fails with 404

**Category:** SDK · **Severity:** Critical — blocks the first step of SDK integration

### Symptom

```
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/@redbellynetwork%2feligibility-sdk
npm error 404
npm error 404  '@redbellynetwork/eligibility-sdk@*' is not in this registry.
```

### Root Cause

**The package is not published on the public npm registry.** It is published to **GitHub
Packages**, which is a separate registry that npm does not consult unless told to, and which
requires authentication even for reads.

Confirmed directly:

- `https://registry.npmjs.org/@redbellynetwork%2Feligibility-sdk` → **HTTP 404**
- A registry search for `redbellynetwork` returns **zero** packages
- `https://npm.pkg.github.com/@redbellynetwork%2Feligibility-sdk` → **HTTP 401**
  `{"error":"authentication token not provided"}`

So the default `npm install` fails not because the name is wrong but because npm is asking
the wrong registry, and the right one requires a token.

### Solution

**1. Create a GitHub personal access token (classic)** with the **`read:packages`** scope, at
<https://github.com/settings/tokens>. Read access is sufficient — no write scopes are needed.

**2. Create `.npmrc` in your project root:**

```ini
@redbellynetwork:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
always-auth=true
```

**The leading `//` on the second line is required.** Redbelly's installation page publishes
that line without it, which fails in a way that looks like a bad token — see [G2](#g2).

**3. Export the token and install:**

```bash
export GITHUB_TOKEN=ghp_your_token_here
npm install @redbellynetwork/eligibility-sdk
```

**4. Install the peer dependencies**, which are not pulled in automatically:

```bash
npm install @reown/appkit @reown/appkit-adapter-wagmi wagmi viem @tanstack/react-query
```

Required versions, per the SDK documentation:

| Package | Version |
|---|---|
| `react` / `react-dom` | 18.x or higher |
| `viem` | 2.x or higher |
| `wagmi` | 2.x or higher |
| `@tanstack/react-query` | 5.x or higher |

**5. Confirm the registry is answering you** before debugging your app:

```bash
curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://npm.pkg.github.com/@redbellynetwork%2Feligibility-sdk | head -c 200
```

JSON containing `dist-tags` means authentication works. `{"error":"authentication token not provided"}` means the token is not reaching the registry.

### Prevention

Never commit the token. Keep `.npmrc` referencing `${GITHUB_TOKEN}` and set the variable in
your shell, your `.env`, or your CI secrets:

```yaml
# GitHub Actions
- run: npm ci
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Add `.npmrc` to `.gitignore` if you ever inline a literal token into it. A leaked
`read:packages` token is low-severity but trivially avoidable.

Document the token requirement in your project README. This is the single most common place
for a new contributor's `npm install` to fail, and the error message says nothing about
GitHub Packages.

---

<a id="g2"></a>
## G2 — `.npmrc` configured but install still fails with 401

**Category:** SDK · **Severity:** High · **Caused by an error in the official docs**

### Symptom

You followed the installation instructions, created `.npmrc`, supplied a valid token, and:

```
npm error code E401
npm error 401 Unauthorized - GET https://npm.pkg.github.com/@redbellynetwork%2feligibility-sdk
npm error Incorrect or missing password.
```

Regenerating the token changes nothing, because the token was never the problem.

### Root Cause

**The `.npmrc` auth line in Redbelly's installation documentation is missing its leading
`//`.** The page publishes:

```ini
@redbellynetwork:registry=https://npm.pkg.github.com
npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}      # ← missing //
always-auth=true
```

npm's config format keys credentials by a URI-like path that **must** begin with `//`.
Without it, npm treats `npm.pkg.github.com/:_authToken` as an unrelated config key, silently
ignores it, and sends the request unauthenticated. GitHub Packages returns 401 for
unauthenticated reads, so the symptom is identical to a wrong token — which is why people
regenerate tokens repeatedly instead of looking at the file.

Redbelly's *getting-started* page contains the same line **with** the slashes, so the two
pages disagree. The getting-started page is the correct one.

### Solution

**1. Fix the line.** Correct form:

```ini
@redbellynetwork:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
always-auth=true
```

**2. Confirm npm has parsed the credential** — this prints the resolved config and is the
fastest way to tell:

```bash
npm config get //npm.pkg.github.com/:_authToken
```

Your token (or the literal `${GITHUB_TOKEN}`) means the key parsed. `undefined` means the
line is still malformed.

**3. Clear the cached failure**, which otherwise persists across a corrected config:

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**4. If it still 401s**, work through the remaining causes in order:

| Cause | Check |
|---|---|
| Token lacks `read:packages` | Regenerate at <https://github.com/settings/tokens> with that scope ticked |
| `GITHUB_TOKEN` not exported | `echo $GITHUB_TOKEN` — empty means npm substitutes nothing |
| Token expired | Classic tokens expire; the page shows the expiry date |
| SSO not authorised | If your account is in an SSO-enabled org, click "Configure SSO" on the token and authorise it |

**5. Test the token independently of npm**, which separates a token problem from a config
problem:

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://npm.pkg.github.com/@redbellynetwork%2Feligibility-sdk
```

`200` means the token is fine and the fault is in `.npmrc`. `401` means the token is the
problem.

### Prevention

Copy the `.npmrc` block from this wiki or from Redbelly's getting-started page, not from the
installation page, until the typo is corrected upstream.

Keep a one-line check in your project's setup script so the failure names itself:

```bash
npm config get //npm.pkg.github.com/:_authToken >/dev/null 2>&1 \
  || echo "WARNING: .npmrc auth line missing or malformed — check the leading //"
```

---

<a id="g3"></a>
## G3 — Quickstart `git clone` fails: the starter repo is private

**Category:** SDK · **Severity:** High — the documented quickstart cannot be completed

### Symptom

Step 1 of the "Quickstart: Your First Eligibility Check" guide is:

```bash
git clone https://github.com/redbellynetwork/eligibility-sdk-quickstart.git
```

which produces:

```
Cloning into 'eligibility-sdk-quickstart'...
remote: Repository not found.
fatal: repository 'https://github.com/redbellynetwork/eligibility-sdk-quickstart.git/' not found
```

Or a credential prompt that no valid credentials satisfy.

### Root Cause

**The repository is not publicly accessible.** Verified:

- `https://api.github.com/repos/redbellynetwork/eligibility-sdk-quickstart` → **HTTP 404**
- `https://github.com/redbellynetwork/eligibility-sdk-quickstart` → **HTTP 404** logged out
- The git endpoint returns **HTTP 401**, which indicates the repository exists but requires
  authorisation — a private repo, rather than a deleted one

GitHub returns 404 rather than 403 for private repositories you cannot see, so "Repository
not found" here means "not visible to you", not "does not exist".

The same quickstart page has a second dead step: **Step 6** directs you to a "Demo Credential
Faucet" for a test KYC credential, marked *(under development)*. Without it there is no
documented way to obtain the test credential the final verification step needs.

So the documented 15-minute quickstart cannot currently be completed end to end by an
external developer.

### Solution

**Build the integration directly from the API documentation** rather than from the starter
kit. The pieces are all documented; only the assembled repository is missing.

**1. Scaffold a Next.js app and install the SDK** ([G1](#g1)):

```bash
npx create-next-app@latest my-eligibility-app --typescript --app
cd my-eligibility-app

cat > .npmrc <<'EOF'
@redbellynetwork:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
always-auth=true
EOF

export GITHUB_TOKEN=ghp_your_token
npm install @redbellynetwork/eligibility-sdk
npm install @reown/appkit @reown/appkit-adapter-wagmi wagmi viem @tanstack/react-query
```

**2. Wrap the root component**, which is the documented requirement for the SDK's hooks and
widgets to initialise at all ([G4](#g4)):

```tsx
// app/providers.tsx
"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { defineChain } from "@reown/appkit/networks";
import { EligibilitySDKProvider } from "@redbellynetwork/eligibility-sdk";

const redbellyTestnet = defineChain({
  id: 153,
  caipNetworkId: "eip155:153",
  chainNamespace: "eip155",
  name: "Redbelly Testnet",
  nativeCurrency: { decimals: 18, name: "Redbelly Network Coin", symbol: "RBNT" },
  rpcUrls: { default: { http: ["https://governors.testnet.redbelly.network"] } },
});

const networks = [redbellyTestnet] as const;
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!;   // from https://cloud.reown.com
const wagmiAdapter = new WagmiAdapter({ projectId, networks: [...networks] });
const queryClient = new QueryClient();

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [...networks],
  metadata: {
    name: "My Eligibility App",
    description: "Eligibility checks on Redbelly Network",
    url: "http://localhost:3000",
    icons: [],
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <EligibilitySDKProvider
          config={{
            network: "testnet",                      // "mainnet" | "testnet" | "staging"
            apiKey: process.env.NEXT_PUBLIC_REDBELLY_API_KEY!,
          }}
        >
          {children}
        </EligibilitySDKProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

**3. Implement the three backend routes.** The SDK requires these exact paths, and the
documentation is explicit that they "must match exactly or the SDK's will not function
properly":

| Route | Method | Purpose |
|---|---|---|
| `/auth-request` | POST | Starts a proof session, returns `{ request, sessionId }` |
| `/callback` | POST | Receives the ZK proof token from the wallet |
| `/status/:sessionId` | GET | Returns `idle` / `verifying` / `failed` / `success` |

Register the `receptor` DID method before starting the server, with the correct chain IDs —
**151 for mainnet, 153 for testnet**:

```js
const { core } = require("@iden3/js-iden3-auth");

core.registerDidMethodNetwork({
  method: "receptor", methodByte: 0b10000011,
  blockchain: "redbelly", network: "testnet",
  networkFlag: 0b10000011, chainId: 153,
});
core.registerDidMethodNetwork({
  method: "receptor", methodByte: 0b01010111,
  blockchain: "redbelly", network: "mainnet",
  networkFlag: 0b01010111, chainId: 151,
});
```

State resolvers for proof verification:

```js
const resolvers = {
  "redbelly:mainnet": new resolver.EthStateResolver(
    "https://governors.mainnet.redbelly.network",
    "0x1cc7261e1777D69505Cb6413a91bb27ca9eb1456"
  ),
  "redbelly:testnet": new resolver.EthStateResolver(
    "https://governors.testnet.redbelly.network",
    "0x69376715FB5E2B924a33e9C27302F52DEa178CDC"
  ),
};
```

**4. Download the Iden3 circuit verification keys** into a `keys/` directory in your backend
root. They come from the Polygon ID trusted setup:
<https://github.com/0xPolygonID/phase2ceremony>

**5. Request an API key.** `EligibilitySDKProvider` requires one, and the documentation
directs you to Averer customer support to obtain it. There is no self-service route.

**6. For the test credential** that the quickstart's demo faucet was meant to supply, use a
Privado-compatible identity wallet (Privado Web or Privado Mobile) and request a credential
from an accredited issuer. The authorised issuer DIDs are:

| Network | Issuer DID |
|---|---|
| Mainnet | `did:receptor:redbelly:mainnet:31AAH8sSaGd6fpnG1TcB6yQ4UZnNeyHzTk5aM2P7rjv` |
| Testnet | `did:receptor:redbelly:testnet:31K82iKCtE6ciDc7oAr3T5EpjZb4S1EFM7c4xJaWkM2` |

### Prevention

Before following any quickstart that begins with `git clone`, check the repository resolves:

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  https://api.github.com/repos/redbellynetwork/eligibility-sdk-quickstart
# 404 = not publicly available
```

Ten seconds spent there saves the confusion of a clone failure that looks like a git
credential problem.

---

<a id="g4"></a>
## G4 — SDK components render nothing / `window is not defined`

**Category:** SDK · **Severity:** High

### Symptom

```
ReferenceError: window is not defined
```
```
Error: useConfig must be used within WagmiProvider
```
```
Error: No QueryClient set, use QueryClientProvider to set one
```

Or the widget mounts and renders nothing at all, with no error.

### Root Cause

Three causes, in the order they usually appear:

**1. The root component is not wrapped in `EligibilitySDKProvider`.** The documentation
states that to use the SDK you "need to wrap your root component with `EligibilitySDKProvider`
and initialize wallet support via AppKit's Wagmi adapter". The SDK's hooks and widgets read
from that context; without it they have nothing to read and render nothing.

The provider chain has a required order — Wagmi outermost, then React Query, then the SDK:

```
WagmiProvider > QueryClientProvider > EligibilitySDKProvider > your components
```

**2. Server-side rendering.** `window is not defined` means SDK code ran during SSR. The SDK
renders a QR modal and talks to browser wallet APIs, so it is client-only. In Next.js App
Router, a component tree without `"use client"` renders on the server first.

**3. A missing API key.** `EligibilitySDKProvider` takes an `apiKey`, and onboarding and
issuer-claim flows are gated behind it. An absent or invalid key produces a widget that
mounts and then does nothing.

**On the "SDK iframe cross-origin" issue.** This is worth stating precisely, because it is
commonly described as an iframe problem and the SDK does not use one. The SDK ships React
components — `<IndividualOnboarding />`, `<BusinessOnboardingSdk />` — rendered directly into
your tree. The genuine cross-origin problem is different: **the user's wallet calls your
backend from the public internet**, so `localhost` is unreachable to it. That is what breaks,
and the fix is a public HTTPS tunnel, covered below.

### Solution

**1. Mark the provider tree as client-only.** Next.js App Router:

```tsx
// app/providers.tsx
"use client";                      // ← required
// ... full provider setup as in G3, step 2
```

```tsx
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
```

**2. Import SDK components dynamically with SSR disabled**, for any page that renders them:

```tsx
import dynamic from "next/dynamic";

const IndividualOnboarding = dynamic(
  () => import("@redbellynetwork/eligibility-sdk").then((m) => m.IndividualOnboarding),
  { ssr: false, loading: () => <p>Loading onboarding…</p> }
);

export default function OnboardingPage() {
  return <IndividualOnboarding />;
}
```

**3. Render only after the component has mounted**, which removes any remaining hydration
mismatch:

```tsx
"use client";
import { useEffect, useState } from "react";

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
}
```

**4. Expose your backend over a public HTTPS URL.** The wallet posts the proof to your
`/callback` endpoint from the internet, so `http://localhost:3000` cannot receive it:

```bash
ngrok http 3000
# Forwarding  https://randomstring.ngrok.io -> http://localhost:3000
```

Use the `https://` URL as `HOST_URL` in your backend and as the base for the callback URI. A
QR code encoding a `localhost` callback will scan successfully and then never complete.

**5. Allow the wallet's origin on your backend routes**, since those requests are
cross-origin:

```js
const cors = require("cors");
app.use(cors());                      // tighten for production
app.use(express.json());
```

**6. Keep the proof-request payload small.** The SDK's documentation is explicit that QR
codes encode roughly 3 KB reliably, and that large or multiple queries can exceed the limit
and cause QR rendering to fail. A widget that renders a blank box where the QR should be is
usually an oversized `scope` array — reduce it to the minimum set of credential checks.

**7. Confirm the provider chain is actually mounted:**

```tsx
import { useHasChainPermission } from "@redbellynetwork/eligibility-sdk";

function SdkHealthCheck({ address }: { address: string }) {
  const { data, error, isLoading } = useHasChainPermission(address);
  return <pre>{JSON.stringify({ data, error: error?.message, isLoading }, null, 2)}</pre>;
}
```

If this throws "must be used within", the provider tree is wrong or not client-side. If it
returns a boolean, the SDK is wired correctly and the problem is elsewhere.

### Prevention

Set the provider tree up once, in a dedicated `providers.tsx`, and never render SDK
components outside it.

Keep the verification `scope` on the server. The SDK documentation is explicit that scope
controls which credential proofs a user must satisfy and must not be read from `req.body`,
query parameters, or any other client-controlled input. Accept a stable flow ID from the
client and map it to a server-defined scope:

```js
const FLOWS = {
  "aml-check": ELIGIBILITY_SCOPE,     // defined server-side
};

app.post("/auth-request", (req, res) => {
  const scope = FLOWS[req.body.flowId];
  if (!scope) return res.status(400).send("Unknown flow");
  // ... build the authorization request with the server-owned scope
});
```

Keep revocation checks enabled. `skipClaimRevocationCheck: true` disables revocation
enforcement and belongs only in clearly marked non-production flows.

---

# Error message index

Search this page for the literal string your tool printed. Every error string quoted anywhere
in this guide appears below, mapped to the entry that fixes it.

| Error message (literal) | Entry |
|---|---|
| `404 page not found` | [A2](#a2) |
| `cannot estimate gas; transaction may fail or may require manual gas limit` | [C3](#c3), [D1](#d1) |
| `Chain ID returned by the custom network does not match the submitted chain ID.` | [B2](#b2), [A1](#a1) |
| `Chain ID returned by RPC URL https://... does not match` | [B2](#b2) |
| `code=SERVER_ERROR, status=429` | [A4](#a4) |
| `could not detect network (event="noNetwork", code=NETWORK_ERROR)` | [A1](#a1), [A2](#a2) |
| `Error! Unable to locate ContractCode at 0x...` | [F2](#f2) |
| `Error HH110: Invalid JSON-RPC response received` | [A1](#a1) |
| `Error HH303: Unrecognized task verify` | [F1](#f1) |
| `Error HHE80000: The network "..." with chain id "153" is not supported.` | [F1](#f1) |
| `execution reverted` | [D1](#d1), [C3](#c3) |
| `execution reverted (no reason string)` | [C3](#c3), [D1](#d1) |
| `Fail - Unable to verify` | [F2](#f2) |
| `gas price too high` | [C1](#c1) |
| `HttpProviderError: Invalid JSON-RPC response received` | [A2](#a2) |
| `Incorrect or missing password.` | [G2](#g2) |
| `insufficient funds for gas * price + value` | [E2](#e2) |
| `insufficient funds for intrinsic transaction cost` | [E2](#e2) |
| `Invalid JSON-RPC response received: <html>` | [A1](#a1) |
| `max fee per gas less than block base fee` | [C1](#c1) |
| `No Etherscan block explorer is configured for the 153 chain in the chain descriptors.` | [F1](#f1) |
| `No QueryClient set, use QueryClientProvider to set one` | [G4](#g4) |
| `nonce has already been used` | [C4](#c4) |
| `nonce too low` | [C4](#c4) |
| `npm error 404 Not Found - GET https://registry.npmjs.org/@redbellynetwork%2feligibility-sdk` | [G1](#g1) |
| `npm error code E401` | [G2](#g2) |
| `npm error code E404` | [G1](#g1) |
| `ProviderError: invalid nonce; got 7, expected 9` | [C4](#c4) |
| `ReferenceError: window is not defined` | [G4](#g4) |
| `remote: Repository not found.` | [G3](#g3) |
| `replacement transaction underpriced` | [C2](#c2) |
| `server response 429 Too Many Requests` | [A4](#a4) |
| `The chain id 153 is not supported.` | [F1](#f1) |
| `The contract "..." at address "0x..." is already verified.` | [F2](#f2) |
| `The Etherscan API key is empty.` | [F1](#f1) |
| `The request to ... failed because the address "0x..." does not have bytecode.` | [F2](#f2) |
| `transaction execution reverted (no reason string)` | [D1](#d1) |
| `transaction underpriced` | [C2](#c2) |
| `Transaction not found` (in explorer) | [B3](#b3) |
| `UNPREDICTABLE_GAS_LIMIT` | [C3](#c3) |
| `Unrecognized chain ID "0x99". Try adding the chain using wallet_addEthereumChain first.` | [B1](#b1) |
| `useConfig must be used within WagmiProvider` | [G4](#g4) |
| `{"error":"authentication token not provided"}` | [G1](#g1), [G2](#g2) |

## Keyword index

| Keyword | Entries |
|---|---|
| 151 / mainnet chain ID | [A1](#a1), [B1](#b1), [B2](#b2) |
| 152 / DevNet | [A3](#a3) |
| 153 / testnet chain ID | [A1](#a1), [B1](#b1), [B2](#b2), [F1](#f1) |
| 154 / TGE | [A1](#a1), [B2](#b2) |
| 429 / rate limit | [A4](#a4) |
| access credential | [D1](#d1), [D2](#d2), [C3](#c3) |
| `chainDescriptors` | [F1](#f1), [E3](#e3) |
| `customChains` | [F1](#f1), [E3](#e3) |
| deployment | [E1](#e1), [E2](#e2), [E3](#e3) |
| Discord | [D2](#d2) |
| `EligibilitySDKProvider` | [G4](#g4), [G3](#g3) |
| `eth_chainId` | [A1](#a1), [B2](#b2) |
| `eth_estimateGas` | [C3](#c3), [D1](#d1) |
| `eth_gasPrice` | [C1](#c1), [E2](#e2) |
| EVM version / `prague` / `osaka` | [E1](#e1), [F2](#f2), [E3](#e3) |
| explorer / Routescan | [B3](#b3), [F1](#f1), [F2](#f2) |
| faucet / FAUCETME | [D2](#d2), [E2](#e2) |
| gas / fees / USD-pegged | [C1](#c1), [C2](#c2), [C3](#c3), [E2](#e2) |
| GitHub Packages | [G1](#g1), [G2](#g2) |
| Hardhat config | [E3](#e3), [E1](#e1), [F1](#f1) |
| MetaMask | [B1](#b1), [B2](#b2), [B3](#b3), [C4](#c4) |
| Next.js / SSR | [G4](#g4), [G3](#g3) |
| ngrok / cross-origin | [G4](#g4) |
| nonce | [C4](#c4), [C2](#c2) |
| `.npmrc` | [G1](#g1), [G2](#g2) |
| permissioned network | [D1](#d1), [C3](#c3), [E2](#e2) |
| quickstart repo | [G3](#g3) |
| RPC URL format | [A2](#a2), [A1](#a1) |
| Solidity 0.8.30 | [E1](#e1), [E3](#e3) |
| stuck / pending transaction | [C2](#c2), [C1](#c1) |
| `useHasChainPermission` | [D1](#d1), [G4](#g4) |
| `wallet_addEthereumChain` | [B1](#b1), [B2](#b2) |
| Waffle | [E3](#e3) |
| contract verification | [F1](#f1), [F2](#f2) |

---

# Coverage and methodology

This section states exactly what this guide's issue list was derived from, so its coverage
can be judged rather than taken on trust.

**Sources used to select the 22 entries:**

1. **Redbelly's own documentation, read in full** — the Vine developer portal
   (`vine.redbelly.network`) and the technical documentation site
   (`docs.redbelly.network`), including the Eligibility SDK reference, Receptor
   documentation, environments, network fees and EVM compatibility pages. Four entries
   ([A1](#a1), [G2](#g2), [G3](#g3), and part of [A2](#a2)) document defects found in that
   documentation itself.
2. **Live probing of the published infrastructure** — the mainnet and testnet JSON-RPC
   endpoints, the Routescan explorer APIs, the public `chainid.network` registry, the npm
   and GitHub Packages registries, and the GitHub API.
3. **Toolchain source** — the shipped source of Hardhat 3.12.0, `@nomicfoundation/hardhat-verify`
   3.0.22 and `@nomicfoundation/hardhat-errors` 3.0.18 were read directly to obtain the
   literal error strings and the exact configuration shapes quoted in this guide, rather
   than paraphrasing documentation.
4. **Solidity release history** — the compiler's own release notes, to establish the default
   EVM version at each version ([E1](#e1)).
5. **The failure modes common to all EVM chains** — nonce handling, gas estimation, rate
   limiting — adapted to Redbelly's specifics where they differ.
6. **A capture of the Redbelly Discord**, analysed below.

<!-- COVERAGE-CLAIM-START -->
## Discord coverage: measured, and the result was not what we expected

**No percentage of "Discord support questions" is claimed by this guide, because the channel
analysis found that there are none to measure against.**

A capture of the Redbelly Network Discord's `💬︱general` channel covering **23 July – 8 August
2026** yielded **21 distinct community questions**. Of those:

| Category | Count |
|---|---|
| Ecosystem & Tokeniser | 6 |
| Roadmap & timing | 4 |
| Token & staking | 3 |
| Market positioning | 2 |
| Builder / partnership enquiries (non-technical) | 2 |
| DAO & task board | 1 |
| Support process | 1 |
| Legal / regional restrictions | 1 |
| Moderation | 1 |
| **Developer technical support** | **0** |

Not one question in the sample concerned an RPC endpoint, a chain ID, wallet configuration,
gas, a nonce, contract deployment, contract verification, the faucet, or the Eligibility SDK.

**The reason is structural: the Redbelly Discord has no developer support surface.** The
captured channel list contains no `#dev`, `#developers`, `#dev-support` or `#builders`
channel — `#technical-analysis` sits under *Price & Market* and is chart analysis. Redbelly
team members in the capture confirm the routing:

> **"Please is there a ticket here?"** — community member
> **"No, how can I help?"** — Daniel Bressoud, Redbelly team, 5 Aug 2026

> **"We love builders. If you want to build on the Redbelly Network, the best would be to reach
> out to our team info@redbelly.network"** — Daniel Bressoud, 5 Aug 2026

> **"You should join our Telegram and check Alan's update on this topic."** — Daniel Bressoud,
> 5 Aug 2026

A developer who hits one of the errors in this guide, joins the official Discord, and looks
for somewhere to ask will find a community server with no developer channel and no ticket
system, and will be pointed at an email address.

That is a sharper version of the problem this guide exists to solve, and it is why the
entries here are sourced from documentation and live infrastructure testing rather than from
a question tally. Full analysis, transcript and screenshots:
[`evidence/channel-analysis.md`](../evidence/channel-analysis.md).

**Limits of the sample, stated plainly:** one channel (`#general`), 16 days, Discord only.
`#averer-kyc-support` and the Telegram group (`t.me/redbellychat`) — where technical questions
are actually routed — were not sampled. A developer channel gated behind a role would not have
appeared. If a further capture changes this picture, this section and the analysis file get
updated together.

**Recommendation to the Redbelly DAO:** create a `#dev-support` channel. The server has 40,719
members and nowhere for a developer to ask why their transaction reverted.
<!-- COVERAGE-CLAIM-END -->

---

# Verification and evidence

Every technical claim in this guide is traced to the source it came from in
[`sources.md`](../evidence/sources.md), and every fix is designed to be checked mechanically
rather than taken on trust. The harness in [`harness/`](../harness/) is what does the
checking.

**Status, stated plainly:** the harness has been written but not yet run end-to-end against
Redbelly Testnet, so `verification-log.json` does not exist in this repository yet. Nothing
below claims otherwise. When the run happens, the log lands in `../evidence/` and this
section is updated with its date and results.

**What the harness does:**

- Queries both Redbelly RPC endpoints and asserts the chain IDs, endpoint shapes and gas
  economics this guide states.
- Re-checks the documentation defects in [A1](#a1), [G2](#g2) and [G3](#g3) against the live
  pages, so a corrected upstream page is detected rather than silently contradicting us.
- Compiles the reference contract under both the correct (`prague`) and the default-modern
  (`osaka`) profiles.
- Deploys to Redbelly Testnet, then **reproduces** the insufficient-funds, nonce-reuse and
  underpriced-transaction failures and confirms the documented recovery for each.
- Verifies the deployed contract through Routescan using the `chainDescriptors` block in
  [F1](#f1).

**Reproducing it:**

```bash
git clone <this repository>
cd harness
./run.sh                # read-only checks; no key or funds needed
./run.sh --deep         # + on-chain checks (needs a funded, onboarded testnet key)
```

**The standard that applies:** any entry whose fix does not reproduce when the harness runs
gets cut, not published with a caveat. That rule is stated in advance so it can be checked
against what this guide contains after the run.

Checks marked observational in the log — the rate-limit burst, the `from`-less gas estimate,
and the un-onboarded address probe — record what the network actually does so that the
wording here matches observed behaviour rather than assumption.

---

# Where to get help when this guide does not cover it

Finding the right place to ask is itself a source of friction on Redbelly, so here is the
map. Every route below is evidenced by the channel capture in
[`evidence/channel-analysis.md`](../evidence/channel-analysis.md).

| You need | Go to | Notes |
|---|---|---|
| A technical answer from the team | **Telegram — <https://t.me/redbellychat>** | Where the team routes technical depth. Redbelly staff direct people here explicitly. |
| To start building / partnership | **info@redbelly.network** | The team's stated route for builders. |
| KYC, onboarding or credential issues | **`#averer-kyc-support`** in the Discord | The one engineering-adjacent Discord channel. |
| Network access for your address | **<https://access.redbelly.network>** | Required before any address can write. See [D1](#d1). |
| Testnet RBNT | **<https://redbelly.faucetme.pro>** | Discord account required. See [D2](#d2). |
| Node operator help | **Node Operator Support Portal** (linked from Vine support) | Separate from developer support. |
| General community | **Discord — <https://discord.com/invite/sxwBgwmdq6>** | 40,719 members. Community and token holders. |

**What does not exist:** a Discord developer-support channel, and a support ticket system.
Asked directly whether there was a ticket system, a Redbelly team member answered *"No, how
can I help?"* (5 Aug 2026). Budget your expectations accordingly — for anything in this guide,
the fastest route is the guide itself, then Telegram.

---

# Contributing

This guide is maintained, not published-and-abandoned.

**Found something wrong?** Open an issue with the error string, the command that produced it,
and the chain ID you were on. Wrong information here is worse than missing information, and
corrections are prioritised over additions.

**Have an error that is not covered?** The most useful report includes:

- the literal error message, copied verbatim
- what you ran to produce it
- chain ID (151 or 153), and the tool and version
- what fixed it, if you found out

**Adding an entry.** Entries follow a fixed shape — Symptom, Root Cause, Solution,
Prevention — and two rules:

1. **No vague instructions.** "Run this command" rather than "check your configuration".
   Every solution step is something the reader can execute.
2. **Every claim is verifiable.** New entries come with a check added to `harness/verify.mjs`
   or `harness/scripts/deep-checks.ts`, so the fix is proven rather than asserted.

**Re-verification.** Chain IDs, endpoints, package versions and compiler defaults all move.
Re-run `./run.sh` before relying on this guide after the "sources read" date, and open an
issue for anything that has drifted.

---

# Sources

Every technical value in this guide traces to one of these, all read on **8 August 2026**:

**Redbelly — Vine developer portal**
- Environments (chain IDs, RPC URLs, explorers): <https://vine.redbelly.network/environments/>
- EVM compatibility (EVM version, Solidity version): <https://vine.redbelly.network/consensus/evm-compatibility/>
- Network fees (USD-pegged gas model, unit gas price, bootstrap registry): <https://vine.redbelly.network/network-fees/>
- Network access (permissioning): <https://vine.redbelly.network/identity/user-access/>
- Testing coins (faucet): <https://vine.redbelly.network/native-currency/testing-coins/>
- Smart contract guides: <https://vine.redbelly.network/smart-contracts/>

**Redbelly — technical documentation**
- Eligibility SDK installation: <https://docs.redbelly.network/pages/eligibility-sdk/installation/>
- Eligibility SDK quickstart: <https://docs.redbelly.network/pages/eligibility-sdk/getting-started/>
- Eligibility SDK backend (DID registration, state resolvers): <https://docs.redbelly.network/pages/eligibility-sdk/backend/>
- `useHasChainPermission`: <https://docs.redbelly.network/pages/eligibility-sdk/client/hooks/useHasChainPermission/>
- Environment values (the page carrying the stale chain ID): <https://docs.redbelly.network/pages/general/rb-env/>

**Independent registries and services**
- Chain registry: <https://chainid.network/chains.json>
- Routescan explorer API: `https://api.routescan.io/v2/network/{mainnet|testnet}/evm/{151|153}/etherscan`
- Etherscan multichain list (which omits Redbelly): <https://api.etherscan.io/v2/chainlist>
- npm registry / GitHub Packages
- Network access dApp: <https://access.redbelly.network>
- Faucet: <https://redbelly.faucetme.pro>

**Toolchain**
- Solidity release notes (default EVM version per release): <https://github.com/ethereum/solidity/releases>
- Hardhat 3.12.0, `@nomicfoundation/hardhat-verify` 3.0.22, `@nomicfoundation/hardhat-errors` 3.0.18 — package source

---

**Sources read: 8 August 2026** · Ships with a reproducible verification harness (not yet run —
see [Verification and evidence](#verification-and-evidence)) · Corrections welcome
