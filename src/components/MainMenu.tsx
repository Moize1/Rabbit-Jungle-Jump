import React, { useState, useEffect } from "react";
import { Play, Trophy, Cpu, HelpCircle, Star, Settings } from "lucide-react";

interface MainMenuProps {
  onStartGame: (username: string, robotColor: string) => void;
  onViewLeaderboard: () => void;
}

export default function MainMenu({ onStartGame, onViewLeaderboard }: MainMenuProps) {
  const [username, setUsername] = useState("HopChamp");
  const [robotColor, setRobotColor] = useState("cyan"); // options: "cyan" | "gold" | "rose" | "lime"
  const [showHelp, setShowHelp] = useState(false);

  // Load username and previous color preference from localstorage on start
  useEffect(() => {
    const savedName = localStorage.getItem("robot_jumper_user_name");
    const savedColor = localStorage.getItem("robot_jumper_color_pref");
    if (savedName) setUsername(savedName.substring(0, 15));
    if (savedColor) setRobotColor(savedColor);
  }, []);

  const handleStart = () => {
    const cleanName = username.trim().substring(0, 16) || "Rabbit";
    localStorage.setItem("robot_jumper_user_name", cleanName);
    localStorage.setItem("robot_jumper_color_pref", robotColor);
    onStartGame(cleanName, robotColor);
  };

  // Color specs
  const colorsList = [
    { id: "cyan", name: "Minty Blue", hexClass: "bg-cyan-100", glowClass: "shadow-cyan-300/50" },
    { id: "gold", name: "Peach Butter", hexClass: "bg-amber-100", glowClass: "shadow-amber-200/50" },
    { id: "rose", name: "Rose Fluff", hexClass: "bg-rose-100", glowClass: "shadow-rose-300/50" },
    { id: "lime", name: "Lime Clover", hexClass: "bg-lime-100", glowClass: "shadow-lime-300/50" }
  ];

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-[#022c22] via-[#042f1a] to-[#011c0f] text-emerald-100 select-none overflow-y-auto">
      {/* Decorative leafy forest elements in header */}
      <div className="flex items-center justify-between pb-2">
        <span className="text-[10px] text-emerald-400 font-mono tracking-widest font-bold">
          🌿 JUNGLE EDITION
        </span>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-1 px-2.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-[10px] font-bold flex items-center gap-1 hover:text-white transition-all cursor-pointer"
        >
          <HelpCircle size={11} />
          <span>Help</span>
        </button>
      </div>

      {/* Main visual branding banner */}
      <div className="flex flex-col items-center text-center my-2 select-none">
        {/* Cute animated glowing logo */}
        <div className="relative mb-2 mt-4 animate-bounce">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400/80 flex items-center justify-center text-emerald-300 text-3xl shadow-[0_0_20px_rgba(52,211,153,0.3)]">
            🐰
          </div>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#22c55e]"></span>
          </span>
        </div>

        <h1 className="text-xl font-extrabold tracking-tight uppercase leading-none font-mono">
          <span className="text-emerald-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">BUNNY</span>{" "}
          <span className="text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] animate-pulse">JUNGLE</span>
        </h1>
        <h2 className="text-sm font-bold tracking-widest text-[#22c55e] uppercase mt-1 mb-2 font-mono">
          ▲ JUMPER ▲
        </h2>
        
        <p className="text-[10.5px] text-emerald-300/60 max-w-[280px]">
          Flee the forest floor! Collect sweet carrots, scale wooden log bridges, and escape sharp thorns & swamp wasps.
        </p>
      </div>

      {/* Main core input area */}
      <div className="space-y-4 my-2 px-1">
        {/* Username Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
            🕹️ ENTER CALLSIGN (NAME):
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.substring(0, 16))}
            placeholder="Type username..."
            className="w-full px-4 py-2.5 bg-slate-950/80 border border-emerald-800/40 rounded-xl text-emerald-100 font-bold text-center placeholder-emerald-800 focus:outline-none focus:border-emerald-400 shadow-sm text-sm"
          />
        </div>

        {/* Character Skin Customizer Options */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono text-center flex items-center justify-center gap-1 bg-emerald-950/40 py-1 rounded-md">
            <Settings size={10} />
            <span>SELECT BUNNY FUR COLOR:</span>
          </label>
          
          <div className="grid grid-cols-4 gap-2">
            {colorsList.map((c) => {
              const active = robotColor === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setRobotColor(c.id)}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer active:scale-95 transition-all ${
                    active
                      ? "bg-emerald-900/40 border-emerald-400 ring-2 ring-emerald-400/30"
                      : "bg-emerald-950/30 border-emerald-900/40 hover:bg-emerald-950/70"
                  }`}
                >
                  <div className={`w-5.5 h-5.5 rounded-full ${c.hexClass} shadow-lg ${active ? `${c.glowClass} animate-pulse scale-110` : "opacity-75"} flex items-center justify-center`}>
                    <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                  </div>
                  <span className="text-[8.5px] font-bold mt-1 text-slate-300 font-mono bg-slate-950/30 px-1 py-0.5 rounded truncate w-full text-center">
                    {c.id.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sliding tutorial overlay */}
      {showHelp && (
        <div className="my-2 bg-emerald-950/90 border border-emerald-500/20 p-3.5 rounded-2xl text-xs space-y-2 animate-fadeIn">
          <h3 className="font-bold text-emerald-300 font-mono uppercase text-[10px] tracking-wider border-b border-emerald-800/40 pb-1">
            🐰 JUNGLE TUTORIAL:
          </h3>
          <ul className="space-y-1 text-emerald-200/80 text-[10.5px]">
            <li>🥕 <span className="font-bold text-white">Movement:</span> Tap Left/Right buttons on-screen, or press keys <span className="text-teal-300">A/D / Arrows</span> on PC.</li>
            <li>🥕 <span className="font-bold text-white">Booster Jump:</span> Tap JUMP, or press <span className="text-teal-300">Spacebar</span>. Double jump makes the bunny flap ears to hop again!</li>
            <li>🥕 <span className="font-bold text-white">Lethal Obstacles:</span> Avoid venomous forest nettles/spikes and swamp wasps.</li>
            <li>🥕 <span className="font-bold text-white">Rising Danger:</span> Screen moves up increasingly fast! If you hit the bottom edge or miss any step, it is game over.</li>
          </ul>
        </div>
      )}

      {/* Call to actions bottom bar */}
      <div className="flex flex-col gap-2.5 mt-4 pb-2">
        <button
          onClick={handleStart}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm uppercase tracking-widest shadow-[0_4px_20px_rgba(16,185,129,0.30)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Play size={16} fill="white" />
          <span>Start Hopping!</span>
        </button>

        <button
          onClick={onViewLeaderboard}
          className="w-full py-3 rounded-2xl bg-slate-950/50 border border-emerald-800/60 text-emerald-400 hover:bg-[#052e16]/60 hover:text-emerald-100 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Trophy size={14} />
          <span>Leaderboard Records</span>
        </button>
      </div>
    </div>
  );
}
