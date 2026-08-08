# Channel data collection — what I need from you

> **STATUS UPDATE — 8 August 2026.** Part 1 is **done**. Your 18 `#general` screenshots are
> transcribed in `evidence/raw-channel-capture.md` and analysed in
> `evidence/channel-analysis.md`. Result: **21 community questions, 0 developer technical
> support questions** — the Discord has no dev-support channel and the team routes technical
> questions to Telegram and email.
>
> **What is still worth capturing, in priority order:**
> 1. **Telegram — `t.me/redbellychat`.** Named in the task's own infrastructure list, and where
>    the team actually sends technical questions. Highest value by far.
> 2. **`#averer-kyc-support`** in the Discord — the one engineering-adjacent channel.
>
> Part 2 (your own recollection) is still open and still useful. Everything below applies to
> those remaining captures.
>
> ---


**Why this matters:** the task's Coverage benchmark says the wiki *"must address issues
accounting for more than 80% of Discord support questions based on channel analysis."*
Without a sample of real questions, we cannot state a coverage basis honestly, and that
benchmark reads as unmet. With even a rough sample, we can state a real, defensible one.

**We will never invent a percentage.** Whatever you bring back, the wiki states exactly
what it was measured against.

---

## Part 1 — Raw scrape (30 minutes, highest value)

Server: **Redbelly Network** — https://discord.com/invite/sxwBgwmdq6
(Verified live 8 Aug 2026: 40,719 members, 590 online, invite does not expire.)

Go to the developer / support channels. Likely candidates: `#dev-chat`, `#developers`,
`#dev-support`, `#technical-support`, `#builders`. The invite lands you in `💬︱general`,
so use the channel sidebar.

For each channel, scroll back as far as you have patience for — **3 months is plenty,
6 months is excellent** — and copy out every message that is *a developer asking for help*.
Ignore price talk, memes, node-operator questions, and staking questions.

Paste them into `evidence/raw-channel-capture.md` in whatever mess they arrive in. Format
does not matter. Do not clean, summarise, or deduplicate them — I do that, and the
deduplication step is what produces the frequency counts.

What I need per message, where it's visible:
- the question text (verbatim is best — error strings are gold)
- the channel name
- the approximate date

Screenshots are fine too. Drop them in `evidence/screenshots/` and I will transcribe.

**A "good enough" sample is ~40 questions.** Below ~20 the frequency counts stop meaning
anything and we fall back to describing it as a qualitative sample.

### Fast path if scrolling is painful
Use Discord's search box inside the server, one term at a time, and copy the hits:

```
rpc
chain id
metamask
gas
nonce
faucet
revert
deploy
hardhat
verify
sdk
eligibility
testnet
insufficient funds
pending
```

That search-term list is deliberately biased toward what I expect to find, so **also do one
unbiased backward scroll** of a single dev channel. If the scroll turns up recurring
questions my list would have missed, that is the most valuable thing in this whole exercise
— it means the wiki's inventory is wrong and I want to fix it before we publish.

---

## Part 2 — Your own recollection (10 minutes)

Separately from the scrape, write down the questions **you have personally seen recur** in
that server, from memory, in `evidence/recalled-questions.md`. Rough is fine:

> "People constantly ask why MetaMask says the chain ID doesn't match."
> "Someone asks about the faucet not paying out roughly every week."

This is kept as a *separate* source from the scrape, and labelled as such in the wiki's
methodology note. It is weaker evidence than the scrape and gets weighted accordingly, but
it covers the period before whatever the scroll reaches, and it catches things that were
asked in threads or DMs.

---

## What I do with it

1. Deduplicate and bucket every captured question against the 20 wiki entries.
2. Produce `evidence/channel-analysis.md`: a table of buckets, counts, and the percentage
   of the captured sample that the wiki's 22 entries address.
3. State the result in the wiki with its exact denominator — e.g. *"of 47 developer support
   questions captured from #dev-chat between 3 May and 8 Aug 2026, 41 (87%) fall into
   categories addressed by this wiki."*
4. Any recurring question the wiki does **not** cover becomes a new entry, or an explicit
   "known gap" line. Both are better than silence.

If the capture comes back and the real coverage is 62%, the wiki will say 62% and list the
gap. A low honest number costs less than a high false one — a reviewer who is in that
Discord can falsify an invented percentage in about ninety seconds, and doing so would take
down the accuracy, verifiability and overall-standard criteria at the same time.
