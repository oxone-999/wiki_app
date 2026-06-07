import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  login,
  setToken,
  getToken,
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getWishes,
  photoUrl,
} from "../api/client.js";
import "../styles/admin.css";

function Login({ onIn }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const { token } = await login(u, p);
      setToken(token);
      onIn();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <form className="admin-login" onSubmit={submit}>
      <h2>Admin</h2>
      <input
        placeholder="username"
        value={u}
        onChange={(e) => setU(e.target.value)}
      />
      <input
        type="password"
        placeholder="password"
        value={p}
        onChange={(e) => setP(e.target.value)}
      />
      {err && <p className="admin-err">{err}</p>}
      <button type="submit">Enter</button>
      <Link to="/wiki" className="admin-link">
        ← back to wiki
      </Link>
    </form>
  );
}

function SectionRow({ section, onSaved, onDeleted }) {
  const [title, setTitle] = useState(section.title);
  const [body, setBody] = useState(section.body || "");
  const [order, setOrder] = useState(section.order ?? 0);
  const [msg, setMsg] = useState("");

  const save = async () => {
    setMsg("saving…");
    try {
      const updated = await updateSection(section._id, {
        title,
        body,
        images: section.images || [],
        order: Number(order),
      });
      onSaved(updated);
      setMsg("saved ✓");
    } catch (e) {
      setMsg(e.message);
    }
  };

  return (
    <div className="sec-row">
      <div className="sec-head">
        <input
          className="sec-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="sec-order"
          type="number"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          title="order"
        />
        <button onClick={save}>Save</button>
        <button className="danger" onClick={() => onDeleted(section._id)}>
          Delete
        </button>
        <span className="admin-muted">{msg}</span>
      </div>
      <textarea
        className="sec-body"
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(!!getToken());
  const [sections, setSections] = useState([]);
  const [wishes, setWishes] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [tab, setTab] = useState("sections");

  const load = () => {
    getSections()
      .then(setSections)
      .catch(() => {});
  };
  useEffect(() => {
    if (authed) load();
  }, [authed]);

  const addSection = async () => {
    if (!newTitle.trim()) return;
    const s = await createSection({
      title: newTitle.trim(),
      body: "[Write about her here…]",
    });
    setSections((arr) => [...arr, s]);
    setNewTitle("");
  };

  const loadWishes = async () => {
    try {
      setWishes(await getWishes());
    } catch {
      setWishes([]);
    }
  };

  const logout = () => {
    setToken("");
    setAuthed(false);
  };

  if (!authed)
    return (
      <div className="admin">
        <Login onIn={() => setAuthed(true)} />
      </div>
    );

  return (
    <div className="admin">
      <header className="admin-top">
        <h1>AnwiPedia — Admin</h1>
        <nav>
          <button
            className={tab === "sections" ? "on" : ""}
            onClick={() => setTab("sections")}
          >
            Sections
          </button>
          <button
            className={tab === "wishes" ? "on" : ""}
            onClick={() => {
              setTab("wishes");
              loadWishes();
            }}
          >
            Wishes
          </button>
          <Link to="/wiki">View wiki</Link>
          <button className="danger" onClick={logout}>
            Logout
          </button>
        </nav>
      </header>

      {tab === "sections" ? (
        <>
          <div className="add-section">
            <input
              placeholder="New section title (e.g. Favorite Songs)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSection()}
            />
            <button onClick={addSection}>＋ Add section</button>
          </div>

          {sections.length === 0 && (
            <p className="admin-muted">No sections yet. Add one above.</p>
          )}
          {sections.map((s) => (
            <SectionRow
              key={s._id}
              section={s}
              onSaved={(u) =>
                setSections((arr) => arr.map((x) => (x._id === u._id ? u : x)))
              }
              onDeleted={async (id) => {
                await deleteSection(id);
                setSections((arr) => arr.filter((x) => x._id !== id));
              }}
            />
          ))}
        </>
      ) : (
        <div className="wishes">
          <p className="admin-muted">
            Secret wishes she made (she believes these are private).
          </p>
          {wishes.length === 0 && <p className="admin-muted">No wishes yet.</p>}
          {wishes.map((w) => (
            <div className="wish-row" key={w._id}>
              <div className="wish-when">
                {new Date(w.createdAt).toLocaleString()}
              </div>
              <ul>
                {w.messages.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
