const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Evaluation
  runEvaluation: (payload) =>
    request("/evaluate/", { method: "POST", body: JSON.stringify(payload) }),

  getSampleTestCases: () => request("/evaluate/sample-test-cases"),
  getModels: () => request("/evaluate/models"),

  // History
  getHistory: (limit = 20, offset = 0) =>
    request(`/history/?limit=${limit}&offset=${offset}`),

  getRun: (runId) => request(`/history/${runId}`),
  deleteRun: (runId) => request(`/history/${runId}`, { method: "DELETE" }),

  // Leaderboard
  getLeaderboard: () => request("/history/leaderboard"),
};
