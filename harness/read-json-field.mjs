#!/usr/bin/env node
/**
 * Prints one top-level field from a JSON file, or nothing if it is missing.
 * Used by run.sh to pull the deployed address out of deep-checks.json without
 * depending on jq being installed.
 *
 *   node read-json-field.mjs <file> <field>
 */
import { readFileSync } from "node:fs";

const [file, field] = process.argv.slice(2);
try {
  const value = JSON.parse(readFileSync(file, "utf8"))[field];
  process.stdout.write(value == null ? "" : String(value));
} catch {
  process.stdout.write("");
}
