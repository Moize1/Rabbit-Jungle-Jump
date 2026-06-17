import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, TrendingUp } from "lucide-react";
import { Player, Platform, Obstacle, Coin, Particle, BackgroundElement, Booster } from "../types";
import { AudioSynth } from "../utils/audio";

interface GameCanvasProps {
  onGameOver: (score: number, coins: number, timeSeconds: number) => void;
  robotColor: string; // "cyan" | "gold" | "rose" | "lime"
}

export default function GameCanvas({ onGameOver, robotColor }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Score stats
  const [score, setScore] = useState(0);
  const [coinsCount, setCoinsCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [survivalScoreTime, setSurvivalScoreTime] = useState(0);
  const [activeThemeName, setActiveThemeName] = useState("Emerald Canopy");
  const [doublePointsTime, setDoublePointsTime] = useState(0);
  const [gameStartedTime, setGameStartedTime] = useState(Date.now());
  const [countdown, setCountdown] = useState<number | null>(3);

  // Input states
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const leftPressed = useRef(false);
  const rightPressed = useRef(false);

  // Keep game parameters updated in refs for the loop without re-triggering hooks
  const gameStateRef = useRef({
    score: 0,
    coins: 0,
    timeSeconds: 0,
    speedFactor: 1.0,
    isDead: false,
    scrollOffset: 0,
  });

  // Bunny colors mapping helper for fur, cheeks, ears inner and details
  const getRabbitColors = (theme: string) => {
    switch (theme) {
      case "gold": return { body: "#fef3c7", belly: "#fffbeb", cheeks: "#ffd3a3", accent: "#ea580c", earsInside: "#fda4af" }; // Peach Butter
      case "rose": return { body: "#ffe4e6", belly: "#fff5f5", cheeks: "#fecdd3", accent: "#e11d48", earsInside: "#fda4af" }; // Rose Fluff
      case "lime": return { body: "#ecfccb", belly: "#f7fee7", cheeks: "#d9f99d", accent: "#166534", earsInside: "#fda4af" }; // Lime Clover
      default: return { body: "#e0f2fe", belly: "#f0f9ff", cheeks: "#bae6fd", accent: "#0369a1", earsInside: "#fda4af" }; // Minty Blue
    }
  };

  useEffect(() => {
    // 3 seconds countdown before game start
    let count = 3;
    AudioSynth.startForestAmbience();
    const interval = setInterval(() => {
      count -= 1;
      if (count === 0) {
        setCountdown(null);
        setGameStartedTime(Date.now());
        clearInterval(interval);
      } else {
        setCountdown(count);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      AudioSynth.stopForestAmbience();
    };
  }, []);

  useEffect(() => {
    if (countdown !== null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fixed internal resolution for consistent game coordinates
    const VW = 360;
    const VH = 600;
    canvas.width = VW;
    canvas.height = VH;

    // Setup initial game objects
    const player: Player = {
      x: VW / 2 - 16,
      y: VH - 90, // Start grounded
      width: 32,
      height: 32,
      vx: 0,
      vy: 0,
      isGrounded: true,
      facing: "right",
      jumpCount: 0,
      angle: 0,
      blinkTimer: 30,
    };

    const platforms: Platform[] = [
      // Starting long floor log
      { id: "p_ground", x: 0, y: VH - 60, width: VW, height: 60, type: "ground", hasVines: false, swayAmount: 0, swaySpeed: 0, swayOffset: 0 },
    ];

    const obstacles: Obstacle[] = [];
    const coins: Coin[] = [];
    const boosters: Booster[] = [];
    const particles: Particle[] = [];
    const bgElements: BackgroundElement[] = [];

    // Create background forest layers, butterflies, fireflies
    for (let i = 0; i < 4; i++) {
      bgElements.push({
        id: `cloud_${i}`,
        x: Math.random() * VW,
        y: Math.random() * (VH - 100),
        width: 60 + Math.random() * 80,
        height: 20 + Math.random() * 30,
        speed: 0.1 + Math.random() * 0.15,
        type: "cloud",
        color: "rgba(16, 185, 129, 0.08)",
        animOffset: Math.random() * 100,
      });
    }

    for (let i = 0; i < 15; i++) {
      bgElements.push({
        id: `firefly_${i}`,
        x: Math.random() * VW,
        y: Math.random() * VH,
        width: 4,
        height: 4,
        speed: 0.3 + Math.random() * 0.5,
        type: "firefly",
        color: "rgba(224, 242, 254, 0.4)",
        animOffset: Math.random() * 100,
      });
    }

    // Helper functions for content generation at targeted Y heights (relative to scroll)
    let nextPlatformId = 1;
    let nextCoinId = 1;
    let nextObstacleId = 1;
    let nextBoosterId = 1;

    const spawnPlatform = (yCor: number) => {
      // Create climbing platforms
      const width = 80 + Math.random() * 50;
      const x = Math.max(10, Math.min(VW - width - 10, Math.random() * (VW - 20)));
      const isSwaying = Math.random() > 0.6;
      
      const newPlatform: Platform = {
        id: `plat_${nextPlatformId++}`,
        x,
        y: yCor,
        width,
        height: 16,
        type: Math.random() > 0.5 ? "wooden_bar" : "moss_log",
        hasVines: Math.random() > 0.7,
        swayAmount: isSwaying ? 20 + Math.random() * 25 : 0,
        swaySpeed: 0.01 + Math.random() * 0.015,
        swayOffset: Math.random() * Math.PI * 2,
      };
      platforms.push(newPlatform);

      // Spawn coins on top of the platforms sometimes
      let coinsSpawned = false;
      if (Math.random() > 0.3) {
        coinsSpawned = true;
        const coinCount = Math.floor(1 + Math.random() * 3);
        const startX = newPlatform.x + (newPlatform.width - coinCount * 22) / 2;
        for (let j = 0; j < coinCount; j++) {
          coins.push({
            id: `coin_${nextCoinId++}`,
            x: startX + j * 22 + 10,
            y: yCor - 30 - Math.sin(j / (coinCount - 1 || 1) * Math.PI) * 15, // Cute parabola
            radius: 7,
            collected: false,
            pulseOffset: Math.random() * 10,
          });
        }
      }

      // Spawn booster occasionally if coins were not spawned
      if (!coinsSpawned && Math.random() > 0.65) {
        boosters.push({
          id: `boost_${nextBoosterId++}`,
          x: newPlatform.x + (newPlatform.width / 2) - 10,
          y: yCor - 35,
          width: 20,
          height: 20,
          collected: false,
          pulseOffset: Math.random() * 10,
        });
      }

      // Spawn optional obstacle
      if (yCor < VH - 150 && Math.random() > 0.45) {
        // Wooden spike underneath or sharp wasp flying above
        const obstacleType = Math.random() > 0.6 ? "wasp" : "wood_spike";
        if (obstacleType === "wasp") {
          const droneX = Math.random() * (VW - 40) + 10;
          obstacles.push({
            id: `obs_${nextObstacleId++}`,
            x: droneX,
            y: yCor - 75,
            width: 24,
            height: 24,
            type: "wasp",
            animOffset: Math.random() * 100,
            baseX: droneX,
            vx: Math.random() > 0.5 ? 0.8 : -0.8,
          });
        } else {
          // Centered spike on top of wooden platform (narrow)
          obstacles.push({
            id: `obs_${nextObstacleId++}`,
            x: newPlatform.x + (newPlatform.width / 2) - 10,
            y: yCor - 15,
            width: 20,
            height: 16,
            type: "wood_spike",
            animOffset: Math.random() * 100,
          });
        }
      }
    };

    // Pre-populate some platforms
    let currentSpawnY = VH - 120;
    while (currentSpawnY > -200) {
      spawnPlatform(currentSpawnY);
      currentSpawnY -= 95 + Math.random() * 30;
    }

    // Input buffers for coyote time & jump buffering
    let coyoteFrames = 8;
    let jumpBufferedFrames = 0;

    const blockKeys = [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "W", "s", "S", "a", "A", "d", "D"];

    // Input listeners with preventDefault to keep viewport locked and jumps responsive
    const handleKeyDown = (e: KeyboardEvent) => {
      if (blockKeys.includes(e.key)) {
        e.preventDefault();
      }
      keysPressed.current[e.key] = true;
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        triggerJump();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (blockKeys.includes(e.key)) {
        e.preventDefault();
      }
      keysPressed.current[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Jump logic helper with coyote time and double jump capability
    const triggerJump = () => {
      if (player.isGrounded || coyoteFrames > 0) {
        player.vy = -9.2; // Snappy agile jump velocity (compensated for fast landing)
        player.isGrounded = false;
        player.jumpCount = 1;
        coyoteFrames = 0; // consume coyote time
        AudioSynth.playJump();
        // Spawn jump dust particles
        for (let i = 0; i < 8; i++) {
          particles.push({
            x: player.x + player.width / 2,
            y: player.y + player.height,
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 2,
            size: 2 + Math.random() * 3,
            color: "rgba(255,255,255,0.45)",
            alpha: 1,
            life: 25 + Math.random() * 15,
            maxLife: 40,
            type: "dust",
          });
        }
      } else if (player.jumpCount === 1) {
        player.vy = -7.8; // Snappy double jump (compensated for fast landing)
        player.jumpCount = 2;
        AudioSynth.playJump();
        // High-altitude magic sparkles above the bunny ears
        for (let i = 0; i < 15; i++) {
          particles.push({
            x: player.x + player.width / 2,
            y: player.y,
            vx: (Math.random() - 0.5) * 4,
            vy: -2 - Math.random() * 3,
            size: 2.5 + Math.random() * 3,
            color: robotColor === "cyan" ? "rgba(103,232,249,0.9)" : robotColor === "gold" ? "rgba(253,230,138,0.9)" : robotColor === "rose" ? "rgba(244,63,94,0.9)" : "rgba(132,204,22,0.9)",
            alpha: 1,
            life: 20 + Math.random() * 15,
            maxLife: 35,
            type: "sparkle",
          });
        }
      } else {
        // Buffer ahead of landing
        jumpBufferedFrames = 8;
      }
    };

    // Store triggerJump in window context so button clicks can activate it
    (window as any).triggerJumpBtn = triggerJump;

    // Core Animation Frame Loop
    let animationId: number;
    let cameraY = 0;
    let survivalSeconds = 0;
    let speedBoostFactor = 1.0;
    const startTimeStamp = Date.now();

    let energyTimer = 45.0; // Dynamic countdown timer (energy) starting at 45 seconds!
    let lastTimeMs = Date.now();
    let prevThemeZone = "emerald";
    let transitionBannerTimer = 0;
    let transitionBannerText = "";
    let doublePointsTimer = 0;

    const gameLoop = () => {
      if (gameStateRef.current.isDead) return;

      // Update timer & dynamic speed progression
      const elapsedMs = Date.now() - startTimeStamp;
      survivalSeconds = Math.floor(elapsedMs / 1000);
      gameStateRef.current.timeSeconds = survivalSeconds;
      
      // Speed multiplier increases 1.0 -> 3.2 based on survival time
      speedBoostFactor = Math.min(3.2, 1.0 + (survivalSeconds / 45));
      gameStateRef.current.speedFactor = speedBoostFactor;

      // Calculate exact frames delta in seconds for energy countdown timer
      const nowMs = Date.now();
      const deltaSecs = Math.min(0.1, (nowMs - lastTimeMs) / 1000); // safety cap
      lastTimeMs = nowMs;

      if (countdown === null && !gameStateRef.current.isDead) {
        energyTimer = Math.max(0, energyTimer - deltaSecs);
        if (energyTimer <= 0) {
          // Play time-out hit effect
          AudioSynth.playHit();
          handlePlayerLose();
        }

        // Ticks down 2X double points multiplier
        if (doublePointsTimer > 0) {
          doublePointsTimer = Math.max(0, doublePointsTimer - deltaSecs);
        }
      }

      // Determine active dynamic theme zone based on survival time
      let currentThemeZone = "emerald";
      let themeTitle = "Emerald Canopy";
      let themeDesc = "Vibrant moss leaves and sunny morning rays";

      if (survivalSeconds >= 15 && survivalSeconds < 35) {
        currentThemeZone = "twilight";
        themeTitle = "Sunset Blossom";
        themeDesc = "Mystic amber twilight evening glow";
      } else if (survivalSeconds >= 35) {
        currentThemeZone = "nebula";
        themeTitle = "Cyber Nebula";
        themeDesc = "Stardust sky and ultraviolet cyber night";
      }

      // Theme transition chimes & blossom particles blast
      if (currentThemeZone !== prevThemeZone && !gameStateRef.current.isDead) {
        prevThemeZone = currentThemeZone;
        transitionBannerTimer = 180; // display banner on screen for ~3 seconds
        transitionBannerText = `ENTERED: ${themeTitle.toUpperCase()}`;
        
        // Blast theme transition particle fireflies
        const colors = currentThemeZone === "twilight" ? ["#f97316", "#f43f5e", "#fda4af"] : ["#a855f7", "#ec4899", "#22d3ee"];
        for (let i = 0; i < 25; i++) {
          particles.push({
            x: Math.random() * VW,
            y: Math.random() * (VH * 0.8),
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 2 - 1,
            size: 2.5 + Math.random() * 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
            life: 60 + Math.random() * 45,
            maxLife: 105,
            type: "sparkle"
          });
        }
      }

      // Dynamic upwards scroll speed
      // Only starts scrolling once the player hops off ground, or after 1000ms
      let activeScrollSpeed = 0.5 * speedBoostFactor;
      if (player.y > VH - 80 && elapsedMs < 2000) {
        activeScrollSpeed = 0; // Hover idle during countdown/rest
      }
      cameraY += activeScrollSpeed;
      gameStateRef.current.scrollOffset = cameraY;

      // Altitude score accumulates
      const distanceScore = Math.floor(cameraY / 2);
      const computedScore = distanceScore + (gameStateRef.current.coins * 50);
      gameStateRef.current.score = computedScore;

      // Clean graphics buffer
      ctx.clearRect(0, 0, VW, VH);

      // --- 1. RENDER BACKGROUND & PARALLAX ---
      const radialGrad = ctx.createRadialGradient(VW / 2, VH / 2, 50, VW / 2, VH / 2, VW);
      if (currentThemeZone === "emerald") {
        radialGrad.addColorStop(0, "#065f46"); // Canopy green
        radialGrad.addColorStop(1, "#022c22"); // Dark forest frame
      } else if (currentThemeZone === "twilight") {
        radialGrad.addColorStop(0, "#7c2d12"); // Twilight orange
        radialGrad.addColorStop(1, "#3c0d02"); // Crimson shadow frame
      } else {
        radialGrad.addColorStop(0, "#1e1b4b"); // Cosmic Violet space sky
        radialGrad.addColorStop(1, "#030712"); // Obsidian deep space frame
      }
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, VW, VH);

      // Shafts of sunbeams / stellar rays
      if (currentThemeZone === "emerald") {
        ctx.fillStyle = "rgba(52, 211, 153, 0.035)";
      } else if (currentThemeZone === "twilight") {
        ctx.fillStyle = "rgba(251, 146, 60, 0.04)";
      } else {
        ctx.fillStyle = "rgba(168, 85, 247, 0.055)";
      }
      // Draw left theme sunbeam
      ctx.beginPath();
      ctx.moveTo(VW * 0.2, 0);
      ctx.lineTo(VW * 0.45, VH);
      ctx.lineTo(VW * 0.65, VH);
      ctx.lineTo(VW * 0.35, 0);
      ctx.fill();

      // Draw right theme sunbeam
      ctx.beginPath();
      ctx.moveTo(VW * 0.6, 0);
      ctx.lineTo(VW * 0.82, VH);
      ctx.lineTo(VW * 0.95, VH);
      ctx.lineTo(VW * 0.75, 0);
      ctx.fill();

      // Render & drift background decorative particles (dynamic colors per theme)
      bgElements.forEach((bg) => {
        bg.animOffset += 0.05;
        if (bg.type === "cloud") {
          bg.x += bg.speed;
          if (bg.x > VW) bg.x = -bg.width;
          
          if (currentThemeZone === "emerald") {
            ctx.fillStyle = "rgba(16, 185, 129, 0.07)";
          } else if (currentThemeZone === "twilight") {
            ctx.fillStyle = "rgba(244, 63, 94, 0.06)";
          } else {
            ctx.fillStyle = "rgba(139, 92, 246, 0.05)";
          }
          ctx.beginPath();
          ctx.arc(bg.x, bg.y, bg.height, 0, Math.PI * 2);
          ctx.arc(bg.x + bg.width * 0.3, bg.y - bg.height * 0.2, bg.height * 1.3, 0, Math.PI * 2);
          ctx.arc(bg.x + bg.width * 0.6, bg.y + bg.height * 0.1, bg.height * 0.9, 0, Math.PI * 2);
          ctx.fill();
        } else if (bg.type === "firefly") {
          bg.y -= bg.speed;
          bg.x += Math.sin(bg.animOffset) * 0.25;
          if (bg.y < 0) {
            bg.y = VH;
            bg.x = Math.random() * VW;
          }
          
          let colorInner = "rgba(253, 224, 71, 0.85)"; // Gold fireflies by default
          let colorOuter = "rgba(253, 224, 71, 0)";
          
          if (currentThemeZone === "twilight") {
            colorInner = "rgba(251, 146, 60, 0.9)"; // Red orange sunset sparkles
            colorOuter = "rgba(251, 146, 60, 0)";
          } else if (currentThemeZone === "nebula") {
            colorInner = "rgba(103, 232, 249, 0.95)"; // Electric Cyan alien bugs
            colorOuter = "rgba(103, 232, 249, 0)";
          }

          const glow = ctx.createRadialGradient(bg.x, bg.y, 1, bg.x, bg.y, 6);
          glow.addColorStop(0, colorInner);
          glow.addColorStop(1, colorOuter);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(bg.x, bg.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // --- 2. UPDATE RUNTIME GENERATION ---
      // Shift everything downwards relative to vertical scroll
      platforms.forEach((p) => { p.y += activeScrollSpeed; });
      obstacles.forEach((o) => { o.y += activeScrollSpeed; });
      coins.forEach((c) => { c.y += activeScrollSpeed; });
      boosters.forEach((b) => { b.y += activeScrollSpeed; });
      particles.forEach((pt) => { pt.y += activeScrollSpeed; });

      // Spawn new platforms and objects when highest platform comes into view
      let highestY = VH;
      platforms.forEach((p) => {
        if (p.y < highestY) highestY = p.y;
      });

      if (highestY > -100) {
        spawnPlatform(-150);
      }

      // Purge offscreen platform data to maintain performance memory
      for (let i = platforms.length - 1; i >= 0; i--) {
        if (platforms[i].y > VH + 100) {
          platforms.splice(i, 1);
        }
      }
      for (let i = obstacles.length - 1; i >= 0; i--) {
        if (obstacles[i].y > VH + 100) {
          obstacles.splice(i, 1);
        }
      }
      for (let i = coins.length - 1; i >= 0; i--) {
        if (coins[i].y > VH + 100) {
          coins.splice(i, 1);
        }
      }
      for (let i = boosters.length - 1; i >= 0; i--) {
        if (boosters[i].y > VH + 100) {
          boosters.splice(i, 1);
        }
      }

      // --- 3. PLAYER MOVEMENT & PHYSICS ---
      // Left / Right direction handlers
      let targetVx = 0;
      if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"] || keysPressed.current["A"] || leftPressed.current) {
        targetVx = -5.4;
        player.facing = "left";
      } else if (keysPressed.current["ArrowRight"] || keysPressed.current["d"] || keysPressed.current["D"] || rightPressed.current) {
        targetVx = 5.4;
        player.facing = "right";
      }

      // Smooth horizontal acceleration/friction interpolation for buttery smooth feel
      player.vx += (targetVx - player.vx) * 0.32;
      player.x += player.vx;

      // Horizontal screen boundary safety clamp
      if (player.x < 0) {
        player.x = 0;
        player.vx = 0;
      }
      if (player.x > VW - player.width) {
        player.x = VW - player.width;
        player.vx = 0;
      }

      // Vertical gravity & collision
      player.vy += 0.42; // Strong snappy gravity so bunny lands quickly
      player.y += player.vy;

      // Platform Collisions (Only land while falling down)
      player.isGrounded = false;
      const nextY = player.y + player.height;

      platforms.forEach((p) => {
        // Wooden sway offset displacement
        p.swayOffset += p.swaySpeed;
        const currentSwayX = p.swayAmount ? Math.sin(p.swayOffset) * p.swayAmount : 0;
        const platLeft = p.x + currentSwayX;
        const platRight = platLeft + p.width;

        // Check feet boundary
        if (
          player.vy >= 0 &&
          player.x + player.width - 6 >= platLeft &&
          player.x + 6 <= platRight &&
          nextY >= p.y &&
          player.y + player.height - player.vy <= p.y + p.height
        ) {
          player.y = p.y - player.height;
          player.vy = 0;
          player.isGrounded = true;
          player.jumpCount = 0;
          
          // Carry player horizontal along swaying log
          if (p.swayAmount) {
            player.x += Math.cos(p.swayOffset) * p.swaySpeed * p.swayAmount;
          }
        }
      });

      // Update input buffers
      if (player.isGrounded) {
        coyoteFrames = 8;
        if (jumpBufferedFrames > 0) {
          jumpBufferedFrames = 0;
          triggerJump();
        }
      } else {
        if (coyoteFrames > 0) {
          coyoteFrames--;
        }
      }
      if (jumpBufferedFrames > 0) {
        jumpBufferedFrames--;
      }

      // Fallen off-screen (bottom of viewport check)
      if (player.y > VH && !gameStateRef.current.isDead) {
        handlePlayerLose();
      }

      // --- 4. COINS PROCESSING ---
      coins.forEach((c) => {
        if (c.collected) return;
        c.pulseOffset += 0.1;

        // Bounding box approximation
        const coinCx = c.x;
        const coinCy = c.y;
        const roboCx = player.x + player.width / 2;
        const roboCy = player.y + player.height / 2;
        const dist = Math.hypot(coinCx - roboCx, coinCy - roboCy);

        if (dist < c.radius + player.width / 2) {
          c.collected = true;

          const isDouble = doublePointsTimer > 0;
          const coinsGained = isDouble ? 2 : 1;
          gameStateRef.current.coins += coinsGained;
          AudioSynth.playCoin();
          
          // Boost energy timer by +3 seconds, maxing out at 50 seconds
          energyTimer = Math.min(50, energyTimer + 3.0);

          // Spawn rising text particle
          particles.push({
            x: c.x,
            y: c.y - 12,
            vx: 0,
            vy: -1.0,
            size: 11,
            color: isDouble ? "#facc15" : "#fb923c", // Gold if double, else carrot orange
            alpha: 1,
            life: 50,
            maxLife: 50,
            type: "text",
            text: isDouble ? "🥕 +2 Carrots (2X!)" : "+3s Power!"
          });

          // Sparkle burst stars
          for (let i = 0; i < 8; i++) {
            particles.push({
              x: c.x,
              y: c.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              size: 2 + Math.random() * 2.5,
              color: isDouble ? "#fbbf24" : "#fdba74", // Gold sparkles if 2X, else bright orange
              alpha: 1,
              life: 30 + Math.random() * 20,
              maxLife: 50,
              type: "sparkle",
            });
          }
        }
      });

      // --- 4B. BOOSTERS PROCESSING ---
      boosters.forEach((b) => {
        if (b.collected) return;
        b.pulseOffset += 0.15;

        // Bounding box approximation
        const boosterCx = b.x + b.width / 2;
        const boosterCy = b.y + b.height / 2;
        const roboCx = player.x + player.width / 2;
        const roboCy = player.y + player.height / 2;
        const dist = Math.hypot(boosterCx - roboCx, boosterCy - roboCy);

        if (dist < b.width / 2 + player.width / 2) {
          b.collected = true;
          doublePointsTimer = 10.0; // 10 whole seconds of 2X Points!
          AudioSynth.playCoin();
          
          // Spawn big golden sparkle burst
          for (let i = 0; i < 15; i++) {
            particles.push({
              x: b.x + b.width / 2,
              y: b.y + b.height / 2,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              size: 3 + Math.random() * 4,
              color: "#fbbf24", // bright sparkling gold
              alpha: 1,
              life: 40 + Math.random() * 20,
              maxLife: 60,
              type: "sparkle"
            });
          }

          // Rising status banner text particle
          particles.push({
            x: b.x + b.width / 2,
            y: b.y - 12,
            vx: 0,
            vy: -1.2,
            size: 13,
            color: "#facc15", // gold
            alpha: 1,
            life: 60,
            maxLife: 60,
            type: "text",
            text: "⭐ DOUBLE SCORE! 2X ACTIVE ⭐"
          });
        }
      });

      // --- 5. OBSTACLES PROCESSING & INTRUSIVE COLLISIONS ---
      obstacles.forEach((o) => {
        o.animOffset += 0.04;

        if (o.type === "wasp") {
          // Patrol horizontally
          if (o.vx && o.baseX) {
            o.x += o.vx;
            if (o.x < o.baseX - 40) {
              o.vx = Math.abs(o.vx);
            } else if (o.x > o.baseX + 40) {
              o.vx = -Math.abs(o.vx);
            }
          }
        }

        // Precise AABB collision box overlap bounds
        const roboLeft = player.x + 4;
        const roboRight = player.x + player.width - 4;
        const roboTop = player.y + 4;
        const roboBottom = player.y + player.height - 4;

        const obsLeft = o.x;
        const obsRight = o.x + o.width;
        const obsTop = o.y;
        const obsBottom = o.y + o.height;

        if (
          roboRight >= obsLeft &&
          roboLeft <= obsRight &&
          roboBottom >= obsTop &&
          roboTop <= obsBottom &&
          !gameStateRef.current.isDead
        ) {
          // Play wood spike crunch buzz & die
          AudioSynth.playHit();
          
          // Splat mechanical red sparks
          for (let i = 0; i < 20; i++) {
            particles.push({
              x: player.x + player.width / 2,
              y: player.y + player.height / 2,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              size: 3 + Math.random() * 3,
              color: "#ef4444", // Red alerts sparks
              alpha: 1,
              life: 40 + Math.random() * 20,
              maxLife: 60,
              type: "sparkle",
            });
          }

          handlePlayerLose();
        }
      });

      // --- 6. RENDER GAME OBJECTS ---
      // Render Wooden & moss log platforms
      platforms.forEach((p) => {
        const currentSwayX = p.swayAmount ? Math.sin(p.swayOffset) * p.swayAmount : 0;
        const drawX = p.x + currentSwayX;

        ctx.save();
        if (p.type === "ground") {
          // Soft lush moss surface
          const groundGrad = ctx.createLinearGradient(drawX, p.y, drawX, p.y + p.height);
          groundGrad.addColorStop(0, "#15803d"); // bright forest grass
          groundGrad.addColorStop(0.3, "#166534"); // dark green turf
          groundGrad.addColorStop(1, "#14532d"); // soil bottom
          ctx.fillStyle = groundGrad;
          ctx.fillRect(drawX, p.y, p.width, p.height);

          // Grass grass tuft hairs
          ctx.fillStyle = "#22c55e";
          for (let gx = 10; gx < p.width; gx += 22) {
            ctx.beginPath();
            ctx.moveTo(gx, p.y);
            ctx.lineTo(gx - 4, p.y - 6);
            ctx.lineTo(gx + 2, p.y);
            ctx.lineTo(gx + 6, p.y - 8);
            ctx.lineTo(gx + 10, p.y);
            ctx.fill();
          }
        } else {
          // Wood platform logs
          const logGrad = ctx.createLinearGradient(drawX, p.y, drawX, p.y + p.height);
          logGrad.addColorStop(0, "#78350f"); // warm light wood log
          logGrad.addColorStop(0.5, "#451a03"); // woody core bark
          logGrad.addColorStop(1, "#3c1502"); // dark shadow line
          ctx.fillStyle = logGrad;
          
          // Draw rounded wood bar shape
          ctx.beginPath();
          ctx.roundRect(drawX, p.y, p.width, p.height, 6);
          ctx.fill();

          // Wooden bark texture lines
          ctx.strokeStyle = "rgba(224, 115, 20, 0.15)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(drawX + 8, p.y + 5);
          ctx.lineTo(drawX + p.width - 8, p.y + 5);
          ctx.moveTo(drawX + 16, p.y + 10);
          ctx.lineTo(drawX + p.width - 24, p.y + 10);
          ctx.stroke();

          // Tree ring ends
          ctx.fillStyle = "#b45309";
          ctx.beginPath();
          ctx.arc(drawX + 4, p.y + p.height/2, 4, 0, Math.PI * 2);
          ctx.arc(drawX + p.width - 4, p.y + p.height/2, 4, 0, Math.PI * 2);
          ctx.fill();

          // Green hanging vines ivy
          if (p.hasVines) {
            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(drawX + p.width * 0.2, p.y + p.height);
            ctx.bezierCurveTo(
              drawX + p.width * 0.2 - 5, p.y + p.height + 10,
              drawX + p.width * 0.2 + 5, p.y + p.height + 20,
              drawX + p.width * 0.2, p.y + p.height + 25
            );
            ctx.stroke();

            // Leaf tips
            ctx.fillStyle = "#15803d";
            ctx.beginPath();
            ctx.arc(drawX + p.width * 0.2 - 1, p.y + p.height + 12, 3, 0, Math.PI * 2);
            ctx.arc(drawX + p.width * 0.2 + 1, p.y + p.height + 22, 3.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      });

      // Render Carrots (formerly Coins) list
      coins.forEach((c) => {
        if (c.collected) return;
        const pulse = Math.sin(c.pulseOffset) * 1.8;

        ctx.save();
        // Translate to center to allow sweet rotation and swaying in the wind
        ctx.translate(c.x, c.y + pulse);
        ctx.rotate(Math.sin(c.pulseOffset) * 0.12);

        // Fast decorative background pulse aura (100x faster than shadowBlur)
        ctx.fillStyle = "rgba(249, 115, 22, 0.14)";
        ctx.beginPath();
        ctx.arc(0, 0, 11 + pulse * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 1. Draw green leafy plumes first
        ctx.fillStyle = "#22c55e"; // leaf green
        ctx.beginPath();
        // left leaf
        ctx.ellipse(-4.5, -9, 3, 6, -Math.PI / 6, 0, Math.PI * 2);
        // right leaf
        ctx.ellipse(4.5, -9, 3, 6, Math.PI / 6, 0, Math.PI * 2);
        // center tall leaf
        ctx.ellipse(0, -11, 3.5, 8.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Draw sweet chubby orange root body
        ctx.fillStyle = "#f97316"; // vibrant carrot orange
        ctx.strokeStyle = "#ea580c"; // deep orange skin border
        ctx.lineWidth = 1.8;

        ctx.beginPath();
        ctx.moveTo(-6, -3);
        ctx.bezierCurveTo(-6, -8, 6, -8, 6, -3); // rounded top crown
        ctx.lineTo(1.5, 11); // taproot tip
        ctx.lineTo(-1.5, 11);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Draw horizontal skin texture details
        ctx.strokeStyle = "rgba(124, 45, 18, 0.45)"; // dark reddish brown detail
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-4, -3); ctx.lineTo(1, -3);
        ctx.moveTo(3, 0); ctx.lineTo(-1, 0);
        ctx.moveTo(-3, 3); ctx.lineTo(1, 3);
        ctx.moveTo(1.5, 6); ctx.lineTo(-1.5, 6);
        ctx.stroke();

        ctx.restore();
      });

      // Render Booster list (glowing bouncing golden rabbit tokens!)
      boosters.forEach((b) => {
        if (b.collected) return;
        const bounce = Math.sin(b.pulseOffset) * 4;

        ctx.save();
        ctx.translate(b.x + b.width / 2, b.y + b.height / 2 + bounce);

        // Golden glowing background ring
        ctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 11 + Math.sin(b.pulseOffset * 1.5) * 1.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "rgba(253, 224, 71, 0.15)";
        ctx.beginPath();
        ctx.arc(0, 0, 11 + Math.sin(b.pulseOffset * 1.5) * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // High detail miniature golden bunny
        ctx.fillStyle = "#facc15"; // rich gold body
        ctx.strokeStyle = "#ca8a04"; // gold outline
        ctx.lineWidth = 1.5;

        // Draw left ear
        ctx.beginPath();
        ctx.ellipse(-3, -7, 2, 5, -Math.PI / 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw right ear
        ctx.beginPath();
        ctx.ellipse(3, -7, 2, 5, Math.PI / 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Head and body (fused cute round golden token bunny)
        ctx.beginPath();
        ctx.arc(0, -1, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 4, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Bouncing golden star badge "2X" text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 7px monospace";
        ctx.textAlign = "center";
        ctx.fillText("2X", 0, 5);

        ctx.restore();
      });

      // Render Obstacles list
      obstacles.forEach((o) => {
        ctx.save();
        if (o.type === "wood_spike") {
          // Sharp pointy jungle wood stakes
          // Draw base wood bar
          ctx.fillStyle = "#1e1b4b"; // toxic dark thorns
          ctx.fillRect(o.x, o.y + o.height - 4, o.width, 4);

          // Render 3 pointy triangular barbs
          ctx.fillStyle = "#4338ca"; // sharp violet spikes
          ctx.strokeStyle = "#818cf8";
          ctx.lineWidth = 1.5;
          
          const spikeCount = 3;
          const pieceWidth = o.width / spikeCount;
          for (let i = 0; i < spikeCount; i++) {
            ctx.beginPath();
            ctx.moveTo(o.x + i * pieceWidth, o.y + o.height);
            ctx.lineTo(o.x + i * pieceWidth + pieceWidth/2, o.y);
            ctx.lineTo(o.x + (i + 1) * pieceWidth, o.y + o.height);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Blood-red venom tips
            ctx.fillStyle = "#ef4444";
            ctx.beginPath();
            ctx.moveTo(o.x + i * pieceWidth + pieceWidth/4, o.y + o.height/2);
            ctx.lineTo(o.x + i * pieceWidth + pieceWidth/2, o.y);
            ctx.lineTo(o.x + i * pieceWidth + 3*pieceWidth/4, o.y + o.height/2);
            ctx.closePath();
            ctx.fill();
          }
        } else if (o.type === "wasp") {
          // A cute flapping techno-bee wasp robot
          const wag = Math.sin(o.animOffset * 3) * 6;
          
          // Glowing wings
          ctx.fillStyle = "rgba(186, 230, 253, 0.6)";
          ctx.beginPath();
          ctx.ellipse(o.x + o.width/2 - 6, o.y + 4 - wag, 5, 8, -Math.PI / 4, 0, Math.PI * 2);
          ctx.ellipse(o.x + o.width/2 + 6, o.y + 4 - wag, 5, 8, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();

          // Main rounded body (striped yellow & purple)
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.arc(o.x + o.width/2, o.y + o.height/2, 9, 0, Math.PI * 2);
          ctx.fill();

          // Venom stinger spike
          ctx.fillStyle = "#1e1b4b";
          ctx.beginPath();
          ctx.moveTo(o.x + o.width/2, o.y + o.height/2 + 7);
          ctx.lineTo(o.x + o.width/2 - 4, o.y + o.height/2 + 15);
          ctx.lineTo(o.x + o.width/2 + 4, o.y + o.height/2 + 15);
          ctx.closePath();
          ctx.fill();

          // Stripes stripes
          ctx.fillStyle = "#4338ca";
          ctx.fillRect(o.x + o.width/2 - 6, o.y + o.height/2 - 3, 12, 3);
          ctx.fillRect(o.x + o.width/2 - 8, o.y + o.height/2 + 2, 16, 2);

          // Glowing binary red goggles (No heavy shadowBlur for 60fps performance)
          ctx.fillStyle = "rgba(239, 68, 68, 0.28)";
          ctx.beginPath();
          ctx.arc(o.x + o.width/2, o.y + o.height/2 - 2, 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(o.x + o.width/2 - 3, o.y + o.height/2 - 2, 2.8, 0, Math.PI * 2);
          ctx.arc(o.x + o.width/2 + 3, o.y + o.height/2 - 2, 2.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(o.x + o.width/2 - 3.8, o.y + o.height/2 - 2.8, 0.8, 0, Math.PI * 2);
          ctx.arc(o.x + o.width/2 + 2.2, o.y + o.height/2 - 2.8, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // --- 7. RENDER CUSTOM CUTE JUNGLE BUNNY PLAYER ---
      ctx.save();
      const bunnyTheme = getRabbitColors(robotColor);

      // Keep bunny standing perfectly straight upright at all times, with no rotational tilt
      player.angle = 0;

      ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

      // Shadow overlay on the grass log
      ctx.fillStyle = "rgba(0,0,0,0.14)";
      ctx.beginPath();
      ctx.arc(0, 15, 13, 0, Math.PI * 2);
      ctx.fill();

      // Dynamic ears motion calculation based on vertical velocity
      // ears bend backward when leaping, and point/flop upwards when falling/landing
      const earStretch = Math.min(6, Math.max(-4, player.vy * 0.8));
      const earAngleL = -Math.PI / 12 + (player.vy < 0 ? 0.12 : -0.06);
      const earAngleR = Math.PI / 12 + (player.vy < 0 ? -0.12 : 0.06);

      // 1. Draw Fluffy Bunny Ears
      // Left Ear Outer
      ctx.fillStyle = bunnyTheme.body;
      ctx.save();
      ctx.translate(-5, -12);
      ctx.rotate(earAngleL);
      ctx.beginPath();
      ctx.roundRect(-4, -13 - earStretch, 8, 16 + earStretch, 4);
      ctx.fill();
      // Left Ear Inner Pink Fluff
      ctx.fillStyle = bunnyTheme.earsInside;
      ctx.beginPath();
      ctx.roundRect(-2, -11 - earStretch, 4, 12 + earStretch, 2);
      ctx.fill();
      ctx.restore();

      // Right Ear Outer
      ctx.fillStyle = bunnyTheme.body;
      ctx.save();
      ctx.translate(5, -12);
      ctx.rotate(earAngleR);
      ctx.beginPath();
      ctx.roundRect(-4, -13 - earStretch, 8, 16 + earStretch, 4);
      ctx.fill();
      // Right Ear Inner Pink Fluff
      ctx.fillStyle = bunnyTheme.earsInside;
      ctx.beginPath();
      ctx.roundRect(-2, -11 - earStretch, 4, 12 + earStretch, 2);
      ctx.fill();
      ctx.restore();

      // 2. Beautiful white/cream fluffy cotton tail on the back side based on direction
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      const tailX = player.facing === "right" ? -14 : 14;
      ctx.arc(tailX, 4, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Fluffy Cheeky bunny cheeks / face backing
      ctx.fillStyle = bunnyTheme.body;
      ctx.strokeStyle = bunnyTheme.accent;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 2, 14.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Creamy soft belly patch
      ctx.fillStyle = bunnyTheme.belly;
      ctx.beginPath();
      ctx.arc(0, 5, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // 4. Blushing cheeks
      ctx.fillStyle = bunnyTheme.cheeks;
      ctx.beginPath();
      ctx.arc(-8, 3, 3, 0, Math.PI * 2);
      ctx.arc(8, 3, 3, 0, Math.PI * 2);
      ctx.fill();

      // 5. Blinking Eye Mechanism
      player.blinkTimer -= 1;
      if (player.blinkTimer < 0) {
        player.blinkTimer = 110 + Math.random() * 140;
      }
      const isBlinking = player.blinkTimer < 8;

      if (isBlinking) {
        // Soft happy closed eye curved lines
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        // left eye curve
        ctx.arc(-5.2, -1.2, 2.5, Math.PI, 0, false);
        // right eye curve
        ctx.arc(5.2, -1.2, 2.5, Math.PI, 0, false);
        ctx.stroke();
      } else {
        // Big round shiny anime eyes
        ctx.fillStyle = "#1e293b"; // dark deep slate
        ctx.beginPath();
        ctx.arc(-5, -1.5, 3.2, 0, Math.PI * 2);
        ctx.arc(5, -1.5, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // White glistening eye reflections of the forest light
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-6.2, -2.5, 1.2, 0, Math.PI * 2);
        ctx.arc(3.8, -2.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-4, -0.6, 0.6, 0, Math.PI * 2);
        ctx.arc(6, -0.6, 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Sweet tiny pink nose triangle and smile whiskers lines
      ctx.fillStyle = "#fda4af"; // cute pink
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(-2, 0.5);
      ctx.lineTo(2, 0.5);
      ctx.closePath();
      ctx.fill();

      // Little curved w-smile mouth lines
      ctx.strokeStyle = bunnyTheme.accent;
      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(-1.5, 3.2, 1.6, 0, Math.PI);
      ctx.arc(1.5, 3.2, 1.6, 0, Math.PI);
      ctx.stroke();

      // Tiny white rabbit front teeth
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-1.5, 4.8, 3, 2.2);

      // Whisker lines
      ctx.strokeStyle = "rgba(30, 41, 59, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      // left whiskers
      ctx.moveTo(-11, 2); ctx.lineTo(-17, 1);
      ctx.moveTo(-11, 4); ctx.lineTo(-17, 4.5);
      // right whiskers
      ctx.moveTo(11, 2); ctx.lineTo(17, 1);
      ctx.moveTo(11, 4); ctx.lineTo(17, 4.5);
      ctx.stroke();

      // 7. Dynamic Cute Paws / Feet
      const squashMultiplier = player.vy > 0 ? 1 : player.vy < 0 ? 0.65 : 0.82;
      ctx.fillStyle = bunnyTheme.body;
      ctx.strokeStyle = bunnyTheme.accent;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      // Left fluffy foot
      ctx.ellipse(-6, 13.5 + 2 * squashMultiplier, 4.5, 3 * squashMultiplier, 0, 0, Math.PI * 2);
      // Right fluffy foot
      ctx.ellipse(6, 13.5 + 2 * squashMultiplier, 4.5, 3 * squashMultiplier, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // --- 8. EMIT PARTICLES ENGINE (SMOKE, SPARKLES, JUMP CLOUDS) ---
      // Cap maximum active particles count to 75 for superb canvas performance
      if (particles.length > 75) {
        particles.splice(0, particles.length - 75);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.life -= 1;
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha = Math.max(0, pt.life / pt.maxLife);

        if (pt.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = pt.alpha;
        
        if (pt.type === "text" && pt.text) {
          ctx.fillStyle = pt.color;
          ctx.font = "bold 11px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(pt.text, pt.x, pt.y);
        } else {
          ctx.fillStyle = pt.color;
          if (pt.type === "sparkle") {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Smoke puff circles
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // --- 9. RENDER THEME TRANSITION BANNER OVERLAY ---
      if (transitionBannerTimer > 0) {
        transitionBannerTimer--;
        ctx.save();
        ctx.globalAlpha = Math.min(1.0, transitionBannerTimer / 30);
        
        // Background dark overlay banner slab
        ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
        ctx.strokeStyle = currentThemeZone === "emerald" ? "#10b981" : currentThemeZone === "twilight" ? "#f97316" : "#a855f7";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(35, VH / 2 - 35, VW - 70, 56, 12);
        ctx.fill();
        ctx.stroke();

        // Banner header text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(transitionBannerText, VW / 2, VH / 2 - 14);

        // Banner sub text description
        ctx.fillStyle = currentThemeZone === "emerald" ? "#34d399" : currentThemeZone === "twilight" ? "#fdba74" : "#c084fc";
        ctx.font = "bold 8px monospace";
        ctx.fillText(themeDesc, VW / 2, VH / 2 + 10);
        ctx.restore();
      }

      // Keep updates matching React state variables for the overlays
      setScore(computedScore);
      setCoinsCount(gameStateRef.current.coins);
      setTimeRemaining(Math.ceil(energyTimer));
      setSurvivalScoreTime(survivalSeconds);
      setDoublePointsTime(Math.ceil(doublePointsTimer));
      if (activeThemeName !== themeTitle) {
        setActiveThemeName(themeTitle);
      }

      // Request next frame
      animationId = requestAnimationFrame(gameLoop);
    };

    // Fail safe finish
    const handlePlayerLose = () => {
      gameStateRef.current.isDead = true;
      cancelAnimationFrame(animationId);
      onGameOver(
        gameStateRef.current.score,
        gameStateRef.current.coins,
        gameStateRef.current.timeSeconds
      );
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      delete (window as any).triggerJumpBtn;
    };
  }, [countdown, onGameOver, robotColor]);

  // Touch arrows interface helpers
  const handleLeftPress = (state: boolean) => {
    leftPressed.current = state;
  };

  const handleRightPress = (state: boolean) => {
    rightPressed.current = state;
  };

  const triggerOnScreenJump = () => {
    if (typeof (window as any).triggerJumpBtn === "function") {
      (window as any).triggerJumpBtn();
    }
  };

  return (
    <div ref={containerRef} className="flex-1 flex flex-col relative w-full h-full bg-emerald-950">
      {/* 1. Play HUD Status bar overlaid */}
      <div className="absolute top-2 inset-x-3 flex items-center justify-between pointer-events-none z-20">
        {/* Floating level speed factor tag */}
        <div className="px-2 py-1 bg-slate-900/60 backdrop-blur-md rounded-lg border border-teal-500/30 flex items-center gap-1">
          <TrendingUp size={12} className="text-teal-400 animate-pulse" />
          <span className="text-[10px] text-teal-300 font-mono font-bold tracking-tight">
            x{gameStateRef.current.speedFactor.toFixed(1)} SPD
          </span>
        </div>

        {/* Dynamic score dashboard */}
        <div className="flex flex-col items-end">
          <div className="text-xl font-bold font-mono text-emerald-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {score.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider drop-shadow-sm">
            Total Score
          </span>
        </div>
      </div>

      {/* Primary stats counter below HUD */}
      {countdown === null && (
        <div className="absolute top-12 inset-x-3 flex flex-col gap-1.5 pointer-events-none z-20 text-[11px] font-mono select-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/90 rounded-full border border-orange-400/40 shadow-sm text-slate-950 font-extrabold">
              <span className="text-sm animate-bounce inline-block">🥕</span>
              <span>Carrots: {coinsCount}</span>
            </div>
            <div className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 font-extrabold transition-all duration-300 ${
              timeRemaining <= 10 
                ? "bg-rose-950/95 border-rose-500 text-rose-350 shadow-[0_0_12px_rgba(239,68,68,0.5)] scale-105" 
                : "bg-slate-950/75 border-slate-700/30 text-amber-300"
            }`}>
              <span className={timeRemaining <= 10 ? "animate-pulse text-red-400 font-black text-xs" : ""}>
                {timeRemaining <= 10 ? "⚠️" : "⚡"}
              </span>
              <span>{timeRemaining}s Energy</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className={`px-2 py-0.5 bg-slate-950/85 border ${
              activeThemeName.includes("Canopy") ? "border-emerald-500/40 text-emerald-300" :
              activeThemeName.includes("Sunset") ? "border-orange-500/40 text-orange-400" :
              "border-purple-500/40 text-purple-300"
            } rounded-md text-[9px] uppercase tracking-wider font-extrabold`}>
              📍 {activeThemeName}
            </div>
            <div className="px-2 py-0.5 bg-slate-950/70 border border-slate-800 rounded-md text-[9px] text-slate-350 font-bold">
              ⏱️ Survived: {survivalScoreTime}s
            </div>
          </div>

           {/* Dynamic Energy Bar Progress Meter */}
          <div className="w-full h-2 bg-slate-950/85 rounded-full overflow-hidden border border-slate-800/40 p-[1.5px]">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                timeRemaining <= 10 
                  ? "bg-gradient-to-r from-red-600 via-rose-500 to-red-400 animate-pulse" 
                  : "bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300"
              }`}
              style={{ width: `${Math.min(100, (timeRemaining / 45) * 100)}%` }}
            />
          </div>

          {/* Golden 2X Active Multiplier Badge */}
          {doublePointsTime > 0 && (
            <div className="w-full py-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border border-yellow-300 rounded-lg text-slate-950 font-black text-center uppercase tracking-widest text-[9px] animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.65)] flex items-center justify-center gap-1.5 mt-0.5">
              <span>🌟 DOUBLE CARROTS ACTIVE: {doublePointsTime}s 🌟</span>
            </div>
          )}
        </div>
      )}

      {/* 2. Standard Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-emerald-950 select-none touch-none touch-pan-y"
      />

      {/* 3. Pre-Game countdown overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center z-40 p-6 select-none animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-6 animate-pulse">
            <span className="font-mono text-emerald-300 font-bold text-xl">🐰</span>
          </div>
          <h2 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-1">
            Warming Up Legs...
          </h2>
          <p className="text-emerald-200/60 text-xs mb-8">
            Stay on platforms, collect sweet carrots!
          </p>
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold flex items-center justify-center text-4xl shadow-xl ring-4 ring-emerald-400/30 animate-ping">
            {countdown}
          </div>
        </div>
      )}

      {/* 4. Interactive Bottom Touch D-Pad Controls Bezel */}
      {countdown === null && (
        <div className="absolute bottom-2 inset-x-3 flex items-center justify-between select-none z-20 gap-2">
          {/* D-Pad Arrows Section */}
          <div className="flex items-center gap-1.5">
            <button
              onMouseDown={() => handleLeftPress(true)}
              onMouseUp={() => handleLeftPress(false)}
              onMouseLeave={() => handleLeftPress(false)}
              onTouchStart={(e) => { e.preventDefault(); handleLeftPress(true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleLeftPress(false); }}
              className="w-14 h-14 bg-slate-950/85 border border-emerald-500/40 hover:bg-emerald-800 text-emerald-400 flex items-center justify-center rounded-2xl active:scale-90 transition-transform shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer"
            >
              <ArrowLeft size={24} strokeWidth={2.5} />
            </button>
            
            <button
              onMouseDown={() => handleRightPress(true)}
              onMouseUp={() => handleRightPress(false)}
              onMouseLeave={() => handleRightPress(false)}
              onTouchStart={(e) => { e.preventDefault(); handleRightPress(true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleRightPress(false); }}
              className="w-14 h-14 bg-slate-950/85 border border-emerald-500/40 hover:bg-emerald-800 text-emerald-400 flex items-center justify-center rounded-2xl active:scale-90 transition-transform shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer"
            >
              <ArrowRight size={24} strokeWidth={2.5} />
            </button>
          </div>

          {/* Central Booster Jumping button */}
          <button
            onClick={triggerOnScreenJump}
            onTouchStart={(e) => { e.preventDefault(); triggerOnScreenJump(); }}
            className="flex-1 h-14 bg-gradient-to-r from-emerald-600 to-teal-500 border border-emerald-400 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl active:scale-95 transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>🚀 JUMP</span>
            <span className="text-[10px] text-emerald-100 opacity-60 font-mono italic font-normal">
              (or Space)
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
