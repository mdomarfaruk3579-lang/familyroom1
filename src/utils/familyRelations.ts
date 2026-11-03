import { Member } from '../types';

export interface RelationQuestion {
  targetMember: Member;
  correctRelation: string;
  explanation: string;
  options: string[];
}

/**
 * Determine the relationship of targetMember relative to me (userMember).
 * "targetMember আপনার কী হন?"
 */
export function determineRelation(
  me: Member,
  target: Member,
  members: Member[]
): { relation: string; explanation: string } {
  if (me.id === target.id) {
    return { relation: 'আপনি নিজে', explanation: 'এটি আপনার নিজের প্রোফাইল।' };
  }

  // Helper map
  const memberMap = new Map<string, Member>();
  members.forEach(m => memberMap.set(m.id, m));

  const myFather = members.find(m => 
    (me.fatherId && m.id === me.fatherId) ||
    (me.parentId && m.id === me.parentId && (m.gender === 'male' || m.type === 'son' || m.type === 'grandpa'))
  );

  const myMother = members.find(m => 
    (me.motherId && m.id === me.motherId) ||
    (myFather && (m.spouseId === myFather.id || myFather.spouseId === m.id))
  );

  const targetFather = members.find(m => 
    (target.fatherId && m.id === target.fatherId) ||
    (target.parentId && m.id === target.parentId && (m.gender === 'male' || m.type === 'son' || m.type === 'grandpa'))
  );

  // 1. Spouse
  if (me.spouseId === target.id || target.spouseId === me.id) {
    if (target.gender === 'female') {
      return { relation: 'স্ত্রী', explanation: 'উনি আপনার বিবাহিত স্ত্রী।' };
    }
    return { relation: 'স্বামী', explanation: 'উনি আপনার স্বামী।' };
  }

  // 2. Parents
  if (myFather?.id === target.id) {
    return { relation: 'বাবা (পিতা)', explanation: 'উনি আপনার শ্রদ্ধেয় পিতা।' };
  }
  if (myMother?.id === target.id) {
    return { relation: 'মা (মাতা)', explanation: 'উনি আপনার মমতাময়ী মাতা।' };
  }

  // 3. Children
  if (target.parentId === me.id || (me.spouseId && target.parentId === me.spouseId)) {
    if (target.gender === 'female' || target.type === 'daughter') {
      return { relation: 'মেয়ে (কন্যা)', explanation: 'উনি আপনার আদরের কন্যা।' };
    }
    return { relation: 'ছেলে (পুত্র)', explanation: 'উনি আপনার সুসন্তান।' };
  }

  // 4. Grandparents
  if (target.type === 'grandpa' || target.role.includes('দাদা') || target.role.includes('নানা')) {
    // If my father's father: দাদা
    if (myFather && (myFather.parentId === target.id || target.type === 'grandpa')) {
      return { relation: 'দাদা', explanation: 'উনি আপনার বাবার পিতা, অর্থাৎ আপনার দাদা।' };
    }
    if (myMother && (myMother.parentId === target.id)) {
      return { relation: 'নানা', explanation: 'উনি আপনার মায়ের পিতা, অর্থাৎ আপনার নানা।' };
    }
    return { relation: 'দাদা/নানা', explanation: 'উনি পরিবারের পরম শ্রদ্ধেয় আদি পুরুষ।' };
  }

  if (target.type === 'grandma' || target.role.includes('দাদি') || target.role.includes('নানি')) {
    if (myFather && (myFather.parentId === target.spouseId || target.type === 'grandma')) {
      return { relation: 'দাদি', explanation: 'উনি আপনার বাবার মাতা, অর্থাৎ আপনার দাদি।' };
    }
    return { relation: 'দাদি/নানি', explanation: 'উনি পরিবারের পরম মমতাময়ী মাতৃকুল অভিভাবক।' };
  }

  // 5. Grandchildren
  if (me.type === 'grandpa' || me.type === 'grandma') {
    if (target.gender === 'female') {
      return { relation: 'নাতনি', explanation: 'উনি আপনার পুত্র বা কন্যার মেয়ে, তাই আপনার নাতনি।' };
    }
    return { relation: 'নাতি', explanation: 'উনি আপনার পুত্র বা কন্যার ছেলে, তাই আপনার নাতি।' };
  }

  // 6. Siblings (Both share same father or mother or parentId)
  const isSibling = (myFather && targetFather && myFather.id === targetFather.id) ||
                    (me.parentId && target.parentId && me.parentId === target.parentId && me.parentId !== 'grandpa-1');

  if (isSibling) {
    const meOrder = me.order || 0;
    const targetOrder = target.order || 0;
    if (target.gender === 'female') {
      if (targetOrder < meOrder) {
        return { relation: 'বড় বোন (আপা)', explanation: 'উনি আপনার বড় বোন।' };
      }
      return { relation: 'ছোট বোন', explanation: 'উনি আপনার ছোট বোন।' };
    } else {
      if (targetOrder < meOrder) {
        return { relation: 'বড় ভাই', explanation: 'উনি আপনার বড় ভাই।' };
      }
      return { relation: 'ছোট ভাই', explanation: 'উনি আপনার ছোট ভাই।' };
    }
  }

  // 7. Uncles / Aunts (Paternal: Father's brothers and sisters)
  if (myFather && (myFather.parentId === 'grandpa-1' || myFather.type === 'son')) {
    // Target is another son of grandpa
    if (target.type === 'son' && target.id !== myFather.id) {
      const fOrder = myFather.order || 0;
      const tOrder = target.order || 0;
      if (tOrder < fOrder) {
        return { relation: 'বড় চাচা / জেঠা', explanation: `উনি আপনার বাবা (${myFather.name})-এর বড় ভাই, তাই আপনার বড় চাচা।` };
      }
      return { relation: 'চাচা', explanation: `উনি আপনার বাবা (${myFather.name})-এর ভাই, তাই আপনার চাচা।` };
    }

    // Target is a daughter of grandpa (Aunt / ফুফু)
    if (target.type === 'daughter') {
      return { relation: 'ফুফু', explanation: `উনি আপনার বাবা (${myFather.name})-এর বোন, তাই আপনার ফুফু।` };
    }

    // Target is husband of a daughter of grandpa (ফুফা)
    const isAuntHusband = members.some(d => d.type === 'daughter' && (d.spouseId === target.id || target.spouseId === d.id));
    if (isAuntHusband) {
      return { relation: 'ফুফা', explanation: 'উনি আপনার ফুফুর স্বামী, তাই আপনার ফুফা।' };
    }

    // Target is wife of an uncle (চাচী)
    const isUncleWife = members.some(s => s.type === 'son' && s.id !== myFather?.id && (s.spouseId === target.id || target.spouseId === s.id));
    if (isUncleWife) {
      return { relation: 'চাচী', explanation: 'উনি আপনার চাচার সহধর্মিণী, তাই আপনার চাচী।' };
    }
  }

  // 8. If I am a son/daughter: Target is a sibling's child (ভাতিজা / ভাতিজি / ভাগ্নে / ভাগ্নি)
  if (me.type === 'son' || me.type === 'daughter') {
    if (target.parentId && target.parentId !== 'grandpa-1') {
      const targetParent = memberMap.get(target.parentId);
      if (targetParent && targetParent.id !== me.id) {
        if (targetParent.type === 'son') {
          if (target.gender === 'female') {
            return { relation: 'ভাতিজি', explanation: `উনি আপনার ভাইয়ের (${targetParent.name}) মেয়ে, তাই আপনার ভাতিজি।` };
          }
          return { relation: 'ভাতিজা', explanation: `উনি আপনার ভাইয়ের (${targetParent.name}) ছেলে, তাই আপনার ভাতিজা।` };
        } else if (targetParent.type === 'daughter') {
          if (target.gender === 'female') {
            return { relation: 'ভাগ্নি', explanation: `উনি আপনার বোনের (${targetParent.name}) মেয়ে, তাই আপনার ভাগ্নি।` };
          }
          return { relation: 'ভাগ্নে', explanation: `উনি আপনার বোনের (${targetParent.name}) ছেলে, তাই আপনার ভাগ্নে।` };
        }
      }
    }
  }

  // 9. Cousins (If both are grandchildren)
  if (me.type === 'grandchild' && target.type === 'grandchild') {
    if (targetFather && myFather && targetFather.id !== myFather.id) {
      if (target.gender === 'female') {
        return { relation: 'চাচাতো বোন', explanation: `উনি আপনার চাচার সন্তান, তাই আপনার চাচাতো বোন।` };
      }
      return { relation: 'চাচাতো ভাই', explanation: `উনি আপনার চাচার সন্তান, তাই আপনার চাচাতো ভাই।` };
    }
    const targetParent = target.parentId ? memberMap.get(target.parentId) : null;
    if (targetParent?.type === 'daughter') {
      if (target.gender === 'female') {
        return { relation: 'ফুফাতো বোন', explanation: `উনি আপনার ফুফুর মেয়ে, তাই আপনার ফুফাতো বোন।` };
      }
      return { relation: 'ফুফাতো ভাই', explanation: `উনি আপনার ফুফুর ছেলে, তাই আপনার ফুফাতো ভাই।` };
    }
  }

  // 10. General in-laws (ভাবী, দুলাভাই, পুত্রবধূ)
  if (target.role.includes('পুত্রবধূ')) {
    if (me.type === 'grandpa' || me.type === 'grandma') {
      return { relation: 'পুত্রবধূ', explanation: 'উনি আপনার ছেলের স্ত্রী, তাই আপনার পুত্রবধূ।' };
    }
    return { relation: 'ভাবী / চাচী', explanation: 'উনি পরিবারের সম্মানিত গৃহবধূ।' };
  }

  if (target.role.includes('জামাই')) {
    if (me.type === 'grandpa' || me.type === 'grandma') {
      return { relation: 'মেয়ের জামাই', explanation: 'উনি আপনার কন্যার স্বামী, তাই আপনার জামাই।' };
    }
    return { relation: 'ভগ্নিপতি / দুলাভাই / ফুফা', explanation: 'উনি পরিবারের সম্মানিত জামাই।' };
  }

  // Fallback by role or gender
  if (target.gender === 'male') {
    return { relation: 'পারিবারিক অভিভাবক', explanation: `উনি আপনার পরিবারের সদস্য (${target.role || 'শ্রদ্ধেয় ব্যক্তি'})।` };
  }
  return { relation: 'পারিবারিক সদস্য', explanation: `উনি আপনার পরিবারের সদস্য (${target.role || 'স্নেহভাজন'})।` };
}

/**
 * Distractor pools for multiple choice options
 */
const MALE_OPTIONS_POOL = [
  'চাচা', 'বড় চাচা / জেঠা', 'মামা', 'ফুফা', 'খালু', 'দাদা', 'নানা', 
  'বড় ভাই', 'ছোট ভাই', 'চাচাতো ভাই', 'ফুফাতো ভাই', 'মামাতো ভাই', 'ভাতিজা', 'ভাগ্নে', 'ছেলে (পুত্র)'
];

const FEMALE_OPTIONS_POOL = [
  'ফুফু', 'খালা', 'চাচী', 'মামানি', 'দাদি', 'নানি', 
  'বড় বোন (আপা)', 'ছোট বোন', 'চাচাতো বোন', 'ফুফাতো বোন', 'মামাতো বোন', 'ভাতিজি', 'ভাগ্নি', 'মেয়ে (কন্যা)', 'ভাবী'
];

/**
 * Generate 10 smart questions for Me
 */
export function generateQuizQuestions(
  me: Member,
  members: Member[]
): RelationQuestion[] {
  // Candidate targets (all members except me)
  const candidatePool = members.filter(m => m.id !== me.id);
  // Shuffle
  const shuffled = [...candidatePool].sort(() => 0.5 - Math.random());
  const selectedTargets = shuffled.slice(0, 10);

  return selectedTargets.map(target => {
    const { relation, explanation } = determineRelation(me, target, members);

    // Pick 3 distractors from appropriate gender pool
    const pool = target.gender === 'female' ? FEMALE_OPTIONS_POOL : MALE_OPTIONS_POOL;
    const wrongOptions = pool
      .filter(opt => opt !== relation && !relation.includes(opt))
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // If needed, fill with fallback
    while (wrongOptions.length < 3) {
      const extra = pool[Math.floor(Math.random() * pool.length)];
      if (!wrongOptions.includes(extra) && extra !== relation) {
        wrongOptions.push(extra);
      }
    }

    const options = [relation, ...wrongOptions].sort(() => 0.5 - Math.random());

    return {
      targetMember: target,
      correctRelation: relation,
      explanation,
      options
    };
  });
}
