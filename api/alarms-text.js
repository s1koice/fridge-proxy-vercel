export default async function handler(req, res) {
  try {
    const response = await fetch("https://fridge-proxy-vercel.vercel.app/api/alarms");
    const data = await response.json();

    if (!data.alarms || data.alarms.length === 0) {
      return res.status(200).send("✅ Все холодильники в норме");
    }

    // Формируем список строк
    const lines = data.alarms.map(a => `${a.name}: ${a.temp.toFixed(1)}°C`);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(lines.join("\n"));
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка получения данных");
  }
}
