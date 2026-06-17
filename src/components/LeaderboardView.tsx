import React, { useEffect, useState } from "react";
import { Trophy, Calendar, Award, Star, RefreshCw, ChevronLeft } from "lucide-react";
import { LeaderboardEntry } from "../types";

interface LeaderboardViewProps {
  onBackToMenu: () => void;
}

export default function LeaderboardView({ onBackToMenu }: LeaderboardViewProps) {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/leaderboard");
      if (!response.ok) {
        throw new Error("Local backend response is unavailable");
      }
      const data = await response.json();
      setScores(data);
    } catch (err) {
      console.warn("Backend leaderboard failed to load, falling back to local storage sync:", err);
      // Fallback local storage data structure
      const localDataStr = localStorage.getItem("robot_jumper_leaderboard");
      if (localDataStr) {
        try {
          const parsed = JSON.parse(localDataStr) as LeaderboardEntry[];
          setScores(parsed.sort((a, b) => b.score - a.score).slice(0, 30));
        } catch {
          populateLocalDefaults();
        }
      } else {
        populateLocalDefaults();
      }
    } finally {
      setLoading(false);
    }
  };

  const populateLocalDefaults = () => {
    const defaultData: LeaderboardEntry[] = [
      { username: "BunnDash", score: 2450, coins: 82, timeSeconds: 120, date: new Date().toISOString() },
      { username: "JungleJax", score: 1840, coins: 55, timeSeconds: 95, date: new Date().toISOString() },
      { username: "CloverHop", score: 1250, coins: 41, timeSeconds: 72, date: new Date().toISOString() },
      { username: "PippinHop", score: 870, coins: 28, timeSeconds: 50, date: new Date().toISOString() },
      { username: "Thumper", score: 420, coins: 15, timeSeconds: 30, date: new Date().toISOString() }
    ];
    localStorage.setItem("robot_jumper_leaderboard", JSON.stringify(defaultData));
    setScores(defaultData);
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5 bg-gradient-to-b from-[#022c22] via-[#052e16] to-[#011c0f] text-emerald-100 overflow-y-auto select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-emerald-800/40 mb-4">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 font-semibold text-xs text-emerald-300 hover:text-white transition-all cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>Exit</span>
        </button>
        
        <h2 className="text-sm font-bold tracking-widest uppercase text-emerald-400 font-mono">
          Global Board
        </h2>

        <button
          onClick={fetchScores}
          className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-900/30 hover:bg-emerald-950/80 transition-all text-emerald-400 hover:text-emerald-100 cursor-pointer"
          title="Refresh entries"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Decorative board logo banner */}
      <div className="flex flex-col items-center justify-center py-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/10 mb-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border-2 border-amber-400 flex items-center justify-center text-amber-400 mb-2 animate-bounce">
          <Trophy size={20} />
        </div>
        <span className="text-xl font-extrabold text-amber-300 font-mono flex items-center gap-1">
          <Star size={14} className="fill-amber-300 text-amber-300" />
          <span>TOP JUMPERS</span>
          <Star size={14} className="fill-amber-300 text-amber-300" />
        </span>
        <p className="text-[10px] text-emerald-400/60 tracking-wider">
          Competitive forest survival times & carrots
        </p>
      </div>

      {/* List content */}
      <div className="flex-1 space-y-2 pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <span className="text-xs text-emerald-400 italic">Syncing global relays...</span>
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-16 text-xs text-emerald-500">
            No entries loaded yet. Be the first to secure a jump placement!
          </div>
        ) : (
          scores.map((entry, idx) => {
            const isTop3 = idx < 3;
            const rankStyle =
              idx === 0
                ? "bg-amber-400 text-slate-950"
                : idx === 1
                ? "bg-slate-300 text-slate-950"
                : idx === 2
                ? "bg-amber-600 text-white"
                : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/30";

            return (
              <div
                key={`${entry.username}_${idx}`}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isTop3
                    ? "bg-emerald-900/40 border-amber-500/30 shadow-[0_2px_8px_rgba(245,158,11,0.05)]"
                    : "bg-emerald-950/20 border-emerald-900/30"
                }`}
              >
                {/* Placement Rank and user details */}
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-extrabold text-[11px] shadow ${rankStyle}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-100 flex items-center gap-1">
                      <span>{entry.username}</span>
                      {idx === 0 && <span className="text-xs">🏆</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-emerald-400/70 font-mono mt-0.5">
                      <span className="text-orange-400 font-bold">🥕 {entry.coins} carrots</span>
                      <span>•</span>
                      <span>⏱️ {entry.timeSeconds}s</span>
                    </div>
                  </div>
                </div>

                {/* Score badge right aligned */}
                <div className="flex flex-col items-end">
                  <span className="text-sm font-extrabold text-teal-300 font-mono tracking-tight text-right">
                    {entry.score.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-[#22c55e] font-mono flex items-center gap-0.5">
                    <Calendar size={8} />
                    {formatDate(entry.date)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
