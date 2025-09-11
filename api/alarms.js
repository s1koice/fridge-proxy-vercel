export default async function handler(req, res) {
  // CORS / preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    return res.status(204).end();
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
    const xml = await r.text();

    // соберём map(list_i -> value)
    const map = {};
    const re = /<u i="list_(\\d+)"><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/u>/g;
    let m;
    while ((m = re.exec(xml)) !== null) map[Number(m[1])] = m[2].trim();

    const alarms = [];
    const keys = Object.keys(map).map(Number).sort((a,b)=>a-b);
    for (const base of keys) {
      if (base % 6 !== 0) continue;
      const idRaw = map[base];
      const name  = (map[base+1] || '').trim();
      const tempS = (map[base+2] || '').replace(',', '.');
      if (!idRaw || !name) continue;

      // только 1..19
      const idNum = parseInt(String(idRaw), 10);
      if (!(idNum >= 1 && idNum <= 19)) continue;

      const temp = Number.parseFloat(tempS);
      const freezer = /מקפ|freez/i.test(name);
      const thr = freezer ? -1 : 9;

      // NaN трактуем как проблему сенсора
      const isAlarm = Number.isFinite(temp) ? temp > thr : true;
      if (isAlarm) alarms.push({ id: String(idRaw), name, temp, freezer });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({
      updated: new Date().toISOString(),
      count: alarms.length,
      alarms,
    });
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(502).json({ error: e.message });
  }
}
