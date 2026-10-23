import React, { forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import { Member } from '../types';
import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';
import { Sparkles, Users, Globe } from 'lucide-react';
import { getCountryDisplay, isProbashi } from '../data/countries';

export interface FamilyTreePdfDownloaderRef {
  downloadPdf: () => Promise<boolean>;
}

interface FamilyTreePdfDownloaderProps {
  members: Member[];
}

interface LineageNode {
  member: Member;
  spouse?: Member;
  children: {
    member: Member;
    spouse?: Member;
    children: {
      member: Member;
      spouse?: Member;
      children: Member[];
    }[];
  }[];
}

export const FamilyTreePdfDownloader = forwardRef<FamilyTreePdfDownloaderRef, FamilyTreePdfDownloaderProps>(
  ({ members }, ref) => {
    const page1Ref = useRef<HTMLDivElement>(null);
    const page2Ref = useRef<HTMLDivElement>(null);

    // Grandparents
    const grandpas = useMemo(() => members.filter(m => m.type === 'head' || m.type === 'grandpa'), [members]);
    const grandmas = useMemo(() => members.filter(m => m.type === 'head' || m.type === 'grandma'), [members]);

    // 4 Sons & 5 Daughters
    const sons = useMemo(() => {
      return members
        .filter(m => m.type === 'son')
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [members]);

    const daughters = useMemo(() => {
      return members
        .filter(m => m.type === 'daughter')
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [members]);

    // Statistics for সদস্য বিন্যাস (Membership Distribution)
    const probashiMembers = useMemo(() => members.filter(m => isProbashi(m.currentlyLiveIn)), [members]);
    const deshiMembers = useMemo(() => members.filter(m => !isProbashi(m.currentlyLiveIn)), [members]);
    const maleMembers = useMemo(() => members.filter(m => m.gender === 'male'), [members]);
    const femaleMembers = useMemo(() => members.filter(m => m.gender === 'female'), [members]);
    const spouses = useMemo(() => members.filter(m => m.type === 'spouse'), [members]);
    const grandchildren = useMemo(() => members.filter(m => m.type === 'grandchild'), [members]);
    const greatGrandchildren = useMemo(() => members.filter(m => m.type === 'great-grandchild' || m.type === 'great-great-grandchild'), [members]);

    // Build orderly lineage for a branch root (son or daughter)
    const buildLineage = (root: Member): LineageNode => {
      // 1. Root spouse
      const rootSpouse = members.find(m => 
        m.spouseId === root.id || (root.spouseId && m.id === root.spouseId)
      );

      // 2. Children of root
      const childrenMembers = members.filter(m => 
        (m.parentId === root.id || (rootSpouse && m.parentId === rootSpouse.id)) &&
        (m.type === 'grandchild' || m.type === 'son' || m.type === 'daughter')
      ).sort((a, b) => (a.order || 0) - (b.order || 0));

      const children = childrenMembers.map(child => {
        // Child's spouse
        const childSpouse = members.find(m => 
          m.spouseId === child.id || (child.spouseId && m.id === child.spouseId)
        );

        // Grandchildren (children of child)
        const grandChildrenMembers = members.filter(m => 
          (m.parentId === child.id || (childSpouse && m.parentId === childSpouse.id)) &&
          (m.type === 'great-grandchild' || m.type === 'grandchild')
        ).sort((a, b) => (a.order || 0) - (b.order || 0));

        const grandChildren = grandChildrenMembers.map(gc => {
          const gcSpouse = members.find(m => 
            m.spouseId === gc.id || (gc.spouseId && m.id === gc.spouseId)
          );
          const greatGrandChildren = members.filter(m => 
            (m.parentId === gc.id || (gcSpouse && m.parentId === gcSpouse.id))
          ).sort((a, b) => (a.order || 0) - (b.order || 0));

          return {
            member: gc,
            spouse: gcSpouse,
            children: greatGrandChildren
          };
        });

        return {
          member: child,
          spouse: childSpouse,
          children: grandChildren
        };
      });

      return {
        member: root,
        spouse: rootSpouse,
        children
      };
    };

    const sonLineages = useMemo(() => sons.map(buildLineage), [sons, members]);
    const daughterLineages = useMemo(() => daughters.map(buildLineage), [daughters, members]);

    useImperativeHandle(ref, () => ({
      async downloadPdf(): Promise<boolean> {
        if (!page1Ref.current || !page2Ref.current) return false;

        try {
          const page1 = page1Ref.current;
          const page2 = page2Ref.current;
          
          // Render Page 1 to high-resolution JPEG
          let imgData1: string;
          try {
            imgData1 = await toJpeg(page1, {
              quality: 0.95,
              backgroundColor: '#FAF9F6',
              pixelRatio: 2,
              cacheBust: true,
            });
          } catch (e1) {
            console.warn("Retrying Page 1 with skipFonts:", e1);
            imgData1 = await toJpeg(page1, {
              quality: 0.92,
              backgroundColor: '#FAF9F6',
              pixelRatio: 1.5,
              skipFonts: true,
            });
          }

          // Render Page 2 to high-resolution JPEG
          let imgData2: string;
          try {
            imgData2 = await toJpeg(page2, {
              quality: 0.95,
              backgroundColor: '#FAF9F6',
              pixelRatio: 2,
              cacheBust: true,
            });
          } catch (e2) {
            console.warn("Retrying Page 2 with skipFonts:", e2);
            imgData2 = await toJpeg(page2, {
              quality: 0.92,
              backgroundColor: '#FAF9F6',
              pixelRatio: 1.5,
              skipFonts: true,
            });
          }

          if (!imgData1 || !imgData2) {
            throw new Error("Failed to render page images");
          }

          // Measure dimensions for perfect scaling without text cutting
          const img1 = new Image();
          await new Promise<void>((resolve, reject) => {
            img1.onload = () => resolve();
            img1.onerror = () => reject(new Error("Failed to load Page 1 JPEG"));
            img1.src = imgData1;
          });

          const img2 = new Image();
          await new Promise<void>((resolve, reject) => {
            img2.onload = () => resolve();
            img2.onerror = () => reject(new Error("Failed to load Page 2 JPEG"));
            img2.src = imgData2;
          });

          // Landscape A3 format (420mm x 297mm) gives ample width and clarity
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a3'
          });

          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();

          // PAGE 1: Sons & Grandparents (fits entirely on Page 1)
          const height1 = (img1.naturalHeight * pdfWidth) / img1.naturalWidth;
          const finalHeight1 = Math.min(height1, pdfHeight);
          pdf.addImage(imgData1, 'JPEG', 0, 0, pdfWidth, finalHeight1);

          // PAGE 2: Daughters & সদস্য বিন্যাস (Membership Distribution) (fits entirely on Page 2)
          pdf.addPage();
          const height2 = (img2.naturalHeight * pdfWidth) / img2.naturalWidth;
          const finalHeight2 = Math.min(height2, pdfHeight);
          pdf.addImage(imgData2, 'JPEG', 0, 0, pdfWidth, finalHeight2);

          // Direct file download on user's device
          pdf.save('Family_Tree_Full_List.pdf');
          return true;
        } catch (error) {
          console.error("PDF direct download failed:", error);
          return false;
        }
      }
    }));

    return (
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: '-99999px', 
          width: '1550px',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -9999,
          opacity: 0.99
        }}
        aria-hidden="true"
      >
        {/* ========================================================================= */}
        {/* PAGE 1: DADA-DADI & 4 SONS (১ম পৃষ্ঠা: দাদা-দাদি ও ৪ জন ছেলে) */}
        {/* ========================================================================= */}
        <div 
          ref={page1Ref}
          style={{
            width: '1500px',
            backgroundColor: '#FAF9F6',
            color: '#1c1917',
          }}
          className="p-8 rounded-2xl border border-stone-300 font-sans flex flex-col justify-between mb-8"
        >
          {/* Document Header - Page 1 */}
          <div className="text-center pb-5 mb-6 border-b-2 border-[#1A3636]">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#1A3636]/10 text-[#1A3636] font-bold text-xs mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>পারিবারিক ঐতিহ্য ও বংশপরম্পরা</span>
            </div>
            <h1 className="text-3xl font-serif font-extrabold text-[#1A3636] tracking-wide mb-1">
              হাজী মোঃ সামছুজ্জোহা ও কুতুরের নেসা পরিবার
            </h1>
            <p className="text-sm text-stone-600 font-medium">
              সম্পূর্ণ বংশলতিকা ও পারিবারিক বিবরণী (Full Family Tree & Lineage Record) • ১ম পৃষ্ঠা
            </p>
            <p className="text-[11px] text-stone-400 mt-1">
              ডাউনলোড তারিখ: {new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* 1. Dada-Dadi Section (Top Center Regal Box) */}
          <div className="mb-6">
            <div className="max-w-xl mx-auto bg-gradient-to-r from-[#1A3636] via-[#244c4c] to-[#1A3636] text-white p-4 rounded-2xl shadow-md border-2 border-amber-400/60 text-center">
              <div className="inline-block px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                মূল অভিভাবক (Grandparents)
              </div>
              <div className="flex items-center justify-center gap-8 text-center">
                <div>
                  <h3 className="font-serif font-bold text-xl text-amber-200">
                    {grandpas[0]?.name || 'মরহুম হাজী মোঃ সামছুজ্জোহা'}
                  </h3>
                  <p className="text-xs text-stone-300 font-medium mt-0.5">দাদা (পরিবারের প্রতিষ্ঠাতা)</p>
                  {grandpas[0]?.currentlyLiveIn && grandpas[0]?.currentlyLiveIn !== 'Bangladesh' && (
                    <span className="text-[10px] text-emerald-300">
                      {getCountryDisplay(grandpas[0].currentlyLiveIn).flag} {getCountryDisplay(grandpas[0].currentlyLiveIn).name}
                    </span>
                  )}
                </div>

                <div className="text-2xl text-amber-400 font-bold">•</div>

                <div>
                  <h3 className="font-serif font-bold text-xl text-amber-200">
                    {grandmas[0]?.name || 'মরহুমা কুতুরের নেসা'}
                  </h3>
                  <p className="text-xs text-stone-300 font-medium mt-0.5">দাদি (পরিবারের রত্নগর্ভা)</p>
                  {grandmas[0]?.currentlyLiveIn && grandmas[0]?.currentlyLiveIn !== 'Bangladesh' && (
                    <span className="text-[10px] text-emerald-300">
                      {getCountryDisplay(grandmas[0].currentlyLiveIn).flag} {getCountryDisplay(grandmas[0].currentlyLiveIn).name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. 4 Boxes for 4 Sons */}
          <div className="mb-6 flex-1">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-amber-500/40">
              <h2 className="text-xl font-serif font-bold text-[#1A3636] flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span>১ম সারি: ৪ জন ছেলে ও তাদের পরিবার</span>
              </h2>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                মোট ৪টি পরিবার
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 items-start">
              {sonLineages.map((item, idx) => {
                const sonCountry = getCountryDisplay(item.member.currentlyLiveIn);
                return (
                  <div 
                    key={item.member.id}
                    className="bg-white rounded-2xl border-2 border-stone-300 shadow-sm overflow-hidden flex flex-col h-full"
                  >
                    {/* Box Header: Son Name at top */}
                    <div className="bg-[#1A3636] text-white p-3 text-center border-b-2 border-amber-400">
                      <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                        {idx === 0 ? '১ম ছেলে (বড় ছেলে)' : idx === 1 ? '২য় ছেলে (মেজো ছেলে)' : idx === 2 ? '৩য় ছেলে (সেজো ছেলে)' : '৪র্থ ছেলে (ছোট ছেলে)'}
                      </span>
                      <h3 className="font-serif font-bold text-base text-amber-100 leading-snug mt-0.5">
                        {item.member.name}
                      </h3>
                      {item.member.currentlyLiveIn && item.member.currentlyLiveIn !== 'Bangladesh' && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/70 text-emerald-300 px-2 py-0.5 rounded-full mt-1 border border-emerald-400/30">
                          <span>{sonCountry.flag}</span> <span>{sonCountry.name}</span>
                        </span>
                      )}
                    </div>

                    {/* Box Content: Wife, Children, Grandchildren in exact serial */}
                    <div className="p-3.5 space-y-3 text-xs text-stone-800 bg-[#FCFBF9] flex-1">
                      {/* Spouse */}
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
                        <span className="text-[10px] font-bold text-amber-800 uppercase block">স্ত্রী (Spouse):</span>
                        <div className="font-bold text-stone-900 text-xs">
                          {item.spouse ? item.spouse.name : 'যোগ করা হয়নি'}
                        </div>
                        {item.spouse?.currentlyLiveIn && item.spouse?.currentlyLiveIn !== 'Bangladesh' && (
                          <span className="text-[10px] text-emerald-800 font-medium">
                            {getCountryDisplay(item.spouse.currentlyLiveIn).flag} {getCountryDisplay(item.spouse.currentlyLiveIn).name}
                          </span>
                        )}
                      </div>

                      {/* Children & their descendants */}
                      <div>
                        <div className="text-[10px] font-bold text-[#1A3636] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>সন্তান ও বংশধর:</span>
                          <span className="font-mono text-stone-500 font-normal">({item.children.length} জন)</span>
                        </div>

                        {item.children.length === 0 ? (
                          <p className="text-[11px] text-stone-400 italic">কোনো সন্তানের তথ্য নেই</p>
                        ) : (
                          <div className="space-y-2">
                            {item.children.map((c, cIdx) => {
                              const childCountry = getCountryDisplay(c.member.currentlyLiveIn);
                              return (
                                <div key={c.member.id} className="p-2 bg-white rounded-xl border border-stone-200 shadow-2xs">
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="font-bold text-stone-900 text-xs">
                                      {cIdx + 1}. {c.member.name}
                                    </div>
                                    <span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-medium shrink-0">
                                      {c.member.role || 'সন্তান'}
                                    </span>
                                  </div>

                                  {c.member.currentlyLiveIn && c.member.currentlyLiveIn !== 'Bangladesh' && (
                                    <div className="text-[9px] text-emerald-700 font-medium mt-0.5">
                                      {childCountry.flag} {childCountry.name}
                                    </div>
                                  )}

                                  {/* Child's spouse */}
                                  {c.spouse && (
                                    <div className="mt-1 pl-1.5 text-[10px] text-stone-600 border-l border-amber-300">
                                      স্ত্রী/স্বামী: <strong className="text-stone-800">{c.spouse.name}</strong>
                                    </div>
                                  )}

                                  {/* Grandchildren */}
                                  {c.children.length > 0 && (
                                    <div className="mt-1 pt-1 border-t border-stone-100 pl-1.5 space-y-0.5">
                                      <span className="text-[8px] text-stone-400 uppercase font-semibold">নাতি-নাতনি:</span>
                                      {c.children.map(gc => (
                                        <div key={gc.member.id} className="text-[9px] text-stone-700 pl-1 border-l border-emerald-400">
                                          • {gc.member.name}
                                          {gc.spouse && <span className="text-stone-500"> (স্ত্রী/স্বামী: {gc.spouse.name})</span>}
                                          {gc.children.length > 0 && (
                                            <div className="text-[8px] text-stone-500 pl-1.5">
                                              সন্তান: {gc.children.map(ggc => ggc.name).join(', ')}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Page 1 Footer */}
          <div className="mt-4 pt-3 border-t border-stone-200 text-center text-xs text-stone-500 flex justify-between items-center">
            <span>পারিবারিক ওয়েবসাইট ও সংরক্ষণাগার (Family Room Archive)</span>
            <span className="font-serif text-[#1A3636] font-bold">ঐক্য, সম্প্রীতি ও চিরন্তন ভালোবাসা</span>
            <span className="font-bold text-stone-700">পৃষ্ঠা ১ এর ২</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PAGE 2: 5 DAUGHTERS & SODOSSO BINNAS (২য় পৃষ্ঠা: ৫ জন মেয়ে ও সদস্য বিন্যাস) */}
        {/* ========================================================================= */}
        <div 
          ref={page2Ref}
          style={{
            width: '1500px',
            backgroundColor: '#FAF9F6',
            color: '#1c1917',
          }}
          className="p-8 rounded-2xl border border-stone-300 font-sans flex flex-col justify-between"
        >
          {/* Document Header - Page 2 */}
          <div className="text-center pb-4 mb-5 border-b-2 border-[#1A3636]">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#1A3636]/10 text-[#1A3636] font-bold text-xs mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>পারিবারিক ঐতিহ্য ও বংশপরম্পরা</span>
            </div>
            <h1 className="text-3xl font-serif font-extrabold text-[#1A3636] tracking-wide mb-1">
              হাজী মোঃ সামছুজ্জোহা ও কুতুরের নেসা পরিবার
            </h1>
            <p className="text-sm text-stone-600 font-medium">
              কন্যা সন্তান ও তাদের পরিবার এবং সদস্য বিন্যাস পরিসংখ্যান • ২য় পৃষ্ঠা
            </p>
          </div>

          {/* 1. 5 Boxes for 5 Daughters */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 pb-1.5 border-b-2 border-rose-400/40">
              <h2 className="text-xl font-serif font-bold text-[#1A3636] flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                <span>২য় সারি: ৫ জন মেয়ে ও তাদের পরিবার</span>
              </h2>
              <span className="text-xs font-bold text-rose-800 bg-rose-100 px-3 py-1 rounded-full">
                মোট ৫টি পরিবার
              </span>
            </div>

            <div className="grid grid-cols-5 gap-3.5 items-start">
              {daughterLineages.map((item, idx) => {
                const daughterCountry = getCountryDisplay(item.member.currentlyLiveIn);
                return (
                  <div 
                    key={item.member.id}
                    className="bg-white rounded-2xl border-2 border-stone-300 shadow-sm overflow-hidden flex flex-col h-full"
                  >
                    {/* Box Header: Daughter Name at top */}
                    <div className="bg-[#244242] text-white p-2.5 text-center border-b-2 border-rose-300">
                      <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider block">
                        {idx === 0 ? '১ম মেয়ে (বড় মেয়ে)' : idx === 1 ? '২য় মেয়ে (মেজো মেয়ে)' : idx === 2 ? '৩য় মেয়ে (সেজো মেয়ে)' : idx === 3 ? '৪র্থ মেয়ে' : '৫ম মেয়ে (ছোট মেয়ে)'}
                      </span>
                      <h3 className="font-serif font-bold text-sm sm:text-base text-white leading-snug mt-0.5">
                        {item.member.name}
                      </h3>
                      {item.member.currentlyLiveIn && item.member.currentlyLiveIn !== 'Bangladesh' && (
                        <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-950/70 text-emerald-300 px-1.5 py-0.2 rounded-full mt-1 border border-emerald-400/30">
                          <span>{daughterCountry.flag}</span> <span>{daughterCountry.name}</span>
                        </span>
                      )}
                    </div>

                    {/* Box Content: Husband, Children, Grandchildren */}
                    <div className="p-3 space-y-2.5 text-xs text-stone-800 bg-[#FCFBF9] flex-1">
                      {/* Spouse */}
                      <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-200">
                        <span className="text-[9px] font-bold text-rose-800 uppercase block">স্বামী (Husband):</span>
                        <div className="font-bold text-stone-900 text-xs">
                          {item.spouse ? item.spouse.name : 'যোগ করা হয়নি'}
                        </div>
                        {item.spouse?.currentlyLiveIn && item.spouse?.currentlyLiveIn !== 'Bangladesh' && (
                          <span className="text-[9px] text-emerald-800 font-medium">
                            {getCountryDisplay(item.spouse.currentlyLiveIn).flag} {getCountryDisplay(item.spouse.currentlyLiveIn).name}
                          </span>
                        )}
                      </div>

                      {/* Children */}
                      <div>
                        <div className="text-[10px] font-bold text-[#1A3636] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>সন্তান ও বংশধর:</span>
                          <span className="font-mono text-stone-500 font-normal">({item.children.length} জন)</span>
                        </div>

                        {item.children.length === 0 ? (
                          <p className="text-[11px] text-stone-400 italic">কোনো সন্তানের তথ্য নেই</p>
                        ) : (
                          <div className="space-y-1.5">
                            {item.children.map((c, cIdx) => {
                              const childCountry = getCountryDisplay(c.member.currentlyLiveIn);
                              return (
                                <div key={c.member.id} className="p-1.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="font-bold text-stone-900 text-xs leading-tight">
                                      {cIdx + 1}. {c.member.name}
                                    </div>
                                    <span className="text-[8px] bg-stone-100 text-stone-600 px-1 py-0.2 rounded font-medium shrink-0">
                                      {c.member.role || 'সন্তান'}
                                    </span>
                                  </div>

                                  {c.member.currentlyLiveIn && c.member.currentlyLiveIn !== 'Bangladesh' && (
                                    <div className="text-[8px] text-emerald-700 font-medium mt-0.5">
                                      {childCountry.flag} {childCountry.name}
                                    </div>
                                  )}

                                  {/* Child's spouse */}
                                  {c.spouse && (
                                    <div className="mt-1 pl-1 text-[9px] text-stone-600 border-l border-rose-300">
                                      স্ত্রী/স্বামী: <strong className="text-stone-800">{c.spouse.name}</strong>
                                    </div>
                                  )}

                                  {/* Grandchildren */}
                                  {c.children.length > 0 && (
                                    <div className="mt-1 pt-1 border-t border-stone-100 pl-1 space-y-0.5">
                                      <span className="text-[8px] text-stone-400 uppercase font-semibold">নাতি-নাতনি:</span>
                                      {c.children.map(gc => (
                                        <div key={gc.member.id} className="text-[9px] text-stone-700 pl-1 border-l border-emerald-400">
                                          • {gc.member.name}
                                          {gc.spouse && <span className="text-stone-500"> ({gc.spouse.name})</span>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. সদস্য বিন্যাস (Membership Distribution Section in empty space below) */}
          <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-[#1A3636] via-[#244c4c] to-[#1A3636] text-white border-2 border-amber-400/50 shadow-md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/15">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-300" />
                <h3 className="text-base font-serif font-bold text-amber-200">
                  পারিবারিক সদস্য বিন্যাস ও পরিসংখ্যান (Membership Distribution)
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  সর্বমোট সদস্য: {members.length} জন
                </span>
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                  প্রবাসী: {probashiMembers.length} জন
                </span>
              </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-6 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
                <span className="text-[10px] text-amber-200 font-bold uppercase block">মোট সদস্য</span>
                <span className="text-xl font-bold font-mono text-white mt-0.5 block">{members.length}</span>
                <span className="text-[9px] text-stone-300 block">১০০% পরিবার</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
                <span className="text-[10px] text-sky-300 font-bold uppercase block">পুরুষ সদস্য</span>
                <span className="text-xl font-bold font-mono text-sky-200 mt-0.5 block">{maleMembers.length}</span>
                <span className="text-[9px] text-sky-300/80 block">
                  {members.length > 0 ? Math.round((maleMembers.length / members.length) * 100) : 0}%
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
                <span className="text-[10px] text-rose-300 font-bold uppercase block">নারী সদস্য</span>
                <span className="text-xl font-bold font-mono text-rose-200 mt-0.5 block">{femaleMembers.length}</span>
                <span className="text-[9px] text-rose-300/80 block">
                  {members.length > 0 ? Math.round((femaleMembers.length / members.length) * 100) : 0}%
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
                <span className="text-[10px] text-amber-300 font-bold uppercase block">ছেলে ও মেয়ে</span>
                <span className="text-xl font-bold font-mono text-amber-100 mt-0.5 block">{sons.length + daughters.length}</span>
                <span className="text-[9px] text-amber-200/80 block">ছেলে {sons.length} • মেয়ে {daughters.length}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
                <span className="text-[10px] text-teal-300 font-bold uppercase block">দেশে অবস্থানরত</span>
                <span className="text-xl font-bold font-mono text-teal-200 mt-0.5 block">{deshiMembers.length}</span>
                <span className="text-[9px] text-teal-300/80 block">বাংলাদেশে</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
                <span className="text-[10px] text-emerald-300 font-bold uppercase block flex items-center justify-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  <span>প্রবাসী</span>
                </span>
                <span className="text-xl font-bold font-mono text-emerald-200 mt-0.5 block">{probashiMembers.length}</span>
                <span className="text-[9px] text-emerald-300/80 block">বিদেশে অবস্থানরত</span>
              </div>
            </div>

            {/* Sub-distribution row */}
            <div className="grid grid-cols-4 gap-2.5 mt-3 text-center text-[11px] text-stone-200 border-t border-white/10 pt-2.5">
              <div className="p-1.5 rounded-lg bg-black/20">
                দাদা-দাদি: <strong className="text-amber-200">{grandpas.length + grandmas.length} জন</strong>
              </div>
              <div className="p-1.5 rounded-lg bg-black/20">
                স্ত্রী ও স্বামী: <strong className="text-amber-200">{spouses.length} জন</strong>
              </div>
              <div className="p-1.5 rounded-lg bg-black/20">
                নাতি-নাতনি: <strong className="text-amber-200">{grandchildren.length} জন</strong>
              </div>
              <div className="p-1.5 rounded-lg bg-black/20">
                প্র-পৌত্র ও অন্যান্য: <strong className="text-amber-200">{greatGrandchildren.length} জন</strong>
              </div>
            </div>
          </div>

          {/* Page 2 Footer */}
          <div className="mt-4 pt-3 border-t border-stone-200 text-center text-xs text-stone-500 flex justify-between items-center">
            <span>পারিবারিক ওয়েবসাইট ও সংরক্ষণাগার (Family Room Archive)</span>
            <span className="font-serif text-[#1A3636] font-bold">ঐক্য, সম্প্রীতি ও চিরন্তন ভালোবাসা</span>
            <span className="font-bold text-stone-700">পৃষ্ঠা ২ এর ২</span>
          </div>
        </div>
      </div>
    );
  }
);

FamilyTreePdfDownloader.displayName = 'FamilyTreePdfDownloader';
