export default async function handler(req, res) {
  try {
    // 1. Запрашиваем твой основной alarms API
    const response = await fetch("https://fridge-proxy-vercel.vercel.app/api/alarms");
    const data = await response.json();

    // 2. Если нет тревог
    if (!data.alarms || data.alarms.length === 0) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).send("✅ כל המקררים תקינים");
    }

    // 3. Формируем список
    const lines = data.alarms.map(a => `${a.name}: ${a.temp.toFixed(1)}°C`);
    const updated = new Date(data.updated).toLocaleString("he-IL");

    const result = `📋 מקררים עם בעיה:\n\n${lines.join("\n")}\n\nעודכן: ${updated}`;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(result);

  } catch (err) {
    res.status(500).send("❌ שגיאה בשרת: " + err.message);
  }
}
