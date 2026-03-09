import { Cpu, BarChart2, History, Zap } from "lucide-react";

const NAV = [
  { id: "evaluate", icon: Zap,      label: "Evaluate" },
  { id: "leaderboard", icon: BarChart2, label: "Leaderboard" },
  { id: "history",  icon: History,  label: "History" },
];

export default function Sidebar({ active, onNav }) {
  return (
    <aside style={{
      width: 220,
      minHeight: "100vh",
      background: "var(--bg-surface)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      padding: "28px 0",
      position: "fixed",
      top: 0, left: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: "0 24px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34,
            background: "var(--accent-dim)",
            border: "1px solid var(--accent-glow)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Cpu size={16} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", color: "var(--text-primary)" }}>
              LLM EVAL
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
              FRAMEWORK
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map(({ id, icon: Icon, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: "var(--radius)",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "var(--font-display)",
                fontWeight: isActive ? 600 : 400,
                letterSpacing: "0.02em",
                background: isActive ? "var(--accent-dim)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
                borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                transition: "all var(--transition)",
                textAlign: "left",
                width: "100%",
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
          GROQ POWERED<br />
          <span style={{ color: "var(--accent)", opacity: 0.7 }}>3 MODELS ACTIVE</span>
        </div>
      </div>
    </aside>
  );
}
