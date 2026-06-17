import React, { useState } from "react";
import PhoneFrame from "./components/PhoneFrame";
import MainMenu from "./components/MainMenu";
import GameCanvas from "./components/GameCanvas";
import LeaderboardView from "./components/LeaderboardView";
import { GameMode } from "./types";
import { Trophy, RefreshCw, ChevronRight, Coins, Hourglass, Star } from "lucide-react";

export default function App() {
  const [gameMode, setGameMode] = useState<GameMode>("menu");
  const [username, setUsername] = useState("RoboPilot");
  const [robotColor, setRobotColor] = useState("cyan");

  const [lastScore, setLastScore] = useState(0);
  const [lastCoins, setLastCoins] = useState(0);
  const [lastTime, setLastTime] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleStartGame = (name: string, color: string) => {
    setUsername(name);
    setRobotColor(color);
    setGameMode("playing");
  };

  const handleGameOver = (score: number, coins: number, timeSeconds: number) => {
    setLastScore(score);
    setLastCoins(coins);
    setLastTime(timeSeconds);
    setGameMode("gameover");
  };

  // Submit high score to local fullstack backend + sync to fallback locale
  const handleSubmitScore = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        username,
        score: lastScore,
        coins: lastCoins,
        timeSeconds: lastTime
      };

      // 1. Submit to API backend
      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Local high score backend could not save entry");
      }

      await response.json();
    } catch (err) {
      console.warn("Backend score submit unavailable, saving score in local storage backup:", err);
      // Synchronize save to locale storage
      saveToLocaleStorageBackup();
    } finally {
      setIsSubmitting(false);
      setGameMode("leaderboard"); // Load board to show placement!
    }
  };

  const saveToLocaleStorageBackup = () => {
    try {
      const localDataStr = localStorage.getItem("robot_jumper_leaderboard");
      let boards = [];
      if (localDataStr) {
        boards = JSON.parse(localDataStr);
      }
      boards.push({
        username,
        score: lastScore,
        coins: lastCoins,
        timeSeconds: lastTime,
        date: new Date().toISOString()
      });
      localStorage.setItem("robot_jumper_leaderboard", JSON.stringify(boards));
    } catch (e) {
      console.error("Local storage sync error:", e);
    }
  };

  const renderContent = () => {
    switch (gameMode) {
      case "playing":
        return <GameCanvas onGameOver={handleGameOver} robotColor={robotColor} />;
      case "leaderboard":
        return <LeaderboardView onBackToMenu={() => setGameMode("menu")} />;
      case "gameover":
        return (
          <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-[#450a0a] via-[#1c0202] to-black text-red-100 select-none overflow-y-auto animate-fadeIn">
            {/* Urgent Red Warn Title Header */}
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-amber-950/80 border-2 border-amber-400/80 text-amber-300 flex items-center justify-center text-2xl mx-auto mb-2 animate-bounce shadow-lg">
                🐰
              </div>
              <h1 className="text-xl font-extrabold tracking-tight uppercase leading-none font-mono text-amber-400">
                Bunny Fell!
              </h1>
              <p className="text-[10px] text-amber-400/60 uppercase tracking-widest mt-1 font-mono">
                Jungle Hop Missed
              </p>
            </div>

            {/* Performance Stats Cards */}
            <div className="my-2 p-4 bg-emerald-950/20 border border-emerald-900/35 rounded-2xl space-y-3.5">
              <div className="text-center py-2 border-b border-emerald-900/20">
                <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-wider uppercase">
                  Accumulated Altitude
                </span>
                <div className="text-3xl font-extrabold font-mono text-amber-300 mt-0.5 tracking-tight">
                  {lastScore.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 p-2.5 bg-black/45 border border-emerald-950 rounded-xl text-orange-400">
                  <span className="text-lg">🥕</span>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-mono">CARROTS</span>
                    <span className="font-bold">{lastCoins}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 p-2.5 bg-black/45 border border-emerald-950 rounded-xl text-teal-400">
                  <Hourglass size={14} />
                  <div>
                    <span className="block text-[9px] text-slate-400 font-mono">SURVIVED</span>
                    <span className="font-bold">{lastTime}s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Highscore Submission Promo Form */}
            <div className="p-3 bg-emerald-950/30 border border-emerald-900/30 rounded-2xl flex flex-col gap-2 items-center text-center">
              <div className="text-emerald-400 font-bold font-mono text-[10px] uppercase tracking-wide flex items-center gap-1">
                <Trophy size={11} />
                <span>Leaderboard Opportunity</span>
              </div>
              <p className="text-[10px] text-slate-300 max-w-[260px] leading-tight">
                Secure your rank in the global leaderboard under callsign <span className="font-semibold text-white">"{username}"</span>!
              </p>
              
              <button
                onClick={handleSubmitScore}
                disabled={isSubmitting}
                className="w-full mt-1.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-60 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <span>Upload Score Log</span>
                    <ChevronRight size={13} />
                  </>
                )}
              </button>
            </div>

            {/* Replay Actions */}
            <div className="flex gap-2.5 mt-4 pb-2">
              <button
                onClick={() => setGameMode("playing")}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20 text-white border border-emerald-400 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>Hop Again</span>
              </button>

              <button
                onClick={() => setGameMode("menu")}
                className="flex-1 py-3 bg-slate-950 border border-emerald-950 text-emerald-400 hover:text-emerald-100 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer active:scale-95"
              >
                <span>Hangar</span>
              </button>
            </div>
          </div>
        );
      default:
        return (
          <MainMenu
            onStartGame={handleStartGame}
            onViewLeaderboard={() => setGameMode("leaderboard")}
          />
        );
    }
  };

  return <PhoneFrame>{renderContent()}</PhoneFrame>;
}
