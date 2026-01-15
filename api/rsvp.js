// api/rsvp.js
export default async function handler(req, res) {
  // 同網域（Vercel 同專案）其實不需要 CORS；這裡先放寬，避免手機瀏覽器預檢卡住
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const token = process.env.NOTION_TOKEN;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!token || !databaseId) {
      return res.status(500).json({
        ok: false,
        error: "Missing NOTION_TOKEN / NOTION_DATABASE_ID (check Vercel Env: Production)",
      });
    }

    // 可靠讀取 JSON body（避免 req.body 在不同環境不是 object）
    const body = await readJsonBody(req);

    const {
      name,
      attendance, // select
      dietType, // select
      noAlcohol, // select
      seatTime, // select
      people, // number
      restrictions, // rich_text
      note, // rich_text
    } = body || {};

    const n = (name || "").trim();
    if (!n) return res.status(400).json({ ok: false, error: "name is required" });

    // ====== Select 值白名單（請確保與 Notion DB 選項「一字不差」）======
    const allowedAttendance = new Set(["出席", "可能出席", "無法出席"]);
    const allowedDietType = new Set(["葷食", "全素", "蛋奶素", "彈性素"]);
    const allowedNoAlcohol = new Set(["是（完全不喝）", "否（可喝 / 視情況）"]);
    const allowedSeatTime = new Set(["17:30"]);

    const att = allowedAttendance.has(attendance) ? attendance : "出席";
    const diet = allowedDietType.has(dietType) ? dietType : "葷食";
    const na = allowedNoAlcohol.has(noAlcohol) ? noAlcohol : "否（可喝 / 視情況）";
    const st = allowedSeatTime.has(seatTime) ? seatTime : "17:30";

    const p = Number(people);
    const ppl = Number.isFinite(p) && p > 0 ? p : 1;

    // ====== 你要求的 property 對照：完全使用以下 8 個 key ======
    const properties = {
      // Aa → title
      name: { title: [{ type: "text", text: { content: n } }] },

      // ▼ → select
      attendance: { select: { name: att } },
      dietType: { select: { name: diet } },
      noAlcohol: { select: { name: na } },
      seatTime: { select: { name: st } },

      // # → number
      people: { number: ppl },

      // ≡ → rich_text
      restrictions: {
        rich_text: [
          {
            type: "text",
            text: { content: (restrictions || "無").trim() || "無" },
          },
        ],
      },
      note: {
        rich_text: [
          {
            type: "text",
            text: { content: (note || "").trim() },
          },
        ],
      },
    };

    const notionResp = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
      }),
    });

    const data = await notionResp.json();

    if (!notionResp.ok) {
      // 把 Notion 原始錯誤吐回去，方便你在前端/Logs 直接看到真正原因
      return res.status(notionResp.status).json({ ok: false, error: data });
    }

    return res.status(200).json({ ok: true, pageId: data.id });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

// 可靠讀取 JSON body（支援 req.body 已被 parse、或是 stream 字串）
function readJsonBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);

    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}
