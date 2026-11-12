#!/usr/bin/env node
/**
 * openapi-typescript-codegen's own URL-fetching (via @apidevtools/json-schema-ref-parser)
 * refuses to read RFC1918 private IPs (e.g. 192.168.x.x, 10.x.x.x) as an SSRF guard, which
 * always fails for our LAN dev servers. Fetching the spec ourselves and passing it in as a
 * parsed object (a form its `input` option explicitly supports) skips that resolver entirely.
 */
const OpenAPI = require('openapi-typescript-codegen');
const path = require('path');
// Run from the host app root (see its package.json): get-base-url lives in the app's scripts/.
const { getBaseUrl } = require(path.resolve(process.cwd(), 'scripts/get-base-url'));

async function main() {
  const baseUrl = getBaseUrl();
  const schemaUrl = `${baseUrl}/openapi/v1.json`;

  const res = await fetch(schemaUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${schemaUrl}: HTTP ${res.status}`);
  }
  const spec = await res.json();

  await OpenAPI.generate({
    input: spec,
    output: 'src/client-side.Commons/dataLayer/open-api',
    httpClient: 'fetch',
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
