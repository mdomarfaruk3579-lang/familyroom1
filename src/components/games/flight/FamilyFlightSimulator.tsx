import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Compass,
  Gauge,
  Navigation,
  Eye,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  MapPin,
  Plane,
  ShieldAlert,
  Wind,
} from 'lucide-react';
import { Member } from '../../../types';

interface FamilyFlightSimulatorProps {
  members: Member[];
  onBackToHub: () => void;
}

type AircraftType = 'jet' | 'cessna' | 'helicopter';

interface RelativeDestination {
  id: string;
  name: string;
  relation: string;
  location: string;
  distanceKm: number;
  coordinates: string;
  description: string;
  photoUrl?: string;
  targetX: number;
  targetZ: number;
}

export function FamilyFlightSimulator({ members, onBackToHub }: FamilyFlightSimulatorProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Game UI State
  const [gameState, setGameState] = useState<'briefing' | 'flying' | 'landed' | 'crashed'>('briefing');
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftType>('jet');
  const [cameraView, setCameraView] = useState<'chase' | 'cockpit'>('chase');
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Telemetry HUD State
  const [speed, setSpeed] = useState(0);
  const [altitude, setAltitude] = useState(150);
  const [throttle, setThrottle] = useState(50); // 0 to 100
  const [heading, setHeading] = useState(0);
  const [vsi, setVsi] = useState(0); // Vertical Speed Indicator m/s
  const [distanceToTarget, setDistanceToTarget] = useState(0);
  const [flightTimeSec, setFlightTimeSec] = useState(0);
  const [isStalling, setIsStalling] = useState(false);
  const [landingRating, setLandingRating] = useState('১০০% নিখুঁত বাটার ল্যান্ডিং');

  // Relative Destinations list
  const destinations: RelativeDestination[] = React.useMemo(() => {
    const list: RelativeDestination[] = [];

    if (members && members.length > 0) {
      members.slice(0, 6).forEach((m, idx) => {
        const angles = [0.2, 1.1, 2.3, 3.5, 4.6, 5.7];
        const dists = [700, 950, 1200, 850, 1100, 1300];
        const angle = angles[idx % angles.length];
        const dist = dists[idx % dists.length];

        list.push({
          id: m.id || `m-${idx}`,
          name: m.name,
          relation: m.role || m.type || 'আত্মীয়',
          location: m.currentlyLiveIn || 'পারিবারিক ভিটা, বাংলাদেশ',
          distanceKm: Number((dist / 300).toFixed(1)),
          coordinates: `23.${8100 + idx * 12}° N, 90.${4100 + idx * 18}° E`,
          description: `${m.name}-এর সুন্দর গ্রামীণ বাড়ি, ছাদ ও সবুজ আঙিনায় তৈরি বিশেষ ল্যান্ডিং জোন।`,
          photoUrl: m.photoUrl,
          targetX: Math.cos(angle) * dist,
          targetZ: Math.sin(angle) * dist,
        });
      });
    }

    if (list.length < 4) {
      list.push(
        {
          id: 'dada-bari',
          name: 'দাদা-দাদীর আদি নিবাস',
          relation: 'দাদা-দাদী',
          location: 'পারিবারিক পূর্বপুরুষের ভিটা, কুষ্টিয়া',
          distanceKm: 2.8,
          coordinates: '23.8902° N, 89.1245° E',
          description: 'আমবাগান ও দিঘির পাড়ে দাদার শতবর্ষী পারিবারিক বাড়ি ও সবুজ রানওয়ে।',
          targetX: 650,
          targetZ: -750,
        },
        {
          id: 'nana-bari',
          name: 'নানার বাড়ি ও নারকেল বাগান',
          relation: 'নানা-নানী',
          location: 'নদীবিধৌত সবুজ প্রান্তর, বরিশাল',
          distanceKm: 3.5,
          coordinates: '22.7010° N, 90.3535° E',
          description: 'নদীর তীরের নারকেল বাগান সংলগ্ন উন্মুক্ত হেলিপ্যাড ও মনোরম প্রান্তর।',
          targetX: -800,
          targetZ: 600,
        },
        {
          id: 'chacha-bari',
          name: 'বড় চাচার ভিলা',
          relation: 'চাচা-চাচী',
          location: 'পারিবারিক আধুনিক বাগানবাড়ি, ঢাকা',
          distanceKm: 1.9,
          coordinates: '23.7771° N, 90.3994° E',
          description: 'প্রশস্ত ছাদ ও আধুনিক স্থাপত্যের পারিবারিক বাংলো ও অবতরণ প্যাড।',
          targetX: 450,
          targetZ: 500,
        },
        {
          id: 'mama-bari',
          name: 'মামার গ্রিন এস্টেট',
          relation: 'মামা-মামী',
          location: 'চা বাগান সংলগ্ন উপত্যকা, শ্রীমঙ্গল',
          distanceKm: 4.2,
          coordinates: '24.3065° N, 91.7296° E',
          description: 'সবুজ পাহাড়ের ঢালে অবস্থিত মনোরম চা বাগান ও সুরক্ষিত এয়ারস্ট্রিপ।',
          targetX: -950,
          targetZ: -850,
        }
      );
    }

    return list;
  }, [members]);

  const [selectedDestination, setSelectedDestination] = useState<RelativeDestination>(destinations[0]);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const windGainRef = useRef<GainNode | null>(null);
  const chopperLfoRef = useRef<OscillatorNode | null>(null);

  // Three.js Scene Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const aircraftGroupRef = useRef<THREE.Group | null>(null);
  const propDiscRef = useRef<THREE.Mesh | null>(null);
  const rotorGroupRef = useRef<THREE.Group | null>(null);
  const tailRotorRef = useRef<THREE.Group | null>(null);
  const targetBeaconRef = useRef<THREE.Mesh | null>(null);
  const vehiclesRef = useRef<{ mesh: THREE.Group; speed: number; axis: 'x' | 'z'; min: number; max: number }[]>([]);

  // Flight Physics State Ref
  const flightStateRef = useRef({
    x: 0,
    y: 110,
    z: 0,
    pitch: 0,
    roll: 0,
    yaw: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    forwardSpeed: 55,
    throttle: 50,
    touchdownTimer: 0,
    maxAltitude: 110,
    isAirborne: true,
  });

  // Controls input ref
  const inputRef = useRef({
    pitchUp: false,
    pitchDown: false,
    rollLeft: false,
    rollRight: false,
    yawLeft: false,
    yawRight: false,
    throttleUp: false,
    throttleDown: false,
  });

  // Sound generator
  const initEngineAudio = useCallback(() => {
    if (isAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      // Master Engine Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.09, ctx.currentTime);
      masterGain.connect(ctx.destination);
      engineGainRef.current = masterGain;

      if (selectedAircraft === 'helicopter') {
        // AUTHENTIC HELICOPTER BLADE-SLAP BUFFER ("WHOP-WHOP-WHOP")
        const loopDuration = 2.0;
        const totalSamples = Math.floor(ctx.sampleRate * loopDuration);
        const chopperBuffer = ctx.createBuffer(1, totalSamples, ctx.sampleRate);
        const cData = chopperBuffer.getChannelData(0);

        const numSlaps = 22; // ~11.0 Hz blade-vortex slap
        const slapPeriod = totalSamples / numSlaps;

        for (let i = 0; i < totalSamples; i++) {
          const slapSampleIndex = i % slapPeriod;
          const slapTimeSec = slapSampleIndex / ctx.sampleRate;

          if (slapTimeSec < 0.038) {
            const bassThump = Math.sin(2 * Math.PI * 86 * slapTimeSec) * Math.exp(-slapTimeSec * 75) * 0.9;
            const subPunch = Math.sin(2 * Math.PI * 43 * slapTimeSec) * Math.exp(-slapTimeSec * 45) * 0.55;
            const bladeCrack = (Math.random() * 2 - 1) * Math.exp(-slapTimeSec * 140) * 0.45;
            cData[i] = bassThump + subPunch + bladeCrack;
          } else {
            cData[i] = (Math.random() * 2 - 1) * 0.018;
          }
        }

        const chopperSource = ctx.createBufferSource();
        chopperSource.buffer = chopperBuffer;
        chopperSource.loop = true;

        const rotorFilter = ctx.createBiquadFilter();
        rotorFilter.type = 'lowpass';
        rotorFilter.frequency.setValueAtTime(280, ctx.currentTime);

        chopperSource.connect(rotorFilter);
        rotorFilter.connect(masterGain);
        chopperSource.start();

        // Weak background turbine whistle
        const turbineWhistle = ctx.createOscillator();
        turbineWhistle.type = 'sine';
        turbineWhistle.frequency.setValueAtTime(1420, ctx.currentTime);
        const whistleGain = ctx.createGain();
        whistleGain.gain.setValueAtTime(0.012, ctx.currentTime);
        turbineWhistle.connect(whistleGain);
        whistleGain.connect(masterGain);
        turbineWhistle.start();
        engineOscRef.current = turbineWhistle;
      } else {
        // JET & CESSNA ENGINE TONE
        const osc = ctx.createOscillator();
        osc.type = selectedAircraft === 'cessna' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(selectedAircraft === 'cessna' ? 115 : 88, ctx.currentTime);
        osc.connect(masterGain);
        osc.start();
        engineOscRef.current = osc;
      }

      // Wind Rushing Noise
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.value = 400;

      const windGain = ctx.createGain();
      windGain.gain.value = 0.01;
      noise.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(ctx.destination);
      noise.start();
      windGainRef.current = windGain;
    } catch {}
  }, [isAudioMuted, selectedAircraft]);

  const stopEngineAudio = useCallback(() => {
    try {
      if (engineOscRef.current) {
        engineOscRef.current.stop();
        engineOscRef.current.disconnect();
        engineOscRef.current = null;
      }
      if (chopperLfoRef.current) {
        chopperLfoRef.current.stop();
        chopperLfoRef.current.disconnect();
        chopperLfoRef.current = null;
      }
      if (engineGainRef.current) {
        engineGainRef.current.disconnect();
        engineGainRef.current = null;
      }
      if (windGainRef.current) {
        windGainRef.current.disconnect();
        windGainRef.current = null;
      }
    } catch {}
  }, []);

  // Landing screech + chime sound
  const playLandingEffects = useCallback((rate: string) => {
    if (isAudioMuted) return;
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;

      // Tire screech sound
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const screech = ctx.createBufferSource();
      screech.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2800, now);
      filter.Q.value = 5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      screech.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      screech.start(now);

      // Celebration Chime
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, now + 0.3 + idx * 0.12);
        noteGain.gain.setValueAtTime(0.12, now + 0.3 + idx * 0.12);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + idx * 0.12 + 0.6);
        osc.connect(noteGain);
        noteGain.connect(ctx.destination);
        osc.start(now + 0.3 + idx * 0.12);
        osc.stop(now + 0.3 + idx * 0.12 + 0.6);
      });
    } catch {}
  }, [isAudioMuted]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'flying') return;
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') inputRef.current.pitchDown = true;
      if (code === 'KeyS' || code === 'ArrowDown') inputRef.current.pitchUp = true;
      if (code === 'KeyA' || code === 'ArrowLeft') inputRef.current.rollLeft = true;
      if (code === 'KeyD' || code === 'ArrowRight') inputRef.current.rollRight = true;
      if (code === 'KeyQ') inputRef.current.yawLeft = true;
      if (code === 'KeyE') inputRef.current.yawRight = true;
      if (code === 'ShiftLeft' || code === 'KeyR') inputRef.current.throttleUp = true;
      if (code === 'ControlLeft' || code === 'KeyF') inputRef.current.throttleDown = true;
      if (code === 'KeyC') setCameraView(prev => (prev === 'chase' ? 'cockpit' : 'chase'));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') inputRef.current.pitchDown = false;
      if (code === 'KeyS' || code === 'ArrowDown') inputRef.current.pitchUp = false;
      if (code === 'KeyA' || code === 'ArrowLeft') inputRef.current.rollLeft = false;
      if (code === 'KeyD' || code === 'ArrowRight') inputRef.current.rollRight = false;
      if (code === 'KeyQ') inputRef.current.yawLeft = false;
      if (code === 'KeyE') inputRef.current.yawRight = false;
      if (code === 'ShiftLeft' || code === 'KeyR') inputRef.current.throttleUp = false;
      if (code === 'ControlLeft' || code === 'KeyF') inputRef.current.throttleDown = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Flight Timer
  useEffect(() => {
    if (gameState !== 'flying') return;
    const interval = setInterval(() => {
      setFlightTimeSec(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // -------------------------------------------------------------
  // THREE.JS SCENE SETUP & PHYSICS RENDER LOOP
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 580;

    // 1. Scene & Sky Atmospheric Fog
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x7ec0ee); // Crisp sky blue
    scene.fog = new THREE.FogExp2(0xbfe0f7, 0.00055);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(58, width / height, 0.5, 6000);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.45);
    sunLight.position.set(500, 800, 400);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 3000;
    sunLight.shadow.camera.left = -700;
    sunLight.shadow.camera.right = 700;
    sunLight.shadow.camera.top = 700;
    sunLight.shadow.camera.bottom = -700;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d7032, 0.55);
    scene.add(hemiLight);

    // 5. Procedural Aerial Landscape (Google Maps Style)
    const worldSize = 4200;

    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 512;
    groundCanvas.height = 512;
    const gctx = groundCanvas.getContext('2d');
    if (gctx) {
      gctx.fillStyle = '#416D36';
      gctx.fillRect(0, 0, 512, 512);

      const fieldColors = ['#4E7D3F', '#375E2D', '#6B8E3D', '#7A9E37', '#A3943A', '#B59040', '#345227'];
      for (let i = 0; i < 40; i++) {
        gctx.fillStyle = fieldColors[i % fieldColors.length];
        const x = (i % 6) * 85 + (Math.random() * 8);
        const y = Math.floor(i / 6) * 85 + (Math.random() * 8);
        gctx.fillRect(x, y, 78, 78);
        gctx.strokeStyle = '#29431E';
        gctx.lineWidth = 2;
        gctx.strokeRect(x, y, 78, 78);
      }

      // Winding River
      gctx.strokeStyle = '#1D4ED8';
      gctx.lineWidth = 26;
      gctx.lineCap = 'round';
      gctx.beginPath();
      gctx.moveTo(0, 256);
      gctx.bezierCurveTo(140, 190, 310, 330, 512, 230);
      gctx.stroke();

      gctx.strokeStyle = '#D97706';
      gctx.lineWidth = 3;
      gctx.stroke();

      // Asphalt Highways
      gctx.strokeStyle = '#27272A';
      gctx.lineWidth = 14;
      gctx.beginPath();
      gctx.moveTo(256, 0);
      gctx.lineTo(256, 512);
      gctx.stroke();

      gctx.strokeStyle = '#FACC15';
      gctx.lineWidth = 1.5;
      gctx.setLineDash([8, 8]);
      gctx.beginPath();
      gctx.moveTo(256, 0);
      gctx.lineTo(256, 512);
      gctx.stroke();
    }

    const groundTexture = new THREE.CanvasTexture(groundCanvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(14, 14);

    const groundGeo = new THREE.PlaneGeometry(worldSize, worldSize, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 0.88,
      metalness: 0.04,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // 6. Fluffy 3D Cumulus Clouds in Sky
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      transparent: true,
      opacity: 0.75,
      fog: true,
    });

    for (let c = 0; c < 24; c++) {
      const cloudGroup = new THREE.Group();
      const cx = (Math.random() - 0.5) * (worldSize * 0.7);
      const cz = (Math.random() - 0.5) * (worldSize * 0.7);
      const cy = Math.random() * 120 + 200; // Cloud altitude 200m - 320m
      cloudGroup.position.set(cx, cy, cz);

      // Cloud puffs
      for (let p = 0; p < 7; p++) {
        const puffSize = Math.random() * 25 + 20;
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(puffSize, 1), cloudMat);
        puff.position.set(
          (Math.random() - 0.5) * 45,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 45
        );
        puff.castShadow = true;
        cloudGroup.add(puff);
      }
      scene.add(cloudGroup);
    }

    // 7. Miniature Vehicles Driving along the Highway
    const vehicleMatRed = new THREE.MeshStandardMaterial({ color: 0xDC2626 });
    const vehicleMatWhite = new THREE.MeshStandardMaterial({ color: 0xF8FAFC });
    const vehicleMatYellow = new THREE.MeshStandardMaterial({ color: 0xEAB308 });
    const vehicles: { mesh: THREE.Group; speed: number; axis: 'x' | 'z'; min: number; max: number }[] = [];

    for (let v = 0; v < 8; v++) {
      const veh = new THREE.Group();
      const carBody = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 1.8, 6),
        v % 3 === 0 ? vehicleMatRed : v % 3 === 1 ? vehicleMatYellow : vehicleMatWhite
      );
      carBody.position.y = 1;
      carBody.castShadow = true;
      veh.add(carBody);

      // Headlights
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.4, 4, 4), new THREE.MeshBasicMaterial({ color: 0xFFFBEB }));
      hl.position.set(1.2, 1, -3);
      veh.add(hl);
      const hr = hl.clone();
      hr.position.x = -1.2;
      veh.add(hr);

      const zStart = (Math.random() - 0.5) * 1200;
      veh.position.set(v % 2 === 0 ? -4 : 4, 0.2, zStart);
      scene.add(veh);

      vehicles.push({
        mesh: veh,
        speed: (Math.random() * 25 + 30) * (v % 2 === 0 ? 1 : -1),
        axis: 'z',
        min: -1400,
        max: 1400,
      });
    }
    vehiclesRef.current = vehicles;

    // 8. Base Airport Runway with Full Lighting & Markings
    const baseRunwayGeo = new THREE.PlaneGeometry(38, 420);
    const baseRunwayMat = new THREE.MeshStandardMaterial({ color: 0x18181B, roughness: 0.6 });
    const baseRunway = new THREE.Mesh(baseRunwayGeo, baseRunwayMat);
    baseRunway.rotation.x = -Math.PI / 2;
    baseRunway.position.set(0, 0.1, 0);
    baseRunway.receiveShadow = true;
    scene.add(baseRunway);

    // Centerline stripes
    for (let rz = -180; rz <= 180; rz += 28) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 14),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
      );
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0.15, rz);
      scene.add(stripe);
    }

    // Touchdown aim point blocks
    const aimLeft = new THREE.Mesh(new THREE.PlaneGeometry(4, 30), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
    aimLeft.rotation.x = -Math.PI / 2;
    aimLeft.position.set(-8, 0.16, -100);
    scene.add(aimLeft);

    const aimRight = aimLeft.clone();
    aimRight.position.x = 8;
    scene.add(aimRight);

    // Runway Edge Lights (glowing amber beads)
    for (let rz = -200; rz <= 200; rz += 25) {
      const leftLight = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), new THREE.MeshBasicMaterial({ color: 0xFDE047 }));
      leftLight.position.set(-20, 0.5, rz);
      scene.add(leftLight);

      const rightLight = leftLight.clone();
      rightLight.position.x = 20;
      scene.add(rightLight);
    }

    // 9. Relative's Homestead & Destination Landing Zone
    const targetGroup = new THREE.Group();
    targetGroup.position.set(selectedDestination.targetX, 0, selectedDestination.targetZ);

    // Grand Villa
    const villa = new THREE.Mesh(
      new THREE.BoxGeometry(34, 18, 28),
      new THREE.MeshStandardMaterial({ color: 0xFEF3C7, roughness: 0.6 })
    );
    villa.position.set(0, 9, -45);
    villa.castShadow = true;
    targetGroup.add(villa);

    const villaRoof = new THREE.Mesh(
      new THREE.ConeGeometry(25, 11, 4),
      new THREE.MeshStandardMaterial({ color: 0xB91C1C, roughness: 0.5 })
    );
    villaRoof.position.set(0, 23, -45);
    villaRoof.rotation.y = Math.PI / 4;
    villaRoof.castShadow = true;
    targetGroup.add(villaRoof);

    // Destination Runway or Helipad
    if (selectedAircraft === 'helicopter') {
      const helipad = new THREE.Mesh(
        new THREE.CircleGeometry(26, 32),
        new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5 })
      );
      helipad.rotation.x = -Math.PI / 2;
      helipad.position.set(0, 0.2, 0);
      helipad.receiveShadow = true;
      targetGroup.add(helipad);

      const helipadRing = new THREE.Mesh(
        new THREE.RingGeometry(23, 25, 32),
        new THREE.MeshBasicMaterial({ color: 0xFACC15, side: THREE.DoubleSide })
      );
      helipadRing.rotation.x = -Math.PI / 2;
      helipadRing.position.set(0, 0.25, 0);
      targetGroup.add(helipadRing);

      const hBar1 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 14), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
      hBar1.position.set(-5, 0.3, 0);
      targetGroup.add(hBar1);

      const hBar2 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 14), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
      hBar2.position.set(5, 0.3, 0);
      targetGroup.add(hBar2);

      const hCross = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 2), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
      hCross.position.set(0, 0.3, 0);
      targetGroup.add(hCross);

      // Helipad glowing perimeter beacons
      for (let a = 0; a < 8; a++) {
        const rad = (a / 8) * Math.PI * 2;
        const bcon = new THREE.Mesh(new THREE.SphereGeometry(0.7, 6, 6), new THREE.MeshBasicMaterial({ color: 0x10B981 }));
        bcon.position.set(Math.cos(rad) * 25, 0.6, Math.sin(rad) * 25);
        targetGroup.add(bcon);
      }
    } else {
      const targetRunway = new THREE.Mesh(
        new THREE.PlaneGeometry(36, 380),
        new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5 })
      );
      targetRunway.rotation.x = -Math.PI / 2;
      targetRunway.position.set(0, 0.2, 0);
      targetRunway.receiveShadow = true;
      targetGroup.add(targetRunway);

      // Approach Threshold Green Bar
      const thresh = new THREE.Mesh(new THREE.PlaneGeometry(30, 4), new THREE.MeshBasicMaterial({ color: 0x22C55E }));
      thresh.rotation.x = -Math.PI / 2;
      thresh.position.set(0, 0.25, 175);
      targetGroup.add(thresh);
    }

    // High vertical beacon beam shooting into sky
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 600, 16),
      new THREE.MeshBasicMaterial({
        color: 0x10B981,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      })
    );
    beacon.position.set(0, 300, 0);
    targetGroup.add(beacon);
    targetBeaconRef.current = beacon;

    scene.add(targetGroup);

    // 10. High Realism 3D Aircraft Models
    const aircraftGroup = new THREE.Group();
    aircraftGroupRef.current = aircraftGroup;

    if (selectedAircraft === 'jet') {
      // ✈️ PASSENGER JET
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, metalness: 0.3, roughness: 0.25 });
      const liveryMat = new THREE.MeshStandardMaterial({ color: 0x006A4E, metalness: 0.35, roughness: 0.3 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.1, metalness: 0.85 });
      const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181B, roughness: 0.8 });

      // Fuselage
      const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 30, 16), bodyMat);
      fuselage.rotation.x = Math.PI / 2;
      fuselage.castShadow = true;
      aircraftGroup.add(fuselage);

      const nose = new THREE.Mesh(new THREE.ConeGeometry(2.4, 7.5, 16), bodyMat);
      nose.rotation.x = -Math.PI / 2;
      nose.position.z = -18.7;
      nose.castShadow = true;
      aircraftGroup.add(nose);

      // Cockpit windows
      const cockpit = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 3.2), glassMat);
      cockpit.position.set(0, 1.3, -13.5);
      cockpit.rotation.x = -0.3;
      aircraftGroup.add(cockpit);

      // Green airline stripe
      const stripe = new THREE.Mesh(
        new THREE.CylinderGeometry(2.42, 2.42, 24, 16, 1, true, -Math.PI * 0.15, Math.PI * 0.3),
        liveryMat
      );
      stripe.rotation.x = Math.PI / 2;
      aircraftGroup.add(stripe);

      // Swept Wings
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.lineTo(28, -12);
      wingShape.lineTo(27, -16);
      wingShape.lineTo(0, -7);
      wingShape.closePath();
      const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.65, bevelEnabled: false });

      const rightWing = new THREE.Mesh(wingGeo, bodyMat);
      rightWing.rotation.x = Math.PI / 2;
      rightWing.position.set(1.8, 0, 2);
      rightWing.castShadow = true;
      aircraftGroup.add(rightWing);

      const leftWing = rightWing.clone();
      leftWing.scale.x = -1;
      leftWing.position.x = -1.8;
      aircraftGroup.add(leftWing);

      // Twin Jet Engines
      const engineGeo = new THREE.CylinderGeometry(1.3, 1.3, 7.5, 14);
      const rightEngine = new THREE.Mesh(engineGeo, metalMat);
      rightEngine.rotation.x = Math.PI / 2;
      rightEngine.position.set(9.5, -2, 0);
      rightEngine.castShadow = true;
      aircraftGroup.add(rightEngine);

      const leftEngine = rightEngine.clone();
      leftEngine.position.x = -9.5;
      aircraftGroup.add(leftEngine);

      // Vertical Tail Fin
      const tailFinShape = new THREE.Shape();
      tailFinShape.moveTo(0, 0);
      tailFinShape.lineTo(0, 8.5);
      tailFinShape.lineTo(-5.5, 8.5);
      tailFinShape.lineTo(-10, 0);
      tailFinShape.closePath();
      const tailFin = new THREE.Mesh(
        new THREE.ExtrudeGeometry(tailFinShape, { depth: 0.5, bevelEnabled: false }),
        liveryMat
      );
      tailFin.position.set(-0.25, 2, 14);
      tailFin.castShadow = true;
      aircraftGroup.add(tailFin);

      // Horizontal Stabilizers
      const hStab = new THREE.Mesh(new THREE.BoxGeometry(15, 0.4, 4.5), bodyMat);
      hStab.position.set(0, 2.6, 13);
      aircraftGroup.add(hStab);

      // Landing Gear with Wheels
      const createGear = (x: number, z: number) => {
        const gear = new THREE.Group();
        gear.position.set(x, -2.4, z);
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.5, 8), metalMat);
        gear.add(strut);
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.6, 12), tireMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.y = -1.2;
        gear.add(wheel);
        aircraftGroup.add(gear);
      };
      createGear(0, -11); // Nose gear
      createGear(-5, 3);  // Left main gear
      createGear(5, 3);   // Right main gear
    } else if (selectedAircraft === 'cessna') {
      // 🛩️ CESSNA SKYHAWK
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, metalness: 0.2, roughness: 0.3 });
      const blueMat = new THREE.MeshStandardMaterial({ color: 0x0284C7 });
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181B });

      const fuselage = new THREE.Mesh(new THREE.ConeGeometry(1.8, 19, 8), bodyMat);
      fuselage.rotation.x = Math.PI / 2;
      aircraftGroup.add(fuselage);

      const wing = new THREE.Mesh(new THREE.BoxGeometry(32, 0.5, 4.5), bodyMat);
      wing.position.set(0, 2.2, -1);
      wing.castShadow = true;
      aircraftGroup.add(wing);

      // Transparent Spinning Propeller Blur Disc
      const propDisc = new THREE.Mesh(
        new THREE.CircleGeometry(4.2, 24),
        new THREE.MeshBasicMaterial({
          color: 0x1E293B,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
        })
      );
      propDisc.position.z = -10.2;
      aircraftGroup.add(propDisc);
      propDiscRef.current = propDisc;

      const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.5, 8), blueMat);
      spinner.rotation.x = -Math.PI / 2;
      spinner.position.z = -10.0;
      aircraftGroup.add(spinner);

      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 4), blueMat);
      tail.position.set(0, 2.2, 8.5);
      aircraftGroup.add(tail);

      // Fixed Tricycle Landing Gear
      const createCessnaWheel = (x: number, z: number) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.4, 10), tireMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, -1.8, z);
        aircraftGroup.add(wheel);
      };
      createCessnaWheel(0, -6);
      createCessnaWheel(-3.5, 1);
      createCessnaWheel(3.5, 1);
    } else {
      // 🚁 FAMILY HELICOPTER
      const copterMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, metalness: 0.35, roughness: 0.35 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x38BDF8, metalness: 0.8, roughness: 0.1 });
      const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });

      const pod = new THREE.Mesh(new THREE.SphereGeometry(3.3, 16, 12), copterMat);
      pod.scale.set(0.8, 1.0, 1.4);
      pod.position.set(0, 2.5, 0);
      pod.castShadow = true;
      aircraftGroup.add(pod);

      const glass = new THREE.Mesh(new THREE.SphereGeometry(3.1, 16, 12, 0, Math.PI, 0, Math.PI * 0.75), glassMat);
      glass.rotation.x = -Math.PI / 2;
      glass.position.set(0, 2.6, -1.1);
      aircraftGroup.add(glass);

      const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 15, 8), copterMat);
      boom.rotation.x = Math.PI / 2;
      boom.position.set(0, 3.2, 9.5);
      aircraftGroup.add(boom);

      // Main Rotor Mast with spinning transparent rotor disc blur
      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(0, 6.3, 0);

      const rotorDisc = new THREE.Mesh(
        new THREE.CircleGeometry(16, 32),
        new THREE.MeshBasicMaterial({
          color: 0x0F172A,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
        })
      );
      rotorDisc.rotation.x = Math.PI / 2;
      rotorGroup.add(rotorDisc);

      for (let b = 0; b < 4; b++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(16, 0.1, 0.8), new THREE.MeshBasicMaterial({ color: 0x0F172A }));
        blade.position.x = 8;
        blade.rotation.y = (b * Math.PI) / 2;
        rotorGroup.add(blade);
      }
      aircraftGroup.add(rotorGroup);
      rotorGroupRef.current = rotorGroup;

      // Tail Rotor
      const tailRotor = new THREE.Group();
      tailRotor.position.set(0.8, 4.5, 17);
      for (let tb = 0; tb < 2; tb++) {
        const tblade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.6, 0.4), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
        tblade.rotation.x = (tb * Math.PI) / 2;
        tailRotor.add(tblade);
      }
      aircraftGroup.add(tailRotor);
      tailRotorRef.current = tailRotor;
    }

    aircraftGroup.position.set(0, flightStateRef.current.y, 0);
    scene.add(aircraftGroup);

    // 11. Physics & Animation Simulation Loop
    let lastTime = performance.now();
    let animId: number;

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const fs = flightStateRef.current;
      const inp = inputRef.current;

      // Throttle adjustments
      if (inp.throttleUp) fs.throttle = Math.min(100, fs.throttle + 28 * dt);
      if (inp.throttleDown) fs.throttle = Math.max(0, fs.throttle - 28 * dt);

      // Forward Speed computation
      const maxSpeed = selectedAircraft === 'jet' ? 190 : selectedAircraft === 'helicopter' ? 95 : 125;
      const targetSpeed = (fs.throttle / 100) * maxSpeed;
      fs.forwardSpeed += (targetSpeed - fs.forwardSpeed) * 1.6 * dt;

      // Control surfaces
      const controlFactor = Math.max(0.35, Math.min(1.2, fs.forwardSpeed / 50));

      if (inp.pitchUp) fs.pitch += 0.95 * controlFactor * dt;
      if (inp.pitchDown) fs.pitch -= 0.95 * controlFactor * dt;
      if (inp.rollLeft) fs.roll += 1.45 * controlFactor * dt;
      if (inp.rollRight) fs.roll -= 1.45 * controlFactor * dt;
      if (inp.yawLeft) fs.yaw += 0.85 * controlFactor * dt;
      if (inp.yawRight) fs.yaw -= 0.85 * controlFactor * dt;

      // Aerodynamic self-centering
      if (!inp.rollLeft && !inp.rollRight) fs.roll *= Math.pow(0.25, dt);
      if (!inp.pitchUp && !inp.pitchDown) fs.pitch *= Math.pow(0.4, dt);

      fs.pitch = Math.max(-0.68, Math.min(0.68, fs.pitch));
      fs.roll = Math.max(-0.85, Math.min(0.85, fs.roll));

      // Coordinated turn: roll induces yaw
      fs.yaw -= fs.roll * 0.75 * dt;

      // Lift physics with realistic Ground Effect (lift cushion near ground)
      const groundEffectBonus = fs.y < 12 ? 1 + (1 - fs.y / 12) * 0.25 : 1.0;
      const lift = Math.cos(fs.roll) * (fs.forwardSpeed / 58) * 9.8 * groundEffectBonus;
      const gravity = 9.8;
      const climbFactor = Math.sin(-fs.pitch) * fs.forwardSpeed;

      fs.vy = (climbFactor + (lift - gravity) * 0.55);

      // Stall detection
      const isStallCondition = fs.pitch > 0.42 && fs.forwardSpeed < 38;
      setIsStalling(isStallCondition);
      if (isStallCondition) {
        fs.vy -= 20 * dt;
      }

      // Forward velocity vector
      const vx = -Math.sin(fs.yaw) * fs.forwardSpeed;
      const vz = -Math.cos(fs.yaw) * fs.forwardSpeed;

      fs.x += vx * dt;
      fs.y += fs.vy * dt;
      fs.z += vz * dt;

      // Ground collision / Touchdown
      const minGroundY = 2.4;
      if (fs.y <= minGroundY) {
        fs.y = minGroundY;
        const descentRate = Math.abs(fs.vy);
        fs.pitch = 0;
        fs.roll = 0;
        fs.vy = 0;

        const dx = fs.x - selectedDestination.targetX;
        const dz = fs.z - selectedDestination.targetZ;
        const distToDestination = Math.sqrt(dx * dx + dz * dz);

        if (distToDestination < 65 && fs.forwardSpeed < 50) {
          fs.touchdownTimer += dt;
          if (fs.touchdownTimer > 1.0 && gameState === 'flying') {
            const rating = descentRate < 1.8 ? '১০০% নিখুঁত বাটার ল্যান্ডিং (Butter Smooth)' : '৯৫% নিরাপদ ও সফল অবতরণ';
            setLandingRating(rating);
            setGameState('landed');
            playLandingEffects(rating);
          }
        }
      } else {
        fs.touchdownTimer = 0;
      }

      if (fs.y > 680) fs.y = 680;
      if (fs.y > fs.maxAltitude) fs.maxAltitude = fs.y;

      // Update 3D Aircraft transform
      if (aircraftGroupRef.current) {
        aircraftGroupRef.current.position.set(fs.x, fs.y, fs.z);
        aircraftGroupRef.current.rotation.set(0, 0, 0);
        aircraftGroupRef.current.rotateY(fs.yaw);
        aircraftGroupRef.current.rotateX(fs.pitch);
        aircraftGroupRef.current.rotateZ(fs.roll);
      }

      // Animate blades & disc blur
      if (propDiscRef.current) {
        propDiscRef.current.rotation.z += 28 * dt;
      }
      if (rotorGroupRef.current) {
        rotorGroupRef.current.rotation.y += 38 * dt;
      }
      if (tailRotorRef.current) {
        tailRotorRef.current.rotation.x += 42 * dt;
      }

      // Animate road vehicles
      vehiclesRef.current.forEach(v => {
        v.mesh.position.z += v.speed * dt;
        if (v.mesh.position.z > v.max) v.mesh.position.z = v.min;
        else if (v.mesh.position.z < v.min) v.mesh.position.z = v.max;
      });

      // Destination beacon pulsing
      if (targetBeaconRef.current) {
        const pulse = 0.5 + Math.sin(time * 0.005) * 0.35;
        (targetBeaconRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
      }

      // Distance & Telemetry
      const dist = Math.sqrt(
        Math.pow(fs.x - selectedDestination.targetX, 2) +
        Math.pow(fs.z - selectedDestination.targetZ, 2)
      );
      setDistanceToTarget(Math.round(dist));

      setSpeed(Math.round(fs.forwardSpeed * 2.2));
      setAltitude(Math.round(fs.y * 1.8));
      setVsi(Number((fs.vy * 0.3).toFixed(1)));
      setThrottle(Math.round(fs.throttle));
      setHeading(Math.round((((fs.yaw * 180) / Math.PI) % 360 + 360) % 360));

      // Audio engine pitch & wind rush update
      if (engineOscRef.current && audioCtxRef.current) {
        const baseFreq = selectedAircraft === 'helicopter' ? 48 : 88;
        const targetFreq = baseFreq + (fs.throttle / 100) * 85;
        engineOscRef.current.frequency.setTargetAtTime(targetFreq, audioCtxRef.current.currentTime, 0.1);
      }
      if (windGainRef.current && audioCtxRef.current) {
        const windLevel = Math.max(0.005, (fs.forwardSpeed / maxSpeed) * 0.08);
        windGainRef.current.gain.setTargetAtTime(windLevel, audioCtxRef.current.currentTime, 0.1);
      }

      // Camera Following System
      if (cameraRef.current) {
        if (cameraView === 'chase') {
          const chaseDist = selectedAircraft === 'jet' ? 48 : 34;
          const chaseHeight = selectedAircraft === 'jet' ? 14 : 11;
          const camX = fs.x + Math.sin(fs.yaw) * chaseDist;
          const camZ = fs.z + Math.cos(fs.yaw) * chaseDist;
          const camY = fs.y + chaseHeight - fs.pitch * 6;

          cameraRef.current.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.14);
          cameraRef.current.lookAt(fs.x, fs.y + 2, fs.z);
        } else {
          // Cockpit Camera with true lookahead
          const cockpitY = selectedAircraft === 'jet' ? 1.4 : 2.5;
          const cockpitZ = selectedAircraft === 'jet' ? -12 : 0;
          const offset = new THREE.Vector3(0, cockpitY, cockpitZ);
          offset.applyEuler(new THREE.Euler(fs.pitch, fs.yaw, fs.roll, 'YXZ'));

          cameraRef.current.position.set(fs.x + offset.x, fs.y + offset.y, fs.z + offset.z);

          const lookTarget = new THREE.Vector3(
            fs.x - Math.sin(fs.yaw) * 120,
            fs.y + Math.sin(-fs.pitch) * 120,
            fs.z - Math.cos(fs.yaw) * 120
          );
          cameraRef.current.lookAt(lookTarget);
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 580;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      stopEngineAudio();
      renderer.dispose();
    };
  }, [selectedAircraft, selectedDestination, cameraView, gameState, playLandingEffects, stopEngineAudio]);

  // Start flight handler
  const handleStartFlight = () => {
    flightStateRef.current = {
      x: 0,
      y: 95,
      z: 0,
      pitch: 0,
      roll: 0,
      yaw: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      forwardSpeed: 62,
      throttle: 55,
      touchdownTimer: 0,
      maxAltitude: 95,
      isAirborne: true,
    };
    setFlightTimeSec(0);
    setGameState('flying');
    initEngineAudio();
  };

  return (
    <div className="w-full flex flex-col font-sans select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={() => {
            stopEngineAudio();
            onBackToHub();
          }}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1A3636] hover:text-[#40534C] bg-white px-3 py-1.5 rounded-full border border-[#D6BD98]/60 shadow-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>গেম মেনুতে ফিরে যান</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsAudioMuted(prev => !prev);
              if (!isAudioMuted) stopEngineAudio();
              else if (gameState === 'flying') initEngineAudio();
            }}
            className="p-1.5 rounded-full bg-white text-stone-700 hover:text-stone-900 border border-stone-200 shadow-xs cursor-pointer"
            title="শব্দ চালু/বন্ধ"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>

          {gameState === 'flying' && (
            <button
              onClick={() => setCameraView(prev => (prev === 'chase' ? 'cockpit' : 'chase'))}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-stone-900 text-white shadow-xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{cameraView === 'chase' ? 'ককপিট ভিউ' : 'চেজ ক্যামেরা'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="relative w-full h-[520px] sm:h-[620px] rounded-3xl overflow-hidden border-2 border-[#1A3636] shadow-2xl bg-sky-200">
        <div ref={mountRef} className="w-full h-full" />

        {/* ----------------------------------------------------------- */}
        {/* BRIEFING MODAL                                              */}
        {/* ----------------------------------------------------------- */}
        {gameState === 'briefing' && (
          <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm z-30 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl border border-stone-200 text-stone-800"
            >
              <div className="text-center mb-5">
                <span className="inline-block p-3 rounded-2xl bg-gradient-to-tr from-[#1A3636] to-[#40534C] text-amber-300 text-3xl shadow-md mb-2">
                  ✈️
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A3636]">
                  পারিবারিক ফ্লাইট সিমুলেটর
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-1">
                  গুগল ম্যাপ স্টাইলের বাস্তব গ্রামীণ দৃশ্য, নদী ও মেঘের ওপর দিয়ে আত্মীয়ের বাড়ি আকাশপথে ভ্রমণ করুন!
                </p>
              </div>

              {/* Aircraft selection */}
              <div className="mb-4">
                <label className="text-xs font-bold text-stone-700 block mb-2">
                  ১. উড়োজাহাজ বা হেলিকপ্টার বেছে নিন:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'jet', name: 'যাত্রীবাহী বিমান', badge: 'টার্বোজেট গতি', icon: '✈️' },
                    { id: 'cessna', name: 'সেসনা প্রপেলার', badge: 'দর্শনীয় উড্ডয়ন', icon: '🛩️' },
                    { id: 'helicopter', name: 'হেলিকপ্টার', badge: 'সোজা ল্যান্ডিং', icon: '🚁' },
                  ].map(craft => (
                    <button
                      key={craft.id}
                      onClick={() => setSelectedAircraft(craft.id as AircraftType)}
                      className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-between ${
                        selectedAircraft === craft.id
                          ? 'border-[#1A3636] bg-[#1A3636]/10 shadow-xs'
                          : 'border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <span className="text-2xl mb-1">{craft.icon}</span>
                      <span className="font-bold text-xs text-[#1A3636]">{craft.name}</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">{craft.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination Selection */}
              <div className="mb-5">
                <label className="text-xs font-bold text-stone-700 block mb-2">
                  ২. ভ্রমণের গন্তব্য (কার বাড়িতে যাবেন?):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {destinations.map(dest => {
                    const isSelected = selectedDestination.id === dest.id;
                    return (
                      <button
                        key={dest.id}
                        onClick={() => setSelectedDestination(dest)}
                        className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                            : 'border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                            {dest.relation.slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-stone-800 line-clamp-1">{dest.name}</h4>
                            <p className="text-[10px] text-stone-500 line-clamp-1">{dest.location}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold whitespace-nowrap ml-1">
                          {dest.distanceKm} কিমি
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleStartFlight}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#1A3636] to-emerald-800 hover:from-[#112424] hover:to-emerald-900 text-white font-bold text-sm sm:text-base shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plane className="w-5 h-5 fill-white" />
                <span>উড্ডয়ন শুরু করুন (Take Off)</span>
              </button>
            </motion.div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* HUD TELEMETRY OVERLAYS                                      */}
        {/* ----------------------------------------------------------- */}
        {gameState === 'flying' && (
          <>
            {/* Top Navigation Ribbon */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
              <div className="bg-stone-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white flex items-center gap-2 shadow-lg">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                <span className="font-bold text-xs text-amber-200">{selectedDestination.name}</span>
                <span className="text-[10px] text-stone-300 font-mono">| {distanceToTarget} মি. দূরত্ব</span>
              </div>

              {isStalling && (
                <div className="bg-red-600/90 text-white px-3.5 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse shadow-xl border border-red-300">
                  <ShieldAlert className="w-4 h-4 text-white" />
                  <span className="font-bold text-xs">স্টল ওয়ার্নিং! থ্রোটল বাড়ান!</span>
                </div>
              )}

              <div className="bg-stone-900/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-xs font-mono">
                ⏱️ {Math.floor(flightTimeSec / 60)}:{String(flightTimeSec % 60).padStart(2, '0')}
              </div>
            </div>

            {/* Left Primary Flight Display Tapes */}
            <div className="absolute left-3 top-20 pointer-events-none z-20 flex flex-col gap-2">
              <div className="bg-stone-950/80 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 text-white w-24 sm:w-28 text-center shadow-lg">
                <div className="flex items-center justify-center gap-1 text-[10px] text-stone-400 font-semibold mb-0.5">
                  <Gauge className="w-3 h-3 text-sky-400" />
                  <span>গতি (IAS)</span>
                </div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-sky-300">
                  {speed}
                </div>
                <span className="text-[9px] text-stone-400">কিমি/ঘণ্টা</span>
              </div>

              <div className="bg-stone-950/80 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 text-white w-24 sm:w-28 text-center shadow-lg">
                <div className="flex items-center justify-center gap-1 text-[10px] text-stone-400 font-semibold mb-0.5">
                  <Navigation className="w-3 h-3 text-emerald-400" />
                  <span>উচ্চতা (ALT)</span>
                </div>
                <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-300">
                  {altitude}
                </div>
                <span className="text-[9px] text-stone-400">মিটার</span>
              </div>
            </div>

            {/* Right Flight Instruments */}
            <div className="absolute right-3 top-20 pointer-events-none z-20 flex flex-col items-end gap-2">
              <div className="bg-stone-950/80 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 text-white w-24 sm:w-28 text-center shadow-lg">
                <div className="flex items-center justify-center gap-1 text-[10px] text-stone-400 font-semibold mb-0.5">
                  <Compass className="w-3 h-3 text-amber-400" />
                  <span>হেডিং</span>
                </div>
                <div className="text-lg sm:text-xl font-mono font-bold text-amber-300">
                  {heading}°
                </div>
                <span className="text-[9px] text-stone-400">COMPASS</span>
              </div>

              <div className="bg-stone-950/80 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 text-white w-24 sm:w-28 text-center shadow-lg">
                <span className="text-[10px] text-stone-400 block mb-1">থ্রোটল (PWR)</span>
                <div className="w-full bg-stone-700 h-2 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all"
                    style={{ width: `${throttle}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-xs text-stone-200">{throttle}%</span>
              </div>
            </div>

            {/* Cockpit HUD Horizon & Reticle */}
            {cameraView === 'cockpit' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                <div className="relative w-56 h-56 border border-emerald-400/40 rounded-full flex items-center justify-center">
                  <div className="w-20 h-0.5 bg-emerald-400 shadow-[0_0_10px_#10B981]" />
                  <div className="w-3 h-3 rounded-full border border-emerald-400 absolute" />
                  {/* Pitch ladder markings */}
                  <div className="absolute top-14 w-8 h-0.5 bg-emerald-300/60" />
                  <div className="absolute bottom-14 w-8 h-0.5 bg-emerald-300/60" />
                </div>
              </div>
            )}

            {/* Responsive Touch Controls */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-auto">
              <div className="grid grid-cols-3 gap-1.5 w-36 sm:w-44 bg-stone-950/70 backdrop-blur-md p-2 rounded-2xl border border-white/15">
                <div />
                <button
                  onPointerDown={() => (inputRef.current.pitchDown = true)}
                  onPointerUp={() => (inputRef.current.pitchDown = false)}
                  className="p-2.5 rounded-xl bg-white/15 active:bg-amber-400 text-white active:text-stone-950 font-bold text-xs transition cursor-pointer text-center"
                >
                  ▲
                </button>
                <div />
                <button
                  onPointerDown={() => (inputRef.current.rollLeft = true)}
                  onPointerUp={() => (inputRef.current.rollLeft = false)}
                  className="p-2.5 rounded-xl bg-white/15 active:bg-amber-400 text-white active:text-stone-950 font-bold text-xs transition cursor-pointer text-center"
                >
                  ◀
                </button>
                <button
                  onPointerDown={() => (inputRef.current.pitchUp = true)}
                  onPointerUp={() => (inputRef.current.pitchUp = false)}
                  className="p-2.5 rounded-xl bg-white/15 active:bg-amber-400 text-white active:text-stone-950 font-bold text-xs transition cursor-pointer text-center"
                >
                  ▼
                </button>
                <button
                  onPointerDown={() => (inputRef.current.rollRight = true)}
                  onPointerUp={() => (inputRef.current.rollRight = false)}
                  className="p-2.5 rounded-xl bg-white/15 active:bg-amber-400 text-white active:text-stone-950 font-bold text-xs transition cursor-pointer text-center"
                >
                  ▶
                </button>
              </div>

              <div className="flex flex-col gap-1.5 bg-stone-950/70 backdrop-blur-md p-2 rounded-2xl border border-white/15">
                <button
                  onPointerDown={() => (inputRef.current.throttleUp = true)}
                  onPointerUp={() => (inputRef.current.throttleUp = false)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/85 active:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  ⚡ গতি বাড়ান (+)
                </button>
                <button
                  onPointerDown={() => (inputRef.current.throttleDown = true)}
                  onPointerUp={() => (inputRef.current.throttleDown = false)}
                  className="px-3.5 py-2 rounded-xl bg-rose-600/85 active:bg-rose-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  🛑 গতি কমান (-)
                </button>
              </div>
            </div>
          </>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TOUCHDOWN REUNION CELEBRATION                               */}
        {/* ----------------------------------------------------------- */}
        {gameState === 'landed' && (
          <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md z-30 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl border border-amber-300 text-stone-800"
            >
              <span className="text-4xl sm:text-5xl inline-block mb-3 animate-bounce">
                🏡🎉
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-emerald-800">
                অভিনন্দন! নিরাপদ অবতরণ সম্পন্ন!
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 mb-4">
                আপনি আকাশপথে সুন্দরভাবে উড়ে <span className="font-bold text-stone-900">{selectedDestination.name}</span>-এ
                অবতরণ করেছেন!
              </p>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 mb-5 text-left flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-xl shrink-0 font-bold shadow-xs">
                  {selectedDestination.name.slice(0, 1)}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-amber-900">
                    {selectedDestination.name} ({selectedDestination.relation})
                  </h4>
                  <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed italic">
                    "আলহামদুলিল্লাহ! অনেক দিন পর আকাশপথে আমাদের বাড়িতে আসলে! পুরো পরিবারের সবাই তোমাকে দেখে ভীষণ আনন্দিত।
                    ভেতরে এসো, গরম চা ও মিষ্টি প্রস্তুত!"
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-200 mb-5">
                <div>
                  <span className="text-[10px] text-stone-500 block">ফ্লাইট সময়</span>
                  <span className="font-mono font-bold text-sm text-stone-800">
                    {Math.floor(flightTimeSec / 60)}মি. {flightTimeSec % 60}সে.
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">অবতরণ রেটিং</span>
                  <span className="font-bold text-xs text-emerald-700">{landingRating}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">উড়োজাহাজ</span>
                  <span className="font-bold text-xs text-stone-800">
                    {selectedAircraft === 'jet' ? 'টার্বোজেট' : selectedAircraft === 'cessna' ? 'সেসনা' : 'চপার'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  onClick={() => setGameState('briefing')}
                  className="w-full py-3 rounded-2xl bg-[#1A3636] hover:bg-[#112424] text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-4 h-4" />
                  <span>অন্য আত্মীয়ের বাড়ি ভ্রমণ করুন</span>
                </button>

                <button
                  onClick={handleStartFlight}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>পুনরায় উড়ুন</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Control Instructions */}
      <div className="mt-3 p-3 bg-white/70 backdrop-blur-xs rounded-2xl border border-[#D6BD98]/40 text-stone-600 text-[11px] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#1A3636]">🎮 কী-বোর্ড কন্ট্রোল:</span>
          <span>W/S (নাক উপরে/নিচে) • A/D (বামে/ডানে ব্যাংকিং) • Q/E (রাডার) • Shift/Ctrl (থ্রোটল) • C (ক্যামেরা)</span>
        </div>
        <div className="text-emerald-800 font-semibold">
          📱 মোবাইলে অন-স্ক্রিন বোতাম ব্যবহার করুন
        </div>
      </div>
    </div>
  );
}
