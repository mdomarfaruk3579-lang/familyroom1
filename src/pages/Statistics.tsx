import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Member } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User, Baby, Heart, Activity, ArrowLeft, ChevronDown, ChevronUp, X, Calculator } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

export default function Statistics() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null);
  const [selectedStatCategory, setSelectedStatCategory] = useState<{ title: string, members: Member[] } | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'members'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      setMembers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const grandpas = useMemo(() => members.filter(m => m.type === 'head' || m.type === 'grandpa'), [members]);
  const grandmas = useMemo(() => members.filter(m => m.type === 'head' || m.type === 'grandma'), [members]);
  const sons = useMemo(() => members.filter(m => m.type === 'son'), [members]);
  const daughters = useMemo(() => members.filter(m => m.type === 'daughter'), [members]);

  const stats = useMemo(() => [
    { title: lang === 'bn' ? 'মোট সদস্য' : 'Total Members', count: members.length, icon: Users, color: 'text-blue-600', members: members },
    { title: lang === 'bn' ? 'দাদা-দাদি' : 'Grandparents', count: grandpas.length + grandmas.length, icon: User, color: 'text-indigo-600', members: [...grandpas, ...grandmas] },
    { title: lang === 'bn' ? 'ছেলে' : 'Sons', count: sons.length, icon: User, color: 'text-blue-500', members: sons },
    { title: lang === 'bn' ? 'মেয়ে' : 'Daughters', count: daughters.length, icon: User, color: 'text-pink-500', members: daughters },
    { title: lang === 'bn' ? 'স্ত্রী/স্বামী' : 'Spouses', count: members.filter(m => m.type === 'spouse').length, icon: Heart, color: 'text-red-500', members: members.filter(m => m.type === 'spouse') },
    { title: lang === 'bn' ? 'নাতি-নাতনি' : 'Grandchildren', count: members.filter(m => m.type === 'grandchild').length, icon: Baby, color: 'text-green-500', members: members.filter(m => m.type === 'grandchild') },
    { title: lang === 'bn' ? 'নাতি-নাতনির সন্তান' : 'Great-Grandchildren', count: members.filter(m => m.type === 'great-grandchild' || m.type === 'great-great-grandchild').length, icon: Baby, color: 'text-teal-500', members: members.filter(m => m.type === 'great-grandchild' || m.type === 'great-great-grandchild') },
    { title: lang === 'bn' ? 'পুরুষ' : 'Male', count: members.filter(m => m.gender === 'male').length, icon: User, color: 'text-sky-600', members: members.filter(m => m.gender === 'male') },
    { title: lang === 'bn' ? 'মহিলা' : 'Female', count: members.filter(m => m.gender === 'female').length, icon: User, color: 'text-rose-500', members: members.filter(m => m.gender === 'female') }
  ], [members, grandpas, grandmas, sons, daughters, lang]);

  const getFamilyMembers = useMemo(() => (rootId: string) => {
    const familyIds = new Set<string>();
    const queue = [rootId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (familyIds.has(currentId)) continue;
      
      familyIds.add(currentId);
      const currentMember = members.find(m => m.id === currentId);
      
      const spouses = members.filter(m => m.spouseId === currentId || (currentMember?.spouseId && m.id === currentMember.spouseId));
      spouses.forEach(s => {
        if (!familyIds.has(s.id)) queue.push(s.id);
      });
      
      const children = members.filter(m => m.parentId === currentId || spouses.some(s => m.parentId === s.id));
      children.forEach(c => {
        if (!familyIds.has(c.id)) queue.push(c.id);
      });
    }
    
    return Array.from(familyIds)
      .map(id => members.find(m => m.id === id)!)
      .filter(Boolean)
      .sort((a, b) => {
        const typeOrder = { 'son': 1, 'daughter': 1, 'spouse': 2, 'grandchild': 3, 'great-grandchild': 4, 'great-great-grandchild': 5 };
        const orderA = typeOrder[a.type as keyof typeof typeOrder] || 99;
        const orderB = typeOrder[b.type as keyof typeof typeOrder] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return (a.order || 0) - (b.order || 0);
      });
  }, [members]);

  const rootFamilies = useMemo(() => {
    return members
      .filter(m => m.type === 'son' || m.type === 'daughter')
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [members]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#EAE6DF] border-t-[#1A3636]"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto py-8 px-4"
    >
      <Link to="/" className="inline-flex items-center gap-2 text-[#1A3636] hover:text-[#C19A6B] mb-6 font-medium transition-colors">
        <ArrowLeft className="w-5 h-5" /> ফ্যামিলি ট্রিতে ফিরে যান
      </Link>

      <div className="text-center mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-serif font-bold text-[#1A3636] mb-4"
        >
          পরিবারের পরিসংখ্যান
        </motion.h1>
        <div className="w-24 h-1 bg-[#C19A6B] mx-auto rounded-full"></div>
        <p className="mt-6 text-[#736B65] max-w-2xl mx-auto text-lg">
          আমাদের ক্রমবর্ধমান পরিবারের একটি বিস্তারিত পরিসংখ্যান। দেখুন কীভাবে আমাদের পরিবার প্রজন্মের পর প্রজন্ম ধরে বিস্তৃত হয়েছে।
        </p>
      </div>

      {/* TOP SECTION: Family Accordions and Calculator */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-[#1A3636] mb-3">পরিবার ভিত্তিক পরিসংখ্যান</h2>
          <div className="w-16 h-1 bg-[#C19A6B] mx-auto rounded-full mb-8"></div>
          
          <Link 
            to="/calculator"
            className="inline-flex items-center gap-2 bg-[#1A3636] hover:bg-[#2E7D61] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-1"
          >
            <Calculator className="w-5 h-5" /> ফ্যামিলি ক্যালকুলেটর (সম্পত্তি বণ্টন)
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rootFamilies.map((root, index) => {
            const familyMembers = getFamilyMembers(root.id);
            const isExpanded = expandedFamilyId === root.id;

            return (
              <motion.div 
                key={root.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-sm border border-[#EAE6DF] overflow-hidden"
              >
                <button 
                  onClick={() => setExpandedFamilyId(isExpanded ? null : root.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-[#F9F8F6] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#C19A6B] shrink-0">
                      {root.photoUrl ? (
                        <img src={root.photoUrl} alt={root.name} className="w-full h-full object-cover" />
                      ) : (
                        <img src={`https://api.dicebear.com/9.x/${root.gender === 'female' ? 'lorelei' : 'micah'}/svg?seed=${encodeURIComponent(root.name || 'family')}&backgroundColor=EAE6DF`} alt="Avatar" className="w-full h-full object-cover p-1" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg text-[#1A3636]">{root.name} এর পরিবার</h3>
                      <p className="text-sm text-[#C19A6B] font-medium">{familyMembers.length} জন সদস্য (তিনি সহ)</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-[#736B65]" /> : <ChevronDown className="w-5 h-5 text-[#736B65]" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-[#EAE6DF]"
                    >
                      <div className="p-4 bg-[#F9F8F6]">
                        <ul className="space-y-2">
                          {familyMembers.map((member) => (
                            <li key={member.id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-[#EAE6DF]/50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#EAE6DF] shrink-0">
                                  {member.photoUrl ? (
                                    <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <img src={`https://api.dicebear.com/9.x/${member.gender === 'female' ? 'lorelei' : 'micah'}/svg?seed=${encodeURIComponent(member.name || 'family')}&backgroundColor=EAE6DF`} alt="Avatar" className="w-full h-full object-cover p-0.5" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-[#1A3636] font-bold text-sm leading-tight">{member.name}</p>
                                </div>
                              </div>
                              <span className="text-xs bg-[#EAE6DF] text-[#1A3636] px-2 py-1 rounded-md font-medium whitespace-nowrap">
                                {member.role}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM SECTION: The 9 Stat Boxes Grid */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-[#1A3636] mb-3">সদস্য বিন্যাস</h2>
          <div className="w-16 h-1 bg-[#C19A6B] mx-auto rounded-full mb-8"></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedStatCategory(stat)}
                className="bg-white p-6 rounded-3xl shadow-sm border border-[#EAE6DF] flex flex-col items-center justify-center cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all hover:border-[#C19A6B]"
              >
                <div className={`p-3 rounded-2xl bg-gray-50 mb-3 ${stat.color}`}>
                  <Icon className="w-8 h-8" />
                </div>
                <span className="text-3xl sm:text-4xl font-bold text-[#1A3636] mb-1 font-serif">{stat.count}</span>
                <span className="text-xs sm:text-sm text-[#736B65] font-medium text-center">{stat.title}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Stats Modal */}
      <AnimatePresence>
        {selectedStatCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedStatCategory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#FAF9F6] rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl border border-[#EAE6DF] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-[#1A3636] p-6 text-white flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Users className="w-6 h-6 text-[#C19A6B]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold">{selectedStatCategory.title}</h2>
                    <p className="text-[#EAE6DF] text-sm opacity-80">মোট সদস্য: {selectedStatCategory.count} জন</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStatCategory(null)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {selectedStatCategory.members.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {selectedStatCategory.members.map(m => (
                      <div 
                        key={m.id} 
                        onClick={() => navigate(`/member/${m.id}`)}
                        className="bg-white p-4 rounded-2xl border border-[#EAE6DF] flex flex-col items-center text-center cursor-pointer hover:border-[#C19A6B] hover:shadow-md transition-all group"
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#EAE6DF] group-hover:border-[#C19A6B] transition-colors mb-3">
                          <img 
                            src={m.photoUrl || (m.gender === 'female' ? "https://api.dicebear.com/7.x/notionists/svg?seed=female&backgroundColor=f0e6d2" : "https://api.dicebear.com/7.x/notionists/svg?seed=male&backgroundColor=f0e6d2")} 
                            alt={m.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <h3 className="font-bold text-[#1A3636] text-sm mb-1">{m.name}</h3>
                        <span className="text-[10px] bg-[#EAE6DF] text-[#736B65] px-2 py-0.5 rounded-full">
                          {m.type === 'head' || m.type === 'grandpa' || m.type === 'grandma' ? 'দাদা-দাদি' : 
                           m.type === 'son' ? 'ছেলে' : 
                           m.type === 'daughter' ? 'মেয়ে' : 
                           m.type === 'spouse' ? 'স্ত্রী/স্বামী' : 
                           m.type === 'grandchild' ? 'নাতি/নাতনি' : 'পরবর্তী প্রজন্ম'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-[#736B65]">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>এই ক্যাটাগরিতে কোনো সদস্য নেই।</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
