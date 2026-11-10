import { useState, useEffect } from "react";
import { api, send, r1 } from "../lib/api";
import Spin from "./Spin";

export default function Scheme({ exam, reload, notify }) {
  const [q, setQ] = useState(exam.rubric?.questions || []);
  const [files, setFiles] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => setQ(exam.rubric?.questions || []), [exam.rubric]);

  const extract = async () => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    fd.append("text", text);
    setBusy("Gemini is reading the marking scheme…");
    try { await api(`/exams/${exam.id}/rubric/extract`, { method: "POST", body: fd }); await reload(); setFiles([]); setText(""); notify("Marking scheme extracted. Check it below.", "ok"); }
    catch (e) { notify(e.message); } finally { setBusy(""); }
  };
  const save = async () => {
    setBusy("Saving…");
    try { await api(`/exams/${exam.id}/rubric`, send("PUT", { title: exam.title, questions: q.map((x) => ({ ...x, max_marks: parseFloat(x.max_marks) || 0 })) })); await reload(); notify("Marking scheme saved.", "ok"); }
    catch (e) { notify(e.message); } finally { setBusy(""); }
  };
  const set = (i, k, v) => setQ(q.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const total = q.reduce((s, x) => s + (parseFloat(x.max_marks) || 0), 0);

  return (
    <>
      <div className="card">
        <h3>{exam.rubric ? "Replace the marking scheme" : "Add the marking scheme"}</h3>
        <label className="drop">
          <input type="file" multiple accept="image/*,application/pdf" onChange={(e) => setFiles([...e.target.files])} />
          {files.length ? `${files.length} file(s) selected` : "Choose photos or a PDF of the marking scheme"}
        </label>
        <textarea style={{ marginTop: 10 }} placeholder="Or paste the marking scheme as text" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" disabled={!!busy || (!files.length && !text.trim())} onClick={extract}>Extract marking scheme</button>
        </div>
        {busy && <Spin text={busy} />}
      </div>
      {q.length > 0 && (
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>{q.length} questions, {r1(total)} marks</h3>
            <div className="row">
              <button className="btn ghost sm" onClick={() => setQ([...q, { question_id: String(q.length + 1), question_text: "", max_marks: 1, model_answer: "", marking_guidance: "", topic: "" }])}>Add question</button>
              <button className="btn sm" disabled={!!busy} onClick={save}>Save changes</button>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>No.</th><th>Question</th><th>Marks</th><th>Model answer</th><th>Marking guidance</th><th>Topic</th><th /></tr></thead>
              <tbody>
                {q.map((x, i) => (
                  <tr key={i}>
                    <td style={{ width: 60 }}><input value={x.question_id} onChange={(e) => set(i, "question_id", e.target.value)} /></td>
                    <td><textarea value={x.question_text} onChange={(e) => set(i, "question_text", e.target.value)} /></td>
                    <td style={{ width: 70 }}><input type="number" step="0.5" min="0" value={x.max_marks} onChange={(e) => set(i, "max_marks", e.target.value)} /></td>
                    <td><textarea value={x.model_answer} onChange={(e) => set(i, "model_answer", e.target.value)} /></td>
                    <td><textarea value={x.marking_guidance} onChange={(e) => set(i, "marking_guidance", e.target.value)} /></td>
                    <td style={{ width: 120 }}><input value={x.topic} onChange={(e) => set(i, "topic", e.target.value)} /></td>
                    <td><button className="btn danger sm" aria-label="Remove question" onClick={() => setQ(q.filter((_, j) => j !== i))}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
