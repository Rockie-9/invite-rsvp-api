import React, { useMemo, useState } from "react";

// ========= 活動設定（你已確定） =========
const EVENT = {
  title: "David 哥 65 歲壽宴｜光影與詩的歲月",
  date: "2026/02/07（六）",
  seatTime: "17:30 入座",
  dinnerTime: "18:00 準時開飯",
  venue: "碧海廚房－敦北店",
  address: "臺北市松山區敦化北路155巷10號1樓",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("碧海廚房 敦北店 臺北市松山區敦化北路155巷10號1樓"),
};

// 詩句輪播（符合壽星：拍照 × 寫詩）
const POEM_LINES = [
  "把時間拍成記憶，把歲月寫成詩。",
  "光落在鏡頭裡，心留在相聚間。",
  "人生不只是一張照片，而是一整本詩集。",
  "今天的笑聲，是明天最清晰的底片。",
  "我們為相遇舉杯——今天改成為健康舉杯（用茶）。",
];

function pickRandom(arr, current) {
  if (arr.length <= 1) return arr[0];
  let next = current;
  while (next === current) next = arr[Math.floor(Math.random() * arr.length)];
  return next;
}

export default function App() {
  const [poem, setPoem] = useState(POEM_LINES[0]);
  const [flash, setFlash] = useState(false);

  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);

  const [rsvp, setRsvp] = useState({
    name: "",
    attendance: "出席",
    people: 1,
    dietType: "葷食",
    restrictions: "無",
    noAlcohol: "否（可喝 / 視情況）",
    note: "",
  });

  const transport = useMemo(
    () => [
      {
        title: "捷運（建議）",
        items: [
          "南京復興站（文湖線／松山新店線）7 或 8 號出口",
          "步行約 8–10 分鐘",
          "18:00 附近為尖峰，建議多預留 5 分鐘",
        ],
      },
      {
        title: "計程車 / Uber",
        items: [
          "定位：碧海廚房－敦北店 或直接貼地址",
          "建議於「敦化北路155巷口」下車後步行入巷",
        ],
      },
      {
        title: "自行開車",
        items: [
          "建議使用周邊收費停車場（晚餐時段可能較滿）",
          "巷內不易臨停，建議停妥後步行前往",
        ],
      },
    ],
    []
  );

  const triggerFlash = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 180);
  };

  const shufflePoem = () => {
    triggerFlash();
    setPoem((cur) => pickRandom(POEM_LINES, cur));
  };

  const validate = () => {
    if (!rsvp.name.trim()) return "請填寫姓名 / 暱稱";
    if (!rsvp.restrictions.trim()) return "飲食禁忌 / 過敏 若無請填「無」";
    if (Number(rsvp.people) <= 0) return "人數請填 1 以上";
    return null;
  };

  const submitToNotion = async () => {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    setSending(true);
    setSentOk(false);

    const payload = {
      name: rsvp.name.trim(),
      attendance: rsvp.attendance,
      people: Number(rsvp.people) > 0 ? Number(rsvp.people) : 1,
      dietType: rsvp.dietType,
      restrictions: rsvp.restrictions.trim() || "無",
      noAlcohol: rsvp.noAlcohol,
      seatTime: "17:30",
      note: (rsvp.note || "").trim(),
    };

    try {
      const resp = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        console.error(data);
        alert("送出失敗：請稍後再試，或直接回覆主辦人。");
        return;
      }

      triggerFlash();
      setSentOk(true);
      alert("已送出回覆，謝謝你！");
    } catch (e) {
      console.error(e);
      alert("送出失敗：網路或系統忙碌，請稍後再試。");
    } finally {
      setSending(false);
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("已複製到剪貼簿。");
    } catch {
      alert("複製失敗，請手動複製。");
    }
  };

  return (
    <div className="page">
      <style>{css}</style>
      {flash && <div className="flash" aria-hidden="true" />}

      <header className="hero">
        <div className="heroTop">
          <div className="badge">INVITATION</div>
          <button className="ghostBtn" onClick={shufflePoem}>
            交換一句詩
          </button>
        </div>

        <h1 className="title">{EVENT.title}</h1>
        <p className="subtitle">
          這一晚，我們不只慶祝年齡，而是一起為一位把生活拍成影像、把心事寫成詩的人，留下值得回看的片刻。
        </p>

        <div className="poemCard" role="note" aria-label="詩句">
          <div className="poemMark">“</div>
          <div className="poemText">{poem}</div>
          <div className="row">
            <button className="btn" onClick={shufflePoem}>
              再來一句
            </button>
            <button className="btn secondary" onClick={() => copy(poem)}>
              複製詩句
            </button>
          </div>
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <h2>活動資訊</h2>
          <div className="kv">
            <div className="k">日期</div>
            <div className="v">{EVENT.date}</div>

            <div className="k">時間</div>
            <div className="v">
              {EVENT.seatTime}／{EVENT.dinnerTime}
              <div className="muted">建議 17:20–17:25 抵達，避免交通與找路壓力。</div>
            </div>

            <div className="k">地點</div>
            <div className="v">
              <div className="strong">{EVENT.venue}</div>
              <div className="muted">{EVENT.address}</div>
              <div className="row">
                <a className="linkBtn" href={EVENT.mapsUrl} target="_blank" rel="noreferrer">
                  開啟 Google Maps 導航
                </a>
                <button className="linkBtn" onClick={() => copy(EVENT.address)}>
                  複製地址
                </button>
              </div>
            </div>

            <div className="k">備註</div>
            <div className="v">
              不一定需要準備禮物，人到心意到。為了順利安排座位與餐點，請在下方 RSVP 填寫葷素、禁忌與是否不喝酒（僅用於安排）。
            </div>
          </div>
        </section>

        <section className="card">
          <h2>交通抵達方式</h2>
          <div className="transport">
            {transport.map((b) => (
              <div key={b.title} className="transportBlock">
                <div className="transportTitle">{b.title}</div>
                <ul>
                  {b.items.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="row">
            <a className="btn" href={EVENT.mapsUrl} target="_blank" rel="noreferrer">
              立即導航
            </a>
            <button className="btn secondary" onClick={() => copy(EVENT.mapsUrl)}>
              複製導航連結
            </button>
          </div>
        </section>

        <section className="card">
          <h2>出席回覆 RSVP（用於排座位與餐點）</h2>
          <p className="muted">
            為確保 17:30 入座順暢、18:00 準時開飯，請協助回覆以下資訊（約 1 分鐘）。
          </p>

          <div className="form">
            <label className="field">
              <span>姓名 / 暱稱（必填）</span>
              <input
                value={rsvp.name}
                onChange={(e) => setRsvp({ ...rsvp, name: e.target.value })}
                placeholder="例如：Rockie"
              />
            </label>

            <div className="twoCol">
              <label className="field">
                <span>出席狀態</span>
                <select
                  value={rsvp.attendance}
                  onChange={(e) => setRsvp({ ...rsvp, attendance: e.target.value })}
                >
                  <option value="出席">出席</option>
                </select>
              </label>

              <label className="field">
                <span>人數</span>
                <input
                  type="number"
                  min={1}
                  value={rsvp.people}
                  onChange={(e) => setRsvp({ ...rsvp, people: e.target.value })}
                />
              </label>
            </div>

            <div className="twoCol">
              <label className="field">
                <span>飲食類型（葷/素）</span>
                <select
                  value={rsvp.dietType}
                  onChange={(e) => setRsvp({ ...rsvp, dietType: e.target.value })}
                >
                  <option value="葷食">葷食</option>
                  <option value="全素">全素</option>
                  <option value="蛋奶素">蛋奶素</option>
                  <option value="彈性素">彈性素</option>
                </select>
              </label>

              <label className="field">
                <span>當天一定不喝酒</span>
                <select
                  value={rsvp.noAlcohol}
                  onChange={(e) => setRsvp({ ...rsvp, noAlcohol: e.target.value })}
                >
                  <option value="是（完全不喝）">是（完全不喝）</option>
                  <option value="否（可喝 / 視情況）">否（可喝 / 視情況）</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span>飲食禁忌 / 過敏（若無請填「無」）</span>
              <input
                value={rsvp.restrictions}
                onChange={(e) => setRsvp({ ...rsvp, restrictions: e.target.value })}
                placeholder="例如：海鮮過敏 / 不吃牛 / 無"
              />
            </label>

            <label className="field">
              <span>備註（排座位用，可留空）</span>
              <textarea
                rows={3}
                value={rsvp.note}
                onChange={(e) => setRsvp({ ...rsvp, note: e.target.value })}
                placeholder="例如：會晚到 10 分鐘 / 希望坐走道 / 需要避免某食材..."
              />
            </label>

            <div className="row">
              <button className="btn" onClick={submitToNotion} disabled={sending}>
                {sending ? "送出中…" : "送出回覆"}
              </button>
              {sentOk && <span className="okTag">已送出</span>}
              <button
                className="btn secondary"
                onClick={() =>
                  copy(
                    `RSVP：${rsvp.name || "（未填姓名）"}｜${rsvp.attendance}｜${rsvp.people}人｜${rsvp.dietType}｜禁忌：${
                      rsvp.restrictions || "無"
                    }｜不喝酒：${rsvp.noAlcohol}`
                  )
                }
              >
                複製我的回覆（備用）
              </button>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>小提醒</h2>
          <ul className="tips">
            <li>17:30 入座，18:00 準時開飯；餐廳 20:30 休息，請盡量提前抵達。</li>
            <li>大家填的葷素、禁忌與是否不喝酒，僅用於排座位與餐點安排。</li>
            <li>如果臨時變動（人數/飲食），直接聯絡Rockie更新即可。</li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <div className="muted">© {new Date().getFullYear()} Invitation</div>
      </footer>
    </div>
  );
}

const css = `
:root{
  --bg: #0b0c10;
  --card: rgba(255,255,255,0.06);
  --card2: rgba(255,255,255,0.09);
  --text: rgba(255,255,255,0.92);
  --muted: rgba(255,255,255,0.65);
  --line: rgba(255,255,255,0.12);
  --shadow: 0 10px 30px rgba(0,0,0,0.35);
  --radius: 18px;
  --radius2: 14px;
  --max: 1080px;
}
*{box-sizing:border-box;}
html,body{height:100%;}
body{
  margin:0;
  background:
    radial-gradient(1200px 600px at 10% 0%, rgba(255,255,255,0.08), transparent 60%),
    radial-gradient(900px 600px at 90% 10%, rgba(255,255,255,0.06), transparent 65%),
    radial-gradient(900px 600px at 50% 100%, rgba(255,255,255,0.05), transparent 70%),
    var(--bg);
  color: var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans TC", Arial, "PingFang TC", "Microsoft JhengHei", sans-serif;
}
.page{min-height:100%;}
.flash{
  position:fixed; inset:0;
  background: rgba(255,255,255,0.8);
  animation: flash 180ms ease-out forwards;
  pointer-events:none;
  z-index:9999;
}
@keyframes flash { from {opacity:1;} to {opacity:0;} }

.hero{
  max-width: var(--max);
  margin: 0 auto;
  padding: 42px 18px 16px;
}
.heroTop{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}
.badge{
  font-size: 12px;
  letter-spacing: 0.18em;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
}
.ghostBtn{
  background: transparent;
  border: 1px solid var(--line);
  color: var(--text);
  padding: 10px 12px;
  border-radius: 999px;
  cursor:pointer;
}
.ghostBtn:hover{background: rgba(255,255,255,0.06);}

.title{
  margin: 18px 0 10px;
  font-size: clamp(26px, 4.2vw, 44px);
  line-height: 1.08;
}
.subtitle{
  margin: 0 0 16px;
  color: var(--muted);
  max-width: 72ch;
}

.poemCard{
  margin-top: 18px;
  padding: 18px 16px;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.04));
  box-shadow: var(--shadow);
}
.poemMark{font-size: 28px; opacity: 0.8;}
.poemText{font-size: 18px; line-height: 1.65; margin-top: 6px;}

.grid{
  max-width: var(--max);
  margin: 0 auto;
  padding: 12px 18px 46px;
  display:grid;
  grid-template-columns: 1fr;
  gap: 14px;
}
@media (min-width: 920px){
  .grid{ grid-template-columns: 1fr 1fr; }
}

.card{
  padding: 18px 16px;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: var(--card);
  box-shadow: var(--shadow);
}
.card h2{ margin: 2px 0 12px; font-size: 18px; }
.kv{
  display:grid;
  grid-template-columns: 96px 1fr;
  gap: 10px 14px;
  padding: 10px 0 6px;
  border-top: 1px dashed var(--line);
}
.k{color: var(--muted); font-size: 13px; padding-top: 2px;}
.v{font-size: 14px;}
.strong{font-weight: 700;}
.muted{color: var(--muted);}
.row{display:flex; gap:10px; flex-wrap:wrap; margin-top: 12px; align-items:center;}

.btn{
  background: rgba(255,255,255,0.92);
  color: #0b0c10;
  border: 0;
  padding: 10px 12px;
  border-radius: 999px;
  cursor:pointer;
  font-weight: 650;
}
.btn:hover{opacity: 0.92;}
.btn:disabled{opacity:0.6; cursor:not-allowed;}
.btn.secondary{
  background: rgba(255,255,255,0.10);
  color: var(--text);
  border: 1px solid var(--line);
}
.linkBtn{
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--line);
  padding: 9px 12px;
  border-radius: 999px;
  text-decoration:none;
  cursor:pointer;
  color: var(--text);
}
.linkBtn:hover{background: rgba(255,255,255,0.09);}

.transport{display:grid; gap: 10px;}
.transportBlock{
  padding: 12px;
  border-radius: var(--radius2);
  background: var(--card2);
  border: 1px solid var(--line);
}
.transportTitle{font-weight: 750; margin-bottom: 6px;}
.transportBlock ul{margin:0; padding-left: 18px;}
.transportBlock li{margin: 6px 0;}

.form{margin-top: 10px;}
.field{display:flex; flex-direction:column; gap: 6px; margin-bottom: 10px;}
.field span{color: var(--muted); font-size: 12px;}
input, select, textarea{
  border-radius: 12px;
  border: 1px solid var(--line);
  padding: 10px 12px;
  background: rgba(0,0,0,0.25);
  color: var(--text);
  outline:none;
}
input:focus, select:focus, textarea:focus{border-color: rgba(255,255,255,0.24);}

.twoCol{
  display:grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
@media (min-width: 520px){
  .twoCol{grid-template-columns: 1fr 1fr;}
}

.okTag{
  padding: 8px 10px;
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
}

.tips{margin:0; padding-left: 18px;}
.tips li{margin: 8px 0; color: var(--text);}

.footer{
  max-width: var(--max);
  margin: 0 auto;
  padding: 10px 18px 26px;
}
`;
