import { useState, useEffect } from "react";
import { API, api } from "../lib/api";
import Spin from "./Spin";

export default function Report({ exam, notify }) {
  const [rep, setRep] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setRep(null); api(`/exams/${exam.id}/report`).then(setRep).catch(() => {}); }, [exam.id]);
  const gen = async () => {
    setBusy(true);
    try { setRep(await api(`/exams/${exam.id}/report`, { method: "POST" })); } catch (e) { notify(e.message); } finally { setBusy(false); }
  };
  const st = rep?.stats, ins = rep?.insights;
  const max = st ? Math.max(1, ...st.distribution.map((b) => b.count)) : 1;

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <button className="btn" disabled={busy} onClick={gen}>{rep ? "Refresh report" : "Generate class report"}</button>
        <a className="btn ghost" style={{ textDecoration: "none" }} href={`${API}/exams/${exam.id}/export.csv`}>Download marks (CSV)</a>
      </div>
      {busy && <Spin text="Analysing the whole class…" />}
      {!rep && !busy && <div className="empty">Mark at least one script, then generate the class report.</div>}
      {rep && (
        <>
          <div className="stats">
            <div className="stat"><b>{st.students_marked}</b>students marked</div>
            <div className="stat"><b>{st.average_percent}%</b>class average</div>
            <div className="stat"><b>{st.pass_rate_percent}%</b>scored 50% or more</div>
            <div className="stat"><b>{st.lowest_percent}–{st.highest_percent}%</b>score range</div>
          </div>
          <div className="card"><h3>Summary</h3><p style={{ margin: 0 }}>{ins.summary}</p></div>
          <div className="split">
            <div className="card">
              <h3>Score distribution</h3>
              <div className="hist">{st.distribution.map((b) => <div key={b.band}><b style={{ height: (b.count / max) * 100 + "%" }} />{b.band}</div>)}</div>
            </div>
            <div className="card">
              <h3>Average by question</h3>
              {st.questions.map((x) => (
                <div key={x.question_id} style={{ marginBottom: 10 }}>
                  <div className="row" style={{ justifyContent: "space-between", fontSize: 13 }}><span>Q{x.question_id} {x.topic && `· ${x.topic}`}</span><b>{x.average_percent}%</b></div>
                  <div className="bar"><i className={x.average_percent < 50 ? "w" : ""} style={{ width: x.average_percent + "%" }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="split">
            <div className="card"><h3>Where the class struggled</h3>
              {ins.weak_topics.map((w, i) => <p key={i} style={{ margin: "0 0 10px" }}><b>{w.topic}</b>{w.question_ids?.length ? ` (Q${w.question_ids.join(", Q")})` : ""}<br /><span className="sub">{w.why}</span></p>)}
            </div>
            <div className="card"><h3>What went well</h3><ul style={{ margin: 0, paddingLeft: 18 }}>{ins.strengths.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
          </div>
          <div className="card"><h3>Plan for the next lesson</h3><ol style={{ margin: 0, paddingLeft: 20 }}>{ins.reteach_plan.map((x, i) => <li key={i} style={{ marginBottom: 6 }}>{x}</li>)}</ol></div>
          {st.needs_attention.length > 0 && <div className="card"><h3>Students who need support</h3>{st.needs_attention.map((s) => <div key={s.script_id}>{s.student_name}: {s.percent}%</div>)}</div>}
        </>
      )}
    </>
  );
}
