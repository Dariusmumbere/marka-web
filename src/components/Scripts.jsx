import { useState, useEffect, useCallback } from "react";
import { api, r1 } from "../lib/api";
import Spin from "./Spin";
import Review from "./Review";

export default function Scripts({ exam, notify }) {
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(null);
  const [name, setName] = useState("");
  const [lang, setLang] = useState("English");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState("");
  const load = useCallback(() => api(`/exams/${exam.id}/scripts`).then(setList).catch((e) => notify(e.message)), [exam.id]);
  useEffect(() => { load(); }, [load]);

  const upload = async () => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    fd.append("student_name", name); fd.append("feedback_language", lang);
    setBusy("Gemini is reading and marking the script. This takes 10 to 30 seconds…");
    try { const d = await api(`/exams/${exam.id}/scripts`, { method: "POST", body: fd }); setName(""); setFiles([]); await load(); setOpen(d.id); }
    catch (e) { notify(e.message); } finally { setBusy(""); }
  };

  if (open) return <Review id={open} notify={notify} onBack={() => { setOpen(null); load(); }} />;
  if (!exam.rubric) return <div className="empty">Add a marking scheme first, then you can mark scripts.</div>;

  return (
    <>
      <div className="card">
        <h3>Mark a script</h3>
        <div className="row" style={{ marginBottom: 10 }}>
          <input className="grow" placeholder="Student name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          <select style={{ width: 150 }} value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Feedback language"><option>English</option><option>Luganda</option><option>Swahili</option></select>
        </div>
        <label className="drop">
          <input type="file" multiple accept="image/*,application/pdf" onChange={(e) => setFiles([...e.target.files])} />
          {files.length ? `${files.length} page(s) selected` : "Take photos or choose the pages of this student's script"}
        </label>
        <div className="row" style={{ marginTop: 10 }}><button className="btn" disabled={!!busy || !files.length} onClick={upload}>Mark script</button></div>
        {busy && <Spin text={busy} />}
      </div>
      <div className="card slist">
        <h3>{list ? `${list.length} marked` : "Scripts"}</h3>
        {!list ? <Spin text="Loading…" /> : list.length === 0 ? <div className="empty">No scripts yet. Upload the first one above.</div> :
          list.map((s) => (
            <div className="it" key={s.id} onClick={() => setOpen(s.id)}>
              <div className="pct">{s.percent}%</div>
              <div className="grow"><b>{s.student_name}</b><div className="sub" style={{ margin: 0 }}>{r1(s.total_awarded)} / {r1(s.total_max)}</div></div>
              {s.needs_review && <span className="pill low">Review</span>}
              <span className="pill ok" style={{ background: "#e8edfb", color: "var(--brand)" }}>{s.grade}</span>
            </div>
          ))}
      </div>
    </>
  );
}
