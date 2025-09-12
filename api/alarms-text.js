export default async function handler(req, res) {
  try {
    // Берём актуальные тревоги из твоего JSON-эндпоинта
    const r = await fetch("https://fridge-proxy-vercel.vercel.app/api/alarms", {
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`Upstream status ${r.status}`);
    const data = await r.json();

    // Время обновления (по ИЛ)
    const updatedDate = data?.updated ? new Date(data.updated) : new Date();
    const updatedStr = updatedDate.toLocaleString("he-IL", { hour12: false });

    const alarms = Array.isArray(data?.alarms) ? data.alarms : [];

    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    // Если тревог нет — короткий ответ
    if (!alarms.length) {
      return res.status(200).send(`✅ אין התראות\nעודכן: ${updatedStr}`);
    }

    // Обёртка для корректного отображения числа+единицы в RTL (FSI … PDI)
    const rtl = (s) => `\u2068${s}\u2069`;

    // Собираем строки: #ID ИМЯ: 12.3℃  (используем символ ℃, чтобы не "ломался" порядок)
    const lines = alarms.map((a) => {
      const id = a?.id ?? "?";
      const name = a?.name ?? "—";
      const t = Number.isFinite(a?.temp) ? a.temp : null;
      const tempStr = t === null ? "חיישן?" : `${t.toFixed(1)}\u2103`; // \u2103 = ℃
      return `#${id} ${name}: ${rtl(tempStr)}`;
    });

    const body = `📋 התראות מקררים\n\n${lines.join("\n")}\n\nעודכן: ${updatedStr}`;
    res.status(200).send(body);
  } catch (e) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(500).send("❌ שגיאה: " + e.message);
  }
}
