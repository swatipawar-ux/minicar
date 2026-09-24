/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CarId, EnvironmentId, CameraViewMode, GameStats, NearMissAlert, HighScoreRecord } from './types/game';
import { CAR_CONFIGS } from './game/CarModels';
import { GameEngine } from './game/GameEngine';
import { SoundSystem } from './audio/SoundSystem';
import { HUD } from './components/HUD';
import { GarageMenu } from './components/GarageMenu';
import { PauseMenu } from './components/PauseMenu';
import { GameOverModal } from './components/GameOverModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { TouchControls } from './components/TouchControls';

const STORAGE_KEY_HIGHSCORE = 'arcade_mini_racer_highscore';
const STORAGE_KEY_RECORDS = 'arcade_mini_racer_records';
const STORAGE_KEY_CAR = 'arcade_mini_racer_selected_car';
const STORAGE_KEY_COLOR = 'arcade_mini_racer_selected_color';
const STORAGE_KEY_ENV = 'arcade_mini_racer_selected_env';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const soundSystemRef = useRef<SoundSystem>(new SoundSystem());

  // Game flow states
  const [gameState, setGameState] = useState<'garage' | 'racing' | 'paused' | 'gameover'>('garage');
  const [selectedCarId, setSelectedCarId] = useState<CarId>(() => {
    return (localStorage.getItem(STORAGE_KEY_CAR) as CarId) || 'sport';
  });
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_COLOR) || CAR_CONFIGS['sport'].accentColor;
  });
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentId>(() => {
    return (localStorage.getItem(STORAGE_KEY_ENV) as EnvironmentId) || 'tokyo_night';
  });

  const [cameraMode, setCameraMode] = useState<CameraViewMode>('chase');

  // Audio states
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [sfxVolume, setSfxVolume] = useState<number>(0.8);
  const [musicVolume, setMusicVolume] = useState<number>(0.5);

  // Stats & HUD
  const [stats, setStats] = useState<GameStats>({
    speed: 0,
    score: 0,
    highScore: 0,
    distance: 0,
    nitro: 100,
    multiplier: 1,
    nearMisses: 0,
    coinsCollected: 0,
    nitroUsedCount: 0,
    maxSpeedReached: 0,
    isInvulnerable: false,
    invulnerableTimeRemaining: 0,
  });

  const [nearMissAlerts, setNearMissAlerts] = useState<NearMissAlert[]>([]);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);

  // High Scores & Leaderboard
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HIGHSCORE);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [records, setRecords] = useState<HighScoreRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Stats callback from Three.js engine
  const handleStatsUpdate = useCallback((newStats: GameStats) => {
    setStats((prev) => ({
      ...newStats,
      highScore: Math.max(prev.highScore, highScore),
    }));
  }, [highScore]);

  // Near Miss Alert callback
  const handleNearMiss = useCallback((alert: NearMissAlert) => {
    setNearMissAlerts((prev) => [...prev.slice(-3), alert]);
    setTimeout(() => {
      setNearMissAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    }, 1800);
  }, []);

  // Game Over callback
  const handleGameOver = useCallback((finalStats: GameStats) => {
    setGameState('gameover');
    setStats(finalStats);

    const isRecord = finalStats.score > highScore;
    setIsNewHighScore(isRecord);

    if (isRecord) {
      setHighScore(finalStats.score);
      localStorage.setItem(STORAGE_KEY_HIGHSCORE, finalStats.score.toString());
    }

    // Save to hall of fame
    const newRecord: HighScoreRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      carId: selectedCarId,
      score: finalStats.score,
      distance: finalStats.distance,
      maxSpeed: finalStats.maxSpeedReached,
      environment: selectedEnv,
    };

    setRecords((prev) => {
      const updated = [...prev, newRecord].sort((a, b) => b.score - a.score).slice(0, 10);
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
      return updated;
    });
  }, [highScore, selectedCarId, selectedEnv]);

  // Initialize GameEngine once container is ready
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine({
      container: containerRef.current,
      carId: selectedCarId,
      carColorHex: selectedColor,
      environmentId: selectedEnv,
      soundSystem: soundSystemRef.current,
      onStatsUpdate: handleStatsUpdate,
      onNearMiss: handleNearMiss,
      onGameOver: handleGameOver,
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [handleStatsUpdate, handleNearMiss, handleGameOver]);

  // Car and Environment switchers
  const handleSelectCar = (carId: CarId) => {
    setSelectedCarId(carId);
    const defColor = CAR_CONFIGS[carId].accentColor;
    setSelectedColor(defColor);
    localStorage.setItem(STORAGE_KEY_CAR, carId);
    localStorage.setItem(STORAGE_KEY_COLOR, defColor);
    if (engineRef.current) {
      engineRef.current.changeCar(carId, defColor);
    }
  };

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    localStorage.setItem(STORAGE_KEY_COLOR, color);
    if (engineRef.current) {
      engineRef.current.changeCar(selectedCarId, color);
    }
  };

  const handleSelectEnv = (envId: EnvironmentId) => {
    setSelectedEnv(envId);
    localStorage.setItem(STORAGE_KEY_ENV, envId);
    if (engineRef.current) {
      engineRef.current.changeEnvironment(envId);
    }
  };

  // Start Race
  const handleStartRace = () => {
    soundSystemRef.current.init();
    if (engineRef.current) {
      engineRef.current.changeCar(selectedCarId, selectedColor);
      engineRef.current.changeEnvironment(selectedEnv);
      engineRef.current.setCameraMode(cameraMode);
      engineRef.current.start();
    }
    setGameState('racing');
  };

  // Pause / Resume
  const handlePause = () => {
    if (gameState === 'racing') {
      engineRef.current?.pause();
      setGameState('paused');
    }
  };

  const handleResume = () => {
    if (gameState === 'paused') {
      engineRef.current?.resume();
      setGameState('racing');
    }
  };

  const handleRestart = () => {
    handleStartRace();
  };

  const handleReturnToGarage = () => {
    engineRef.current?.stop();
    setGameState('garage');
  };

  // Camera Cycle
  const handleCycleCamera = () => {
    const modes: CameraViewMode[] = ['chase', 'far', 'hood'];
    const nextIdx = (modes.indexOf(cameraMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setCameraMode(nextMode);
    engineRef.current?.setCameraMode(nextMode);
  };

  // Audio Toggles
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundSystemRef.current.setMuted(nextMuted);
  };

  const handleToggleMusic = () => {
    const isPlaying = soundSystemRef.current.toggleMusic();
    setIsMusicPlaying(isPlaying);
  };

  const handleSetSfxVolume = (val: number) => {
    setSfxVolume(val);
    soundSystemRef.current.setSfxVolume(val);
  };

  const handleSetMusicVolume = (val: number) => {
    setMusicVolume(val);
    soundSystemRef.current.setMusicVolume(val);
  };

  // Keyboard shortcut listener for Pause (Esc or P)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (gameState === 'racing') {
          handlePause();
        } else if (gameState === 'paused') {
          handleResume();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState]);

  // Touch controls input bridge
  const handleTouchAction = (action: 'left' | 'right' | 'up' | 'down' | 'boost', state: boolean) => {
    if (!engineRef.current) return;
    engineRef.current.keys[action] = state;
  };

  const handleClearRecords = () => {
    localStorage.removeItem(STORAGE_KEY_RECORDS);
    localStorage.removeItem(STORAGE_KEY_HIGHSCORE);
    setRecords([]);
    setHighScore(0);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Three.js 3D Viewport Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Subtle CRT / Arcade scanline texture */}
      <div className="absolute inset-0 scanlines opacity-40 pointer-events-none" />

      {/* In-Game HUD overlay */}
      {gameState === 'racing' && (
        <>
          <HUD
            stats={stats}
            nearMissAlerts={nearMissAlerts}
            cameraMode={cameraMode}
            isMuted={isMuted}
            isMusicPlaying={isMusicPlaying}
            onToggleMute={handleToggleMute}
            onToggleMusic={handleToggleMusic}
            onCycleCamera={handleCycleCamera}
            onPause={handlePause}
          />
          <TouchControls onPress={handleTouchAction} />
        </>
      )}

      {/* Garage / Car Selection Screen */}
      {gameState === 'garage' && (
        <GarageMenu
          selectedCarId={selectedCarId}
          selectedColor={selectedColor}
          selectedEnv={selectedEnv}
          highScore={highScore}
          isMuted={isMuted}
          isMusicPlaying={isMusicPlaying}
          onSelectCar={handleSelectCar}
          onSelectColor={handleSelectColor}
          onSelectEnv={handleSelectEnv}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onStartRace={handleStartRace}
        />
      )}

      {/* Pause Menu */}
      {gameState === 'paused' && (
        <PauseMenu
          cameraMode={cameraMode}
          sfxVolume={sfxVolume}
          musicVolume={musicVolume}
          isMuted={isMuted}
          isMusicPlaying={isMusicPlaying}
          onResume={handleResume}
          onRestart={handleRestart}
          onReturnToGarage={handleReturnToGarage}
          onSetCameraMode={(mode) => {
            setCameraMode(mode);
            engineRef.current?.setCameraMode(mode);
          }}
          onSetSfxVolume={handleSetSfxVolume}
          onSetMusicVolume={handleSetMusicVolume}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={stats}
          isNewHighScore={isNewHighScore}
          onRestart={handleRestart}
          onReturnToGarage={handleReturnToGarage}
        />
      )}

      {/* Hall of Fame / Leaderboard Modal */}
      {isLeaderboardOpen && (
        <LeaderboardModal
          records={records}
          onClose={() => setIsLeaderboardOpen(false)}
          onClearRecords={handleClearRecords}
        />
      )}
    </div>
  );
}
