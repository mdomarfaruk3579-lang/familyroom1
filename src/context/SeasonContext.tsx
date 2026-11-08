import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type TimeOfDay = 'day' | 'night';
export type SeasonType = 'normal' | 'winter' | 'summer' | 'rainy' | 'autumn';
export type AircraftKind = 'plane' | 'helicopter';

export interface CurvedFlightInfo {
  id: string;
  kind: AircraftKind;
  airlineOrOperator: string;
  callsign: string;
  color: string;
  accentColor: string;
  startX: number;
  startY: number;
  controlX1: number;
  controlY1: number;
  controlX2: number;
  controlY2: number;
  endX: number;
  endY: number;
  durationSec: number;
  bankFactor: number;
  scale: number;
}

interface SunlightConfig {
  intensity: number; // 0.2 to 1.5
  warmth: number;    // 0 to 1
  position: 'top-right' | 'top-center' | 'top-left' | 'sunset';
}

interface SeasonContextType {
  timeOfDay: TimeOfDay;
  setTimeOfDay: (time: TimeOfDay) => void;
  nightDarkness: number; // 0.1 to 1.0 (opacity of night darkness)
  setNightDarkness: (val: number) => void;
  dayBrightness: number; // 0.3 to 1.5 (ambient day brightness)
  setDayBrightness: (val: number) => void;
  season: SeasonType;
  setSeason: (season: SeasonType) => void;
  sunlight: SunlightConfig;
  updateSunlight: (config: Partial<SunlightConfig>) => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  isSkyTrafficEnabled: boolean;
  toggleSkyTraffic: () => void;
  activeFlights: CurvedFlightInfo[];
  triggerOverheadAircraft: (kind?: AircraftKind) => void;
  playThunderSound: () => void;
}

const SeasonContext = createContext<SeasonContextType | null>(null);

const AIRCRAFT_LIVERIES = [
  { name: 'Biman Bangladesh Airlines', callsign: 'BG-027', color: '#006A4E', accent: '#DC2626' },
  { name: 'Emirates', callsign: 'EK-582', color: '#D71920', accent: '#F59E0B' },
  { name: 'Qatar Airways', callsign: 'QR-638', color: '#5C0632', accent: '#CBD5E1' },
  { name: 'Singapore Airlines', callsign: 'SQ-446', color: '#002B49', accent: '#EAB308' },
  { name: 'US-Bangla Airlines', callsign: 'BS-101', color: '#0284C7', accent: '#EA580C' },
  { name: 'Air Arabia', callsign: 'G9-511', color: '#DC2626', accent: '#FFFFFF' },
];

const HELICOPTER_OPERATORS = [
  { name: 'বাংলাদেশ বিমান বাহিনী (BAF Rescue)', callsign: 'BAF-302', color: '#1E3A8A', accent: '#FACC15' },
  { name: 'পারিবারিক এয়ার অ্যাম্বুলেন্স (Family Heli)', callsign: 'MED-01', color: '#DC2626', accent: '#FFFFFF' },
  { name: 'মেঘনা এভিয়েশন (Charter Heli)', callsign: 'S2-AHA', color: '#059669', accent: '#F59E0B' },
  { name: 'স্কাই ক্যাপিটাল ভিআইপি চপার', callsign: 'VIP-09', color: '#1F2937', accent: '#E2E8F0' },
];

export const SeasonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Time of Day: 'day' | 'night'
  const [timeOfDay, setTimeOfDayState] = useState<TimeOfDay>(() => {
    try {
      const saved = localStorage.getItem('family_app_time_of_day');
      if (saved === 'day' || saved === 'night') return saved;
    } catch {}
    return 'day';
  });

  // Night Darkness / Opacity: 0.1 to 1.0 (default 0.75)
  const [nightDarkness, setNightDarknessState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('family_app_night_darkness');
      if (saved) return parseFloat(saved);
    } catch {}
    return 0.75;
  });

  // Day Brightness / Ambient: 0.3 to 1.5 (default 1.0)
  const [dayBrightness, setDayBrightnessState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('family_app_day_brightness');
      if (saved) return parseFloat(saved);
    } catch {}
    return 1.0;
  });

  // Season: 'normal' | 'winter' | 'summer' | 'rainy' | 'autumn'
  const [season, setSeasonState] = useState<SeasonType>(() => {
    try {
      const saved = localStorage.getItem('family_app_season_type');
      if (saved && ['normal', 'winter', 'summer', 'rainy', 'autumn'].includes(saved)) {
        return saved as SeasonType;
      }
    } catch {}
    return 'winter';
  });

  const [sunlight, setSunlight] = useState<SunlightConfig>(() => {
    try {
      const saved = localStorage.getItem('family_app_sunlight_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      intensity: 1.0,
      warmth: 0.5,
      position: 'top-right',
    };
  });

  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('family_app_sound_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Sky traffic enabled toggle: Plane & Helicopter can be turned off!
  const [isSkyTrafficEnabled, setIsSkyTrafficEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('family_sky_traffic_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [activeFlights, setActiveFlights] = useState<CurvedFlightInfo[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Persistence methods
  const setTimeOfDay = (newTime: TimeOfDay) => {
    setTimeOfDayState(newTime);
    try {
      localStorage.setItem('family_app_time_of_day', newTime);
    } catch {}
  };

  const setNightDarkness = (val: number) => {
    const clamped = Math.max(0.1, Math.min(1.0, val));
    setNightDarknessState(clamped);
    try {
      localStorage.setItem('family_app_night_darkness', String(clamped));
    } catch {}
  };

  const setDayBrightness = (val: number) => {
    const clamped = Math.max(0.3, Math.min(1.5, val));
    setDayBrightnessState(clamped);
    try {
      localStorage.setItem('family_app_day_brightness', String(clamped));
    } catch {}
  };

  const setSeason = (newSeason: SeasonType) => {
    setSeasonState(newSeason);
    try {
      localStorage.setItem('family_app_season_type', newSeason);
    } catch {}
  };

  const updateSunlight = (config: Partial<SunlightConfig>) => {
    setSunlight(prev => {
      const next = { ...prev, ...config };
      try {
        localStorage.setItem('family_app_sunlight_config', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleSound = () => {
    setIsSoundEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem('family_app_sound_enabled', String(next));
      } catch {}
      return next;
    });
  };

  const toggleSkyTraffic = () => {
    setIsSkyTrafficEnabled(prev => {
      const next = !prev;
      if (!next) {
        // Clear currently flying aircraft immediately
        setActiveFlights([]);
      }
      try {
        localStorage.setItem('family_sky_traffic_enabled', String(next));
      } catch {}
      return next;
    });
  };

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // -------------------------------------------------------------
  // REALISTIC JET ENGINE SOUND SYNTHESIS
  // -------------------------------------------------------------
  const playJetEngineSound = useCallback((durationMs = 12000, startLeft = true) => {
    if (!isSoundEnabled || !isSkyTrafficEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const durationSec = durationMs / 1000;

      const bufferSize = ctx.sampleRate * 3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.Q.setValueAtTime(4.0, now);
      bandpass.frequency.setValueAtTime(540, now);
      bandpass.frequency.linearRampToValueAtTime(960, now + durationSec * 0.45);
      bandpass.frequency.exponentialRampToValueAtTime(320, now + durationSec);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(320, now);
      lowpass.frequency.linearRampToValueAtTime(680, now + durationSec * 0.45);
      lowpass.frequency.linearRampToValueAtTime(180, now + durationSec);

      const turbineOsc = ctx.createOscillator();
      turbineOsc.type = 'sawtooth';
      turbineOsc.frequency.setValueAtTime(82, now);
      turbineOsc.frequency.linearRampToValueAtTime(126, now + durationSec * 0.45);
      turbineOsc.frequency.linearRampToValueAtTime(68, now + durationSec);

      const turbineWhine = ctx.createOscillator();
      turbineWhine.type = 'sine';
      turbineWhine.frequency.setValueAtTime(1580, now);
      turbineWhine.frequency.linearRampToValueAtTime(1920, now + durationSec * 0.45);
      turbineWhine.frequency.exponentialRampToValueAtTime(840, now + durationSec);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(0.22, now + durationSec * 0.45);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      let panner: StereoPannerNode | null = null;
      if (ctx.createStereoPanner) {
        panner = ctx.createStereoPanner();
        const fromPan = startLeft ? -0.85 : 0.85;
        const toPan = startLeft ? 0.85 : -0.85;
        panner.pan.setValueAtTime(fromPan, now);
        panner.pan.linearRampToValueAtTime(toPan, now + durationSec);
      }

      whiteNoise.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(masterGain);

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.08;
      turbineOsc.connect(oscGain);
      turbineWhine.connect(oscGain);
      oscGain.connect(masterGain);

      if (panner) {
        masterGain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        masterGain.connect(ctx.destination);
      }

      whiteNoise.start(now);
      turbineOsc.start(now);
      turbineWhine.start(now);

      whiteNoise.stop(now + durationSec);
      turbineOsc.stop(now + durationSec);
      turbineWhine.stop(now + durationSec);
    } catch {}
  }, [isSoundEnabled, isSkyTrafficEnabled, getAudioContext]);

  // -------------------------------------------------------------
  // AUTHENTIC HELICOPTER ACOUSTIC SYNTHESIS (Blade-Vortex Slap)
  // -------------------------------------------------------------
  const playHelicopterSound = useCallback((durationMs = 14000, startLeft = true) => {
    if (!isSoundEnabled || !isSkyTrafficEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const durationSec = durationMs / 1000;

      // 1. Generate an authentic 2.0s seamless looping buffer of heavy blade slaps
      // 22 distinct "WHOP-WHOP" impacts across 2 seconds (~11.0 Hz classic Huey / Bell chopper frequency)
      const loopDuration = 2.0;
      const totalSamples = Math.floor(ctx.sampleRate * loopDuration);
      const chopperBuffer = ctx.createBuffer(1, totalSamples, ctx.sampleRate);
      const cData = chopperBuffer.getChannelData(0);

      const numSlaps = 22;
      const slapPeriod = totalSamples / numSlaps; // samples per blade pass (~4000 samples @ 44.1kHz)

      for (let i = 0; i < totalSamples; i++) {
        const slapSampleIndex = i % slapPeriod;
        const slapTimeSec = slapSampleIndex / ctx.sampleRate; // time since blade impact in seconds

        if (slapTimeSec < 0.038) {
          // Sharp percussive acoustic compression wave + hollow wood-like resonant thump
          const bassThump = Math.sin(2 * Math.PI * 86 * slapTimeSec) * Math.exp(-slapTimeSec * 75) * 0.88;
          const subPunch = Math.sin(2 * Math.PI * 43 * slapTimeSec) * Math.exp(-slapTimeSec * 45) * 0.55;
          const bladeCrack = (Math.random() * 2 - 1) * Math.exp(-slapTimeSec * 140) * 0.45;
          cData[i] = bassThump + subPunch + bladeCrack;
        } else {
          // Low airflow trough between blade strikes (gives the signature staccato "WHOP... WHOP... WHOP")
          cData[i] = (Math.random() * 2 - 1) * 0.018;
        }
      }

      const chopperSource = ctx.createBufferSource();
      chopperSource.buffer = chopperBuffer;
      chopperSource.loop = true;

      // Resonant Lowpass Filter giving the deep acoustic body of rotating rotor blades
      const rotorFilter = ctx.createBiquadFilter();
      rotorFilter.type = 'lowpass';
      rotorFilter.frequency.setValueAtTime(260, now);
      rotorFilter.frequency.linearRampToValueAtTime(320, now + durationSec * 0.45);
      rotorFilter.frequency.linearRampToValueAtTime(190, now + durationSec);

      // Distant subtle turbine transmission whistle (very faint so it doesn't mask the blade chop!)
      const turbineWhistle = ctx.createOscillator();
      turbineWhistle.type = 'sine';
      turbineWhistle.frequency.setValueAtTime(1380, now);
      turbineWhistle.frequency.linearRampToValueAtTime(1520, now + durationSec * 0.45);
      turbineWhistle.frequency.exponentialRampToValueAtTime(1100, now + durationSec);

      const whistleGain = ctx.createGain();
      whistleGain.gain.setValueAtTime(0.012, now); // soft in background

      // Master gain envelope (swells as helicopter flies closer, fades as it leaves)
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(0.38, now + durationSec * 0.45);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      // Stereo panner
      let panner: StereoPannerNode | null = null;
      if (ctx.createStereoPanner) {
        panner = ctx.createStereoPanner();
        const fromPan = startLeft ? -0.85 : 0.85;
        const toPan = startLeft ? 0.85 : -0.85;
        panner.pan.setValueAtTime(fromPan, now);
        panner.pan.linearRampToValueAtTime(toPan, now + durationSec);
      }

      chopperSource.connect(rotorFilter);
      rotorFilter.connect(masterGain);

      turbineWhistle.connect(whistleGain);
      whistleGain.connect(masterGain);

      if (panner) {
        masterGain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        masterGain.connect(ctx.destination);
      }

      chopperSource.start(now);
      turbineWhistle.start(now);

      chopperSource.stop(now + durationSec);
      turbineWhistle.stop(now + durationSec);
    } catch {}
  }, [isSoundEnabled, isSkyTrafficEnabled, getAudioContext]);

  // Web Audio Thunder Sound
  const playThunderSound = useCallback(() => {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const durationSec = 4.0;

      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = b0 + b1 + b2 + white * 0.5362;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, now);
      filter.frequency.linearRampToValueAtTime(110, now + durationSec);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.linearRampToValueAtTime(0.48, now + 0.12);
      gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.9);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      noiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + durationSec);
    } catch {}
  }, [isSoundEnabled, getAudioContext]);

  // -------------------------------------------------------------
  // TRIGGER CURVED / SPIRAL OVERHEAD FLIGHT
  // -------------------------------------------------------------
  const triggerOverheadAircraft = useCallback((kind?: AircraftKind) => {
    // If sky traffic is turned off, do nothing
    if (!isSkyTrafficEnabled) return;

    const chosenKind: AircraftKind = kind || (Math.random() > 0.5 ? 'helicopter' : 'plane');
    const startLeft = Math.random() > 0.35;

    const startX = startLeft ? -12 : 112;
    const endX = startLeft ? 112 : -12;

    const startY = Math.floor(Math.random() * 25) + 6;
    const endY = Math.floor(Math.random() * 30) + 8;

    const curveAmp = chosenKind === 'helicopter' ? 22 : 14;
    const midSign = Math.random() > 0.5 ? 1 : -1;

    const controlX1 = startLeft ? 25 : 75;
    const controlY1 = Math.max(3, Math.min(45, (startY + endY) / 2 + midSign * curveAmp));

    const controlX2 = startLeft ? 75 : 25;
    const controlY2 = Math.max(3, Math.min(50, (startY + endY) / 2 - midSign * (curveAmp * 0.8)));

    const durationSec = chosenKind === 'helicopter' ? 14 : 11;

    const livery = chosenKind === 'plane'
      ? AIRCRAFT_LIVERIES[Math.floor(Math.random() * AIRCRAFT_LIVERIES.length)]
      : HELICOPTER_OPERATORS[Math.floor(Math.random() * HELICOPTER_OPERATORS.length)];

    const newFlight: CurvedFlightInfo = {
      id: `craft-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      kind: chosenKind,
      airlineOrOperator: livery.name,
      callsign: livery.callsign,
      color: livery.color,
      accentColor: livery.accent,
      startX,
      startY,
      controlX1,
      controlY1,
      controlX2,
      controlY2,
      endX,
      endY,
      durationSec,
      bankFactor: midSign * (chosenKind === 'helicopter' ? 14 : 10),
      scale: chosenKind === 'helicopter' ? 0.95 : 1.05,
    };

    setActiveFlights(prev => [...prev.slice(-1), newFlight]);

    if (chosenKind === 'plane') {
      playJetEngineSound(durationSec * 1000, startLeft);
    } else {
      playHelicopterSound(durationSec * 1000, startLeft);
    }
  }, [isSkyTrafficEnabled, playJetEngineSound, playHelicopterSound]);

  // Periodic sky traffic crossing
  useEffect(() => {
    if (!isSkyTrafficEnabled) return;

    const initialTimer = setTimeout(() => {
      triggerOverheadAircraft();
    }, 12000);

    const interval = setInterval(() => {
      triggerOverheadAircraft();
    }, Math.floor(Math.random() * 35000) + 40000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isSkyTrafficEnabled, triggerOverheadAircraft]);

  return (
    <SeasonContext.Provider
      value={{
        timeOfDay,
        setTimeOfDay,
        nightDarkness,
        setNightDarkness,
        dayBrightness,
        setDayBrightness,
        season,
        setSeason,
        sunlight,
        updateSunlight,
        isSoundEnabled,
        toggleSound,
        isSkyTrafficEnabled,
        toggleSkyTraffic,
        activeFlights,
        triggerOverheadAircraft,
        playThunderSound,
      }}
    >
      {children}
    </SeasonContext.Provider>
  );
};

export const useSeason = () => {
  const context = useContext(SeasonContext);
  if (!context) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
};
