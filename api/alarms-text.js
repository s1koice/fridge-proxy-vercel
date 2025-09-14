export default async function handler(req, res) {
  try {
    const r = await fetch("https://fridge-proxy-vercel.vercel.app/api/alarms", {
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`Upstream status ${r.status}`);
    const data = await r.json();

    const updatedDate = data?.updated ? new Date(data.updated) : new Date();
    const updatedStr = updatedDate.toLocaleString("he-IL", { hour12: false });

    const alarms = Array.isArray(data?.alarms) ? data.alarms : [];

    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    // Если тревог нет
    if (!alarms.length) {
      return res.status(200).send(`✅ אין התראות\nעודכן: ${updatedStr}`);
    }

    // Фильтрация и коррекция
    const filtered = alarms
      .filter((a) => {
        // убрать холодильник 19
        if (a.id === "19") return false;
        // игнорировать холодильник 6
        if (a.id === "6") return false;
        return true;
      })
      .map((a) => {
        let temp = Number.isFinite(a?.temp) ? a.temp : null;

        // для холодильника 13-14 уменьшаем на 5 градусов
        if (a.id === "13-14" && temp !== null) {
          temp = temp - 5;
        }

        const id = a?.id ?? "?";
        const name = a?.name ?? "—";
        const tempStr = temp === null ? "חיישן?" : `${temp.toFixed(1)}°C`;
        return `#${id} ${name}: ${tempStr}`;
      });

    if (!filtered.length) {
      return res.status(200).send(`✅ אין התראות (לאחר סינון)\nעודכן: ${updatedStr}`);
    }

    const body = `📋 התראות מקררים\n\n${filtered.join("\n")}\n\nעודכן: ${updatedStr}`;
    res.status(200).send(body);
  } catch (e) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(500).send("❌ שגיאה: " + e.message);
  }
}
