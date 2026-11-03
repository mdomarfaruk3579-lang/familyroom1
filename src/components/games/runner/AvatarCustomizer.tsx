import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Camera, Trash2, ArrowRight, ArrowLeft, RotateCw, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { RunnerConfig } from './types';
import { processFacePhoto, saveRunnerConfig, deleteCustomFacePhoto } from './facePipeline';
import { createCharacter, CharacterRig, animateRunning } from './characterMesh';

interface AvatarCustomizerProps {
  initialConfig: RunnerConfig;
  onConfirm: (config: RunnerConfig) => void;
  onBack: () => void;
}

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  initialConfig,
  onConfirm,
  onBack,
}) => {
  const [config, setConfig] = useState<RunnerConfig>(initialConfig);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const rigRef = useRef<CharacterRig | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const isDraggingRef = useRef(false);
  const prevMouseXRef = useRef(0);

  // Initialize Three.js 3D Preview
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 320;
    const height = 360;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f3ee);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 1.4, 3.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Soft Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd6bd98, 1.2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.5);
    dirLight.position.set(3, 5, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xbbf7d0, 0.8);
    backLight.position.set(-3, 3, -3);
    scene.add(backLight);

    // Circular pedestal ground
    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.3, 0.1, 32),
      new THREE.MeshStandardMaterial({ color: 0xe5e5e5, roughness: 0.8 })
    );
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // Initial character
    const rig = createCharacter(config, true);
    scene.add(rig.root);
    rigRef.current = rig;

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      if (rigRef.current) {
        animateRunning(rigRef.current, elapsedTime, 0.6);
      }
      renderer.render(scene, camera);
    };
    animate();

    // Mouse / Touch Rotation Handler
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseXRef.current = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !rigRef.current) return;
      const deltaX = e.clientX - prevMouseXRef.current;
      rigRef.current.root.rotation.y += deltaX * 0.015;
      prevMouseXRef.current = e.clientX;
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMouseXRef.current = e.touches[0].clientX;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !rigRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseXRef.current;
      rigRef.current.root.rotation.y += deltaX * 0.015;
      prevMouseXRef.current = e.touches[0].clientX;
    };
    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Character Model when config changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const currentRotationY = rigRef.current ? rigRef.current.root.rotation.y : 0;

    if (rigRef.current) {
      scene.remove(rigRef.current.root);
    }

    const newRig = createCharacter(config, true);
    newRig.root.rotation.y = currentRotationY;
    scene.add(newRig.root);
    rigRef.current = newRig;
  }, [config.gender, config.hairStyle, config.hairColor, config.outfit, config.outfitColor, config.skinTone]);

  // Handle Photo Upload & Canvas Processing
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('ছবির আকার সর্বোচ্চ ৮ মেগাবাইট হতে পারে।');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const processedTexture = await processFacePhoto(file, {
        scale: config.faceScale,
        offsetY: config.faceOffsetY,
        brightness: config.brightness,
        skinTone: config.skinTone,
      });

      const updated = {
        ...config,
        faceDataUrl: processedTexture,
      };
      setConfig(updated);
      saveRunnerConfig(updated);
      if (rigRef.current) {
        rigRef.current.updateFaceTexture(processedTexture);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'ছবি প্রক্রিয়া করতে সমস্যা হয়েছে। অন্য ছবি দিয়ে চেষ্টা করুন।');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSliderAdjustment = async (
    updates: Partial<Pick<RunnerConfig, 'faceScale' | 'faceOffsetY' | 'brightness' | 'skinTone'>>
  ) => {
    const nextConfig = { ...config, ...updates };
    setConfig(nextConfig);

    // If a face photo exists, re-project with updated sliders
    if (nextConfig.faceDataUrl) {
      try {
        const reprocessed = await processFacePhoto(nextConfig.faceDataUrl, {
          scale: nextConfig.faceScale,
          offsetY: nextConfig.faceOffsetY,
          brightness: nextConfig.brightness,
          skinTone: nextConfig.skinTone,
        });
        nextConfig.faceDataUrl = reprocessed;
        saveRunnerConfig(nextConfig);
        if (rigRef.current) {
          rigRef.current.updateFaceTexture(reprocessed);
        }
      } catch (err) {
        console.error('Adjustment re-render failed', err);
      }
    }
  };

  const handleDeletePhoto = () => {
    deleteCustomFacePhoto();
    const updated = { ...config, faceDataUrl: null };
    setConfig(updated);
    saveRunnerConfig(updated);
    if (rigRef.current) {
      rigRef.current.updateFaceTexture(null);
    }
  };

  const handleSaveAndProceed = () => {
    saveRunnerConfig(config);
    onConfirm(config);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-2 px-3 sm:px-6">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1A3636] hover:text-[#40534C] bg-white px-3.5 py-1.5 rounded-full border border-[#D6BD98]/60 shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> ফিরে যান
        </button>

        <span className="text-xs font-semibold px-3 py-1 bg-[#D6BD98]/30 text-[#1A3636] rounded-full border border-[#D6BD98]">
          রানার সেটিং (নিজের অবতার)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* LEFT COLUMN: 3D Live Interactive Preview */}
        <div className="md:col-span-5 bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-4 shadow-sm flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-[#1A3636] uppercase tracking-wider">
              থ্রিডি প্রিভিউ
            </span>
            <span className="text-[11px] text-[#736B65] flex items-center gap-1">
              <RotateCw className="w-3 h-3 animate-spin-slow" /> ঘুরিয়ে দেখতে ড্র্যাগ করুন
            </span>
          </div>

          <div
            ref={mountRef}
            className="w-full h-[340px] sm:h-[380px] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing bg-gradient-to-b from-[#FAF9F6] to-[#EAE6DF] relative shadow-inner"
          >
            {isProcessing && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center text-white z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-amber-300 border-t-transparent mb-2"></div>
                <p className="text-xs font-medium">মুখের ছবি ৩ডি অবতারে বসানো হচ্ছে...</p>
              </div>
            )}
          </div>

          {/* Quick Photo Upload & Delete Buttons */}
          <div className="w-full mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1A3636] hover:bg-[#40534C] text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-sm transition cursor-pointer">
                <Camera className="w-4 h-4 text-amber-300" />
                <span>{config.faceDataUrl ? 'অন্য ছবি দিন' : 'ছবি আপলোড (ঐচ্ছিক)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {config.faceDataUrl ? (
                <button
                  onClick={handleDeletePhoto}
                  title="আমার ছবি মুছে ফেলুন"
                  className="p-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSaveAndProceed}
                  className="py-2.5 px-3 rounded-xl border border-[#D6BD98] text-[#1A3636] bg-amber-50 hover:bg-amber-100 text-xs font-bold transition cursor-pointer"
                >
                  ছবি ছাড়া খেলুন
                </button>
              )}
            </div>

            <p className="text-[10px] text-center text-amber-800">
              💡 ছবি আপলোড না করলেও চমৎকার বাস্তবসম্মত থ্রিডি মুখাবয়ব স্বয়ংক্রিয়ভাবে থাকবে।
            </p>
          </div>

          {errorMessage && (
            <p className="text-[11px] text-rose-600 mt-2 text-center">{errorMessage}</p>
          )}

          {/* PRIVACY GUARANTEE BANNER (Mandatory) */}
          <div className="w-full mt-3 p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl text-[11px] text-emerald-950 flex items-start gap-2 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>গোপনীয়তা নিশ্চিত:</strong> আপনার ছবি কোনো সার্ভারে পাঠানো হয় না, সম্পূর্ণ ব্রাউজারে প্রক্রিয়াজাত হয়ে শুধু আপনার ডিভাইসেই থাকে।
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Customization Controls & Sliders */}
        <div className="md:col-span-7 bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-xl font-serif font-bold text-[#1A3636] border-b border-[#D6BD98]/40 pb-2">
            অবতার কাস্টমাইজেশন
          </h2>

          {/* 1. Gender Selection */}
          <div>
            <label className="block text-xs font-bold text-[#1A3636] uppercase tracking-wider mb-1.5">
              লিঙ্গ নির্বাচন
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfig({ ...config, gender: 'male', outfit: 'panjabi' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  config.gender === 'male'
                    ? 'bg-[#1A3636] text-amber-200 border-[#1A3636] shadow-sm'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                }`}
              >
                <span>👨 পুরুষ</span>
                {config.gender === 'male' && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setConfig({ ...config, gender: 'female', outfit: 'saree' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  config.gender === 'female'
                    ? 'bg-[#1A3636] text-amber-200 border-[#1A3636] shadow-sm'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                }`}
              >
                <span>👩 মহিলা</span>
                {config.gender === 'female' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* 2. Face Sliders (if photo is uploaded) */}
          {config.faceDataUrl && (
            <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> মুখের ছবি ফাইন-টিউন
                </span>
                <span className="text-[10px] text-amber-800">ছবি সঠিক অবস্থানে বসান</span>
              </div>

              {/* Scale */}
              <div>
                <div className="flex justify-between text-[11px] text-stone-700 mb-0.5">
                  <span>মুখের আকার (Scale)</span>
                  <span className="font-mono">{config.faceScale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.05"
                  value={config.faceScale}
                  onChange={(e) => handleSliderAdjustment({ faceScale: parseFloat(e.target.value) })}
                  className="w-full accent-[#1A3636]"
                />
              </div>

              {/* Vertical Offset */}
              <div>
                <div className="flex justify-between text-[11px] text-stone-700 mb-0.5">
                  <span>উচ্চতা সমাহার (Vertical Shift)</span>
                  <span className="font-mono">{config.faceOffsetY.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-1.0"
                  max="1.0"
                  step="0.1"
                  value={config.faceOffsetY}
                  onChange={(e) => handleSliderAdjustment({ faceOffsetY: parseFloat(e.target.value) })}
                  className="w-full accent-[#1A3636]"
                />
              </div>

              {/* Brightness */}
              <div>
                <div className="flex justify-between text-[11px] text-stone-700 mb-0.5">
                  <span>উজ্জ্বলতা (Brightness)</span>
                  <span className="font-mono">{Math.round(config.brightness * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.05"
                  value={config.brightness}
                  onChange={(e) => handleSliderAdjustment({ brightness: parseFloat(e.target.value) })}
                  className="w-full accent-[#1A3636]"
                />
              </div>
            </div>
          )}

          {/* 3. Skin Tone Selection */}
          <div>
            <label className="block text-xs font-bold text-[#1A3636] uppercase tracking-wider mb-1.5">
              ত্বকের রঙ (Skin Tone)
            </label>
            <div className="flex items-center gap-2">
              {[
                { label: 'উজ্জ্বল ফর্সা', color: '#f7d0b3' },
                { label: 'স্বাভাবিক', color: '#e0ac69' },
                { label: 'শ্যামলা', color: '#c68642' },
                { label: 'গাঢ় শ্যামলা', color: '#8d5524' },
              ].map((item) => (
                <button
                  key={item.color}
                  onClick={() => handleSliderAdjustment({ skinTone: item.color })}
                  title={item.label}
                  className={`w-9 h-9 rounded-full border-2 transition-transform cursor-pointer ${
                    config.skinTone === item.color
                      ? 'scale-110 border-[#1A3636] shadow-md'
                      : 'border-white hover:scale-105'
                  }`}
                  style={{ backgroundColor: item.color }}
                />
              ))}
            </div>
          </div>

          {/* 4. Outfit & Color */}
          <div>
            <label className="block text-xs font-bold text-[#1A3636] uppercase tracking-wider mb-1.5">
              পোশাক নির্বাচন
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {config.gender === 'male' ? (
                <>
                  <button
                    onClick={() => setConfig({ ...config, outfit: 'panjabi' })}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-medium cursor-pointer ${
                      config.outfit === 'panjabi' ? 'bg-[#1A3636] text-white border-[#1A3636]' : 'bg-white border-stone-200'
                    }`}
                  >
                    পাঞ্জাবি
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, outfit: 'shirt_pant' })}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-medium cursor-pointer ${
                      config.outfit === 'shirt_pant' ? 'bg-[#1A3636] text-white border-[#1A3636]' : 'bg-white border-stone-200'
                    }`}
                  >
                    শার্ট-প্যান্ট
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, outfit: 'casual' })}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-medium cursor-pointer ${
                      config.outfit === 'casual' ? 'bg-[#1A3636] text-white border-[#1A3636]' : 'bg-white border-stone-200'
                    }`}
                  >
                    ক্যাজুয়াল
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setConfig({ ...config, outfit: 'saree' })}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-medium cursor-pointer ${
                      config.outfit === 'saree' ? 'bg-[#1A3636] text-white border-[#1A3636]' : 'bg-white border-stone-200'
                    }`}
                  >
                    শাড়ি
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, outfit: 'salwar' })}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-medium cursor-pointer ${
                      config.outfit === 'salwar' ? 'bg-[#1A3636] text-white border-[#1A3636]' : 'bg-white border-stone-200'
                    }`}
                  >
                    সালোয়ার-কামিজ
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, outfit: 'casual' })}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-medium cursor-pointer ${
                      config.outfit === 'casual' ? 'bg-[#1A3636] text-white border-[#1A3636]' : 'bg-white border-stone-200'
                    }`}
                  >
                    কুর্তি
                  </button>
                </>
              )}
            </div>

            {/* Outfit Color Palette */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-stone-600">রঙ:</span>
              {['#1A3636', '#991b1b', '#1e3a8a', '#854d0e', '#047857', '#4c1d95'].map((hex) => (
                <button
                  key={hex}
                  onClick={() => setConfig({ ...config, outfitColor: hex })}
                  className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${
                    config.outfitColor === hex ? 'scale-110 border-[#D6BD98] shadow-sm' : 'border-white'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Action Button: Proceed to Relay Selection */}
          <div className="pt-2 border-t border-[#D6BD98]/40 flex justify-end">
            <button
              onClick={handleSaveAndProceed}
              className="inline-flex items-center gap-2 bg-[#1A3636] hover:bg-[#40534C] text-white text-xs sm:text-sm font-bold py-3 px-6 rounded-full shadow-md transition cursor-pointer"
            >
              <span>রিলে দল নির্বাচন করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
