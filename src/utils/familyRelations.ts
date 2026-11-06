import { Member } from '../types';

export interface RelationQuestion {
  targetMember: Member;
  correctRelation: string;
  explanation: string;
  options: string[];
}

/**
 * Determine the exact relationship of targetMember relative to me (userMember).
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

  // Quick lookup map
  const memberMap = new Map<string, Member>();
  members.forEach(m => memberMap.set(m.id, m));

  // Helper to find spouse
  const getSpouse = (m: Member | null | undefined): Member | null => {
    if (!m) return null;
    if (m.spouseId && memberMap.has(m.spouseId)) return memberMap.get(m.spouseId)!;
    const found = members.find(other => other.spouseId === m.id);
    return found || null;
  };

  // Helper to find father
  const getFather = (m: Member | null | undefined): Member | null => {
    if (!m) return null;
    if (m.fatherId && memberMap.has(m.fatherId)) return memberMap.get(m.fatherId)!;
    if (m.fatherName) {
      const byName = members.find(x => x.name === m.fatherName);
      if (byName) return byName;
    }
    if (m.parentId && memberMap.has(m.parentId)) {
      const p = memberMap.get(m.parentId)!;
      if (p.gender === 'male' || p.type === 'son' || p.type === 'grandpa') return p;
      const pSpouse = getSpouse(p);
      if (pSpouse && (pSpouse.gender === 'male' || pSpouse.type === 'son' || pSpouse.type === 'grandpa')) return pSpouse;
    }
    return null;
  };

  // Helper to find mother
  const getMother = (m: Member | null | undefined): Member | null => {
    if (!m) return null;
    if (m.motherId && memberMap.has(m.motherId)) return memberMap.get(m.motherId)!;
    if (m.motherName) {
      const byName = members.find(x => x.name === m.motherName);
      if (byName) return byName;
    }
    const father = getFather(m);
    if (father) {
      const s = getSpouse(father);
      if (s) return s;
    }
    if (m.parentId && memberMap.has(m.parentId)) {
      const p = memberMap.get(m.parentId)!;
      if (p.gender === 'female' || p.type === 'daughter' || p.type === 'grandma') return p;
      const pSpouse = getSpouse(p);
      if (pSpouse && (pSpouse.gender === 'female' || pSpouse.type === 'daughter' || pSpouse.type === 'grandma')) return pSpouse;
    }
    return null;
  };

  // Helper to find the Generation-2 root branch (son or daughter of grandpa/grandma)
  const getGen2Branch = (m: Member | null | undefined): Member | null => {
    if (!m) return null;
    if (m.type === 'son' || m.type === 'daughter') return m;
    if (m.type === 'spouse') {
      const sp = getSpouse(m);
      if (sp && (sp.type === 'son' || sp.type === 'daughter')) return sp;
    }
    if (m.parentId && memberMap.has(m.parentId)) {
      const p = memberMap.get(m.parentId)!;
      if (p.type === 'son' || p.type === 'daughter') return p;
      if (p.type === 'grandchild') return getGen2Branch(p);
    }
    const f = getFather(m);
    if (f && (f.type === 'son' || f.type === 'daughter')) return f;
    const mo = getMother(m);
    if (mo && (mo.type === 'son' || mo.type === 'daughter')) return mo;
    return null;
  };

  const myFather = getFather(me);
  const myMother = getMother(me);
  const targetFather = getFather(target);
  const targetMother = getMother(target);
  const mySpouse = getSpouse(me);
  const targetSpouse = getSpouse(target);

  const myBranch = getGen2Branch(me);
  const targetBranch = getGen2Branch(target);

  // -------------------------------------------------------------
  // 1. Spouse
  // -------------------------------------------------------------
  if (mySpouse?.id === target.id || targetSpouse?.id === me.id) {
    if (target.gender === 'female' || target.type === 'spouse') {
      return { relation: 'স্ত্রী', explanation: 'উনি আপনার বিবাহিত সহধর্মিণী।' };
    }
    return { relation: 'স্বামী', explanation: 'উনি আপনার বিবাহিত স্বামী।' };
  }

  // -------------------------------------------------------------
  // 2. Direct Parents
  // -------------------------------------------------------------
  if (myFather?.id === target.id) {
    return { relation: 'বাবা (পিতা)', explanation: 'উনি আপনার শ্রদ্ধেয় পিতা।' };
  }
  if (myMother?.id === target.id) {
    return { relation: 'মা (মাতা)', explanation: 'উনি আপনার মমতাময়ী মাতা।' };
  }

  // -------------------------------------------------------------
  // 3. Direct Children
  // -------------------------------------------------------------
  const isDirectChild = (
    target.parentId === me.id ||
    (mySpouse && target.parentId === mySpouse.id) ||
    (targetFather && targetFather.id === me.id) ||
    (targetMother && targetMother.id === me.id)
  );
  if (isDirectChild) {
    if (target.gender === 'female' || target.type === 'daughter') {
      return { relation: 'মেয়ে (কন্যা)', explanation: 'উনি আপনার আদরের কন্যা।' };
    }
    return { relation: 'ছেলে (পুত্র)', explanation: 'উনি আপনার আদরের পুত্র।' };
  }

  // -------------------------------------------------------------
  // 4. Grandparents (দাদা, দাদি, নানা, নানি)
  // -------------------------------------------------------------
  if (target.type === 'grandpa') {
    if (myBranch?.type === 'daughter' || (myMother && myMother.parentId === 'grandpa-1')) {
      return { relation: 'নানা', explanation: 'উনি আপনার মায়ের পিতা, অর্থাৎ আপনার নানা।' };
    }
    return { relation: 'দাদা', explanation: 'উনি আপনার বাবার পিতা, অর্থাৎ আপনার দাদা।' };
  }
  if (target.type === 'grandma') {
    if (myBranch?.type === 'daughter' || (myMother && myMother.parentId === 'grandpa-1')) {
      return { relation: 'নানি', explanation: 'উনি আপনার মায়ের মাতা, অর্থাৎ আপনার নানি।' };
    }
    return { relation: 'দাদি', explanation: 'উনি আপনার বাবার মাতা, অর্থাৎ আপনার দাদি।' };
  }

  // -------------------------------------------------------------
  // 5. Grandchildren (for Grandpa / Grandma)
  // -------------------------------------------------------------
  if (me.type === 'grandpa' || me.type === 'grandma') {
    if (target.type === 'grandchild' || target.type === 'great-grandchild') {
      if (target.type === 'great-grandchild') {
        return target.gender === 'female'
          ? { relation: 'পুঁতি (প্রপৌত্রী)', explanation: 'উনি আপনার নাতি বা নাতনির কন্যা।' }
          : { relation: 'পুঁতি (প্রপৌত্র)', explanation: 'উনি আপনার নাতি বা নাতনির পুত্র।' };
      }
      return target.gender === 'female'
        ? { relation: 'নাতনি', explanation: 'উনি আপনার পুত্র বা কন্যার মেয়ে, তাই আপনার নাতনি।' }
        : { relation: 'নাতি', explanation: 'উনি আপনার পুত্র বা কন্যার ছেলে, তাই আপনার নাতি।' };
    }
  }

  // -------------------------------------------------------------
  // 6. Direct Siblings (আপন ভাই ও বোন)
  // -------------------------------------------------------------
  const isDirectSibling = (
    (myFather && targetFather && myFather.id === targetFather.id) ||
    (myMother && targetMother && myMother.id === targetMother.id) ||
    (myBranch && targetBranch && myBranch.id === targetBranch.id && (me.type === 'grandchild' && target.type === 'grandchild')) ||
    (me.type === 'son' && target.type === 'son' && me.parentId === target.parentId) ||
    (me.type === 'daughter' && target.type === 'daughter' && me.parentId === target.parentId) ||
    (me.type === 'son' && target.type === 'daughter' && me.parentId === target.parentId) ||
    (me.type === 'daughter' && target.type === 'son' && me.parentId === target.parentId)
  );

  if (isDirectSibling && me.id !== target.id) {
    const meOrder = me.order || 0;
    const targetOrder = target.order || 0;
    const isTargetOlder = targetOrder < meOrder || (target.birthYear && me.birthYear && target.birthYear < me.birthYear);

    if (target.gender === 'female') {
      return isTargetOlder
        ? { relation: 'বড় বোন (আপা)', explanation: 'উনি আপনার আপন বড় বোন।' }
        : { relation: 'ছোট বোন', explanation: 'উনি আপনার আপন ছোট বোন।' };
    } else {
      return isTargetOlder
        ? { relation: 'বড় ভাই', explanation: 'উনি আপনার আপন বড় ভাই।' }
        : { relation: 'ছোট ভাই', explanation: 'উনি আপনার আপন ছোট ভাই।' };
    }
  }

  // -------------------------------------------------------------
  // 7. Direct Sibling's Spouse (বড়/ছোট ভাইয়ের বউ = ভাবী; বোনের স্বামী = দুলাভাই)
  // -------------------------------------------------------------
  if (targetSpouse) {
    const isTargetSpouseMySibling = (
      (myFather && getFather(targetSpouse)?.id === myFather.id) ||
      (myMother && getMother(targetSpouse)?.id === myMother.id) ||
      (myBranch && getGen2Branch(targetSpouse)?.id === myBranch.id && me.type === 'grandchild') ||
      (me.parentId && targetSpouse.parentId && me.parentId === targetSpouse.parentId && me.parentId !== 'grandpa-1') ||
      (me.type === 'son' && (targetSpouse.type === 'son' || targetSpouse.type === 'daughter') && me.parentId === targetSpouse.parentId) ||
      (me.type === 'daughter' && (targetSpouse.type === 'son' || targetSpouse.type === 'daughter') && me.parentId === targetSpouse.parentId)
    );

    if (isTargetSpouseMySibling && targetSpouse.id !== me.id) {
      if (targetSpouse.gender === 'male') {
        return { relation: 'ভাবী', explanation: `উনি আপনার ভাই (${targetSpouse.name})-এর সহধর্মিণী, তাই আপনার ভাবী।` };
      } else {
        return { relation: 'দুলাভাই', explanation: `উনি আপনার বোন (${targetSpouse.name})-এর স্বামী, তাই আপনার দুলাভাই।` };
      }
    }
  }

  // -------------------------------------------------------------
  // 8. Nephew / Niece's Spouses (ভাগ্নে বউ, ভাতিজা বউ, ভাগ্নি জামাই, ভাতিজি জামাই)
  // Specific user request: "bagne er bou hobe ভাগ্নে বউ"
  // -------------------------------------------------------------
  if (targetSpouse && (me.type === 'son' || me.type === 'daughter')) {
    const spouseBranch = getGen2Branch(targetSpouse);
    if (spouseBranch && targetSpouse.type === 'grandchild') {
      if (spouseBranch.type === 'daughter') {
        // Sister's child (ভাগ্নে / ভাগ্নি)
        if (targetSpouse.gender === 'male') {
          // Husband is my sister's son (ভাগ্নে) -> Target is his wife -> ভাগ্নে বউ!
          return { relation: 'ভাগ্নে বউ', explanation: `উনি আপনার ভাগ্নে (${targetSpouse.name})-এর স্ত্রী, তাই আপনার ভাগ্নে বউ।` };
        } else {
          // Wife is my sister's daughter (ভাগ্নি) -> Target is her husband -> ভাগ্নি জামাই!
          return { relation: 'ভাগ্নি জামাই', explanation: `উনি আপনার ভাগ্নি (${targetSpouse.name})-এর স্বামী, তাই আপনার ভাগ্নি জামাই।` };
        }
      } else if (spouseBranch.type === 'son' && spouseBranch.id !== me.id) {
        // Brother's child (ভাতিজা / ভাতিজি)
        if (targetSpouse.gender === 'male') {
          return { relation: 'ভাতিজা বউ', explanation: `উনি আপনার ভাতিজা (${targetSpouse.name})-এর স্ত্রী, তাই আপনার ভাতিজা বউ।` };
        } else {
          return { relation: 'ভাতিজি জামাই', explanation: `উনি আপনার ভাতিজি (${targetSpouse.name})-এর স্বামী, তাই আপনার ভাতিজি জামাই।` };
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 9. Nephews & Nieces (ভাতিজা / ভাতিজি / ভাগ্নে / ভাগ্নি)
  // When 'me' is Generation 2 (son or daughter) and target is grandchild
  // -------------------------------------------------------------
  if ((me.type === 'son' || me.type === 'daughter') && target.type === 'grandchild') {
    if (targetBranch) {
      if (targetBranch.type === 'daughter') {
        // Sister's children = ভাগ্নে / ভাগ্নি
        return target.gender === 'female'
          ? { relation: 'ভাগ্নি', explanation: `উনি আপনার বোন (${targetBranch.name})-এর মেয়ে, তাই আপনার ভাগ্নি।` }
          : { relation: 'ভাগ্নে', explanation: `উনি আপনার বোন (${targetBranch.name})-এর ছেলে, তাই আপনার ভাগ্নে।` };
      } else if (targetBranch.type === 'son' && targetBranch.id !== me.id) {
        // Brother's children = ভাতিজা / ভাতিজি
        return target.gender === 'female'
          ? { relation: 'ভাতিজি', explanation: `উনি আপনার ভাই (${targetBranch.name})-এর মেয়ে, তাই আপনার ভাতিজি।` }
          : { relation: 'ভাতিজা', explanation: `উনি আপনার ভাই (${targetBranch.name})-এর ছেলে, তাই আপনার ভাতিজা।` };
      }
    }
  }

  // -------------------------------------------------------------
  // 10. Paternal Uncles & Aunts (বাবার ভাই ও বোন)
  // When 'me' is grandchild and target is son or daughter of grandpa
  // -------------------------------------------------------------
  if (myBranch && myBranch.type === 'son') {
    // Target is a brother of my father (জেঠা / চাচা)
    if (target.type === 'son' && target.id !== myBranch.id) {
      const fOrder = myBranch.order || 0;
      const tOrder = target.order || 0;
      const isElder = tOrder < fOrder || (target.birthYear && myBranch.birthYear && target.birthYear < myBranch.birthYear);
      if (isElder) {
        return { relation: 'জেঠা (বড় চাচা)', explanation: `উনি আপনার বাবা (${myBranch.name})-এর বড় ভাই, তাই আপনার জেঠা।` };
      } else {
        return { relation: 'চাচা', explanation: `উনি আপনার বাবা (${myBranch.name})-এর ছোট ভাই, তাই আপনার চাচা (কাকা)।` };
      }
    }

    // Target is wife of my father's brother (জেঠী / চাচী)
    if (targetSpouse && targetSpouse.type === 'son' && targetSpouse.id !== myBranch.id) {
      const fOrder = myBranch.order || 0;
      const uOrder = targetSpouse.order || 0;
      const isElder = uOrder < fOrder;
      if (isElder) {
        return { relation: 'জেঠী (বড় চাচী)', explanation: `উনি আপনার জেঠা (${targetSpouse.name})-এর স্ত্রী, তাই আপনার জেঠী।` };
      } else {
        return { relation: 'চাচী', explanation: `উনি আপনার চাচা (${targetSpouse.name})-এর স্ত্রী, তাই আপনার চাচী।` };
      }
    }

    // Target is sister of my father -> ফুফু
    if (target.type === 'daughter') {
      return { relation: 'ফুফু', explanation: `উনি আপনার বাবা (${myBranch.name})-এর বোন, তাই আপনার ফুফু (পিসি)।` };
    }

    // Target is husband of my father's sister -> ফুফা
    if (targetSpouse && targetSpouse.type === 'daughter') {
      return { relation: 'ফুফা', explanation: `উনি আপনার ফুফু (${targetSpouse.name})-এর স্বামী, তাই আপনার ফুফা।` };
    }
  }

  // -------------------------------------------------------------
  // 11. Maternal Uncles & Aunts (মায়ের ভাই ও বোন)
  // When 'me' is grandchild and mother is a daughter of grandpa
  // -------------------------------------------------------------
  if (myBranch && myBranch.type === 'daughter') {
    if (target.type === 'son') {
      return { relation: 'মামা', explanation: `উনি আপনার মায়ের ভাই, তাই আপনার মামা।` };
    }
    if (targetSpouse && targetSpouse.type === 'son') {
      return { relation: 'মামী', explanation: `উনি আপনার মামা (${targetSpouse.name})-এর স্ত্রী, তাই আপনার মামী।` };
    }
    if (target.type === 'daughter' && target.id !== myBranch.id) {
      return { relation: 'খালা', explanation: `উনি আপনার মায়ের বোন, তাই আপনার খালা (মাসি)।` };
    }
    if (targetSpouse && targetSpouse.type === 'daughter' && targetSpouse.id !== myBranch.id) {
      return { relation: 'খালু', explanation: `উনি আপনার খালা (${targetSpouse.name})-এর স্বামী, তাই আপনার খালু।` };
    }
  }

  // -------------------------------------------------------------
  // 12. Cousins (চাচাতো, জেঠাতো, ফুফাতো, মামাতো, খালাতো ভাই ও বোন)
  // When BOTH 'me' and 'target' are Grandchildren!
  // Specific user requests:
  // - "fufato bhai k cacato bhai dekhay keno" -> Fixed!
  // - "babar boro bhai er meye cacato bon dekhay hoyar kotha jethato bon" -> Fixed!
  // -------------------------------------------------------------
  const isBothGrandchildren = (me.type === 'grandchild' && target.type === 'grandchild');
  if (isBothGrandchildren && myBranch && targetBranch && myBranch.id !== targetBranch.id) {
    // Case 1: My branch is SON (বাবার দিক)
    if (myBranch.type === 'son') {
      // Target's branch is DAUGHTER (ফুফুর সন্তান -> ফুফাতো ভাই / ফুফাতো বোন)
      if (targetBranch.type === 'daughter') {
        if (target.gender === 'female') {
          return { relation: 'ফুফাতো বোন', explanation: `উনি আপনার ফুফু (${targetBranch.name})-এর মেয়ে, তাই আপনার ফুফাতো বোন।` };
        }
        return { relation: 'ফুফাতো ভাই', explanation: `উনি আপনার ফুফু (${targetBranch.name})-এর ছেলে, তাই আপনার ফুফাতো ভাই।` };
      }

      // Target's branch is SON (চাচা বা জেঠার সন্তান)
      if (targetBranch.type === 'son') {
        const myOrder = myBranch.order || 0;
        const targetParentOrder = targetBranch.order || 0;
        const isBoroBhai = targetParentOrder < myOrder || 
          (targetBranch.birthYear && myBranch.birthYear && targetBranch.birthYear < myBranch.birthYear) ||
          targetBranch.role.includes('বড়');

        if (isBoroBhai) {
          // বাবার বড় ভাইয়ের সন্তান -> জেঠাতো ভাই / জেঠাতো বোন
          if (target.gender === 'female') {
            return { relation: 'জেঠাতো বোন', explanation: `উনি আপনার বাবার বড় ভাই অর্থাৎ জেঠা (${targetBranch.name})-এর মেয়ে, তাই আপনার জেঠাতো বোন।` };
          }
          return { relation: 'জেঠাতো ভাই', explanation: `উনি আপনার বাবার বড় ভাই অর্থাৎ জেঠা (${targetBranch.name})-এর ছেলে, তাই আপনার জেঠাতো ভাই।` };
        } else {
          // বাবার ছোট ভাইয়ের সন্তান -> চাচাতো ভাই / চাচাতো বোন
          if (target.gender === 'female') {
            return { relation: 'চাচাতো বোন', explanation: `উনি আপনার চাচা (${targetBranch.name})-এর মেয়ে, তাই আপনার চাচাতো বোন।` };
          }
          return { relation: 'চাচাতো ভাই', explanation: `উনি আপনার চাচা (${targetBranch.name})-এর ছেলে, তাই আপনার চাচাতো ভাই।` };
        }
      }
    }

    // Case 2: My branch is DAUGHTER (মায়ের দিক)
    if (myBranch.type === 'daughter') {
      // Target's branch is SON (মামার সন্তান -> মামাতো ভাই / মামাতো বোন)
      if (targetBranch.type === 'son') {
        if (target.gender === 'female') {
          return { relation: 'মামাতো বোন', explanation: `উনি আপনার মামা (${targetBranch.name})-এর মেয়ে, তাই আপনার মামাতো বোন।` };
        }
        return { relation: 'মামাতো ভাই', explanation: `উনি আপনার মামা (${targetBranch.name})-এর ছেলে, তাই আপনার মামাতো ভাই।` };
      }

      // Target's branch is DAUGHTER (খালার সন্তান -> খালাতো ভাই / খালাতো বোন)
      if (targetBranch.type === 'daughter') {
        if (target.gender === 'female') {
          return { relation: 'খালাতো বোন', explanation: `উনি আপনার খালা (${targetBranch.name})-এর মেয়ে, তাই আপনার খালাতো বোন।` };
        }
        return { relation: 'খালাতো ভাই', explanation: `উনি আপনার খালা (${targetBranch.name})-এর ছেলে, তাই আপনার খালাতো ভাই।` };
      }
    }
  }

  // -------------------------------------------------------------
  // 13. Cousin's Spouse (ভাবী / দুলাভাই)
  // -------------------------------------------------------------
  if (targetSpouse && targetSpouse.type === 'grandchild' && me.type === 'grandchild') {
    if (targetSpouse.gender === 'male') {
      return { relation: 'ভাবী', explanation: `উনি আপনার ভাই (${targetSpouse.name})-এর স্ত্রী, তাই আপনার ভাবী।` };
    } else {
      return { relation: 'দুলাভাই', explanation: `উনি আপনার বোন (${targetSpouse.name})-এর স্বামী, তাই আপনার দুলাভাই।` };
    }
  }

  // -------------------------------------------------------------
  // 14. Cousin's Children (ভাতিজা / ভাতিজি / ভাগ্নে / ভাগ্নি)
  // -------------------------------------------------------------
  if (me.type === 'grandchild' && (target.type === 'great-grandchild' || target.parentId)) {
    const tParent = target.parentId ? memberMap.get(target.parentId) : null;
    if (tParent && tParent.type === 'grandchild') {
      if (tParent.gender === 'male') {
        return target.gender === 'female'
          ? { relation: 'ভাতিজি', explanation: `উনি আপনার ভাই (${tParent.name})-এর মেয়ে, তাই আপনার ভাতিজি।` }
          : { relation: 'ভাতিজা', explanation: `উনি আপনার ভাই (${tParent.name})-এর ছেলে, তাই আপনার ভাতিজা।` };
      } else {
        return target.gender === 'female'
          ? { relation: 'ভাগ্নি', explanation: `উনি আপনার বোন (${tParent.name})-এর মেয়ে, তাই আপনার ভাগ্নি।` }
          : { relation: 'ভাগ্নে', explanation: `উনি আপনার বোন (${tParent.name})-এর ছেলে, তাই আপনার ভাগ্নে।` };
      }
    }
  }

  // -------------------------------------------------------------
  // 15. In-Laws (শ্বশুর, শাশুড়ি, দেবর, ভাসুর, ননদ, জা, শালা, শালী)
  // -------------------------------------------------------------
  if (mySpouse) {
    if (target.id === mySpouse.fatherId || (target.type === 'grandpa' && mySpouse.type === 'son')) {
      return { relation: 'শ্বশুর', explanation: 'উনি আপনার জীবনসঙ্গীর পিতা, অর্থাৎ আপনার শ্বশুর।' };
    }
    if (target.id === mySpouse.motherId || (target.type === 'grandma' && mySpouse.type === 'son')) {
      return { relation: 'শাশুড়ি', explanation: 'উনি আপনার জীবনসঙ্গীর মাতা, অর্থাৎ আপনার শাশুড়ি।' };
    }
    if (me.gender === 'female') {
      // Wife perspective
      if (target.gender === 'male' && target.parentId === mySpouse.parentId && target.id !== mySpouse.id) {
        const sOrder = mySpouse.order || 0;
        const tOrder = target.order || 0;
        return tOrder < sOrder
          ? { relation: 'ভাসুর', explanation: 'উনি আপনার স্বামীর বড় ভাই, তাই আপনার ভাসুর।' }
          : { relation: 'দেবর', explanation: 'উনি আপনার স্বামীর ছোট ভাই, তাই আপনার দেবর।' };
      }
      if (target.gender === 'female' && target.parentId === mySpouse.parentId) {
        return { relation: 'ননদ', explanation: 'উনি আপনার স্বামীর বোন, তাই আপনার ননদ।' };
      }
    } else {
      // Husband perspective
      if (target.gender === 'male' && target.parentId === mySpouse.parentId) {
        return { relation: 'শালা', explanation: 'উনি আপনার স্ত্রীর ভাই, তাই আপনার শালা।' };
      }
      if (target.gender === 'female' && target.parentId === mySpouse.parentId) {
        return { relation: 'শালী', explanation: 'উনি আপনার স্ত্রীর বোন, তাই আপনার শালী।' };
      }
    }
  }

  // -------------------------------------------------------------
  // 16. Fallback with warm accurate family role
  // -------------------------------------------------------------
  if (target.role.includes('পুত্রবধূ') || (targetSpouse && isDirectChild && targetSpouse.gender === 'male')) {
    return { relation: 'পুত্রবধূ', explanation: 'উনি আপনার ছেলের স্ত্রী, তাই আপনার পুত্রবধূ।' };
  }
  if (target.role.includes('জামাই') || (targetSpouse && isDirectChild && targetSpouse.gender === 'female')) {
    return { relation: 'মেয়ের জামাই', explanation: 'উনি আপনার মেয়ের স্বামী, তাই আপনার জামাই।' };
  }

  if (target.gender === 'female') {
    if (target.type === 'grandchild' || target.type === 'great-grandchild') {
      return { relation: 'ভাতিজি / বোন', explanation: `উনি আপনার পরিবারের আদরের সদস্যা (${target.name})।` };
    }
    return { relation: 'ভাবী / ফুফু', explanation: `উনি আপনার পরিবারের সম্মানিত সদস্যা (${target.name})।` };
  } else {
    if (target.type === 'grandchild' || target.type === 'great-grandchild') {
      return { relation: 'ভাতিজা / ভাই', explanation: `উনি আপনার পরিবারের সদস্য (${target.name})।` };
    }
    return { relation: 'চাচা / ভাই', explanation: `উনি আপনার পরিবারের সদস্য (${target.name})।` };
  }
}

/**
 * Distractor pools for multiple choice options
 */
export const MALE_OPTIONS_POOL = [
  'জেঠা (বড় চাচা)', 'চাচা', 'মামা', 'ফুফা', 'খালু', 'দাদা', 'নানা', 
  'বড় ভাই', 'ছোট ভাই', 'জেঠাতো ভাই', 'চাচাতো ভাই', 'ফুফাতো ভাই', 'মামাতো ভাই', 'খালাতো ভাই',
  'ভাতিজা', 'ভাগ্নে', 'ছেলে (পুত্র)', 'দুলাভাই', 'ভগ্নিপতি', 'নাতি', 'ভাগ্নি জামাই', 'ভাতিজি জামাই',
  'ভাসুর', 'দেবর', 'শালা', 'শ্বশুর'
];

export const FEMALE_OPTIONS_POOL = [
  'জেঠী (বড় চাচী)', 'চাচী', 'মামী', 'ফুফু', 'খালা', 'দাদি', 'নানি', 
  'বড় বোন (আপা)', 'ছোট বোন', 'জেঠাতো বোন', 'চাচাতো বোন', 'ফুফাতো বোন', 'মামাতো বোন', 'খালাতো বোন',
  'ভাবী', 'ভাগ্নে বউ', 'ভাতিজা বউ', 'ভাতিজি', 'ভাগ্নি', 'মেয়ে (কন্যা)', 'পুত্রবধূ', 'নাতনি',
  'ননদ', 'জা', 'শালী', 'শাশুড়ি'
];

/**
 * Generate 10 smart questions for Me
 */
export function generateQuizQuestions(
  me: Member,
  members: Member[]
): RelationQuestion[] {
  const candidatePool = members.filter(m => m.id !== me.id);
  const shuffled = [...candidatePool].sort(() => 0.5 - Math.random());
  const selectedTargets = shuffled.slice(0, 10);

  return selectedTargets.map(target => {
    const { relation, explanation } = determineRelation(me, target, members);

    // Pick 3 distractors from appropriate gender pool
    const pool = target.gender === 'female' ? FEMALE_OPTIONS_POOL : MALE_OPTIONS_POOL;
    const wrongOptions = pool
      .filter(opt => opt !== relation && !relation.includes(opt) && !opt.includes(relation))
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

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
