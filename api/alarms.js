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

    // --- простой парсер XML без внешних библиотек ---
    function parse(xmlText) {
      const map = {};
      let i = 0;
      while (true) {
        const start = xmlText.indexOf('<u i="list_', i);
        if (start === -1) break;
        const afterAttr = start + '<u i="list_'.length; // позиция после 'list_'
        const endAttr = xmlText.indexOf('">', afterAttr);
        if (endAttr === -1) break;

        const idxStr = xmlText.slice(afterAttr, endAttr);
        const cdataStart = xmlText.indexOf('<![CDATA[', endAttr);
        const cdataEnd = xmlText.indexOf(']]>', cdataStart);
        const closeU = xmlText.indexOf('</u>', cdataEnd);

        if (cdataStart === -1 || cdataEnd === -1 || closeU === -1) {
          i = endAttr + 1; // пропускаем битую ноду
          continue;
        }

        const val = xmlText.slice(cdataStart + 9, cdataEnd).trim();
        const idxNum = parseInt(idxStr, 10);
        if (Number.isFinite(idxNum)) map[idxNum] = val;

        i = closeU + 4;
      }

      const keys = Object.keys(map).map(Number).sort((a, b) => a - b);
      const rows = [];
      for (const base of keys) {
        if (base % 6 !== 0) continue; // каждая запись начинается на кратном 6
        const idRaw   = map[base];
        const name    = map[base + 1];
        const tempRaw = map[base + 2];
        if (!idRaw || !name) continue;

        const idNum = parseInt(String(idRaw), 10);
        if (!(idNum >= 1 && idNum <= 19)) continue; // только 1..19

        const tNum = Number(String(tempRaw || '').replace(',', '.'));
        rows.push({ id: String(idRaw).trim(), name, temp: Number.isFinite(tNum) ? tNum : null });
      }
      return rows;
    }

    const rows = parse(xml);

    // Только текущие превышения порога (без правила «30 минут»)
    const alarms = rows.filter(r => {
      const freezer = /מקפ|freez/i.test(r.name);
      const thr = freezer ? -1 : 9;
      if (r.temp == null) return true;   // проблема сенсора -> считаем аварией
      return r.temp > thr;
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      updated: new Date().toISOString(),
      count: alarms.length,
      alarms,
    });
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: e.message });
  }
}
