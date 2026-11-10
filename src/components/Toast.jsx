export default function Toast({ m, t }) {
  return <div className={"toast " + t} role="status">{m}</div>;
}
