# Source traceability

Every non-obvious technical claim in the wiki, the source it came from, and how it is
verified. All sources read **8 August 2026**.

The rule applied throughout: no value in the wiki is recalled from training data. Chain IDs,
URLs, contract addresses, package names, version numbers and error strings were each read
from a live source or from shipped package source.

---

## Network values

| Claim | Source | Harness check |
|---|---|---|
| Mainnet chain ID = 151 | `vine.redbelly.network/environments/`; `chainid.network/chains.json` | `A1.1` — `eth_chainId` returns `0x97` |
| Testnet chain ID = 153 | same | `A1.2` — `eth_chainId` returns `0x99` |
| Mainnet RPC `https://governors.mainnet.redbelly.network` | `vine.redbelly.network/environments/` | `A1.1`, `A2.1` |
| Testnet RPC `https://governors.testnet.redbelly.network` | same | `A1.2`, `A2.1` |
| RPC takes POSTs at the domain root, no `/rpc` path | Observed: bare URL 200, `/rpc` 404 | `A2.1`, `A2.2`, `A2.3` |
| Explorer `https://redbelly.routescan.io` (mainnet) | `vine.redbelly.network/environments/` | `B3.1` |
| Explorer `https://redbelly.testnet.routescan.io` (testnet) | same | `B3.2` |
| DevNet (152) deprecated, no published RPC | Vine environments page; registry `rpc: []` | `A3.1`, `A3.2` |
| Chain 154 is "Redbelly Network TGE", not mainnet | `chainid.network/chains.json` | `A1.3` |
| `docs.redbelly.network` still publishes 154 as mainnet | `docs.redbelly.network/pages/general/rb-env/` | `A1.4` (re-checked each run) |
| That same site registers mainnet as `chainId: 151` elsewhere | `docs.redbelly.network/pages/eligibility-sdk/backend/` | — (documented contradiction) |

**Note on the contradiction.** `docs.redbelly.network/pages/general/rb-env/` lists mainnet
`CHAIN_ID = 154` and both RPC URLs as "Coming Soon". The same domain's Eligibility SDK
backend page calls `core.registerDidMethodNetwork({ ..., network: "mainnet", chainId: 151 })`.
Two independent registries agree with 151. The wiki treats 151 as correct and says why.

---

## Gas and fees

| Claim | Source | Harness check |
|---|---|---|
| Gas priced in USD terms, not gwei | `vine.redbelly.network/network-fees/` | — |
| Simple transfer costs US$0.01 at 21,000 gas | same, verbatim | `C1.3` |
| Unit gas price US$0.000000476190476190 | same, verbatim | `C1.3` |
| Measured mainnet `eth_gasPrice` = `0x962477744fe0` (165,083.367 gwei) | Live read via Routescan proxy, block 3,120,675 | `C1.1` (re-measured each run) |
| 21,000 gas × that price = 3.4668 RBNT | Derived | `C1.1` |
| Implied RBNT price ≈ US$0.00288 | Derived from the two above | `C1.1` |
| Wallets mishandle Redbelly gas display | `vine.redbelly.network/smart-contracts/interaction/`, verbatim | — |
| Bootstrap registry `0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5` (both networks) | `vine.redbelly.network/network-fees/` | — |

The derived RBNT price is presented in the wiki as a worked cross-check of the documented
model, not as a price quote.

---

## EVM and compiler

| Claim | Source | Harness check |
|---|---|---|
| Redbelly EVM version = `Prague` | `vine.redbelly.network/consensus/evm-compatibility/` | — |
| Redbelly Solidity version = `v0.8.30` | same | — |
| solc 0.8.25 set default EVM to `cancun` | Solidity release notes | — |
| solc 0.8.30 set default EVM to `prague` (7 May 2025) | Solidity release notes, verbatim | — |
| solc 0.8.31 set default EVM to `osaka` (3 Dec 2025) | Solidity release notes, verbatim | — |
| solc 0.8.36 adds `amsterdam` (9 Jul 2026) | Solidity release notes | — |
| Hardhat 3 `--init` template pins solc 0.8.28 | `hardhat@3.12.0` shipped templates | — |
| Compiling for `prague` works on Redbelly | — | `E1.1`, compile stage |

---

## Permissioning and access

| Claim | Source | Harness check |
|---|---|---|
| Write access requires a network access credential | `vine.redbelly.network/identity/user-access/`, verbatim | `D1.1`, `D1.3` |
| Credential requires biometric-verified photo ID via an accredited issuer | same | — |
| Access dApp at `https://access.redbelly.network` | link target on that page | `D1.2` |
| SDK ships `useHasChainPermission` for exactly this check | `docs.redbelly.network/pages/eligibility-sdk/client/hooks/useHasChainPermission/` | — |
| Business Identifier contracts can authorise external EOAs | `docs.redbelly.network/pages/eligibility-sdk/onboarding/business/overview/` | — |
| Faucet is FAUCETME, requires a Discord account | `vine.redbelly.network/native-currency/testing-coins/`, verbatim | `D2.1` |
| Nominal RBNT granted on receiving testnet access | same, verbatim | — |

---

## Explorer and verification

| Claim | Source | Harness check |
|---|---|---|
| Routescan mainnet API base | Probed live; Etherscan-format responses | `B3.1`, `F1.2` |
| Routescan testnet API base | same | `B3.2`, `F1.1` |
| Redbelly absent from Etherscan's multichain list | `api.etherscan.io/v2/chainlist` | `F1.3` |
| Hardhat 3 removed `customChains`, uses `chainDescriptors` | `hardhat@3.12.0` type extensions source | — |
| `chainDescriptors` shape (`name`, `blockExplorers.etherscan.{name,url,apiUrl}`) | same source file | — |
| hardhat-verify v3 errors on an empty `apiKey` | `@nomicfoundation/hardhat-verify@3.0.22` source | — |
| Literal verify error strings | `@nomicfoundation/hardhat-errors@3.0.18` descriptors | — |

Error strings quoted in the wiki were taken from the shipped `descriptors.js` message
templates rather than paraphrased, so the error-message index matches what a user's terminal
prints.

---

## Eligibility SDK

| Claim | Source | Harness check |
|---|---|---|
| Package absent from public npm | `registry.npmjs.org` → 404 | `G1.1`, `G1.2` |
| Published to GitHub Packages, auth required | `npm.pkg.github.com` → 401 | `G2.1` |
| Installation page `.npmrc` line missing leading `//` | `docs.redbelly.network/pages/eligibility-sdk/installation/` | `G2.2` (re-checked each run) |
| Getting-started page has the correct form | `docs.redbelly.network/pages/eligibility-sdk/getting-started/` | — |
| Quickstart repo is not publicly accessible | GitHub API 404; git endpoint 401 | `G3.1`, `G3.2` |
| Demo Credential Faucet marked "(under development)" | getting-started page, verbatim | `G3.2` |
| Peer deps: react 18+, viem 2+, wagmi 2+, react-query 5+ | installation page | — |
| AppKit packages required | installation page, verbatim install command | — |
| Backend routes must be `/auth-request`, `/callback`, `/status/:sessionId` | `docs.redbelly.network/pages/eligibility-sdk/backend/`, verbatim | — |
| DID method registration byte values and chain IDs | same page, verbatim code block | — |
| State contract addresses (mainnet `0x1cc7…1456`, testnet `0x6937…8CDC`) | same page | — |
| Authorised issuer DIDs | `docs.redbelly.network/pages/eligibility-sdk/eligibility-sdk/` | — |
| Credential JSON-LD schema URLs resolve | `raw.githubusercontent.com/redbellynetwork/receptor-schema` | `G4.1` |
| QR codes encode ~3 KB reliably | backend and configure-eligibility-criteria pages, verbatim | — |
| Scope must be server-controlled | backend page, verbatim security note | — |
| SDK is React components, not an iframe embed | individual/business onboarding overview pages | — |

**On the spec's "cross-origin issues with SDK iframe".** The documentation presents the SDK
as React components (`<IndividualOnboarding />`, `<BusinessOnboardingSdk />`) rendered into
the host tree, with a QR code and a wallet callback — not an embedded iframe. Entry
[G4] documents the cross-origin problem that actually exists (the wallet must reach your
backend over public HTTPS, hence ngrok, plus CORS on the three routes) rather than restating
the spec's assumption. This was a deliberate decision to describe observed behaviour.

---

## Tooling versions referenced

Read from the npm registry on 8 August 2026:

| Package | Latest | Published |
|---|---|---|
| `hardhat` | 3.12.0 (`hh2` tag: 2.29.0) | 2026-07-30 |
| `@nomicfoundation/hardhat-verify` | 3.0.22 | 2026-07-30 |
| `@nomicfoundation/hardhat-toolbox` | 7.0.0 | 2026-02-26 |
| `@nomicfoundation/hardhat-toolbox-mocha-ethers` | 3.0.7 | 2026-06-04 |
| `ethers` | 6.17.0 | 2026-06-18 |
| `ethereum-waffle` | 4.0.10 | **2023-02-15** |

The Waffle date supports the wiki's statement in [E3] that Redbelly's recommended testing
framework has not been published in over three years. The wiki states the publication date
rather than calling the package "deprecated", because npm does not carry a deprecation
notice for it.

---

## Community sources

Discord invite `https://discord.com/invite/sxwBgwmdq6`, published on the Vine portal.
Verified live 8 August 2026 via the Discord API: guild **Redbelly Network**, ID
`969088176322908160`, 40,719 members, 590 online, invite has no expiry, lands in
`💬︱general`.

Channel question capture and its coverage analysis are recorded separately in
`channel-analysis.md` once the capture is complete.
