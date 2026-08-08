# Community validation: what was attempted and what the channel analysis found

**Deliverable 3 of this task reads:** *"Share draft in Redbelly Discord developer channel.
Incorporate feedback from at least 3 active developers."*

**One of the three responders was obtained**, and the response resolved the guide's single
largest open question. Three was not reachable, and the reason is documented below rather
than left blank, because the obstacle turned out to be a finding in its own right.

## What was obtained

The guide was shared in the Redbelly **Telegram** (`t.me/redbellychat`) on 8 August 2026,
because the Discord has no developer channel and the team routes technical questions to
Telegram. Telegram is named in the task's own infrastructure list.

Moderator **Appie**, a member of the Redbelly team, answered two of the four questions put to
the channel:

> "1. The chain ID is 151. 2. No, they can't. For the other question, @djrbn will be able to help."

This confirmed the mainnet chain ID as 151 ([A1](../wiki/troubleshooting-wiki.md#a1)) and,
more significantly, confirmed that an address which has not claimed network access **cannot**
send a testnet transaction ([D1](../wiki/troubleshooting-wiki.md#d1)).

A second, unprompted message at 16:52 refined it further:

> "By the way, building is still permissionless, but in order to make a transaction (sending),
> you will need to go through KYC/KYB. However, you can receive without the need for KYC/KYB."

That established a three-way distinction the guide did not have: **building and receiving are
permissionless; only sending requires KYC/KYB.** The receiving half was new information and
corrected an inaccuracy — D1 had implied an un-onboarded address was inert on the chain, when
in fact it holds and receives RBNT normally. That matters diagnostically, because it makes
"my address has a balance, so permissioning can't be the problem" a false inference, and that
is precisely the wrong turn D1 exists to prevent.

This is the clearest argument for having posted at all. The correction came from a question
that was not asked, from a source no amount of documentation review would have produced.

D1 is the guide's headline claim and was, until this response, its largest unresolved risk:
the same moderator had stated on 5 August that building on Redbelly is permissionless, and
the entry carried a scope note flagging the apparent contradiction. The response resolves it.
Both statements are true and answer different questions — building is permissionless, and
per-address write access is not. That distinction is now stated in the guide, where it is
likely to save readers the same confusion.

Full record: [`03-VALIDATION-TABLE.md`](03-VALIDATION-TABLE.md). Screenshots of the exchange
are in [`../evidence/screenshots/`](../evidence/screenshots/), filenames timestamped to the
minute each message was sent: `Screenshot_2026-08-08_163403.png` (the post),
`Screenshot_2026-08-08_163627.png` (first reply), `Screenshot_2026-08-08_165306.png`
(follow-up).

---

## There is no Redbelly Discord developer channel

The task assumes one exists. The channel capture in
[`../evidence/channel-analysis.md`](../evidence/channel-analysis.md) and the transcript in
[`../evidence/raw-channel-capture.md`](../evidence/raw-channel-capture.md) show it does not.

From 18 screenshots of the Redbelly Network Discord covering 23 July to 8 August 2026
(retained in [`../evidence/screenshots/`](../evidence/screenshots/)):

- **21 distinct community questions were captured. Zero were developer technical support
  questions.** No question in the sample concerns RPC endpoints, chain IDs, wallet
  configuration, gas, nonces, contract deployment, the faucet, contract verification, or the
  Eligibility SDK. The traffic is ecosystem, roadmap, staking, price, and listings.
- **The server has no `#dev`, `#developers`, `#dev-support` or `#builders` channel.** The
  one channel with an engineering-sounding name, `#technical-analysis`, sits under *Price &
  Market* and is chart discussion.
- **The team routes technical questions elsewhere.** Asked "Please is there a ticket here?",
  a team member answered "No, how can I help?". Builder enquiries are directed to
  `info@redbelly.network`; technical depth is directed to Telegram (`t.me/redbellychat`).

So the venue the task names as the source of developer feedback is not a venue where
developers ask technical questions. With 40,719 members and no developer support channel,
there is no population of "active developers" in that server to obtain three responses from
within any predictable timeframe.

## What this means for the guide

The absence of a developer support surface is the strongest available evidence *for* the
problem this task exists to solve. The task's premise is that developers "wait hours for
Discord support responses." The capture suggests something sharper: there is no Discord
developer support to wait on.

**Recommendation to the Redbelly DAO:** create a `#dev-support` channel. The server has
40,719 members and nowhere for a developer to ask why their transaction reverted.

That recommendation, and a "Where to get help" section mapping each kind of problem to the
route that actually works, are both carried in the published guide as a direct result of this
analysis.

## Why the post got an answer

The post led with four specific, checkable claims rather than a request for review. Two were
assertions that Redbelly's own documentation is wrong. That appears to be what drew a
response where an open-ended "here's my draft, any feedback?" would likely have drawn none:
a specific claim invites correction, and a moderator can answer it in one line.

@djrbn was named as the contact for the two remaining questions. Any further responses will
be logged in the validation table and the guide updated accordingly. Corrections are
prioritised over additions, per the contributing policy.

## The question this resolved

Entry [D1](../wiki/troubleshooting-wiki.md#d1) states that an un-onboarded address cannot
write to the chain. Before the Telegram response, that claim sat against a team member's
5 August statement that building on Redbelly is permissionless, and the entry hedged
accordingly rather than asserting past its evidence.

The moderator's "No, they can't" settles it, and the hedge has been replaced with the
confirmation. The verification harness in [`../harness/`](../harness/) still probes an
un-onboarded address directly (checks `D1.1`, `D1.3`), so the claim now has both a team
confirmation and a reproducible check behind it.
