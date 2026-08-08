# Redbelly Network Troubleshooting Wiki

**22 fixes for the errors developers hit most often on Redbelly Network.**

Every chain ID, URL, address and package name here was read from a live source on 8 August
2026 and is traced in [`evidence/sources.md`](evidence/sources.md). A verification harness
that executes each fix against Redbelly Testnet ships with the repository — it has not been
run end-to-end yet, and this README will say so until it has.

📖 **[Read the wiki →](wiki/troubleshooting-wiki.md)**

---

## What is in here

| Path | Contents |
|---|---|
| [`wiki/troubleshooting-wiki.md`](wiki/troubleshooting-wiki.md) | The guide. 22 entries across 7 categories, plus an error-message index and a keyword index. |
| [`wiki/DRAFT-for-discord.md`](wiki/DRAFT-for-discord.md) | The 11-entry partial shared with the Redbelly Discord for community review. |
| [`harness/`](harness/) | The verification harness. Reproduces each failure and confirms each fix. |
| [`evidence/sources.md`](evidence/sources.md) | Every technical claim traced to the source it came from. |
| [`evidence/sources.md`](evidence/sources.md) | Every technical claim traced to the source it came from. |
| [`evidence/link-check.json`](evidence/link-check.json) | Every external link, checked. |
| [`community/`](community/) | Discord outreach kit and the community validation record. |

---

## The three things that make Redbelly different

Most Redbelly debugging time goes on these, because none of them behaves like a normal EVM
chain and none is signposted where you first hit it:

**1. It is a permissioned network.** An address without a network access credential cannot
write to the chain. Transactions fail as bare reverts with no reason string, which is
indistinguishable from a contract bug at a glance.
→ [D1](wiki/troubleshooting-wiki.md#d1)

**2. Gas is priced in US dollars.** `eth_gasPrice` returns roughly **165,000 gwei** — about
four orders of magnitude above Ethereum. That is correct behaviour, and it silently breaks
any hardcoded gas price or fee cap carried over from another chain.
→ [C1](wiki/troubleshooting-wiki.md#c1)

**3. The two official documentation sites disagree**, including on the mainnet chain ID. One
publishes 151, the other 154. 154 is a different network entirely.
→ [A1](wiki/troubleshooting-wiki.md#a1)

Plus one that catches every new project: **Redbelly's EVM is `prague`, and Solidity 0.8.31
and later default to `osaka`.** A current toolchain on defaults compiles for an EVM revision
newer than the chain implements.
→ [E1](wiki/troubleshooting-wiki.md#e1)

---

## Quick reference

| | Mainnet | Testnet |
|---|---|---|
| Chain ID | `151` (`0x97`) | `153` (`0x99`) |
| RPC URL | `https://governors.mainnet.redbelly.network` | `https://governors.testnet.redbelly.network` |
| Explorer | `https://redbelly.routescan.io` | `https://redbelly.testnet.routescan.io` |
| Explorer API | `https://api.routescan.io/v2/network/mainnet/evm/151/etherscan` | `https://api.routescan.io/v2/network/testnet/evm/153/etherscan` |
| Currency | `RBNT` (18 decimals) | `RBNT` (18 decimals) |
| Network access | <https://access.redbelly.network> | <https://access.redbelly.network> |
| Faucet | — | <https://redbelly.faucetme.pro> |
| EVM version | `prague` | `prague` |
| Solidity | `0.8.30` | `0.8.30` |

Chain 152 (DevNet) is deprecated. Chain 154 is **not** mainnet.

---

## Verifying this yourself

Nothing here asks to be taken on trust.

```bash
cd harness
./run.sh                # read-only checks — no key, no funds, no install
./run.sh --deep         # + on-chain checks (needs a funded, onboarded testnet key)
```

Output lands in `evidence/verification-log.json`, one record per check, with the raw response
kept so the conclusion can be re-derived. See [`harness/README.md`](harness/README.md).

**Not yet run.** The log does not exist in this repository yet. The read-only stage needs no
key, no funds and no install, so anyone can produce it independently.

**The standard that applies:** any entry whose fix does not reproduce when the harness runs
gets cut rather than published with a caveat.

---

## Contributing

Corrections are prioritised over additions — wrong information here is worse than missing
information. Open an issue with the literal error string, the command that produced it, and
the chain ID.

New entries follow the Symptom / Root Cause / Solution / Prevention shape, contain no vague
instructions, and come with a check added to the harness. See
[Contributing](wiki/troubleshooting-wiki.md#contributing).

---

**Sources read: 8 August 2026**
