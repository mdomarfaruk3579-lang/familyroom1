import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Heart, Coins, Key, Pause, Play, RotateCcw, 
  AlertTriangle, Settings, ChevronLeft, ChevronRight, ArrowUp, ArrowDown,
  Volume2, VolumeX, Sparkles, Layers, ShieldCheck
} from 'lucide-react';
import { Member } from '../../../types';
import { 
  EraId, GenerationRunner, RunnerConfig, GamePhase, QualityLevel 
} from './types';
import { ERAS_CONFIG, LANE_POSITIONS, createEraEnvironment, EnvironmentScene } from './environment';
import { 
  createCharacter, CharacterRig, animateRunning, animateJumping, 
  animateSliding, animateBatonPass 
} from './characterMesh';
import { loadSavedRunnerConfig, DEFAULT_RUNNER_CONFIG } from './facePipeline';
import { AvatarCustomizer } from './AvatarCustomizer';
import { RelayTeamSelector } from './RelayTeamSelector';
import { TrunkCutscene } from './TrunkCutscene';
import { sounds } from './soundEffects';

interface FamilyRunnerGameProps {
  members: Member[];
  onBackToHub: () => void;
}

export const FamilyRunnerGame: React.FC<FamilyRunnerGameProps> = ({
  members,
  onBackToHub,
}) => {
  // Game Flow State
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [playerConfig, setPlayerConfig] = useState<RunnerConfig>(loadSavedRunnerConfig);
  const [relayTeam, setRelayTeam] = useState<GenerationRunner[]>([]);
  const [currentEraId, setCurrentEraId] = useState<EraId>(1);
  const [quality, setQuality] = useState<QualityLevel>('medium');
  const [isMuted, setIsMuted] = useState(sounds.getIsMuted());

  // Active Gameplay Stats
  const [lives, setLives] = useState(3);
  const [coins, setCoins] = useState(0);
  const [keyPieces, setKeyPieces] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [isHitInvulnerable, setIsHitInvulnerable] = useState(false);

  // 3D Canvas Refs
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const runnerRigRef = useRef<CharacterRig | null>(null);
  const nextRunnerRigRef = useRef<CharacterRig | null>(null);
  const envRef = useRef<EnvironmentScene | null>(null);

  // Gameplay Simulation State Refs
  const gameStateRef = useRef({
    currentLane: 1, // 0 = left, 1 = center, 2 = right
    targetX: 0,
    currentX: 0,
    z: 0,
    speed: 16.5,
    isJumping: false,
    jumpTime: 0,
    jumpDuration: 0.65,
    isSliding: false,
    slideTime: 0,
    slideDuration: 0.7,
    isInvulnerable: false,
    invulnerableTimer: 0,
    isPassingBaton: false,
    passProgress: 0,
    trackLength: 300,
  });

  // Track Length per era
  const TRACK_LENGTH = 280;

  // Initialize Default Relay Team if empty
  useEffect(() => {
    if (relayTeam.length === 0 && members.length > 0) {
      const parentMember = members.find(m => m.type === 'son' || m.type === 'daughter') || members[1] || null;
      const grandMember = members.find(m => m.type === 'grandpa' || m.type === 'grandma') || members[0] || null;
      const elderMember = members.find(m => m.type === 'grandpa') || members[0] || null;

      const initialTeam: GenerationRunner[] = [
        {
          eraId: 1,
          generationTitle: '১ম রানার (বর্তমান)',
          eraName: 'বর্তমান - আধুনিক ঢাকা',
          member: null,
          config: playerConfig,
        },
        {
          eraId: 2,
          generationTitle: '২য় রানার (৯০-এর দশক)',
          eraName: '৯০-এর দশক - রিকশার অলিগলি',
          member: parentMember,
          config: {
            ...DEFAULT_RUNNER_CONFIG,
            gender: parentMember?.gender || 'male',
            outfit: parentMember?.gender === 'female' ? 'saree' : 'shirt_pant',
            outfitColor: '#92400e',
            faceDataUrl: parentMember?.photoUrl || null,
          },
        },
        {
          eraId: 3,
          generationTitle: '৩য় রানার (৬০-এর দশক)',
          eraName: '৬০-এর দশক - মেঠোপথ ও বাদল দিন',
          member: grandMember,
          config: {
            ...DEFAULT_RUNNER_CONFIG,
            gender: grandMember?.gender || 'male',
            outfit: grandMember?.gender === 'female' ? 'saree' : 'panjabi',
            outfitColor: '#166534',
            faceDataUrl: grandMember?.photoUrl || null,
          },
        },
        {
          eraId: 4,
          generationTitle: '৪র্থ রানার (পুরনো দিন)',
          eraName: 'পুরনো দিন - নদীর ঘাট ও পালতোলা নৌকা',
          member: elderMember,
          config: {
            ...DEFAULT_RUNNER_CONFIG,
            gender: elderMember?.gender || 'male',
            outfit: 'panjabi',
            outfitColor: '#78350f',
            faceDataUrl: elderMember?.photoUrl || null,
          },
        },
      ];
      setRelayTeam(initialTeam);
    }
  }, [members, playerConfig]);

  // Keyboard controls listener
  useEffect(() => {
    if (phase !== 'playing' || isPaused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const gs = gameStateRef.current;
      if (gs.isPassingBaton) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        moveLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        moveRight();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        e.preventDefault();
        jump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        slide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isPaused]);

  // Touch Swipe Gesture Handling
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (phase !== 'playing' || isPaused) return;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current || phase !== 'playing' || isPaused) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 28) {
      if (absX > absY) {
        if (dx > 0) moveRight();
        else moveLeft();
      } else {
        if (dy < 0) jump();
        else slide();
      }
    }
    touchStartPos.current = null;
  };

  // Movement Action Functions
  const moveLeft = () => {
    const gs = gameStateRef.current;
    if (gs.currentLane > 0) {
      gs.currentLane -= 1;
      gs.targetX = LANE_POSITIONS[gs.currentLane];
    }
  };

  const moveRight = () => {
    const gs = gameStateRef.current;
    if (gs.currentLane < 2) {
      gs.currentLane += 1;
      gs.targetX = LANE_POSITIONS[gs.currentLane];
    }
  };

  const jump = () => {
    const gs = gameStateRef.current;
    if (!gs.isJumping && !gs.isSliding) {
      gs.isJumping = true;
      gs.jumpTime = 0;
      sounds.playJump();
    }
  };

  const slide = () => {
    const gs = gameStateRef.current;
    if (!gs.isSliding && !gs.isJumping) {
      gs.isSliding = true;
      gs.slideTime = 0;
      sounds.playSlide();
    }
  };

  // Start Level & Setup 3D Scene
  useEffect(() => {
    if (phase !== 'playing') {
      sounds.stopBgm();
      return;
    }
    if (!isPaused) {
      sounds.startBgm();
    } else {
      sounds.stopBgm();
    }
    if (!canvasContainerRef.current) return;

    const container = canvasContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const eraInfo = ERAS_CONFIG[currentEraId];
    scene.background = new THREE.Color(eraInfo.skyColor);
    scene.fog = new THREE.Fog(eraInfo.fogColor, 18, 70);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 120);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: quality !== 'low', alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(quality === 'high' ? Math.min(window.devicePixelRatio, 2) : 1);
    renderer.shadowMap.enabled = quality !== 'low';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const hemiLight = new THREE.HemisphereLight(eraInfo.skyColor, eraInfo.groundColor, 1.1);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(eraInfo.ambientColor, 1.4);
    sunLight.position.set(12, 24, 15);
    sunLight.castShadow = quality !== 'low';
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Build Environment
    const env = createEraEnvironment(currentEraId, TRACK_LENGTH);
    scene.add(env.group);
    envRef.current = env;

    // Build Current Runner
    const currentRunnerConfig = relayTeam[currentEraId - 1]?.config || playerConfig;
    const runner = createCharacter(currentRunnerConfig, true);
    scene.add(runner.root);
    runnerRigRef.current = runner;

    // Reset Simulation State
    const gs = gameStateRef.current;
    gs.currentLane = 1;
    gs.targetX = 0;
    gs.currentX = 0;
    gs.z = 0;
    gs.speed = currentEraId === 1 ? 16 : currentEraId === 2 ? 17 : currentEraId === 3 ? 17.5 : 18;
    gs.isJumping = false;
    gs.isSliding = false;
    gs.isInvulnerable = false;
    gs.isPassingBaton = false;
    gs.passProgress = 0;
    gs.trackLength = TRACK_LENGTH;

    // Game Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const gameLoop = () => {
      animId = requestAnimationFrame(gameLoop);
      if (isPaused) return;

      const delta = Math.min(clock.getDelta(), 0.08);
      const now = clock.getElapsedTime();

      // 1. Move Player Forward along Z
      if (!gs.isPassingBaton) {
        gs.z += gs.speed * delta;
      }

      // Smooth Lane change interpolation (Lerp)
      gs.currentX += (gs.targetX - gs.currentX) * 12 * delta;

      // Update Runner Root Position
      runner.root.position.x = gs.currentX;
      runner.root.position.z = gs.z;

      // Follow Camera behind runner
      camera.position.x = gs.currentX * 0.7;
      camera.position.y = 3.6 + (gs.isJumping ? 0.6 : 0);
      camera.position.z = gs.z - 5.8;
      camera.lookAt(gs.currentX * 0.5, 1.4, gs.z + 6);

      // Move Sunlight with player
      sunLight.position.z = gs.z + 15;
      sunLight.target.position.set(0, 0, gs.z);
      scene.add(sunLight.target);

      // 2. Character Pose & Animation
      if (gs.isJumping) {
        gs.jumpTime += delta;
        const progress = Math.min(gs.jumpTime / gs.jumpDuration, 1);
        animateJumping(runner, progress);
        if (progress >= 1) {
          gs.isJumping = false;
          runner.body.position.y = 0;
        }
      } else if (gs.isSliding) {
        gs.slideTime += delta;
        const progress = Math.min(gs.slideTime / gs.slideDuration, 1);
        animateSliding(runner);
        if (progress >= 1) {
          gs.isSliding = false;
          runner.body.position.y = 0;
          runner.torso.rotation.x = 0;
        }
      } else if (gs.isPassingBaton) {
        // Baton Pass Cutscene
        gs.passProgress += delta * 0.8;
        if (nextRunnerRigRef.current) {
          animateBatonPass(runner, nextRunnerRigRef.current, gs.passProgress);
          nextRunnerRigRef.current.root.position.z = gs.z + 2.4 + gs.passProgress * 4;
        }
        if (gs.passProgress >= 1.2) {
          handleBatonPassComplete();
          return;
        }
      } else {
        animateRunning(runner, now, 1.1);
      }

      // Update ground running dust particles
      runner.updateDust(delta, !gs.isJumping && !gs.isSliding && !gs.isPassingBaton);

      // 3. Invulnerability Flash Timer
      if (gs.isInvulnerable) {
        gs.invulnerableTimer -= delta;
        runner.root.visible = Math.floor(now * 14) % 2 === 0;
        if (gs.invulnerableTimer <= 0) {
          gs.isInvulnerable = false;
          runner.root.visible = true;
          setIsHitInvulnerable(false);
        }
      }

      // 4. Update Environment (coins spin, key piece spin)
      env.update(gs.z, delta);

      // 5. Coin Collection Check
      env.coins.forEach((coin) => {
        if (!coin.collected) {
          const dz = Math.abs(coin.z - gs.z);
          const dx = Math.abs(LANE_POSITIONS[coin.lane] - gs.currentX);
          if (dz < 1.4 && dx < 0.9) {
            coin.collected = true;
            coin.mesh.visible = false;
            setCoins((c) => c + 1);
            sounds.playCoin();
          }
        }
      });

      // 6. Obstacle Collisions
      if (!gs.isInvulnerable && !gs.isPassingBaton) {
        env.obstacles.forEach((obs) => {
          if (!obs.isPassed) {
            const dz = obs.z - gs.z;
            const isNearZ = dz > -0.8 && dz < 1.0;
            const sameLane = obs.lane === gs.currentLane;

            if (isNearZ && sameLane) {
              let isAvoided = false;
              if (obs.canJumpOver && gs.isJumping) isAvoided = true;
              if (obs.canSlideUnder && gs.isSliding) isAvoided = true;

              if (!isAvoided) {
                // HIT OBSTACLE!
                handleObstacleHit();
                obs.isPassed = true;
              }
            }
          }
        });
      }

      // 7. Reach Key Piece & Trigger Level Complete / Baton Pass
      if (!gs.isPassingBaton && gs.z >= TRACK_LENGTH - 12) {
        triggerBatonPass();
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(gameLoop);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      env.cleanup();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [phase, currentEraId, quality, isPaused]);

  // Handle Player Colliding with Obstacle
  const handleObstacleHit = () => {
    sounds.playHit();
    setLives((prev) => {
      const nextLives = prev - 1;
      if (nextLives <= 0) {
        // Soft Retry Screen
        setPhase('game_over');
      }
      return Math.max(0, nextLives);
    });

    const gs = gameStateRef.current;
    gs.isInvulnerable = true;
    gs.invulnerableTimer = 1.5;
    setIsHitInvulnerable(true);
  };

  // Trigger Baton Pass Cutscene
  const triggerBatonPass = () => {
    const gs = gameStateRef.current;
    gs.isPassingBaton = true;
    gs.passProgress = 0;
    setKeyPieces((k) => Math.min(4, k + 1));
    sounds.playKeyPiece();
    sounds.playBatonPass();

    // Spawn Next Generation Runner in front to receive the baton!
    if (sceneRef.current && currentEraId < 4) {
      const nextRunnerConfig = relayTeam[currentEraId]?.config || DEFAULT_RUNNER_CONFIG;
      const nextRunner = createCharacter(nextRunnerConfig, false);
      nextRunner.root.position.set(gs.currentX, 0, gs.z + 2.2);
      sceneRef.current.add(nextRunner.root);
      nextRunnerRigRef.current = nextRunner;
    }
  };

  // Complete Baton Pass & Transition to next Era or Trunk Opening
  const handleBatonPassComplete = () => {
    if (currentEraId < 4) {
      const nextEra = (currentEraId + 1) as EraId;
      setCurrentEraId(nextEra);
      // Brief pause then start new era
      setPhase('baton_pass');
      setTimeout(() => {
        setPhase('playing');
      }, 1600);
    } else {
      // 4 pieces collected! Open grandfather's tin trunk!
      setPhase('trunk_open');
    }
  };

  // Restart current era or full run
  const handleRetryCurrentEra = () => {
    setLives(3);
    setPhase('playing');
  };

  const handleFullRestart = () => {
    setLives(3);
    setCoins(0);
    setKeyPieces(0);
    setCurrentEraId(1);
    setPhase('playing');
  };

  return (
    <div className="w-full min-h-[85vh] flex flex-col items-center justify-center font-sans select-none">
      
      {/* ----------------------------------------------------------------- */}
      {/* VIEW 1: INTRO SCREEN (Story: হারানো সিন্দুকের চাবি) */}
      {/* ----------------------------------------------------------------- */}
      {phase === 'intro' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden"
        >
          {/* Header Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D6BD98]/30 text-[#1A3636] rounded-full text-xs font-bold border border-[#D6BD98] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>নতুন পারিবারিক অ্যাডভেঞ্চার</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#1A3636] mb-3">
            ফ্যামিলি রানার
          </h1>
          <p className="text-base sm:text-lg font-serif italic text-amber-800 font-medium mb-6">
            "হারানো সিন্দুকের চাবি ও চার প্রজন্মের রিলে দৌড়"
          </p>

          {/* Story in 4 short lines */}
          <div className="bg-[#F5EFEB] border border-[#D6BD98]/60 rounded-2xl p-4 sm:p-5 text-left mb-6 text-xs sm:text-sm text-stone-800 leading-relaxed space-y-2">
            <p className="flex items-start gap-2">
              <span className="text-base">🗝️</span>
              <span>দাদার পুরনো টিনের সিন্দুকের সোনার চাবিটি ভেঙে ৪টি টুকরো হয়ে হারিয়ে গেছে চার প্রজন্মের ইতিহাসের বাঁকে বাঁকে।</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-base">🏙️</span>
              <span><strong>১ম স্তর (বর্তমান):</strong> আপনি নিজে দৌড় শুরু করবেন আধুনিক শহরের রাজপথ দিয়ে।</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-base">📻</span>
              <span><strong>২য় স্তর (৯০ দশক) ও ৩য় স্তর (৬০ দশক):</strong> মশাল হস্তান্তর হবে আপনার পিতা/মাতা ও দাদা/দাদির হাতে।</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-base">⛵</span>
              <span><strong>৪র্থ স্তর (পুরনো দিন):</strong> পূর্বপুরুষের হাতে শেষ টুকরোটি উদ্ধার হলেই খুলবে দাদার সিন্দুকের গোপন স্মৃতি!</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center items-center">
            {/* 1. Direct Play without photo */}
            <button
              onClick={() => {
                setCurrentEraId(1);
                setLives(3);
                setCoins(0);
                setKeyPieces(0);
                setPhase('playing');
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1A3636] hover:bg-[#40534C] text-white text-xs sm:text-sm font-bold py-3.5 px-6 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>সরাসরি খেলুন (ছবি ছাড়া)</span>
            </button>

            {/* 2. Customize Avatar / Add Photo */}
            <button
              onClick={() => setPhase('customize')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-[#1A3636] border border-[#D6BD98] text-xs sm:text-sm font-bold py-3.5 px-6 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>অবতার সাজান / ছবি দিন</span>
            </button>

            {/* 3. Back to games hub */}
            <button
              onClick={onBackToHub}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#736B65] hover:text-[#1A3636] py-2 px-3 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ফ্যামিলি গেমসে ফিরুন</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* VIEW 2: AVATAR CUSTOMIZER ("রানার সেটিং") */}
      {/* ----------------------------------------------------------------- */}
      {phase === 'customize' && (
        <AvatarCustomizer
          initialConfig={playerConfig}
          onConfirm={(updated) => {
            setPlayerConfig(updated);
            setPhase('relay_select');
          }}
          onBack={() => setPhase('intro')}
        />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* VIEW 3: RELAY TEAM SELECTOR */}
      {/* ----------------------------------------------------------------- */}
      {phase === 'relay_select' && (
        <RelayTeamSelector
          members={members}
          playerConfig={playerConfig}
          onConfirmTeam={(team) => {
            setRelayTeam(team);
            setCurrentEraId(1);
            setLives(3);
            setCoins(0);
            setKeyPieces(0);
            setPhase('playing');
          }}
          onBack={() => setPhase('customize')}
        />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* VIEW 4: ACTIVE 3D RUNNER CANVAS & HUD */}
      {/* ----------------------------------------------------------------- */}
      {phase === 'playing' && (
        <div 
          className="relative w-full max-w-4xl h-[78vh] sm:h-[82vh] rounded-3xl overflow-hidden shadow-2xl border-2 border-[#D6BD98] bg-stone-900"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Three.js Canvas Container */}
          <div ref={canvasContainerRef} className="w-full h-full" />

          {/* HUD Top Bar: Lives, Key Pieces, Coins, Era Info, Pause */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-20">
            {/* Lives & Keys */}
            <div className="flex items-center gap-2">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1 border border-white/20 text-white shadow-md">
                {[1, 2, 3].map((i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 ${
                      i <= lives ? 'text-rose-500 fill-rose-500' : 'text-stone-500'
                    }`}
                  />
                ))}
              </div>

              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20 text-amber-300 font-mono font-bold text-xs shadow-md">
                <Key className="w-4 h-4 text-amber-400" />
                <span>{keyPieces} / 4</span>
              </div>
            </div>

            {/* Current Era Badge */}
            <div className="bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-300/40 text-amber-200 text-xs font-bold font-serif shadow-md">
              <span>{ERAS_CONFIG[currentEraId].nameBn}</span>
            </div>

            {/* Coins, Sound Toggle & Pause Button */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20 text-yellow-300 font-mono font-bold text-xs shadow-md">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span>{coins}</span>
              </div>

              {/* Sound Mute/Unmute Button */}
              <button
                onClick={() => setIsMuted(sounds.toggleMute())}
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition cursor-pointer"
                title={isMuted ? 'শব্দ চালু করুন' : 'শব্দ বন্ধ করুন'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                onClick={() => setIsPaused(true)}
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition cursor-pointer"
                title="বিরতি"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* On-Screen Mobile Touch Controls (Lane switches, Jump, Slide) */}
          <div className="absolute bottom-4 inset-x-4 flex items-center justify-between pointer-events-none z-20">
            {/* Left & Right Lane Switch Buttons */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={moveLeft}
                className="w-13 h-13 rounded-2xl bg-white/25 hover:bg-white/40 active:bg-white/50 backdrop-blur-md border border-white/40 flex items-center justify-center text-white text-xl shadow-lg cursor-pointer"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                onClick={moveRight}
                className="w-13 h-13 rounded-2xl bg-white/25 hover:bg-white/40 active:bg-white/50 backdrop-blur-md border border-white/40 flex items-center justify-center text-white text-xl shadow-lg cursor-pointer"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </div>

            {/* Jump & Slide Buttons */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={slide}
                className="w-13 h-13 rounded-2xl bg-amber-500/35 hover:bg-amber-500/50 active:bg-amber-500/60 backdrop-blur-md border border-amber-300/50 flex flex-col items-center justify-center text-amber-200 text-xs font-bold shadow-lg cursor-pointer"
              >
                <ArrowDown className="w-5 h-5 mb-0.5" />
                <span className="text-[9px]">স্লাইড</span>
              </button>
              <button
                onClick={jump}
                className="w-13 h-13 rounded-2xl bg-emerald-500/35 hover:bg-emerald-500/50 active:bg-emerald-500/60 backdrop-blur-md border border-emerald-300/50 flex flex-col items-center justify-center text-emerald-200 text-xs font-bold shadow-lg cursor-pointer"
              >
                <ArrowUp className="w-5 h-5 mb-0.5" />
                <span className="text-[9px]">লাফ</span>
              </button>
            </div>
          </div>

          {/* Invulnerability Red Flash Effect */}
          {isHitInvulnerable && (
            <div className="absolute inset-0 bg-red-600/25 pointer-events-none animate-pulse z-10" />
          )}

          {/* Pause Modal */}
          {isPaused && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-30">
              <div className="bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl">
                <h3 className="text-xl font-serif font-bold text-[#1A3636] mb-3">
                  খেলা স্থগিত (Pause)
                </h3>

                {/* Quality Toggle */}
                <div className="mb-5 text-left">
                  <span className="text-[11px] font-bold text-stone-700 block mb-1">
                    গ্রাফিক্স কোয়ালিটি:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['low', 'medium', 'high'] as QualityLevel[]).map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuality(q)}
                        className={`py-1.5 text-xs rounded-lg font-bold capitalize transition cursor-pointer ${
                          quality === q
                            ? 'bg-[#1A3636] text-amber-200'
                            : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        }`}
                      >
                        {q === 'low' ? 'কম' : q === 'medium' ? 'মাঝারি' : 'উচ্চ'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setIsPaused(false)}
                    className="w-full py-2.5 rounded-full bg-[#1A3636] hover:bg-[#40534C] text-white font-bold text-xs transition cursor-pointer"
                  >
                    খেলা চালিয়ে যান
                  </button>
                  <button
                    onClick={handleRetryCurrentEra}
                    className="w-full py-2.5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition cursor-pointer"
                  >
                    বর্তমান স্তর পুনরায় শুরু করুন
                  </button>
                  <button
                    onClick={() => setShowQuitConfirm(true)}
                    className="w-full py-2 text-xs text-rose-700 hover:underline cursor-pointer"
                  >
                    মেনুতে প্রস্থান করুন
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* VIEW 5: BATON PASS TRANSITION CUTSCENE */}
      {/* ----------------------------------------------------------------- */}
      {phase === 'baton_pass' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-6 text-center shadow-xl"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-3xl mb-3">
            🤝
          </div>
          <h3 className="text-xl font-serif font-bold text-[#1A3636] mb-1">
            মশাল ও চাবি হস্তান্তর সফল!
          </h3>
          <p className="text-xs text-[#40534C] mb-4">
            পরবর্তী প্রজন্ম দায়িত্ব গ্রহণ করেছে। নতুন যুগের পথ খুলে যাচ্ছে...
          </p>

          <div className="bg-[#1A3636] text-amber-200 p-3 rounded-2xl text-xs font-serif mb-2">
            প্রবেশ করছেন: <strong>{ERAS_CONFIG[currentEraId].nameBn} ({ERAS_CONFIG[currentEraId].period})</strong>
          </div>
        </motion.div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* VIEW 6: SOFT RETRY / GAME OVER SCREEN */}
      {/* ----------------------------------------------------------------- */}
      {phase === 'game_over' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-6 text-center shadow-xl"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 border-2 border-rose-300 flex items-center justify-center text-3xl mb-3 text-rose-600">
            💔
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#1A3636] mb-1">
            জীবন শেষ হয়ে গেছে!
          </h3>
          <p className="text-xs text-[#736B65] mb-5">
            চিন্তা নেই, আপনার অর্জিত চাবির টুকরো অক্ষুণ্ণ আছে।
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleRetryCurrentEra}
              className="inline-flex items-center justify-center gap-2 bg-[#1A3636] hover:bg-[#40534C] text-white py-3 px-6 rounded-full font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>এই স্তর থেকেই আবার চেষ্টা করুন</span>
            </button>
            <button
              onClick={handleFullRestart}
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-[#1A3636] border border-[#D6BD98] py-2.5 px-6 rounded-full font-bold text-xs transition cursor-pointer"
            >
              <span>শুরু থেকে খেলুন</span>
            </button>
            <button
              onClick={onBackToHub}
              className="text-xs text-stone-500 hover:text-stone-800 py-1"
            >
              ফ্যামিলি গেমসে ফিরে যান
            </button>
          </div>
        </motion.div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* VIEW 7: TRUNK UNLOCKING & MEMORY CUTSCENE */}
      {/* ----------------------------------------------------------------- */}
      {phase === 'trunk_open' && (
        <TrunkCutscene
          score={keyPieces}
          totalCoins={coins}
          members={members}
          onPlayAgain={handleFullRestart}
          onBackToHub={onBackToHub}
        />
      )}

      {/* Quit Confirmation Dialog */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-2" />
            <h3 className="text-lg font-serif font-bold text-[#1A3636] mb-1">
              খেলা থেকে বের হতে চান?
            </h3>
            <p className="text-xs text-[#736B65] mb-5">
              এখন বের হলে বর্তমান অগ্রগতি সাময়িকভাবে মুছে যাবে।
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-200 text-stone-800 hover:bg-stone-300 cursor-pointer"
              >
                খেলায় থাকুন
              </button>
              <button
                onClick={() => {
                  setShowQuitConfirm(false);
                  onBackToHub();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#C85A38] text-white hover:bg-rose-700 cursor-pointer shadow-sm"
              >
                হ্যাঁ, বের হব
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
