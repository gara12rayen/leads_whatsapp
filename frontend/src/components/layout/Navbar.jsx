export default function Navbar({ title, sub }) {
  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        <p className="sub">{sub}</p>
      </div>
    </div>
  );
}
