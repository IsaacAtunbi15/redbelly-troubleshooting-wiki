# Discord channel analysis

**Analysed:** 8 August 2026
**Source:** `raw-channel-capture.md` — 18 screenshots of `💬︱general`, Redbelly Network
Discord, covering 23 July – 8 August 2026 (16 days)
**Screenshots retained:** `evidence/screenshots/` (18 files)

---

## Headline finding

**Of 21 distinct community questions captured, zero were developer technical support
questions.**

Not "few". Zero. No question in the sample mentions an RPC endpoint, a chain ID, a wallet
configuration, gas, a nonce, a contract deployment, a faucet failure, contract verification,
or the Eligibility SDK.

This is a real result about the channel, not a shortfall in the capture. It changes what can
honestly be claimed about coverage, and it is reported here rather than worked around.

---

## Question breakdown

| # | Category | Count | Share |
|---|---|---|---|
| 1 | Ecosystem & Tokeniser (what it is, what assets, competitive position) | 6 | 29% |
| 2 | Roadmap & timing ("when will X happen") | 4 | 19% |
| 3 | Market positioning / RWA sector ranking | 2 | 10% |
| 4 | Token & staking (staking site, whale tiers, delegated staking) | 3 | 14% |
| 5 | Builder / partnership enquiries (non-technical) | 2 | 10% |
| 6 | DAO & task board | 1 | 5% |
| 7 | Support process ("is there a ticket here?") | 1 | 5% |
| 8 | Legal / regional restrictions | 1 | 5% |
| 9 | Moderation | 1 | 5% |
| — | **Developer technical support** | **0** | **0%** |
| | **Total** | **21** | |

Greetings, link shares and reactions are excluded from the 21.

---

## Why there are no developer questions in `#general`

Three pieces of evidence from the capture itself, all from Redbelly team members:

**1. There is no support ticket system.**

> DeRealAlomzy: "Please is there a ticket here?"
> Daniel Bressoud *(team)*: "No, how can I help?" — 5 Aug 2026

**2. Builders are routed to email.**

> Daniel Bressoud *(team)*: "We love builders. If you want to build on the Redbelly Network,
> the best would be to reach out to our team info@redbelly.network" — 5 Aug 2026

**3. Technical depth is routed to Telegram.**

> Daniel Bressoud *(team)*: "You should join our Telegram and check Alan's update on this
> topic." https://t.me/redbellychat — 5 Aug 2026
> Daniel Bressoud *(team)*: "For insights, the best would be to ask Alan Burt directly (he is
> active on our Telegram)" — 5 Aug 2026

**And there is no developer channel to ask in.** The captured sidebar shows:

- **General Discussion:** `general`, `hi-gmgn`, `community-tweets`, `memes`,
  `averer-kyc-support`, `Ama Stage`
- **Price & Market:** `price-talk`, `technical-analysis`, `interesting-projects`
- **DAO-Public:** `dao-announcements`, `voting-announcements`, `game-announcements`, …

No `#dev`, `#developers`, `#dev-support`, `#builders` or `#technical-support`.
`#technical-analysis` sits under *Price & Market* — it is chart analysis, not engineering.
The only engineering-adjacent channel is `#averer-kyc-support`, which is scoped to KYC and
onboarding.

The Redbelly Network Discord is, as configured, a **community and token-holder server**.
Developer support happens in Telegram, by email, and through direct contact.

---

## What this means for the coverage benchmark

The task's Coverage benchmark reads:

> "Must address issues accounting for more than 80% of Discord support questions based on
> channel analysis."

The channel analysis was performed. It returned a denominator of **zero developer support
questions** in the sampled channel and period. A ">80% of Discord support questions" figure
is therefore not measurable against this server as configured — 0 of 0 is undefined, and
0 of 21 total questions would be both true and meaningless, since none of the 21 is the kind
of question a troubleshooting wiki is for.

**Three things follow, and the wiki states all three:**

1. **No percentage is claimed.** Inventing one would be trivially falsifiable by any reviewer
   in that Discord, and would discredit the technical content along with it.
2. **The issue inventory's actual sourcing is stated plainly** — Redbelly's own documentation,
   live probing of the published infrastructure, toolchain source, and Solidity release
   history. That sourcing is stronger evidence than a question tally would have been, because
   four of the 22 entries document defects that exist in Redbelly's documentation *right now*
   and are re-checked on every harness run.
3. **The absence is reported as a finding**, because it is one — and it is the same finding
   the task itself is premised on.

---

## The finding is the task's own premise, confirmed

The task description opens:

> "Developers encountering standard technical roadblocks … are forced to rely on trial-and-error
> or **wait hours for Discord support responses**. This creates unnecessary friction."

The capture shows something sharper than slow responses: **there is no Discord developer
support surface at all.** A developer who hits a chain ID conflict or a permissioned-network
revert, joins the official Discord, and looks for somewhere to ask will find a community
server with no dev channel and no ticket system, and will be pointed at an email address.

That is the anti-friction problem, stated more strongly than the task assumed. It also means
this wiki is filling a real gap rather than duplicating an existing support channel.

**Recommendation to the Redbelly DAO**, which follows directly from the analysis: create a
`#dev-support` channel in the Discord. The server has 40,719 members and no place for a
developer to ask why their transaction reverted.

---

## Limits of this sample — stated plainly

- **One channel.** `#general` only. `#averer-kyc-support` was not captured and is the one
  remaining channel likely to contain SDK/onboarding questions.
- **16 days.** 23 July – 8 August 2026. A longer scrollback could surface occasional
  developer questions that this window missed.
- **Discord only.** Telegram (`t.me/redbellychat`) was not sampled, and the capture shows it
  is where technical questions are actually routed. The task's own "Infrastructure to Use"
  lists *"Redbelly Developer Discord **and Telegram** for research"*, so Telegram is in scope
  and is the higher-value target.
- **Possible hidden channels.** A developer channel gated behind a role would not appear in
  this sidebar. Not ruled out.

If a further capture changes the picture, this file and the wiki's coverage section get
updated together, and the wiki's "last verified" date moves with them.

---

## Cross-check: does the capture contradict any wiki entry?

One item, flagged rather than buried.

**"Building on redbelly.network is permissionless"** — Appie (team), 5 Aug 2026.

Wiki entry [D1] states that an address needs a network access credential before it can write.
The two are reconcilable: "permissionless" in the sense of *no approval needed to launch a
project*, versus per-account write enablement, which Redbelly's user-access page describes
explicitly. The remark was made mid-debate about whether Tokeniser crowds out other builders,
so it is most likely answering a different question.

It is not settled by argument. Harness checks `D1.1` and `D1.3` settle it empirically against
testnet. If an un-onboarded address transacts successfully, D1 gets rewritten. This is also
on the question list for the Discord post.
