import React, { useState, useEffect } from "react";
import { Wifi, Signal, Battery, Volume2, VolumeX } from "lucide-react";
import { AudioSynth } from "../utils/audio";

interface PhoneFrameProps {
  children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  const [timeStr, setTimeStr] = useState("12:00 PM");
  const [muted, setMuted] = useState(AudioSynth.getMuteStatus());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      setTimeStr(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMuteToggle = () => {
    const isMuted = AudioSynth.toggleMute();
    setMuted(isMuted);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black p-4 md:p-8 font-sans overflow-hidden">
      {/* Decorative floating ambient forest particles in background */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl top-10 left-10 animate-pulse" />
        <div className="absolute w-96 h-96 rounded-full bg-teal-500/10 blur-3xl bottom-10 right-10 animate-pulse" />
      </div>

      <div className="relative flex flex-row items-center gap-4">
        {/* Physical Button Toggles left side */}
        <div className="hidden lg:flex flex-col gap-4 absolute -left-12 top-48">
          <button
            onClick={handleMuteToggle}
            className="w-8 h-12 bg-slate-800 border-r-4 border-emerald-500 hover:bg-emerald-800 transition-all text-white flex items-center justify-center rounded-l-lg shadow-lg"
            title="Toggle Audio Synth"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>

        {/* The Outer Phone Chassis */}
        <div className="relative w-full max-w-[400px] h-[780px] bg-slate-950 rounded-[48px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-4 border-slate-800/80 ring-1 ring-white/10 flex flex-col justify-between overflow-hidden">
          {/* Edge Glow Reflection */}
          <div className="absolute inset-x-0 top-0 h-[60%] bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-t-[40px] z-20" />
          
          {/* Speaker & Sensor Notch Bar */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-32 h-[22px] bg-black rounded-b-2xl z-30 flex items-center justify-center gap-1.5">
            <div className="w-12 h-1 bg-slate-800 rounded-full" />
            <div className="w-2.5 h-2.5 bg-indigo-950 border border-indigo-500/30 rounded-full" />
          </div>

          {/* Interactive Screen viewport */}
          <div className="relative w-full h-[716px] bg-slate-900 rounded-[38px] overflow-hidden flex flex-col z-10 border border-black/40">
            {/* Top Phone Status Bar */}
            <div className="h-7 bg-emerald-950/80 backdrop-blur-sm px-6 flex items-center justify-between text-[11px] text-emerald-300 font-semibold tracking-wide select-none z-30 border-b border-emerald-950/30">
              <span>{timeStr}</span>
              <div className="flex items-center gap-1.5">
                <Signal size={11} className="text-emerald-400" />
                <span className="text-[10px]">5G</span>
                <Wifi size={11} className="text-emerald-400" />
                <Battery size={13} className="rotate-0 text-emerald-400" />
              </div>
            </div>

            {/* Content Display Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-emerald-950 select-none">
              {children}
            </div>

            {/* Bottom Virtual Home Navigation Line */}
            <div className="h-4 bg-emerald-950/90 flex items-center justify-center select-none z-30">
              <div className="w-28 h-1 bg-emerald-400/30 rounded-full" />
            </div>
          </div>
        </div>

        {/* Instructions Panel on the side for wide desktop screens */}
        <div className="hidden xl:flex flex-col w-64 p-6 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 text-slate-300 text-sm gap-4">
          <div className="text-emerald-400 font-bold text-base border-b border-emerald-500/20 pb-2">
            🤖 JUNGLE RUNNER SETTINGS
          </div>
          <div>
            <span className="font-semibold text-white">Left / Right Buttons:</span>
            <p className="text-xs text-slate-400 mt-1">Move robot left or right inside the viewport.</p>
          </div>
          <div>
            <span className="font-semibold text-white">Tap/Spacebar:</span>
            <p className="text-xs text-slate-400 mt-1">Jump! Double tap to trigger a rocket booster double jump.</p>
          </div>
          <div>
            <span className="font-semibold text-white">Sound Synth:</span>
            <p className="text-xs text-slate-400 mt-1">Generates forest winds, digital coin melodies, and bird chirps on-the-fly.</p>
          </div>
          <button
            onClick={handleMuteToggle}
            className="flex items-center justify-center gap-2 mt-2 px-3 py-2 rounded-lg bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-medium hover:bg-emerald-600/50 transition-colors w-full text-xs"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {muted ? "Unmute Sounds" : "Mute Sounds"}
          </button>
        </div>
      </div>
    </div>
  );
}
