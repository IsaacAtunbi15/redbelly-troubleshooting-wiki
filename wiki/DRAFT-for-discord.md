# Redbelly Network Troubleshooting Wiki — DRAFT v0.1

**Status: incomplete and shared on purpose.** 11 of 22 entries are written (categories A, B
and C). Categories D–G are in progress and listed in the contents below so you can see what
is coming and tell me if the plan is wrong.

Sharing it half-finished is deliberate: feedback that arrives now can change the remaining
entries, which is worth more than feedback on a finished document.

Every value in here — chain IDs, RPC URLs, gas figures, contract addresses — was read from a
live source on **8 August 2026**, not recalled. Every fix will be executed against Redbelly
Testnet before publication, and the run log ships with the finished wiki.

**Corrections very welcome.** Especially on anything marked as a discrepancy in Redbelly's
own documentation — I would rather be wrong here than in public.

---
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

> **Sources read:** 8 August 2026
> **Verification status:** the testnet run has not happened yet. Every fix below is derived
> from a live source, but none has been executed against chain 153 at the time of this draft.
> Anything that fails the run will be corrected or cut before publication — it will not ship
> with an asterisk.

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

**D. Network access and permissioning** — *not yet written* *(Redbelly-specific — no equivalent on other EVM chains)*
- [D1 — Transactions revert because the address has no network access credential](#d1)
- [D2 — Testnet faucet does not distribute RBNT](#d2)

**E. Contract deployment and compilation** — *not yet written*
- [E1 — Contract compiles but misbehaves or fails to deploy: EVM version mismatch](#e1)
- [E2 — Hardhat deployment fails with `insufficient funds for gas * price + value`](#e2)
- [E3 — No official Hardhat config exists for Redbelly](#e3)

**F. Explorer and contract verification** — *not yet written*
- [F1 — `The network "..." with chain id "153" is not supported`](#f1)
- [F2 — Verification submitted but the contract shows no source](#f2)

**G. Eligibility SDK integration** — *not yet written*
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
