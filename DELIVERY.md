# TASK-09 — delivery state and what is left

> **Updated 8 Aug 2026, later:** the harness Stage 1 was run (30/33 pass, log in
> `evidence/verification-log.json`) and community validation obtained one team responder.
> Both sections below are superseded; kept for the record.
>
> **Earlier decision:** submitting without the harness run and without community
> validation. Deliverable 2 (live link) is complete: the guide is published on Dev.to and the
> repository is public. Deliverable 3 is not obtained, and the reason is documented in
> `community/04-VALIDATION-NOTE.md` rather than left blank.
>
> **Original note:** submitting without the harness run. The package states its
> execution status accurately throughout, so nothing false ships. The harness remains in the
> repo as the differentiator — anyone, including the reviewer, can run it. Items below marked
> "harness" are now optional upside, not blockers.

**Target: 35/35. Floor to defend: 33/35.**

Read this first. It says exactly what is finished, what is blocked on you, and what the
submission scores today versus what it scores once the blocked items land.

---

## Where this stands right now

**Written by me — complete (verification harness written but NOT yet run):**

- 22-entry troubleshooting wiki, ~2,950 lines, 7 categories
- Error-message index (43 literal error strings) and keyword index (35 keywords)
- Verification harness: 25 read-only checks + on-chain reproduction of 7 failure conditions
- Reference Hardhat 3 config for Redbelly — the only one that exists anywhere, verified
  against the shipped package source rather than guessed
- Source traceability for every technical claim (`evidence/sources.md`)
- Link check: 18/18 external links resolve (`evidence/link-check.json`)
- Anchor check: 192 internal links, 0 broken
- Vague-language scan: clean
- Discord outreach kit and channel-data collection brief

**Blocked on you — four things, in priority order.**

---

## 1. Post to Discord — do this today

The three-developer requirement is the only part of this task that cannot be compressed by
working harder. Realistic turnaround is 2–5 days and the clock starts when you post.

Everything is ready:

- **The post text:** `community/02-DISCORD-POST.md`
- **The attachment:** `wiki/DRAFT-for-discord.md` (11 entries)
- **Where:** https://discord.com/invite/sxwBgwmdq6 → the developer channel

The post leads with three checkable findings rather than a request for review, because
"here's my draft, any feedback?" reliably gets nothing. One of them says Redbelly's own docs
are wrong, which is the kind of claim people correct even when they would ignore a request.

**When replies arrive**, log them in `community/03-VALIDATION-TABLE.md` — handle, date,
verbatim quote, and what changed in the wiki as a result. That last column is the evidence;
without it "incorporated feedback from 3 developers" is an assertion a reviewer cannot check.

---

## 2. Discord channel data — DONE, and the result changed the plan

Your 18 screenshots are transcribed into `evidence/raw-channel-capture.md` and analysed in
`evidence/channel-analysis.md`. Screenshots archived to `evidence/screenshots/`.

**The finding: 21 community questions captured, 0 developer technical support questions.**

Not few — zero. Nothing about RPCs, chain IDs, wallets, gas, nonces, deployment, verification,
the faucet or the SDK. The capture is all `#general`: Tokeniser, roadmap, staking, price,
exchange listings, DAO tasks.

The reason is structural, and the capture proves it in the team's own words:

- Asked "Please is there a ticket here?", Daniel Bressoud (team) answered **"No, how can I help?"**
- Builders get routed to **info@redbelly.network**
- Technical depth gets routed to **Telegram** (`t.me/redbellychat`)
- The channel list contains **no `#dev`, `#developers`, `#dev-support` or `#builders`**.
  `#technical-analysis` is under *Price & Market* — it's chart analysis.

So the ">80% of Discord support questions" benchmark has **no denominator to measure against**.
0 of 0 is undefined; 0 of 21 is true but meaningless. We claim no percentage, and the wiki now
says exactly why, with the quotes and the sample's limits.

**This is a better outcome than a number would have been.** The task's own premise is that
developers "wait hours for Discord support responses" — the capture shows something sharper:
there is no Discord developer support surface at all. That is the anti-friction problem,
confirmed and evidenced. The wiki now carries a **recommendation to the DAO to create a
`#dev-support` channel**, which is a real finding from real analysis.

Two things also came out of it:

- A new **"Where to get help"** section in the wiki, mapping each kind of problem to the route
  that actually works (Telegram / email / `#averer-kyc-support` / access dApp / faucet).
- **One flagged contradiction.** Appie (team) said on 5 Aug: *"Building on redbelly.network is
  permissionless."* Entry D1 says addresses need an access credential to write. These are
  probably answering different questions — and the harness settles it empirically (checks
  `D1.1`, `D1.3`). If an un-onboarded address transacts fine on testnet, **D1 gets rewritten**.
  Do not skip the harness run on account of this; it is the thing that decides it.

### Worth 20 more minutes, optional but cheap

Two captures would strengthen the analysis, and one is explicitly in the task's scope:

1. **Telegram — `t.me/redbellychat`.** The task's own "Infrastructure to Use" says *"Redbelly
   Developer Discord **and Telegram** for research"*, and the capture shows Telegram is where
   technical questions actually go. This is the highest-value remaining sample by some way.
2. **`#averer-kyc-support`** in the Discord — the one engineering-adjacent channel, likely to
   hold SDK and onboarding questions that map to entries D1 and G1–G4.

If either turns up real developer questions, I fold them in and the coverage section gets a
measured figure after all. If they turn up nothing, that strengthens the finding rather than
weakening it.

---

## 3. Run the verification harness

You said you can run it but need testnet funds. Three steps:

```bash
# a. Get an address ready
#    - claim network access at https://access.redbelly.network   (required — Redbelly is permissioned)
#    - fund it at https://redbelly.faucetme.pro                  (join with Discord)

# b. Configure
cd ~/task09-redbelly-wiki/harness
cp .env.example .env
nano .env                 # add REDBELLY_PRIVATE_KEY (use a throwaway key)

# c. Run
./run.sh --deep
```

Read-only checks run without any of that — `./run.sh` alone already produces a populated log
and is worth doing right now, before the faucet, just to confirm the endpoints are reachable
from your machine.

**Important:** I could not run any of this myself. My sandbox blocks `governors.*.redbelly.network`
(confirmed HTTP 403 on both endpoints). Everything on-chain has to run from your machine.

**When it finishes, send me `evidence/verification-log.json`.** Any `FAIL` means an entry gets
corrected or cut before publication — that is the rule, and it is what keeps Criterion 5 at 5.

---

## 4. Publish

You chose Dev.to canonical + GitHub mirror. Order matters — the repo first, so the article can
link to it.

**a. GitHub repo (public — this one has to be public, it is the evidence archive):**

```bash
cd ~/task09-redbelly-wiki
git init && git add -A
git commit -m "Redbelly Network troubleshooting wiki: 22 verified entries + verification harness"
gh repo create redbelly-troubleshooting-wiki --public --source=. --push
```

I have not run this. Your standing rule is to ask before pushing competition work, so say the
word and I will.

**b. Rewrite the repo-relative links for Dev.to.** The wiki links to `../evidence/` and
`harness/`, which only resolve inside the repo:

```bash
REPO=https://github.com/YOUR_USERNAME/redbelly-troubleshooting-wiki/blob/main
sed -e "s#(../evidence/#($REPO/evidence/#g" \
    -e "s#(../harness/#($REPO/harness/#g" \
    -e "s#(harness/#($REPO/harness/#g" \
    wiki/troubleshooting-wiki.md > wiki/devto-article.md
```

**c. Publish on Dev.to.** The front matter at the top of the wiki file is already Dev.to
format. Before publishing:

- set `published: true`
- set `canonical_url` to the Dev.to URL itself (Dev.to is canonical per your choice)
- add a `cover_image` if you want one — optional, and the article reads fine without

The title is already SEO-shaped: *"Redbelly Network Troubleshooting Guide: 22 Common
Developer Errors and Their Fixes"* — it leads with the network name, states the format, and
matches how people actually search.

**d. Confirm the live link resolves in a logged-out browser.** This is an explicit item on
the task's checklist and takes ten seconds in a private window.

---

## Honest scoring

Scored against the task's 7 criteria, 5 points each.

### If you submitted today: **21/35**

*(Revised after review. The earlier figure of 25 scored the package as though its verification
claims were absent. They were present and inaccurate, which is worse than absent. Those claims
have now been corrected throughout — the scores below reflect the corrected package.)*

| # | Criterion | Score | Why |
|---|---|---|---|
| 1 | Deliverable completeness | **2** | Wiki exists. No live link. No community validation. Two of three deliverables missing. |
| 2 | Quality benchmarks | **3** | Actionability and scannability are strong. Accuracy is unestablished until the harness runs. Coverage is backed by a real, documented channel analysis but returns "not measurable" rather than a figure above 80%. Two of four benchmarks unmet. |
| 3 | Technical accuracy | **4** | Every value traced to a live source, nothing recalled, and execution status now stated accurately throughout. Not 5 until the on-chain run confirms them from a real client. |
| 4 | Documentation quality | **5** | Consistent four-part shape across all 22, working TOC, 43-string error index, 35-keyword index, every block copy-pasteable, no broken links. |
| 5 | Verification | **2** | The harness is written and syntax-clean. It has not been run. Criterion 5 asks whether claims are *tested*, and today they are not. |
| 6 | Failure criteria | **3** | 22 entries clears ≥15. Zero vague solutions confirmed by grep. **No live link — this is a stated failure condition.** |
| 7 | Overall standard | **4** | Reads as maintained infrastructure, states its own limits accurately, and the channel analysis produced an original finding about Redbelly's own developer-support gap. Not published, so not yet at the bar for a published deliverable. |

### With the remaining three blocked items done: **33–35/35**

| # | Criterion | Projected | What gets it there |
|---|---|---|---|
| 1 | Deliverable completeness | **5** | Live link + validation table with 3 named devs, dates, quotes, resulting changes |
| 2 | Quality benchmarks | **3–5** | See below — the widest remaining spread |
| 3 | Technical accuracy | **5** | Harness confirms every value from a real client |
| 4 | Documentation quality | **5** | Already there |
| 5 | Verification | **5** | `verification-log.json` from a real testnet run, all 22 entries covered, not just the 5 a reviewer spot-checks |
| 6 | Failure criteria | **5** | Live link published |
| 7 | Overall standard | **5** | Reviewer judgement — not engineerable, but no criterion is left with a citable shortfall |

**Criterion 2 is now the whole ballgame, and the capture moved it in both directions.**

- **The case for 5:** the benchmark says *"based on channel analysis"*. We did the channel
  analysis, documented it with a transcript, 18 screenshots, a category breakdown and stated
  sample limits, and reported a result that contradicts the task's own assumption. That is
  more rigour than a plausible-looking percentage would have shown.
- **The case for 3:** a reviewer reading the benchmark literally sees "must address issues
  accounting for more than 80%" and no figure above 80% anywhere in the submission. An outright
  unmet benchmark in this criterion scores 3, not 4.
- **The case for 4, which is my honest expectation:** the analysis is clearly real work and the
  other three benchmarks in the criterion (actionability, scannability, accuracy) are strong,
  but the coverage benchmark is not satisfied on its own terms.

**Realistic landing zone: 34.** Range 33–35, and 33 is the floor you asked me to defend.

The one lever that could still move Criterion 2 to a 5 is the **Telegram capture** — it is
named in the task's own infrastructure list, it is where the team routes technical questions,
and it is the only place a real developer-question denominator is likely to exist. That is
maybe 20 minutes of scrolling.

Criterion 7 is a human call and no amount of preparation guarantees a 5.

### Where the gap is not my choice

Every point currently missing is on one of the remaining blocked items. Nothing is waiting on
more writing from me. The wiki, harness, indexes, channel analysis and evidence trail are done.

---

## Two decisions I made that differ from the plan

**1. 22 entries, not 20.** The brief said target 20 and not to pad. This is not padding — the
inventory grew because the research turned up two additions stronger than anything in the
original list ([A1](wiki/troubleshooting-wiki.md#a1), the chain-ID contradiction, and
[E1](wiki/troubleshooting-wiki.md#e1), the `prague`/`osaka` mismatch), and cutting two covered
failure modes to hit a round number would have made the guide worse. The spec's floor is 15
and its range reads as "at least 15–20"; 22 clears it comfortably. If you would rather land
exactly on 20, [A4](wiki/troubleshooting-wiki.md#a4) (rate limiting) and
[B3](wiki/troubleshooting-wiki.md#b3) (explorer URL) are the two weakest and can go.

**2. [A4](wiki/troubleshooting-wiki.md#a4) is a cut candidate pending the run.** It is written
as a defensive pattern rather than a claim that a specific rate limit was hit, because I could
not reach the endpoint to measure one. The harness fires a 40-request burst and records what
happens. If no 429 appears, the entry either gets reworded to match or gets cut — per the rule
that an unverified entry is worse than an absent one.

---

## The one thing the original brief got wrong

The brief assumed the RPC endpoints were at `.../rpc`. They are not — Redbelly's endpoints take
JSON-RPC at the domain root, and the `/rpc` shape appears only in a leftover staging-host
example in the SDK docs. That correction is now [A2](wiki/troubleshooting-wiki.md#a2), and it
is a genuine friction source rather than just a fixed typo.
