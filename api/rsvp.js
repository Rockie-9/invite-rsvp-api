export default async function handler(req, res) {
  const ALLOWED_ORIGINS = [
    "https://<your-github-username>.github.io", // 你 GitHub Pages 的網域
  ];

  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const token = process.env.NOTION_TOKEN;
    const databaseId = process.env.NOTION_DATABASE_ID;
    if (!token || !databaseId) {
      return res
        .status(500)
        .json({ ok: false, error: "Missing NOTION_TOKEN / NOTION_DATABASE_ID" });
    }

    const {
      name,
      attendance,    // 出席/可能出席/無法出席
      dietType,      // 葷食/全素/蛋奶素/彈性素
      restrictions,  // 飲食禁忌/過敏
      noAlcohol,     // 是（完全不喝）/否（可喝 / 視情況）
      people,        // number
      seatTime,      // 固定 17:30
      note,          // 備註（排座位用）
    } = req.body || {};

    const n = (name || "").trim();
    if (!n) return res.status(400).json({ ok: false, error: "name is required" });

    // 僅允許 DB 既有選項（避免 Notion 寫入失敗）
    const allowedAttendance = new Set(["出席", "可能出席", "無法出席"]);
    const allowedDietType = new Set(["葷食", "全素", "蛋奶素", "彈性素"]);
    const allowedNoAlcohol = new Set(["是（完全不喝）", "否（可喝 / 視情況）"]);
    const allowedSeatTime =