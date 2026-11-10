import { useState, useEffect, useCallback } from "react";
import { api, r1 } from "../lib/api";
import Spin from "./Spin";
import Review from "./Review";

// "03_Nakato_Grace.pdf" -> "Nakato Grace"
const guessName = (fn) => fn.replace(/\.[^.]+$/, "").replace(/^\d+[_\-\s.]*/, "").replace(/[_\-]+/g, " ").trim();
const PARALLEL = 3;

export default function Scripts({ exam, notify }) {
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(null);
  const [name, setName] = useState("");
  const [lang, setLang] = useState("English");
  const [files, setFiles] = useState([]);
  const [mode, setMode] = useState("many"); // "many" = one student per file, "one" = pages of one student
  const [busy, setBusy] = useState("");
  const [jobs, setJobs] = useState([]);
  const [running, setRunning] = useState(false);
  const load = useCallback(() => api(`/exams/${exam.id}/scripts`).then(setList).catch((e) => notify(e.message)), [exam.id]);
  useEffect(() => { load(); }, [load]);

  const multi = files.length > 1;
  const asBatch = multi && mode === "many";

  const upload = async () => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    fd.append("student_name", name); fd.append("feedback_language", lang);
    setBusy("Gemini is reading and marking the script. This takes 10 to 40 seconds…");
    try { const d = await api(`/exams/${exam.id}/scripts`, { method: "POST", body: fd }); setName(""); setFiles([]); await load(); setOpen(d.id); }
    catch (e) { notify(e.message); } finally { setBusy(""); }
  };

  const runQueue = async (queue) => {
    setRunning(true);
    const update = (i, patch) => setJobs((j) => j.map((x) => (x.i === i ? { ...x, ...patch } : x)));
    let next = 0;
    const worker = async () => {
      while (next < queue.length) {
        const job = queue[next++];
        update(job.i, { status: "marking", error: "" });
        try {
          const fd = new FormData();
          fd.append("files", job.file); fd.append("student_name", job.name); fd.append("feedback_language", lang);
          const d = await api(`/exams/${exam.id}/scripts`, { method: "POST", body: fd });
          update(job.i, { status: "done", scriptId: d.id, percent: d.percent, grade: d.grade });
        } catch (e) { update(job.i, { status: "error", error: e.message }); }
      }
    };
    await Promise.all(Array.from({ length: Math.min(PARALLEL, queue.length) }, worker));
    await load();
    setRunning(false);
  };

  const startBatch = () => {
    const q = files.map((f, i) => ({ i, file: f, name: guessName(f.name) || `Student ${i + 1}`, status: "waiting", error: "" }));
    setJobs(q); setFiles([]); runQueue(q);
  };
  const retryFailed = () => runQueue(jobs.filter((j) => j.status === "error"));

  if (open) return <Review id={open} notify={notify} onBack={() => { setOpen(null); load(); }} />;
  if (!exam.rubric) return <div className="empty">Add a marking scheme first, then you can mark scripts.</div>;

  const done = jobs.filter((j) => j.status === "done").length;
  const failed = jobs.filter((j) => j.status === "error").length;

  return (
    <>
      <div className="card">
        <h3>Mark scripts</h3>
        <div className="row" style={{ marginBottom: 10 }}>
          {!asBatch && <input className="grow" placeholder="Student name (optional)" value={name} onChange={(e) => setName(e.target.value)} />}
          <select style={{ width: 150 }} value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Feedback language"><option>English</option><option>Luganda</option><option>Swahili</option></select>
        </div>
        <label className="drop">
          <input type="file" multiple accept="image/*,application/pdf" onChange={(e) => setFiles([...e.target.files])} />
          {files.length ? `${files.length} file(s) selected` : "Choose script files: one PDF per student, or several photos of one student's pages"}
        </label>
        {multi && (
          <div className="row" style={{ marginTop: 10 }}>
            <span className="sub" style={{ margin: 0 }}>These {files.length} files are:</span>
            <button className={"btn sm " + (mode === "many" ? "" : "ghost")} onClick={() => setMode("many")}>One student per file</button>
            <button className={"btn sm " + (mode === "one" ? "" : "ghost")} onClick={() => setMode("one")}>Pages of one student</button>
          </div>
        )}
        {asBatch && <p className="sub" style={{ margin: "10px 0 0" }}>Students (names come from the file names): {files.map((f) => guessName(f.name) || f.name).join(", ")}</p>}
        <div className="row" style={{ marginTop: 10 }}>
          {asBatch
            ? <button className="btn" disabled={running} onClick={startBatch}>Mark {files.length} students</button>
            : <button className="btn" disabled={!!busy || running || !files.length} onClick={upload}>Mark script</button>}
        </div>
        {busy && <Spin text={busy} />}
      </div>

      {jobs.length > 0 && (
        <div className="card slist">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>{running ? `Marking… ${done} of ${jobs.length} done` : `Finished: ${done} of ${jobs.length} marked`}</h3>
            {!running && failed > 0 && <button className="btn sm" onClick={retryFailed}>Retry {failed} failed</button>}
          </div>
          {jobs.map((j) => (
            <div className="it" key={j.i} style={{ cursor: j.scriptId ? "pointer" : "default" }} onClick={() => j.scriptId && setOpen(j.scriptId)}>
              <div className="grow"><b>{j.name}</b>{j.error && <div className="sub" style={{ margin: 0, color: "var(--red)" }}>{j.error}</div>}</div>
              {j.status === "waiting" && <span className="pill mid">Waiting</span>}
              {j.status === "marking" && <span className="pill mid">Marking…</span>}
              {j.status === "done" && <><span className="pct">{j.percent}%</span><span className="pill ok">{j.grade}</span></>}
              {j.status === "error" && <span className="pill low">Failed</span>}
            </div>
          ))}
        </div>
      )}

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
