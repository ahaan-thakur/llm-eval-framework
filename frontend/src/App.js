import { useState } from "react";
import "./index.css";
import Sidebar from "./components/Sidebar";
import EvaluatePage from "./pages/EvaluatePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import HistoryPage from "./pages/HistoryPage";

const PAGES = {
  evaluate: EvaluatePage,
  leaderboard: LeaderboardPage,
  history: HistoryPage,
};

export default function App() {
  const [page, setPage] = useState("evaluate");
  const Page = PAGES[page] || EvaluatePage;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar active={page} onNav={setPage} />
      <main style={{
        marginLeft: 220,
        flex: 1,
        padding: "48px 48px 80px",
        maxWidth: 1100,
      }}>
        <Page />
      </main>
    </div>
  );
}
