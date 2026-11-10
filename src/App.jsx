import { useState, useEffect, useCallback } from "react";
import { api, send, confirm_ } from "./lib/api";
import Sidebar from "./components/Sidebar";
import Spin from "./components/Spin";
import Scheme from "./components/Scheme";
import Scripts from "./components/Scripts";
import Report from "./components/Report";
import Toast from "./components/Toast";

export default function App() {
  const [exams, setExams] = useState(null);
  const [sel, setSel] = useState(null);
  const [exam, setExam] = useState(null);
  const [tab, setTab] = useState("scheme");
  const [form, setForm] = useState({ title: "", subject: "", class_name: "" });
  const [toast, setToast] = useState(null);
  const notify = (m, t = "err") => { setToast({ m, t }); setTimeout(() => setToast(null), 5000); };

  const loadExams = useCallback(() => api("/exams").then(setExams).catch((e) => { setExams([]); notify("Could not reach the server: " + e.message); }), []);
  const loadExam = useCallback(() => (sel ? api(`/exams/${sel}`).then(setExam).catch((e) => notify(e.message)) : null), [sel]);
  useEffect(() => { loadExams(); }, [loadExams]);
  useEffect(() => { setExam(null); loadExam(); }, [loadExam]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try { const x = await api("/exams", send("POST", form)); setForm({ title: "", subject: "", class_name: "" }); await loadExams(); setSel(x.id); setTab("scheme"); }
    catch (err) { notify(err.message); }
  };
  const remove = async () => {
    if (!confirm_("Delete this exam and all its scripts?")) return;
    try { await api(`/exams/${sel}`, { method: "DELETE" }); setSel(null); loadExams(); } catch (e) { notify(e.message); }
  };

  return (
    <>
            <div className="app">
        <Sidebar exams={exams} sel={sel} form={form} setForm={setForm} onCreate={create} onSelect={(x) => { setSel(x.id); setTab(x.has_rubric ? "scripts" : "scheme"); }} />
        <main>
          {!sel ? (
            <div className="empty"><h2>Mark a whole class in minutes</h2><p>Create an exam, add the marking scheme, then photograph each student's script.</p></div>
          ) : !exam ? <Spin text="Loading exam…" /> : (
            <>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div><h2>{exam.title}</h2><p className="sub" style={{ margin: 0 }}>{[exam.subject, exam.class_name].filter(Boolean).join(" · ") || "No subject or class set"}</p></div>
                <button className="btn danger sm" onClick={remove}>Delete exam</button>
              </div>
              <div className="tabs" role="tablist">
                {[["scheme", "Marking scheme"], ["scripts", "Scripts"], ["report", "Class report"]].map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={tab === k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>
                ))}
              </div>
              {tab === "scheme" && <Scheme exam={exam} reload={async () => { await loadExam(); loadExams(); }} notify={notify} />}
              {tab === "scripts" && <Scripts exam={exam} notify={notify} />}
              {tab === "report" && <Report exam={exam} notify={notify} />}
            </>
          )}
        </main>
      </div>
      {toast && <Toast {...toast} />}
    </>
  );
}
