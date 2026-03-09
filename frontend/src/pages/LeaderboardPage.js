import { useEffect, useState } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Trophy, RefreshCw } from "lucide-react";
import { api } from "../services/api";

const MODEL_COLORS = {
  "llama-3.1-8b":  "#00e5ff",
  "llama-3.3-70b": "#00ff9d",
  "gemma2-9b":     "#ffd900",
};
const FALLBACK_COLORS = ["#00e5ff", "#00ff9d", "#ffd900", "#ff4d6d", "#a78bfa"];

function getColor(name, index) {
  return MODEL_COLORS[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-bright)", borderRadius: "var(--radius)", padding: "10px 14px" }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontFamily: "var(--font-mono)" }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 12, color: p.color, fontFamily: "var(--font-mono)" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
        </div>
      ))}
    </div>
  );
};

export default function LeaderboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getLeaderboard();
      setData(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-secondary)", paddingTop: 80 }}>
      <span className="spinner" /> Loading leaderboard…
    </div>
  );

  if (error) return (
    <div style={{ padding: "14px 18px", background: "var(--red-dim)", borderRadius: "var(--radius)", color: "var(--red)", fontSize: 13 }}>{error}</div>
  );

  const leaderboard = data?.leaderboard || [];

  if (!leaderboard.length) return (
    <div style={{ color: "var(--text-secondary)", paddingTop: 80, textAlign: "center" }}>
      <p>No evaluation data yet.</p>
      <p style={{ fontSize: 13, marginTop: 8, color: "var(--text-muted)" }}>Run an evaluation first to see the leaderboard.</p>
    </div>
  );

  // Radar chart data
  const radarData = [
    { metric: "Accuracy",    ...Object.fromEntries(leaderboard.map(m => [m.model_name, m.avg_accuracy])) },
    { metric: "Anti-Halluc", ...Object.fromEntries(leaderboard.map(m => [m.model_name, m.avg_hallucination_risk])) },
    { metric: "Tone",        ...Object.fromEntries(leaderboard.map(m => [m.model_name, m.avg_tone_clarity])) },
    { metric: "Overall",     ...Object.fromEntries(leaderboard.map(m => [m.model_name, m.avg_overall_score])) },
  ];

  // Bar chart data
  const barData = leaderboard.map(m => ({
    name: m.model_name.replace("llama-", "").replace("-instant", "").replace("-versatile", ""),
    Accuracy: m.avg_accuracy,
    "Anti-Halluc": m.avg_hallucination_risk,
    Tone: m.avg_tone_clarity,
    Overall: m.avg_overall_score,
  }));

  return (
    <div>
      <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>Leaderboard</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Aggregate model performance across all evaluation runs.</p>
        </div>
        <button className="btn btn-ghost" onClick={load} style={{ padding: "8px 16px" }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Rank cards */}
      <div className="fade-up-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 32 }}>
        {leaderboard.map((m, i) => {
          const color = getColor(m.model_name, i);
          return (
            <div key={m.model_name} className="card" style={{ borderColor: i === 0 ? color : "var(--border)", position: "relative", overflow: "hidden" }}>
              {i === 0 && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} />
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  #{i + 1} {i === 0 && <Trophy size={10} style={{ display: "inline", color: "var(--yellow)" }} />}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{m.avg_overall_score}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14, fontFamily: "var(--font-mono)" }}>
                {m.model_name}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Accuracy", val: m.avg_accuracy, color: "var(--accent)" },
                  { label: "Anti-Halluc", val: m.avg_hallucination_risk, color: "var(--green)" },
                  { label: "Tone", val: m.avg_tone_clarity, color: "var(--yellow)" },
                ].map(({ label, val, color: c }) => (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>{label}</span>
                      <span style={{ fontSize: 10, color: c, fontFamily: "var(--font-mono)" }}>{val}</span>
                    </div>
                    <div style={{ height: 2, background: "var(--bg-elevated)", borderRadius: 1 }}>
                      <div style={{ height: "100%", width: `${val * 10}%`, background: c, borderRadius: 1 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, display: "flex", gap: 12, fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                <span>{m.total_runs} runs</span>
                <span>{m.total_cases} cases</span>
                <span>⚡ {m.avg_latency_ms}ms</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="fade-up-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
        {/* Radar */}
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20 }}>
            Capability Radar
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
              {leaderboard.map((m, i) => (
                <Radar key={m.model_name} name={m.model_name} dataKey={m.model_name}
                  stroke={getColor(m.model_name, i)} fill={getColor(m.model_name, i)} fillOpacity={0.08} strokeWidth={2} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)", paddingTop: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar */}
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20 }}>
            Score Breakdown
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barSize={14}>
              <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)", paddingTop: 12 }} />
              <Bar dataKey="Accuracy" fill="var(--accent)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Anti-Halluc" fill="var(--green)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Tone" fill="var(--yellow)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
