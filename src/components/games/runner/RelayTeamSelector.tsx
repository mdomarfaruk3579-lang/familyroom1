import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, UserCheck, Sparkles, Layers, ShieldCheck } from 'lucide-react';
import { Member } from '../../../types';
import { GenerationRunner, RunnerConfig } from './types';

interface RelayTeamSelectorProps {
  members: Member[];
  playerConfig: RunnerConfig;
  onConfirmTeam: (team: GenerationRunner[]) => void;
  onBack: () => void;
}

export const RelayTeamSelector: React.FC<RelayTeamSelectorProps> = ({
  members,
  playerConfig,
  onConfirmTeam,
  onBack,
}) => {
  // Find potential parents, grandparents, elders
  const potentialParents = members.filter(
    (m) => m.type === 'son' || m.type === 'daughter' || m.type === 'spouse'
  );
  const potentialGrandparents = members.filter(
    (m) => m.type === 'grandpa' || m.type === 'grandma'
  );
  const allOtherMembers = members.filter(Boolean);

  const [selectedParentId, setSelectedParentId] = useState<string>(
    potentialParents[0]?.id || allOtherMembers[1]?.id || ''
  );
  const [selectedGrandparentId, setSelectedGrandparentId] = useState<string>(
    potentialGrandparents[0]?.id || allOtherMembers[0]?.id || ''
  );
  const [selectedElderId, setSelectedElderId] = useState<string>(
    potentialGrandparents[1]?.id || allOtherMembers[2]?.id || ''
  );

  const handleStartRelay = () => {
    const parentMember = members.find((m) => m.id === selectedParentId) || null;
    const grandparentMember = members.find((m) => m.id === selectedGrandparentId) || null;
    const elderMember = members.find((m) => m.id === selectedElderId) || null;

    const team: GenerationRunner[] = [
      // Gen 1: Player (Present)
      {
        eraId: 1,
        generationTitle: '১ম রানার (বর্তমান প্রজন্ম)',
        eraName: 'বর্তমান - আধুনিক ঢাকা',
        member: null,
        config: playerConfig,
      },
      // Gen 2: Parent (90s)
      {
        eraId: 2,
        generationTitle: '২য় রানার (পিতা/মাতা প্রজন্ম)',
        eraName: '৯০-এর দশক - রিকশার অলিগলি',
        member: parentMember,
        config: {
          gender: parentMember?.gender || 'male',
          hairStyle: 'classic',
          hairColor: '#262626',
          outfit: parentMember?.gender === 'female' ? 'saree' : 'shirt_pant',
          outfitColor: '#92400e',
          skinTone: '#e0ac69',
          faceDataUrl: parentMember?.photoUrl || null,
          faceScale: 1.0,
          faceOffsetY: 0,
          brightness: 1.0,
        },
      },
      // Gen 3: Grandparent (60s)
      {
        eraId: 3,
        generationTitle: '৩য় রানার (দাদা/দাদি প্রজন্ম)',
        eraName: '৬০-এর দশক - মেঠোপথ ও বাদল দিন',
        member: grandparentMember,
        config: {
          gender: grandparentMember?.gender || 'male',
          hairStyle: 'short',
          hairColor: '#525252',
          outfit: grandparentMember?.gender === 'female' ? 'saree' : 'panjabi',
          outfitColor: '#166534',
          skinTone: '#e0ac69',
          faceDataUrl: grandparentMember?.photoUrl || null,
          faceScale: 1.0,
          faceOffsetY: 0,
          brightness: 1.0,
        },
      },
      // Gen 4: Great-grandparent / Family Root (Old Days)
      {
        eraId: 4,
        generationTitle: '৪র্থ রানার (পূর্বপুরুষ প্রজন্ম)',
        eraName: 'পুরনো দিন - নদীর ঘাট ও পালতোলা নৌকা',
        member: elderMember,
        config: {
          gender: elderMember?.gender || 'male',
          hairStyle: 'short',
          hairColor: '#e5e5e5',
          outfit: elderMember?.gender === 'female' ? 'saree' : 'panjabi',
          outfitColor: '#78350f',
          skinTone: '#c68642',
          faceDataUrl: elderMember?.photoUrl || null,
          faceScale: 1.0,
          faceOffsetY: 0,
          brightness: 1.0,
        },
      },
    ];

    onConfirmTeam(team);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-3 px-3 sm:px-6">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1A3636] hover:text-[#40534C] bg-white px-3.5 py-1.5 rounded-full border border-[#D6BD98]/60 shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> অবতার সেটিংসে ফিরুন
        </button>

        <span className="text-xs font-semibold px-3 py-1 bg-[#D6BD98]/30 text-[#1A3636] rounded-full border border-[#D6BD98]">
          ধাপ ২: ৪ প্রজন্মের রিলে দল
        </span>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A3636] mb-1">
          ৪ প্রজন্মের রিলে দৌড়বিদ নির্বাচন
        </h2>
        <p className="text-xs sm:text-sm text-[#40534C] max-w-xl mx-auto leading-relaxed">
          হারানো সিন্দুকের চাবি উদ্ধার করতে ১ প্রজন্ম থেকে আরেক প্রজন্মে মশাল হাতবদল হবে। আপনার পরিবারের সদস্যদের মধ্য থেকে প্রতিটি যুগের রানার বেছে নিন।
        </p>
      </div>

      {/* 4 Generation Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Gen 1: Self */}
        <div className="bg-[#FAF9F6] border-2 border-emerald-600/70 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                ১ম প্রজন্ম
              </span>
              <span className="text-xs">🏃</span>
            </div>
            <h3 className="font-serif font-bold text-[#1A3636] text-base mb-0.5">
              আপনি নিজে
            </h3>
            <p className="text-[11px] text-[#736B65] mb-3">বর্তমান - আধুনিক ঢাকা</p>

            <div className="w-16 h-16 rounded-full mx-auto border-2 border-emerald-600 overflow-hidden bg-white mb-2 shadow-sm flex items-center justify-center">
              {playerConfig.faceDataUrl ? (
                <img
                  src={playerConfig.faceDataUrl}
                  alt="Player"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-center text-emerald-700 font-medium bg-emerald-50 py-1 rounded-lg">
            কাস্টম অবতার সক্রিয়
          </p>
        </div>

        {/* Gen 2: Parent */}
        <div className="bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                ২য় প্রজন্ম
              </span>
              <span className="text-xs">📻</span>
            </div>
            <h3 className="font-serif font-bold text-[#1A3636] text-base mb-0.5">
              পিতা / মাতা
            </h3>
            <p className="text-[11px] text-[#736B65] mb-2">৯০-এর দশক (অলিগলি)</p>

            <select
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              className="w-full p-2 text-xs border border-stone-300 rounded-xl bg-white mb-2 font-medium"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role || m.type})
                </option>
              ))}
            </select>
          </div>
          <div className="text-[10px] text-center text-stone-600 bg-stone-100 py-1 rounded-lg truncate">
            {members.find((m) => m.id === selectedParentId)?.name || 'সদস্য নির্বাচন করুন'}
          </div>
        </div>

        {/* Gen 3: Grandparent */}
        <div className="bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                ৩য় প্রজন্ম
              </span>
              <span className="text-xs">🌧️</span>
            </div>
            <h3 className="font-serif font-bold text-[#1A3636] text-base mb-0.5">
              দাদা / দাদি
            </h3>
            <p className="text-[11px] text-[#736B65] mb-2">৬০-এর দশক (মেঠোপথ)</p>

            <select
              value={selectedGrandparentId}
              onChange={(e) => setSelectedGrandparentId(e.target.value)}
              className="w-full p-2 text-xs border border-stone-300 rounded-xl bg-white mb-2 font-medium"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role || m.type})
                </option>
              ))}
            </select>
          </div>
          <div className="text-[10px] text-center text-stone-600 bg-stone-100 py-1 rounded-lg truncate">
            {members.find((m) => m.id === selectedGrandparentId)?.name || 'সদস্য নির্বাচন করুন'}
          </div>
        </div>

        {/* Gen 4: Great-grandparent / Family Root */}
        <div className="bg-[#FAF9F6] border-2 border-[#D6BD98] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                ৪র্থ প্রজন্ম
              </span>
              <span className="text-xs">⛵</span>
            </div>
            <h3 className="font-serif font-bold text-[#1A3636] text-base mb-0.5">
              পূর্বপুরুষ / প্রপিতামহ
            </h3>
            <p className="text-[11px] text-[#736B65] mb-2">পুরনো দিন (নদীর ঘাট)</p>

            <select
              value={selectedElderId}
              onChange={(e) => setSelectedElderId(e.target.value)}
              className="w-full p-2 text-xs border border-stone-300 rounded-xl bg-white mb-2 font-medium"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role || m.type})
                </option>
              ))}
            </select>
          </div>
          <div className="text-[10px] text-center text-stone-600 bg-stone-100 py-1 rounded-lg truncate">
            {members.find((m) => m.id === selectedElderId)?.name || 'সদস্য নির্বাচন করুন'}
          </div>
        </div>

      </div>

      {/* Start Button */}
      <div className="text-center pt-2">
        <button
          onClick={handleStartRelay}
          className="inline-flex items-center gap-2 bg-[#1A3636] hover:bg-[#40534C] text-white text-sm sm:text-base font-bold py-3.5 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-5 h-5 fill-white text-white" />
          <span>ফ্যামিলি রানার শুরু করুন!</span>
        </button>
      </div>
    </div>
  );
};
