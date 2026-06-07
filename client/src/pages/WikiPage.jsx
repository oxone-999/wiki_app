import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSections } from "../api/client.js";
import Polaroid from "../components/Polaroid.jsx";
import "../styles/wiki.css";

// Edit these placeholders or override via the infobox later.
const SUBJECT_NAME = "Anwita Biswas"; // change in code or leave for now
const INFOBOX = {
  photo: "20260207_121042.jpg", // drop server/photos/infobox.jpg
  caption: "The birthday girl ✦",
  fields: [
    ["Born", "8th June 2004"],
    ["From", "Nadia, India"],
    ["Known for", "being so lovely and cute"],
    ["Loves", "obviously me, kuro and daisy. But she loves me the most 💗"],
    [
      "Status",
      "Married to me In my universe, which is the only one that matters.",
    ],
  ],
};

const TABS = ["Article"];

export default function WikiPage() {
  const [sections, setSections] = useState([]);
  const [tab, setTab] = useState("Article");
  const [err, setErr] = useState("");

  useEffect(() => {
    getSections()
      .then(setSections)
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <div className="wiki">
      {/* Starry Night (Van Gogh) backdrop */}
      <div className="starry-bg">
        <div className="swirls" />
        <div className="stars" />
        <div className="stars2" />
        <div className="moon" />
      </div>

      <div className="wiki-top">
        <Link to="/" className="wiki-logo" style={{ textDecoration: "none" }}>
          <span className="wiki-globe">☾</span>
          <span>AnwiPedia</span>
        </Link>
        <input
          className="wiki-search"
          placeholder="Search (only one result…)"
        />
      </div>

      <div className="wiki-body">
        <aside className="wiki-side">
          <h4>Navigation</h4>
          <Link to="/wiki">Main article</Link>
          <Link to="/gallery">Photo universe</Link>
          <Link to="/">Birthday gate</Link>
          <h4>Contents</h4>
          {sections.map((s) => (
            <a key={s._id} href={`#${s.slug}`}>
              {s.title}
            </a>
          ))}
          <h4>Tools</h4>
          <Link to="/admin">Edit (admin)</Link>
        </aside>

        <main className="wiki-main">
          <div className="wiki-tabs">
            {TABS.map((t) => (
              <div
                key={t}
                className={`wiki-tab ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
              </div>
            ))}
          </div>

          {tab !== "Article" ? (
            <p
              className="wiki-p"
              style={{ fontStyle: "italic", marginTop: "1.5rem" }}
            >
              {TAB_MSG[tab]}
            </p>
          ) : (
            <>
              <h1 className="wiki-h1">{SUBJECT_NAME}</h1>
              <p className="wiki-fromline">
                From AnwiPedia, the encyclopedia of one extraordinary person
              </p>

              {/* Infobox */}
              <aside className="infobox">
                <div className="infobox-title">{SUBJECT_NAME}</div>
                <div className="infobox-photo">
                  <Polaroid
                    filename={INFOBOX.photo}
                    caption={INFOBOX.caption}
                    width={240}
                  />
                </div>
                <table>
                  <tbody>
                    {INFOBOX.fields.map(([k, v]) => (
                      <tr key={k}>
                        <th>{k}</th>
                        <td>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </aside>

              <p className="wiki-p">
                Anwita Biswas , born on 8th June 2004, is a person so wonderful
                that a whole encyclopedia is dedicated to her. This is the story
                of her life, her passions, and the universe of love that
                surrounds her.
              </p>

              {/* Contents box */}
              {sections.length > 0 && (
                <div className="wiki-toc">
                  <h4>Contents</h4>
                  <ol>
                    {sections.map((s) => (
                      <li key={s._id}>
                        <a href={`#${s.slug}`}>{s.title}</a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {err && (
                <p className="wiki-p" style={{ color: "crimson" }}>
                  Could not load sections: {err}
                </p>
              )}

              {sections.map((s) => (
                <section key={s._id} id={s.slug}>
                  <h2 className="wiki-h2">{s.title}</h2>
                  <p className="wiki-p">{s.body}</p>
                  {s.images?.length > 0 && (
                    <div className="section-photos">
                      {s.images.map((img) => (
                        <Polaroid
                          key={img}
                          filename={img}
                          caption={s.title}
                          width={190}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))}

              <section>
                <h2 className="wiki-h2">Gallery</h2>
                <p className="wiki-p">
                  Step into a universe made entirely of her — a sky of floating
                  photographs drifting in every direction.
                </p>
                <Link to="/gallery" className="gallery-cta">
                  ✦ Enter your photo universe ✦
                </Link>
              </section>

              <div className="wiki-refs">
                <h2 className="wiki-h2">References</h2>
                <p>1. Everyone who has ever met her. ↩</p>
                <p>2. The universe, on the night she was born. ↩</p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
