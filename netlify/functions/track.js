/**
 * Netlify Function: track
 * Route: POST /.netlify/functions/track
 *
 * Secure proxy between the site's analytics.js and Power BI's Push Dataset API.
 * The real Power BI endpoint URL is stored in a Netlify environment variable
 * (POWERBI_ENDPOINT) so it never appears in client-side source code.
 *
 * Setup:
 *   1. In Power BI: create a Streaming Dataset → API type → use the schema below.
 *   2. Copy the "Push URL" Power BI gives you.
 *   3. In Netlify dashboard → Site settings → Environment variables →
 *      add key "POWERBI_ENDPOINT" with the Push URL as the value.
 *   4. Deploy — the proxy is live automatically.
 *
 * Power BI dataset schema (name: "MC Analytics"):
 *   timestamp    DateTime
 *   session_id   Text
 *   event        Text
 *   page         Text
 *   device       Text
 *   browser      Text
 *   referrer     Text
 *   utm_source   Text
 *   utm_medium   Text
 *   utm_campaign Text
 *   scroll_pct   Number
 *   is_bot       Text
 *   extra        Text
 *
 * Expected request body from analytics.js:
 *   { "rows": [ { ...row }, ... ] }
 *
 * Power BI Push API accepts:
 *   POST <push_url>
 *   Content-Type: application/json
 *   { "rows": [ { ...row } ] }
 */

exports.handler = async (event) => {
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Pre-flight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: 'Method not allowed' };
  }

  const endpoint = process.env.POWERBI_ENDPOINT;
  if (!endpoint) {
    // Not configured — accept silently so the site still works in dev
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, note: 'POWERBI_ENDPOINT not set — event dropped' }),
    };
  }

  // Parse incoming body
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (_) {
    return { statusCode: 400, headers: CORS_HEADERS, body: 'Invalid JSON' };
  }

  const rows = payload.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return { statusCode: 400, headers: CORS_HEADERS, body: 'rows array required' };
  }

  // Validate + sanitise each row (drop unexpected keys, enforce schema)
  const ALLOWED_KEYS = new Set([
    'timestamp', 'session_id', 'event', 'page', 'device', 'browser',
    'referrer', 'utm_source', 'utm_medium', 'utm_campaign',
    'scroll_pct', 'is_bot', 'extra',
  ]);

  const clean = rows.slice(0, 100).map(row => {    // cap at 100 rows per flush
    const out = {};
    for (const key of ALLOWED_KEYS) {
      out[key] = row[key] !== undefined ? String(row[key]).slice(0, 500) : '';
    }
    // Ensure scroll_pct is numeric
    out.scroll_pct = Number(row.scroll_pct) || 0;
    // Ensure timestamp is a valid ISO date; reject events > 1 hour old
    const ts = new Date(row.timestamp);
    if (isNaN(ts.getTime()) || (Date.now() - ts.getTime()) > 3_600_000) {
      out.timestamp = new Date().toISOString();
    } else {
      out.timestamp = ts.toISOString();
    }
    return out;
  });

  // Forward to Power BI
  let pbiResponse;
  try {
    pbiResponse = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows: clean }),
    });
  } catch (err) {
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to reach Power BI', detail: err.message }),
    };
  }

  if (!pbiResponse.ok) {
    const text = await pbiResponse.text().catch(() => '');
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error:  'Power BI returned an error',
        status: pbiResponse.status,
        detail: text.slice(0, 200),
      }),
    };
  }

  return {
    statusCode: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, rows: clean.length }),
  };
};
