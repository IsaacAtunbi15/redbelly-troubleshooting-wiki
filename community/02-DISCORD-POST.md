# Discord outreach kit

**Post this today.** Three developers have to respond, and that is the one part of this task
no amount of extra work on my side can speed up. Everything else runs in parallel behind it.

Server: **Redbelly Network** — https://discord.com/invite/sxwBgwmdq6
*(Verified live 8 Aug 2026: 40,719 members, 590 online, invite does not expire. It drops you
in `💬︱general`; move to the developer channel from the sidebar.)*

---

## Why this post is shaped the way it is

"Here's my draft, any feedback?" reliably gets zero replies. This post instead leads with
**three specific, checkable claims** — one of which says the official docs are wrong — and
ends with **three narrow questions**. People who ignore a request for review will still
correct a factual claim about a thing they know, and will still answer a yes/no question.
That is the mechanism we need, because we need replies, not applause.

Attach `wiki/DRAFT-for-discord.md` to the message. If the channel blocks attachments, post
the text and add the repo link once it exists.

---

## The post

> **Building a Redbelly developer troubleshooting wiki — could use a sanity check on 3 findings**
>
> Hey all 👋 I'm putting together a troubleshooting guide for common Redbelly dev errors —
> the RPC/wallet/gas/deployment/SDK stuff that eats an afternoon before you find the answer.
> Draft attached, 11 of 22 entries so far. Every fix gets run against testnet before it
> ships, so I'd rather be corrected now than publish something wrong.
>
> Three things I found while researching that I'd like someone to confirm or shoot down:
>
> **1. The docs disagree on the mainnet chain ID.**
> `vine.redbelly.network/environments/` says **151**. `docs.redbelly.network/pages/general/rb-env/`
> says **154**. chainid.network says 151 is mainnet and 154 is "Redbelly Network TGE" — a
> different network with no published RPC. The eligibility-SDK backend page on
> *docs.redbelly.network itself* registers mainnet as `chainId: 151`, so that site
> contradicts its own env page. I'm treating **151 as correct and 154 as stale**. Is that right?
>
> **2. Gas price reads ~165,000 gwei on mainnet — that's correct, isn't it?**
> `eth_gasPrice` currently returns `0x962477744fe0` ≈ 165,083 gwei. Which lines up exactly
> with the documented model — 21,000 gas × that price = ~3.47 RBNT, and the docs peg a
> simple transfer at US$0.01, implying ~$0.0029/RBNT. So it's the USD-pegged gas model
> working as designed, not a broken oracle. But it does mean **any hardcoded `gasPrice` or
> `maxFeePerGas` from another chain will silently never mine**, which I suspect is behind a
> lot of "my tx is stuck" reports. Does that match what you've seen?
>
> **3. The Eligibility SDK quickstart repo appears to be private.**
> `docs.redbelly.network/pages/eligibility-sdk/getting-started/` step 1 says to run
> `git clone https://github.com/redbellynetwork/eligibility-sdk-quickstart.git`. That URL
> 404s for me logged-out and asks for auth on clone, so I don't think it's public. Same page
> also links a "Demo Credential Faucet" marked *(under development)*. Is there a working
> starter kit somewhere I've missed?
>
> Also — the install page's `.npmrc` snippet has `npm.pkg.github.com/:_authToken=...` where
> I think it needs the leading `//`. The getting-started page has it with the slashes. Minor,
> but it'd fail auth exactly like a bad token, which is a horrible thing to debug.
>
> **4. One I genuinely can't resolve from the docs — is writing to the chain permissioned?**
> The Vine user-access page says every user "must claim their access credential from a network
> accredited issuer before they self enable their account with write access to the network",
> and the Eligibility SDK ships a `useHasChainPermission` hook. So I've written the guide as:
> an address that hasn't been onboarded can read but not write, and its transactions fail as
> bare reverts with no reason string. But I've also seen it said here that *"building on
> redbelly.network is permissionless"* — which I read as being about launching a project rather
> than per-account write access, but I'd rather ask than guess. **Can an address that hasn't
> gone through access.redbelly.network send a testnet transaction, or not?** I'm testing it
> directly, but a straight answer would save me publishing the wrong mental model.
>
> **What would help most:**
> - Anything in the draft that's wrong, out of date, or that you'd phrase differently
> - The one Redbelly error *you* hit that isn't in there yet
> - Where developers actually ask technical questions — I looked and couldn't find a dev
>   channel here, and it seems like Telegram is the place. Is that right?
>
> Happy to credit anyone who contributes. Thanks 🙏

---

## After posting

**Do this immediately:**
- Copy the message link (right-click the message → Copy Message Link) into
  `community/03-VALIDATION-TABLE.md`. It is the evidence that the draft was shared, dated,
  and where.
- Screenshot the posted message. Put it in `evidence/screenshots/`.

**If it is quiet after 24 hours**, post one follow-up in the same thread — not a bump, a new
piece of information:

> Update: ran the chain ID check against both RPCs directly —
> `curl -s -X POST https://governors.mainnet.redbelly.network -H 'Content-Type: application/json' --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'`
> returns `0x97` (151), so the `rb-env` page listing 154 is confirmed stale. Have opened
> [issue/DM] about it. Still keen for eyes on the draft if anyone has 5 minutes 🙏

**If it is quiet after 48 hours**, go direct. Three named developers is the requirement, and
DMs count. Good targets, in order:
1. Anyone who has answered a technical question in the dev channel in the last month.
2. Anyone whose question is *in* our capture from the channel-data pass — they hit the
   problem, so they have an opinion about the fix.
3. Redbelly team members with a dev-facing role.

DM template, kept short and specific:

> Hi — saw you helping people with [specific thing] in the Redbelly dev channel. I'm writing
> a troubleshooting wiki for common Redbelly dev errors and I'd value your eyes on it,
> particularly the [gas / SDK / deployment] section. It's 22 entries, and every fix gets run against
> testnet. Would 5 minutes of "this bit's wrong" be alright? Happy to credit you.

---

## What counts as usable feedback

The task requires feedback from **at least 3 active developers**, incorporated. To make
that verifiable rather than assertable, capture per responder:

- Discord username/handle and (if given) their GitHub
- Date of the response
- What they actually said — verbatim, not paraphrased
- **What changed in the wiki as a result**, with the entry ID

That last line is the one that matters. "Incorporated feedback from 3 developers" with no
diff is an unverifiable claim; "E-C1 gained a paragraph on wallet fee display because
@user said X" is not. Log each one into `community/03-VALIDATION-TABLE.md` as it arrives.

A reply of "looks good" is real feedback and worth logging, but it changes nothing, so it
does not evidence *incorporation*. If someone says that, ask one follow-up: *"Anything you'd
have wanted in here the last time you hit a Redbelly error?"* That converts approval into
something actionable.
