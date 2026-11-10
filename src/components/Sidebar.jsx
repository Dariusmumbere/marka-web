import Spin from "./Spin";

export default function Sidebar({ exams, sel, form, setForm, onCreate, onSelect }) {
  return (
    <aside>
      <h1 className="logo">Marka</h1>
      <form onSubmit={onCreate} style={{ display: "grid", gap: 6, marginBottom: 16 }}>
        <input placeholder="New exam title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <input placeholder="Class" value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} />
        <button className="btn" disabled={!form.title.trim()}>Create exam</button>
      </form>
      {exams === null ? <Spin text="Waking the server…" /> : exams.map((x) => (
        <button key={x.id} className={"exam" + (sel === x.id ? " on" : "")} onClick={() => onSelect(x)}>
          {x.title}
          <small>{[x.subject, x.class_name].filter(Boolean).join(" · ")}{x.script_count ? ` · ${x.script_count} marked` : ""}</small>
        </button>
      ))}
    </aside>
  );
}
