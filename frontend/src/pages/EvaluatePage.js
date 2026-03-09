import { useState } from "react";
import { Plus, Trash2, Play, Trophy, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../services/api";

const EMPTY_CASE = { question: "", expected: "", category: "general" };
const CATEGORIES = ["general", "factual", "technical", "reasoning", "creative"];

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color }}>{value}/10</span>
      </div>
      <div style={{ height: 3, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value * 10}%`, background: color, borderRadius: 2, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const map = { PASS: "badge-pass", PARTIAL: "badge-partial", FAIL: "badge-fail" };
  return <span className={`badge ${map[verdict] || "badge-partial"}`}>{verdict}</span>;
}

function ResultCard({ result, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card fade-up" style={{ animationDelay: `${index * 0.05}s`, marginBottom: 12 }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {result.category}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
            {result.question}
          </div>
        </div>
        <button style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0 0 0 16px" }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: "var(--radius)", borderLeft: "3px solid var(--border-bright)" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 4, textTransform: "uppercase" }}>Expected</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{result.expected}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {result.model_scores.map(score => (
              <div key={score.model_name} style={{
                background: "var(--bg-elevated)",
                borderRadius: "var(--radius)",
                padding: 16,
                border: "1px solid var(--border)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--accent)", fontWeight: 600 }}>
                    {score.model_name}
                  </span>
                  <VerdictBadge verdict={score.verdict} />
                </div>

                <ScoreBar label="Accuracy" value={score.accuracy} color="var(--accent)" />
                <ScoreBar label="Hallucination Risk" value={score.hallucination_risk} color="var(--green)" />
                <ScoreBar label="Tone & Clarity" value={score.tone_clarity} color="var(--yellow)" />

                <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", display: "flex", gap: 12 }}>
                  <span>⚡ {score.latency_ms}ms</span>
                  <span>🔤 {score.tokens_used} tokens</span>
                </div>

                {score.reasoning && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                    {score.reasoning}
                  </div>
                )}

                {score.response && (
                  <div style={{ marginTop: 10, padding: "8px 12px", background: "var(--bg-surface)", borderRadius: 6, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, maxHeight: 100, overflowY: "auto" }}>
                    {score.response}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvaluatePage() {
  const [runName, setRunName] = useState("");
  const [testCases, setTestCases] = useState([{ ...EMPTY_CASE }]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const addCase = () => setTestCases(t => [...t, { ...EMPTY_CASE }]);
  const removeCase = (i) => setTestCases(t => t.filter((_, idx) => idx !== i));
  const updateCase = (i, field, value) => setTestCases(t => t.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const loadSamples = async () => {
    try {
      const data = await api.getSampleTestCases();
      setTestCases(data.test_cases);
    } catch (e) { setError(e.message); }
  };

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.runEvaluation({
        run_name: runName || `Run ${new Date().toLocaleTimeString()}`,
        test_cases: testCases.filter(tc => tc.question && tc.expected),
      });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "10px 14px",
    color: "var(--text-primary)",
    fontFamily: "var(--font-display)",
    fontSize: 13,
    outline: "none",
    transition: "border-color var(--transition)",
  };

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
          Run Evaluation
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Compare LLM responses across accuracy, hallucination risk, and tone.
        </p>
      </div>

      {/* Config */}
      <div className="card fade-up-1" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
              Run Name
            </label>
            <input
              style={inputStyle}
              placeholder="e.g. factual benchmark v1"
              value={runName}
              onChange={e => setRunName(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost" onClick={loadSamples}>
            Load Sample Cases
          </button>
        </div>
      </div>

      {/* Test Cases */}
      <div className="fade-up-2">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Test Cases — {testCases.length}
          </div>
          <button className="btn btn-ghost" onClick={addCase} style={{ padding: "6px 14px", fontSize: 12 }}>
            <Plus size={13} /> Add Case
          </button>
        </div>

        {testCases.map((tc, i) => (
          <div key={i} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--accent-dim)", border: "1px solid var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--accent)", flexShrink: 0 }}>
                {i + 1}
              </div>
              <select
                value={tc.category}
                onChange={e => updateCase(i, "category", e.target.value)}
                style={{ ...inputStyle, width: "auto", cursor: "pointer" }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {testCases.length > 1 && (
                <button className="btn btn-danger" onClick={() => removeCase(i)} style={{ padding: "6px 10px", marginLeft: "auto" }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>Question</label>
                <textarea
                  style={{ ...inputStyle, resize: "vertical", minHeight: 70 }}
                  placeholder="What question should the model answer?"
                  value={tc.question}
                  onChange={e => updateCase(i, "question", e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>Expected Answer</label>
                <textarea
                  style={{ ...inputStyle, resize: "vertical", minHeight: 70 }}
                  placeholder="What is the correct / ideal answer?"
                  value={tc.expected}
                  onChange={e => updateCase(i, "expected", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Run Button */}
      <div className="fade-up-3" style={{ marginTop: 20, marginBottom: 32 }}>
        <button
          className="btn btn-primary"
          onClick={handleRun}
          disabled={loading || testCases.every(tc => !tc.question)}
          style={{ padding: "12px 32px", fontSize: 15 }}
        >
          {loading ? <><span className="spinner" /> Evaluating Models…</> : <><Play size={15} /> Run Evaluation</>}
        </button>
        {loading && (
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Querying 3 models + judging responses… this takes ~30 seconds
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "14px 18px", background: "var(--red-dim)", border: "1px solid rgba(255,77,109,0.2)", borderRadius: "var(--radius)", color: "var(--red)", fontSize: 13, marginBottom: 24 }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          {/* Summary bar */}
          <div className="card fade-up" style={{ marginBottom: 20, background: "var(--bg-elevated)", borderColor: "var(--accent-glow)" }}>
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Winner</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Trophy size={16} /> {result.winner}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Test Cases</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{result.total_cases}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Eval Time</div>
                <div style={{ fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={14} /> {result.evaluation_time_s}s
                </div>
              </div>
              {result.summary.map(s => (
                <div key={s.model_name}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.model_name}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.model_name === result.winner ? "var(--green)" : "var(--text-primary)" }}>
                    {s.overall_score}/10
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Per-case results */}
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
            Results — click to expand
          </div>
          {result.results.map((r, i) => <ResultCard key={i} result={r} index={i} />)}
        </div>
      )}
    </div>
  );
}
