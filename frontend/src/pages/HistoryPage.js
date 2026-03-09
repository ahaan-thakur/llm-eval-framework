import { useEffect, useState } from "react";
import { Trophy, Clock, Layers, Trash2, ChevronRight, RefreshCw } from "lucide-react";
import { api } from "../services/api";

function RunRow({ run, onDelete, onView }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this run? This cannot be undone.")) return;
    setDeleting(true);
    try { await onDelete(run.id); } finally { setDeleting(false); }
  };

  const date = new Date(run.created_at);
  const dateStr = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="card"
      onClick={() => onView(run)}
      style={{ marginBottom: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 20, padding: "16px 20px" }}
    >
      {/* Date */}
      <div style={{ minWidth: 80, textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
          {dateStr.split(" ")[0]}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {dateStr.split(" ").slice(1).join(" ")}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{timeStr}</div>
      </div>

      <div style={{ width: 1, height: 40, background: "var(--border)", flexShrink: 0 }} />

      {/* Name */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{run.run_name || "Unnamed Run"}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(run.models_evaluated || []).map(m => (
            <span key={m} style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--accent)", background: "var(--accent-dim)", padding: "2px 8px", borderRadius: 4 }}>{m}</span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 24, flexShrink: 0 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Cases</div>
          <div style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
            <Layers size={12} color="var(--text-muted)" /> {run.total_cases}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Winner</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
            <Trophy size={12} /> {run.winner}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Time</div>
          <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, justifyContent: "center", color: "var(--text-secondary)" }}>
            <Clock size={12} /> {run.eval_time_s}s
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={deleting}
          style={{ padding: "6px 10px" }}
        >
          {deleting ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Trash2 size={13} />}
        </button>
        <ChevronRight size={16} color="var(--text-muted)" style={{ alignSelf: "center" }} />
      </div>
    </div>
  );
}

function RunDetail({ run, onBack }) {
  const [full, setFull] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRun(run.id).then(setFull).catch(console.error).finally(() => setLoading(false));
  }, [run.id]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-secondary)", paddingTop: 80 }}>
      <span className="spinner" /> Loading run details…
    </div>
  );

  return (
    <div>
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 24, padding: "8px 16px", fontSize: 13 }}>
        ← Back to History
      </button>

      <div className="fade-up" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>{full.run_name || "Unnamed Run"}</h2>
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {new Date(full.created_at).toLocaleString()} · {full.eval_time_s}s · Winner: <span style={{ color: "var(--green)" }}>{full.winner}</span>
        </div>
      </div>

      {/* Summary table */}
      <div className="card fade-up-1" style={{ marginBottom: 24, overflowX: "auto" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Model Summary</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Model", "Accuracy", "Anti-Halluc", "Tone", "Overall", "Pass Rate", "Latency"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(full.summary || []).map((s, i) => (
              <tr key={s.model_name} style={{ borderBottom: "1px solid var(--border)", background: i === 0 ? "var(--accent-dim)" : "transparent" }}>
                <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 12, color: i === 0 ? "var(--accent)" : "var(--text-primary)", fontWeight: i === 0 ? 600 : 400 }}>{s.model_name} {i === 0 && "🏆"}</td>
                <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{s.avg_accuracy}</td>
                <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", color: "var(--green)" }}>{s.avg_hallucination_risk}</td>
                <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", color: "var(--yellow)" }}>{s.avg_tone_clarity}</td>
                <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{s.overall_score}</td>
                <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", color: "var(--green)" }}>{s.pass_rate}%</td>
                <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{s.avg_latency_ms}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Per-question results */}
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
        Detailed Results — {full.results?.length} questions
      </div>
      {(full.results || []).map((r, i) => (
        <div key={i} className="card fade-up" style={{ marginBottom: 12, animationDelay: `${i * 0.04}s` }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", marginBottom: 6 }}>{r.category}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{r.question}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14, padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: 6, borderLeft: "3px solid var(--border-bright)" }}>
            <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase" }}>Expected: </span>
            {r.expected}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {(r.model_scores || []).map(s => (
              <div key={s.model_name} style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius)", padding: "12px 14px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{s.model_name}</span>
                  <span className={`badge badge-${s.verdict?.toLowerCase()}`}>{s.verdict}</span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 11, fontFamily: "var(--font-mono)" }}>
                  <span style={{ color: "var(--accent)" }}>acc {s.accuracy}</span>
                  <span style={{ color: "var(--green)" }}>hall {s.hallucination_risk}</span>
                  <span style={{ color: "var(--yellow)" }}>tone {s.tone_clarity}</span>
                </div>
                {s.reasoning && <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{s.reasoning}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HistoryPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHistory();
      setRuns(data.runs || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    await api.deleteRun(id);
    setRuns(r => r.filter(run => run.id !== id));
  };

  if (selected) return <RunDetail run={selected} onBack={() => setSelected(null)} />;

  return (
    <div>
      <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>History</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>All past evaluation runs — click any row to drill in.</p>
        </div>
        <button className="btn btn-ghost" onClick={load} style={{ padding: "8px 16px" }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-secondary)", paddingTop: 40 }}>
          <span className="spinner" /> Loading history…
        </div>
      )}
      {error && (
        <div style={{ padding: "14px 18px", background: "var(--red-dim)", borderRadius: "var(--radius)", color: "var(--red)", fontSize: 13 }}>{error}</div>
      )}
      {!loading && !error && runs.length === 0 && (
        <div style={{ textAlign: "center", paddingTop: 80, color: "var(--text-secondary)" }}>
          <p>No runs yet.</p>
          <p style={{ fontSize: 13, marginTop: 8, color: "var(--text-muted)" }}>Run your first evaluation to see it here.</p>
        </div>
      )}
      {runs.map(run => (
        <RunRow key={run.id} run={run} onDelete={handleDelete} onView={setSelected} />
      ))}
    </div>
  );
}
