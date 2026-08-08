#!/usr/bin/env bash
# Redbelly troubleshooting wiki — full verification run.
#
#   ./run.sh              read-only checks only
#   ./run.sh --deep       + state-changing checks against testnet (needs a funded key)
#
# Produces ../evidence/verification-log.json — the artifact that ships with the submission.

set -uo pipefail   # deliberately NOT -e: a failing check is data, not a reason to abort

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"
EVIDENCE="$HERE/../evidence"
mkdir -p "$EVIDENCE"

DEEP=0
for a in "$@"; do [ "$a" = "--deep" ] && DEEP=1; done

echo "=================================================="
echo " Redbelly wiki verification harness"
echo " $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "=================================================="

# ---- 0. Environment -------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not found on PATH. Install Node 20+ and rerun." >&2
  exit 1
fi
echo "node $(node -v)"
[ -f .env ] && { set -a; . ./.env; set +a; echo "loaded .env"; }

# ---- 1. Read-only checks --------------------------------------------------
echo
echo "--- Stage 1: read-only checks (no key, no funds) ---"
if [ -n "${GITHUB_TOKEN:-}" ]; then
  node verify.mjs --github-token
else
  node verify.mjs
fi
STAGE1=$?

if [ "$DEEP" -eq 0 ]; then
  echo
  echo "Stage 1 complete. Re-run with --deep to add on-chain checks."
  echo "Log: $EVIDENCE/verification-log.json"
  exit 0
fi

# ---- 2. Dependencies ------------------------------------------------------
echo
echo "--- Stage 2: installing Hardhat toolchain ---"
if [ ! -d node_modules ]; then
  npm install || { echo "npm install failed — stage 1 results are still in the log." >&2; exit 0; }
fi

# ---- 3. Compile -----------------------------------------------------------
echo
echo "--- Stage 3: compile with evmVersion=prague ---"
npx hardhat compile
COMPILE_PRAGUE=$?
echo "compile(prague) exit=$COMPILE_PRAGUE"

echo
echo "--- Stage 3b: compile with the deliberately mismatched osaka profile ---"
echo "    (reproduces wiki entry E1's failure condition)"
npx hardhat compile --build-profile osakaMismatch
COMPILE_OSAKA=$?
echo "compile(osakaMismatch) exit=$COMPILE_OSAKA"

# ---- 4. On-chain checks ---------------------------------------------------
if [ -z "${REDBELLY_PRIVATE_KEY:-}" ]; then
  echo
  echo "REDBELLY_PRIVATE_KEY not set — skipping on-chain checks."
  echo "Set it in harness/.env (see .env.example) and rerun with --deep."
  exit 0
fi

echo
echo "--- Stage 4: on-chain checks against Redbelly Testnet (153) ---"
npx hardhat run scripts/deep-checks.ts --network redbellyTestnet
DEEPEXIT=$?

# ---- 5. Contract verification --------------------------------------------
echo
echo "--- Stage 5: Routescan contract verification ---"
if [ -f "$EVIDENCE/deep-checks.json" ]; then
  PROBE=$(node read-json-field.mjs "$EVIDENCE/deep-checks.json" deployedProbe)
  LABEL=$(node read-json-field.mjs "$EVIDENCE/deep-checks.json" constructorLabel)
  if [ -n "$PROBE" ]; then
    echo "verifying $PROBE"
    npx hardhat verify --network redbellyTestnet "$PROBE" "$LABEL" 2>&1 | tee "$EVIDENCE/verify-output.txt"
    VERIFYEXIT=${PIPESTATUS[0]}
    echo "hardhat verify exit=$VERIFYEXIT"
  else
    echo "no deployed contract recorded — skipping"
  fi
else
  echo "deep-checks.json missing — skipping"
fi

# ---- 6. Merge -------------------------------------------------------------
echo
echo "--- Stage 6: merging evidence ---"
node merge-evidence.mjs "$EVIDENCE" "$COMPILE_PRAGUE" "$COMPILE_OSAKA"

echo
echo "=================================================="
echo " Done. Evidence: $EVIDENCE/verification-log.json"
echo "=================================================="
