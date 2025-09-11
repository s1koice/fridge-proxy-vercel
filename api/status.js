export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.status(204).end();
    return;
  }

  try {
    const upstream = 'http://109.67.166.227:82/cgi-bin/cgi.cgi?Status';
    const r = await fetch(upstream, {
      headers: {
        'Accept': 'application/xml, text/plain, */*',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'http://109.67.166.227:82/cgi-bin/cgi.cgi?Layout',
      },
    });
    const text = await r.text();

    // CORS headers for browser
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Cache-Control', 'no-store');

    // Return upstream status & body
    res.status(r.status);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(text);
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(502).json({ error: e.message });
  }
}
