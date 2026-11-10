import { useState, useEffect } from "react";
import { API, api, send, r1, confClass, confirm_ } from "../lib/api";
import Spin from "./Spin";

export default function Review({ id, onBack, notify }) {
  const [s, setS] = useState(null);
  const [pg, setPg] = useState(0);
  const [vals, setVals] = useState({});
  const [busy, setBusy] = useState("");
  const apply = (d) => { setS(d); setVals(Object.fromEntries(d.answers.map((a) => [a.question_id, a.marks_awarded]))); };
  useEffect(() => { api(`/scripts/${id}`).then(apply).catch((e) => notify(e.message)); }, [id]);
  if (!s) return <Spin text="Loading script…" />;

  const confirm = async (a) => {
    try { apply(await api(`/scripts/${id}/answers/${encodeURIComponent(a.question_id)}`, send("PATCH", { marks_awarded: parseFloat(vals[a.question_id]) || 0 }))); }
    catch (e) { notify(e.message); }
  };
  const remark = async () => {
    setBusy("Re-marking with Gemini…");
    try { const fd = new FormData(); apply(await api(`/scripts/${id}/remark`, { method: "POST", body: fd })); notify("Re-marked.", "ok"); }
    catch (e) { notify(e.message); } finally { setBusy(""); }
  };
  const del = async () => {
    if (!confirm_("Delete this script?")) return;
    try { await api(`/scripts/${id}`, { method: "DELETE" }); onBack(true); } catch (e) { notify(e.message); }
  };
  const img = s.images[pg];

  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <button className="btn ghost sm" onClick={() => onBack(false)}>← All scripts</button>
        <h2 className="grow" style={{ fontSize: 20 }}>{s.student_name}</h2>
        {s.needs_review && <span className="pill low">Needs your review</span>}
        <button className="btn ghost sm" disabled={!!busy} onClick={remark}>Re-mark</button>
        <button className="btn danger sm" onClick={del}>Delete</button>
      </div>
      {busy && <Spin text={busy} />}
      <div className="split">
        <div className="imgs">
          {s.images.length > 1 && <div className="pg">{s.images.map((_, i) => <button key={i} className={"btn sm " + (i === pg ? "" : "ghost")} onClick={() => setPg(i)}>Page {i + 1}</button>)}</div>}
          {img && (img.mime === "application/pdf" ? <iframe className="pdf" src={API + img.url} title="Script" /> : <img src={API + img.url} alt={`Script page ${pg + 1}`} />)}
        </div>
        <div>
          <div className="card row" style={{ gap: 16 }}>
            <div className="score">{s.grade}</div>
            <div><b style={{ fontSize: 24 }}>{r1(s.total_awarded)} / {r1(s.total_max)}</b><div className="sub" style={{ margin: 0 }}>{s.percent}%</div></div>
          </div>
          {s.answers.map((a) => (
            <div key={a.question_id} className={"ans" + (a.low_confidence ? " flag" : "")}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <b>Q{a.question_id}{a.topic && <span style={{ color: "var(--mute)", fontWeight: 400 }}> · {a.topic}</span>}</b>
                <span className={"pill " + confClass(a.confidence)}>{a.teacher_override ? "Confirmed by you" : `${Math.round(a.confidence * 100)}% sure`}</span>
              </div>
              {a.question_text && <div className="sub" style={{ margin: "2px 0" }}>{a.question_text}</div>}
              <div className="hand">{a.transcribed_answer || "(no answer found)"}</div>
              <div className="row">
                <input className="mk" type="number" step="0.5" min="0" max={a.max_marks} value={vals[a.question_id] ?? ""} onChange={(e) => setVals({ ...vals, [a.question_id]: e.target.value })} aria-label={`Marks for question ${a.question_id}`} />
                <span>/ {a.max_marks}</span>
                <button className="btn ghost sm" onClick={() => confirm(a)}>{a.low_confidence ? "Confirm" : "Save"}</button>
              </div>
              <div className="sub" style={{ margin: "8px 0 0" }}>{a.reason}</div>
            </div>
          ))}
          <div className="card"><h3>Feedback for {s.student_name}</h3><div style={{ whiteSpace: "pre-wrap" }}>{s.feedback}</div></div>
        </div>
      </div>
    </>
  );
}
