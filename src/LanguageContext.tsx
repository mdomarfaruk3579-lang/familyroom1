import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'bn' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
  translateRole: (role: string) => string;
  translateType: (type: string) => string;
}

const roleTranslations: Record<string, { bn: string; en: string }> = {
  'grandpa': { bn: 'দাদা/নানা', en: 'Grandfather' },
  'grandma': { bn: 'দাদি/নানি', en: 'Grandmother' },
  'son': { bn: 'ছেলে', en: 'Son' },
  'daughter': { bn: 'মেয়ে', en: 'Daughter' },
  'spouse': { bn: 'স্ত্রী/স্বামী', en: 'Spouse' },
  'grandchild': { bn: 'নাতি/নাতনি', en: 'Grandchild' },
  'great-grandchild': { bn: 'প্রপৌত্র/প্রপৌত্রী', en: 'Great-Grandchild' },
  'great-great-grandchild': { bn: 'প্র-প্রপৌত্র/প্রপৌত্রী', en: 'Great-Great-Grandchild' },
  'father': { bn: 'পিতা', en: 'Father' },
  'mother': { bn: 'মাতা', en: 'Mother' },
  'বড় ছেলে': { bn: 'বড় ছেলে', en: 'Eldest Son' },
  'মেজো ছেলে': { bn: 'মেজো ছেলে', en: 'Second Son' },
  'সেজো ছেলে': { bn: 'সেজো ছেলে', en: 'Third Son' },
  'ছোট ছেলে': { bn: 'ছোট ছেলে', en: 'Youngest Son' },
  'বড় মেয়ে': { bn: 'বড় মেয়ে', en: 'Eldest Daughter' },
  'মেজো মেয়ে': { bn: 'মেজো মেয়ে', en: 'Second Daughter' },
  'ছোট মেয়ে': { bn: 'ছোট মেয়ে', en: 'Youngest Daughter' },
  'স্ত্রী': { bn: 'স্ত্রী', en: 'Wife' },
  'স্বামী': { bn: 'স্বামী', en: 'Husband' },
  'নাতি': { bn: 'নাতি', en: 'Grandson' },
  'নাতনি': { bn: 'নাতনি', en: 'Granddaughter' },
  'দাদা': { bn: 'দাদা', en: 'Grandfather' },
  'দাদি': { bn: 'দাদি', en: 'Grandmother' },
  'নানা': { bn: 'নানা', en: 'Maternal Grandfather' },
  'নানি': { bn: 'নানি', en: 'Maternal Grandmother' },
  'বড় ভাই': { bn: 'বড় ভাই', en: 'Elder Brother' },
  'ছোট ভাই': { bn: 'ছোট ভাই', en: 'Younger Brother' },
  'বড় বোন': { bn: 'বড় বোন', en: 'Elder Sister' },
  'ছোট বোন': { bn: 'ছোট বোন', en: 'Younger Sister' },
};

const translations: Record<Language, Record<string, string>> = {
  bn: {
    // Navbar & Common
    appTitle: 'ফ্যামিলি রুম',
    home: 'হোম',
    gallery: 'গ্যালারি',
    about: 'আমাদের সম্পর্কে',
    calculator: 'ক্যালকুলেটর',
    admin: 'অ্যাডমিন',
    login: 'লগইন',
    logout: 'লগআউট',
    adminAccess: 'অ্যাডমিন প্যানেল লগইন',
    adminModalDesc: 'পারিবারিক ওয়েবসাইট নিয়ন্ত্রণ ও তথ্য সম্পাদনা করতে অ্যাডমিন কোড দিন।',
    adminCodePlaceholder: 'সিক্রেট অ্যাডমিন কোড দিন',
    incorrectCode: 'ভুল কোড! সঠিক কোড দিয়ে আবার চেষ্টা করুন।',
    adminGrantedLoginPrompt: 'কোড সঠিক! আপনি এখন অ্যাডমিন সুবিধা উপভোগ করতে পারবেন।',
    cancel: 'বাতিল',
    enter: 'প্রবেশ করুন',
    installApp: 'অ্যাপ ইনস্টল করুন',
    installOnIos: 'আইফোনে ইনস্টল',
    backToHome: 'হোমে ফিরে যান',

    // Home & Search
    familyChart: 'ফ্যামিলি চার্ট',
    searchPlaceholder: 'যেকোনো সদস্যের নাম, সম্পর্ক বা তথ্য দিয়ে খুঁজুন...',
    noSearchResults: 'কোনো সদস্য খুঁজে পাওয়া যায়নি',
    searchResults: 'খোঁজার ফলাফল',
    upcomingBirthday: 'Upcoming Birthday',
    live: 'LIVE',
    upcomingTitle: 'আসন্ন জন্মদিন (পরবর্তী ৩০ দিন)',
    noUpcomingBirthdays: 'পরবর্তী ৩০ দিনে কারো জন্মদিন নেই',
    daysRemaining: 'দিন বাকি',
    todayIsBirthday: 'আজকেই শুভ জন্মদিন! 🎉',
    clickForGreeting: 'কার্ড ও শুভেচ্ছা দেখতে ক্লিক করুন',

    // Tree Levels & Roles
    sonAndDaughter: 'ছেলে ও মেয়ে',
    sons: 'ছেলে',
    daughters: 'মেয়ে',
    spouse: 'স্ত্রী/স্বামী',
    viewDetails: 'বিস্তারিত দেখুন',
    grandpa: 'দাদা/নানা',
    grandma: 'দাদি/নানি',
    grandchild: 'নাতি/নাতনি',
    greatGrandchild: 'প্রপৌত্র/প্রপৌত্রী',

    // Profile & Modal
    backToFamilyTree: 'ফ্যামিলি ট্রিতে ফিরে যান',
    editProfile: 'প্রোফাইল এডিট',
    born: 'জন্ম',
    died: 'মৃত্যু',
    dob: 'জন্মতারিখ',
    shortBio: 'জীবনবৃত্তান্ত ও পরিচিতি',
    familyGallery: 'ফ্যামিলি গ্যালারি',
    children: 'সন্তানসন্ততি',
    noChildren: 'কোনো সন্তান তালিকাভুক্ত নেই',
    noBio: 'কোনো পরিচিতি এখনো যোগ করা হয়নি।',
    close: 'বন্ধ করুন',
    phone: 'ফোন নম্বর',
    email: 'ইমেইল',
    socialMedia: 'সোশ্যাল মিডিয়া ও যোগাযোগ',
    timelineTitle: 'জীবনের মাইলফলক ও অধ্যায় (Timeline)',
    noTimeline: 'কোনো টাইমলাইন তথ্য নেই',

    // Birthday Greeting Card
    happyBirthday: 'Happy Birthday',
    birthdayWish: 'May your life be filled with boundless joy, robust health, long life, and endless peace. Wishing you all the love and blessings from the entire family!',
    customPhotoOptional: 'কার্ডের ছবি পরিবর্তন করুন',
    downloadCard: 'ইনস্টাগ্রাম সাইজ কার্ড ডাউনলোড করুন',
    downloading: 'ডাউনলোড হচ্ছে...',
    downloadSuccess: 'কার্ডটি ডাউনলোড করা হয়েছে!',
    designedBy: 'md omars',
    appDeveloper: 'App Developer',
    shareCard: 'শেয়ার করুন',

    // Admin
    adminDashboard: 'অ্যাডমিন ড্যাশবোর্ড',
    addMember: 'নতুন সদস্য যোগ করুন',
    editMember: 'সদস্যের তথ্য সম্পাদনা',
    name: 'পূর্ণ নাম',
    role: 'ভূমিকা / সম্পর্ক (যেমন: পিতা, মাতা, বড় ছেলে)',
    type: 'ধরণ (Hierarchy Type)',
    gender: 'লিঙ্গ',
    male: 'পুরুষ (Male)',
    parent: 'অভিভাবক',
    father: 'পিতা (বাবা)',
    mother: 'মাতা (মা)',
    selectFather: 'পিতা নির্বাচন করুন (ঐচ্ছিক)',
    selectMother: 'মাতা নির্বাচন করুন (ঐচ্ছিক)',
    fatherLabel: 'পিতা',
    motherLabel: 'মাতা',
    dateOfBirthLabel: 'জন্মতারিখ (DD/MM/YYYY)',
    dobPlaceholder: 'যেমন: 25/12/1998',
    deathYear: 'মৃত্যু সাল (প্রযোজ্য ক্ষেত্রে)',
    sortingOrder: 'ক্রমিক নম্বর (Order)',
    saveMember: 'সংরক্ষণ করুন',
    deleteMember: 'মুছে ফেলুন',
    confirmDelete: 'আপনি কি নিশ্চিতভাবে এই সদস্যকে মুছে ফেলতে চান?',
    savedSuccess: 'সফলভাবে সংরক্ষিত হয়েছে!',
    deletedSuccess: 'সফলভাবে মুছে ফেলা হয়েছে!',
    timelineHelper: 'টাইমলাইন এন্ট্রি যোগ করুন (যেমন: পড়াশোনা, কর্মজীবন, বিশেষ স্মৃতি)',
    addEvent: '+ নতুন অধ্যায় যোগ করুন',
    eventDate: 'সাল / তারিখ',
    eventTitle: 'শিরোনাম',
    eventDesc: 'সংক্ষিপ্ত বিবরণ',
    formattingToolbar: 'টেক্সট ফরম্যাটিং বার:',

    // Footer
    createdBy: 'ডিজাইন ও উন্নয়ন : Md Omars',
    allRightsReserved: 'সর্বস্বত্ব সংরক্ষিত',
  },
  en: {
    // Navbar & Common
    appTitle: 'Family Room',
    home: 'Home',
    gallery: 'Gallery',
    about: 'About Us',
    calculator: 'Calculator',
    admin: 'Admin',
    login: 'Login',
    logout: 'Logout',
    adminAccess: 'Admin Control Center',
    adminModalDesc: 'Enter the master passkey to unlock administrative and editing privileges.',
    adminCodePlaceholder: 'Enter master admin code',
    incorrectCode: 'Invalid code! Please check and try again.',
    adminGrantedLoginPrompt: 'Welcome! Master admin access granted for your session.',
    cancel: 'Cancel',
    enter: 'Enter',
    installApp: 'Install App',
    installOnIos: 'Install on iOS',
    backToHome: 'Back to Home',

    // Home & Search
    familyChart: 'Family Chart',
    searchPlaceholder: 'Search any member by name, relation, or details...',
    noSearchResults: 'No matching family members found',
    searchResults: 'Search Results',
    upcomingBirthday: 'Upcoming Birthday',
    live: 'LIVE',
    upcomingTitle: 'Upcoming Birthdays (Next 30 Days)',
    noUpcomingBirthdays: 'No upcoming birthdays in the next 30 days',
    daysRemaining: 'days left',
    todayIsBirthday: "Today is the birthday! 🎉",
    clickForGreeting: 'Click to open greeting card & celebration',

    // Tree Levels & Roles
    sonAndDaughter: 'Sons & Daughters',
    sons: 'Sons',
    daughters: 'Daughters',
    spouse: 'Spouse',
    viewDetails: 'View Profile',
    grandpa: 'Grandfather',
    grandma: 'Grandmother',
    grandchild: 'Grandchild',
    greatGrandchild: 'Great-Grandchild',

    // Profile & Modal
    backToFamilyTree: 'Back to Family Tree',
    editProfile: 'Edit Profile',
    born: 'Born',
    died: 'Died',
    dob: 'Date of Birth',
    shortBio: 'Life Journey & Biography',
    familyGallery: 'Family Gallery',
    children: 'Children',
    noChildren: 'No children listed',
    noBio: 'No biography has been added yet.',
    close: 'Close',
    phone: 'Phone Number',
    email: 'Email Address',
    socialMedia: 'Social Links & Contact',
    timelineTitle: 'Life Milestones & Timeline',
    noTimeline: 'No milestones recorded yet',

    // Birthday Greeting Card
    happyBirthday: 'Happy Birthday',
    birthdayWish: 'May your life be filled with boundless joy, robust health, long life, and endless peace. Wishing you all the love and blessings from the entire family!',
    customPhotoOptional: 'Change Card Photo',
    downloadCard: 'Download Instagram Card',
    downloading: 'Downloading...',
    downloadSuccess: 'Card saved to device successfully!',
    designedBy: 'md omars',
    appDeveloper: 'App Developer',
    shareCard: 'Share Greeting',

    // Admin
    adminDashboard: 'Admin Dashboard',
    addMember: 'Add Family Member',
    editMember: 'Edit Member Profile',
    name: 'Full Name',
    role: 'Role / Relation (e.g. Father, Mother, Eldest Son)',
    type: 'Hierarchy Node Type',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    parent: 'Parent',
    father: 'Father',
    mother: 'Mother',
    selectFather: 'Select Father (Optional)',
    selectMother: 'Select Mother (Optional)',
    fatherLabel: 'Father',
    motherLabel: 'Mother',
    dateOfBirthLabel: 'Date of Birth (DD/MM/YYYY)',
    dobPlaceholder: 'e.g. 25/12/1998',
    deathYear: 'Death Year (If applicable)',
    sortingOrder: 'Display Sorting Order',
    saveMember: 'Save Member',
    deleteMember: 'Delete Member',
    confirmDelete: 'Are you sure you want to permanently delete this member?',
    savedSuccess: 'Member saved successfully!',
    deletedSuccess: 'Member deleted successfully!',
    timelineHelper: 'Add timeline milestones (Education, Career, Milestones)',
    addEvent: '+ Add New Milestone',
    eventDate: 'Year / Date',
    eventTitle: 'Event Title',
    eventDesc: 'Short description',
    formattingToolbar: 'Text Formatting Tools:',

    // Footer
    createdBy: 'Crafted by : Md Omars',
    allRightsReserved: 'All rights reserved',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'bn',
  setLang: () => {},
  toggleLang: () => {},
  t: (key: string) => key,
  translateRole: (r: string) => r,
  translateType: (t: string) => t,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lang: Language = 'bn';

  useEffect(() => {
    localStorage.setItem('familyroom_lang', 'bn');
    document.documentElement.lang = 'bn';
    document.body.classList.add('font-bn');
    document.body.classList.remove('font-en');
  }, []);

  const setLang = (_newLang: Language) => {
    // Locked to Bengali
  };

  const toggleLang = () => {
    // Locked to Bengali
  };

  const t = (key: string): string => {
    return translations.bn[key] ?? key;
  };

  const translateRole = (role: string): string => {
    if (!role) return '';
    const trimmed = role.trim();
    if (roleTranslations[trimmed]?.bn) return roleTranslations[trimmed].bn;
    return trimmed;
  };

  const translateType = (type: string): string => {
    if (!type) return '';
    return roleTranslations[type]?.bn ?? type;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, translateRole, translateType }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
