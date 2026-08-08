# Community validation record

Evidence for the task's Community Validation deliverable: *"Share draft in Redbelly Discord
developer channel. Incorporate feedback from at least 3 active developers."*

**Status: 1 of 3 responders obtained.** The draft was shared and a Redbelly team moderator
answered two of the four open questions, including the one the guide most depended on. See
[`04-VALIDATION-NOTE.md`](04-VALIDATION-NOTE.md) for why three responders was not reachable
in this venue.

---

## Draft sharing record

| Item | Value |
|---|---|
| Venue | Redbelly Network Telegram (`t.me/redbellychat`) |
| Why Telegram | The Discord has no developer channel and the team routes technical questions to Telegram — evidenced in [`../evidence/channel-analysis.md`](../evidence/channel-analysis.md). Telegram is named in the task's own infrastructure list |
| Date posted | 8 August 2026 |
| Shared | Published guide, all 22 entries, plus four specific questions for confirmation |
| Screenshot | `../evidence/screenshots/Screenshot_2026-08-08_163403.png` (post, 16:34) |

---

## Responder 1 — Appie (Moderator, Redbelly team)

| Field | Value |
|---|---|
| Handle | Appie |
| Role | Moderator, Redbelly Network Telegram |
| Date of response | 8 August 2026, 16:36 |
| Screenshots | `../evidence/screenshots/Screenshot_2026-08-08_163627.png` (reply 1, 16:36) · `../evidence/screenshots/Screenshot_2026-08-08_165306.png` (reply 2, 16:52) |

**What they said (verbatim):**

Message 1 (16:36):

> 1. The chain ID is 151. 2. No, they can't. For the other question, @djrbn will be able to help.

Message 2 (16:52), unprompted follow-up:

> By the way, building is still permissionless, but in order to make a transaction (sending),
> you will need to go through KYC/KYB. However, you can receive without the need for KYC/KYB.

**Questions answered:**

1. *"Which mainnet chain ID is right, 151 or 154?"* → **151**
2. *"Can an address that hasn't been through access.redbelly.network send a testnet tx?"* → **No**

**Volunteered beyond what was asked:** the receive-without-KYC/KYB distinction, which was not
in the guide and corrected an inaccuracy in it.

**What changed as a result:**

| Entry | Change made |
|---|---|
| [A1](../wiki/troubleshooting-wiki.md#a1) | Team confirmation of chain ID 151 added as the first line of evidence, ahead of the registry and self-contradiction arguments |
| [D1](../wiki/troubleshooting-wiki.md#d1) | The scope note hedging the permissioning claim was **replaced with the confirmation**, and the entry was then **corrected** on the strength of message 2. It previously implied a two-way split (build vs. write). The moderator's follow-up establishes three capabilities: building and *receiving* need no KYC/KYB, only *sending* does. A capability table was added, plus an explicit warning that a funded balance is not evidence against this diagnosis — an un-onboarded address holds and receives RBNT normally, which makes "my address has funds, so it can't be permissioning" a false inference. This was the guide's headline claim and its largest open risk |
| [D1](../wiki/troubleshooting-wiki.md#d1) — Solution step 2 | Balance check reworded: a non-zero balance no longer reads as weak evidence against permissioning, because receiving is permissionless |

**Referred on:** @djrbn was named as the contact for the remaining questions (gas model,
SDK quickstart repository). Not yet pursued.

---

## Outstanding questions from the post

| # | Question | Status |
|---|---|---|
| 1 | Mainnet chain ID 151 or 154 | **Answered** — 151 |
| 2 | Can an un-onboarded address transact | **Answered** — no |
| 3 | Is ~165,000 gwei the USD-pegged model working normally | Open — referred to @djrbn |
| 4 | Is there a working Eligibility SDK starter kit | Open — referred to @djrbn |

Questions 3 and 4 are both already evidenced from primary sources in the guide. Confirmation
would strengthen them; their absence does not leave either unsupported.

---

## Additional responders

| Handle | Date | Feedback | Entry changed |
|---|---|---|---|
| | | | |

---

## Feedback received but not incorporated

None. Both answers received were incorporated.
