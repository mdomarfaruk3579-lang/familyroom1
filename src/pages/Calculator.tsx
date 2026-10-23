import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator as CalcIcon, Users, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Member } from '../types';

import { defaultFamilyMembers } from '../data/defaultMembers';

export default function Calculator() {
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const cached = localStorage.getItem('family_members_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return defaultFamilyMembers;
  });
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(() => {
    return defaultFamilyMembers
      .filter(m => m.type === 'son' || m.type === 'daughter')
      .map(m => m.id);
  });
  const [includeWife, setIncludeWife] = useState<boolean>(true);

  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
          setMembers(data);
          // Auto-select sons and daughters by default
          const defaultIds = data
            .filter(m => m.type === 'son' || m.type === 'daughter')
            .map(m => m.id);
          setSelectedMemberIds(defaultIds);
        }
      },
      (error) => {
        console.warn("Calculator onSnapshot error (quota/offline):", error);
        try {
          const cached = localStorage.getItem('family_members_cache');
          if (cached) {
            const data: Member[] = JSON.parse(cached);
            setMembers(data);
            const defaultIds = data
              .filter(m => m.type === 'son' || m.type === 'daughter')
              .map(m => m.id);
            setSelectedMemberIds(defaultIds);
          }
        } catch {}
      }
    );
    return () => unsubscribe();
  }, []);

  const sons = useMemo(() => members.filter(m => m.type === 'son'), [members]);
  const daughters = useMemo(() => members.filter(m => m.type === 'daughter'), [members]);
  const grandmas = useMemo(() => members.filter(m => m.type === 'grandma'), [members]);

  const toggleMember = (id: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const allIds = [...sons, ...daughters].map(m => m.id);
    setSelectedMemberIds(allIds);
  };

  const deselectAll = () => {
    setSelectedMemberIds([]);
  };

  // 2:1 Shariah Calculation
  const calculation = useMemo(() => {
    const propertyValue = parseFloat(totalAmount) || 0;
    if (propertyValue <= 0) {
      return {
        hasData: false,
        totalAmount: 0,
        wifeAmount: 0,
        remainingAmount: 0,
        selectedSons: [],
        selectedDaughters: [],
        perSonAmount: 0,
        perDaughterAmount: 0,
        sonsTotalAmount: 0,
        daughtersTotalAmount: 0,
      };
    }

    const selectedSons = sons.filter(s => selectedMemberIds.includes(s.id));
    const selectedDaughters = daughters.filter(d => selectedMemberIds.includes(d.id));

    let currentRemaining = propertyValue;
    let wifeAmount = 0;

    // If wife/grandma is included: gets 1/8 (12.5%) when children exist
    if (includeWife && (selectedSons.length > 0 || selectedDaughters.length > 0)) {
      wifeAmount = propertyValue * (1 / 8);
      currentRemaining = propertyValue - wifeAmount;
    }

    // 2:1 ratio for Sons & Daughters
    const totalUnits = (selectedSons.length * 2) + (selectedDaughters.length * 1);
    const unitValue = totalUnits > 0 ? (currentRemaining / totalUnits) : 0;

    const perSonAmount = unitValue * 2;
    const perDaughterAmount = unitValue * 1;
    const sonsTotalAmount = perSonAmount * selectedSons.length;
    const daughtersTotalAmount = perDaughterAmount * selectedDaughters.length;

    return {
      hasData: true,
      totalAmount: propertyValue,
      wifeAmount: Math.round(wifeAmount),
      remainingAmount: Math.round(currentRemaining),
      selectedSons,
      selectedDaughters,
      perSonAmount: Math.round(perSonAmount),
      perDaughterAmount: Math.round(perDaughterAmount),
      sonsTotalAmount: Math.round(sonsTotalAmount),
      daughtersTotalAmount: Math.round(daughtersTotalAmount),
    };
  }, [totalAmount, selectedMemberIds, includeWife, sons, daughters]);

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4">
      {/* Top Header */}
      <div className="mb-8">
        <Link 
          to="/statistics" 
          className="inline-flex items-center gap-1.5 text-stone-600 hover:text-[#1A3636] font-medium text-xs sm:text-sm mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> পরিসংখ্যান পেজে ফিরে যান
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-900 rounded-2xl border border-amber-300 shadow-xs">
            <CalcIcon className="w-6 h-6 text-amber-800" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A3636]">
              ফ্যামিলি ক্যালকুলেটর (সম্পত্তি বণ্টন)
            </h1>
            <p className="text-xs sm:text-sm text-stone-500">
              ইসলামিক শরীয়াহ অনুযায়ী পরিবারে সম্পত্তি বণ্টন হিসাব (ছেলের অংশ মেয়ের দ্বিগুণ)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Property Input & Member Checkboxes */}
        <div className="lg:col-span-6 space-y-5">
          {/* 1. Property Amount */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200">
            <label className="block text-sm font-serif font-bold text-[#1A3636] mb-2">
              মোট সম্পত্তির পরিমাণ (টাকা / মূল্য) *
            </label>
            <div className="relative">
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="যেমন: 5000000"
                className="w-full pl-4 pr-12 py-3 text-lg font-mono font-bold text-[#1A3636] bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1A3636] focus:bg-white outline-none transition-all placeholder:text-stone-400"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-stone-400">
                BDT (৳)
              </span>
            </div>

            {/* Wife Checkbox */}
            <div className="mt-4 pt-4 border-t border-stone-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWife}
                  onChange={(e) => setIncludeWife(e.target.checked)}
                  className="w-4 h-4 text-[#1A3636] rounded"
                />
                <span className="text-xs sm:text-sm font-semibold text-stone-800">
                  স্ত্রী / দাদি-নানির অংশ (১/৮ ভাগ বা ১২.৫%) অন্তর্ভুক্ত রাখুন
                </span>
              </label>
            </div>
          </div>

          {/* 2. Select Members */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-serif font-bold text-[#1A3636] flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-700" />
                <span>ওয়ারিশান নির্বাচন করুন ({selectedMemberIds.length} জন)</span>
              </h3>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-amber-800 font-bold hover:underline cursor-pointer"
                >
                  সবাইকে নির্বাচন
                </button>
                <span className="text-stone-300">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-stone-500 hover:underline cursor-pointer"
                >
                  ক্লিয়ার
                </button>
              </div>
            </div>

            {/* Sons List */}
            {sons.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold text-stone-600 mb-2 uppercase tracking-wide">
                  ছেলেগণ (প্রত্যেকে ২ ভাগ)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {sons.map(son => {
                    const isSelected = selectedMemberIds.includes(son.id);
                    return (
                      <div
                        key={son.id}
                        onClick={() => toggleMember(son.id)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-300 text-stone-900 shadow-2xs'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent onClick
                          className="w-3.5 h-3.5 text-[#1A3636] rounded pointer-events-none"
                        />
                        <span className="truncate">{son.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Daughters List */}
            {daughters.length > 0 && (
              <div>
                <div className="text-xs font-bold text-stone-600 mb-2 uppercase tracking-wide">
                  মেয়েগণ (প্রত্যেকে ১ ভাগ)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {daughters.map(daughter => {
                    const isSelected = selectedMemberIds.includes(daughter.id);
                    return (
                      <div
                        key={daughter.id}
                        onClick={() => toggleMember(daughter.id)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-300 text-stone-900 shadow-2xs'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent onClick
                          className="w-3.5 h-3.5 text-[#1A3636] rounded pointer-events-none"
                        />
                        <span className="truncate">{daughter.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Calculation Result Card */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-stone-200 sticky top-20">
            <h3 className="text-base font-serif font-bold text-[#1A3636] pb-3 mb-4 border-b border-stone-100 flex items-center justify-between">
              <span>বণ্টন ফলাফল</span>
              {calculation.hasData && (
                <span className="text-xs font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  মোট: {calculation.totalAmount.toLocaleString('bn-BD')} ৳
                </span>
              )}
            </h3>

            {calculation.hasData ? (
              <div className="space-y-4">
                {/* Wife Card if included */}
                {includeWife && calculation.wifeAmount > 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-900 block">
                        স্ত্রী / দাদি-নানি (১/৮ অংশ)
                      </span>
                      <span className="text-[11px] text-stone-500">
                        মোট সম্পত্তির ১২.৫% অংশ
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-mono font-bold text-amber-950 block">
                        {calculation.wifeAmount.toLocaleString('bn-BD')} ৳
                      </span>
                    </div>
                  </div>
                )}

                {/* Sons Summary Card */}
                {calculation.selectedSons.length > 0 && (
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-stone-800">
                        ছেলেদের প্রাপ্তি ({calculation.selectedSons.length} জন)
                      </span>
                      <span className="text-xs font-mono font-bold text-[#1A3636]">
                        মাথাপিছু: {calculation.perSonAmount.toLocaleString('bn-BD')} ৳
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 flex justify-between pt-2 border-t border-stone-200/60">
                      <span>ছেলেদের মোট অংশ:</span>
                      <strong className="font-mono text-stone-800">
                        {calculation.sonsTotalAmount.toLocaleString('bn-BD')} ৳
                      </strong>
                    </div>
                  </div>
                )}

                {/* Daughters Summary Card */}
                {calculation.selectedDaughters.length > 0 && (
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-stone-800">
                        মেয়েদের প্রাপ্তি ({calculation.selectedDaughters.length} জন)
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-900">
                        মাথাপিছু: {calculation.perDaughterAmount.toLocaleString('bn-BD')} ৳
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 flex justify-between pt-2 border-t border-stone-200/60">
                      <span>মেয়েদের মোট অংশ:</span>
                      <strong className="font-mono text-stone-800">
                        {calculation.daughtersTotalAmount.toLocaleString('bn-BD')} ৳
                      </strong>
                    </div>
                  </div>
                )}

                {/* Shariah Note */}
                <div className="p-3 bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-[11px] text-stone-500 leading-relaxed mt-4">
                  পবিত্র কোরআনের বিধান অনুযায়ী ছেলে ও মেয়ের মাঝে ২:১ অনুপাতে সম্পত্তি বণ্টন করা হয়, অর্থাৎ একজন ছেলে যা পাবে একজন মেয়ে তার অর্ধেক অংশ পাবে।
                </div>
              </div>
            ) : (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-2xl mx-auto flex items-center justify-center mb-3">
                  <CalcIcon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-serif font-bold text-stone-700 mb-1">
                  সম্পত্তির পরিমাণ লিখুন
                </h4>
                <p className="text-xs text-stone-400 max-w-xs mx-auto">
                  মোট টাকার পরিমাণ লিখলে স্বয়ংক্রিয়ভাবে ছেলে ও মেয়েদের মাঝে ২:১ অনুপাতে সঠিক বণ্টন হিসাব প্রদর্শিত হবে।
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
