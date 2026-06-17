import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const LEADERBOARD_FILE = path.join(process.cwd(), "leaderboard.json");

app.use(express.json());

interface LeaderboardEntry {
  username: string;
  score: number;
  coins: number;
  timeSeconds: number;
  date: string;
}

// Ensure leaderboard file exists
function loadLeaderboard(): LeaderboardEntry[] {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const data = fs.readFileSync(LEADERBOARD_FILE, "utf-8");
      return JSON.parse(data) as LeaderboardEntry[];
    }
  } catch (err) {
    console.error("Failed to read leaderboard file, starting fresh:", err);
  }
  return [];
}

function saveLeaderboard(data: LeaderboardEntry[]) {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write leaderboard file:", err);
  }
}

// Initialize leaderboard with some lovely default entries to keep it lively!
if (!fs.existsSync(LEADERBOARD_FILE)) {
  const initialData: LeaderboardEntry[] = [
    { username: "RoboDash", score: 2450, coins: 82, timeSeconds: 120, date: new Date().toISOString() },
    { username: "JungleJax", score: 1840, coins: 55, timeSeconds: 95, date: new Date().toISOString() },
    { username: "RustyCogs", score: 1250, coins: 41, timeSeconds: 72, date: new Date().toISOString() },
    { username: "BoltFlyer", score: 870, coins: 28, timeSeconds: 50, date: new Date().toISOString() },
    { username: "NutsNBolts", score: 420, coins: 15, timeSeconds: 30, date: new Date().toISOString() }
  ];
  saveLeaderboard(initialData);
}

// API Routes
app.get("/api/leaderboard", (req, res) => {
  try {
    const leaderboard = loadLeaderboard();
    // Sort descending by score
    const sorted = leaderboard.sort((a, b) => b.score - a.score).slice(0, 50);
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

app.post("/api/leaderboard", (req, res) => {
  try {
    const { username, score, coins, timeSeconds } = req.body;
    if (!username || typeof score !== "number") {
      res.status(400).json({ error: "Invalid username or score" });
      return;
    }

    const leaderboard = loadLeaderboard();
    const cleanUsername = String(username).trim().substring(0, 16) || "Anonymous";

    const newEntry: LeaderboardEntry = {
      username: cleanUsername,
      score: Math.max(0, score),
      coins: typeof coins === "number" ? Math.max(0, coins) : 0,
      timeSeconds: typeof timeSeconds === "number" ? Math.max(0, timeSeconds) : 0,
      date: new Date().toISOString()
    };

    leaderboard.push(newEntry);
    
    // Sort & limit to top 100 on disk to keep things responsive
    const sorted = leaderboard.sort((a, b) => b.score - a.score).slice(0, 100);
    saveLeaderboard(sorted);

    res.json({ success: true, rank: sorted.findIndex(e => e === newEntry) + 1, data: newEntry });
  } catch (error) {
    console.error("Failed to post score:", error);
    res.status(500).json({ error: "Failed to save score" });
  }
});

// Setup Vite middleware or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with Vite hot-reload middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode); serving static build folders");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
