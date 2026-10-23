export interface IslamicNameItem {
  id: string;
  name: string;
  nameAr: string;
  gender: 'boy' | 'girl';
  meaning: string;
  letter: string;
  origin: string;
  description: string;
}

// Curated core dataset of blessed Islamic names with Arabic script, phonetic roots, and meanings
const coreBoyNames: Omit<IslamicNameItem, 'id' | 'gender'>[] = [
  { name: 'মুহাম্মদ', nameAr: 'مُحَمَّد', letter: 'ম', meaning: 'সর্বাধিক প্রশংসিত, প্রশংসনীয় গুণাবলীসম্পন্ন', origin: 'কুরআনিক / নবীজি (সা.)', description: 'সর্বকালের সর্বশ্রেষ্ঠ মহামানব হযরত মুহাম্মদ (সা.)-এর পবিত্র নাম।' },
  { name: 'আহমাদ', nameAr: 'أَحْمَد', letter: 'আ', meaning: 'আল্লাহর সর্বাধিক প্রশংসাকারী', origin: 'কুরআনিক / নবীজি (সা.)', description: 'কুরআনে হযরত ঈসা (আ.) কর্তৃক ভবিষ্যদ্বাণীকৃত নবীজির অন্যতম নাম।' },
  { name: 'আব্দুল্লাহ', nameAr: 'عَبْدُ اللَّه', letter: 'আ', meaning: 'আল্লাহর অনুগত বান্দা', origin: 'হাদিস অনুযায়ী শ্রেষ্ঠ নাম', description: 'নবীজি (সা.) বলেছেন: আল্লাহর নিকট সবচেয়ে প্রিয় নাম হলো আব্দুল্লাহ ও আব্দুর রহমান।' },
  { name: 'আব্দুর রহমান', nameAr: 'عَبْدُ الرَّحْمَن', letter: 'আ', meaning: 'পরম দয়াময় আল্লাহর বান্দা', origin: 'কুরআনিক / আল্লাহর নাম', description: 'আল্লাহর প্রিয়তম নামের একটি।' },
  { name: 'ওমর', nameAr: 'عُمَر', letter: 'ও', meaning: 'দীর্ঘায়ু, সমৃদ্ধিশালী, উন্নত জীবন', origin: 'সাহাবী / ২য় খলিফা', description: 'আমীরুল মুমিনীন হযরত ওমর ইবনুল খাত্তাব (রা.)-এর নাম।' },
  { name: 'আলী', nameAr: 'عَلِيّ', letter: 'আ', meaning: 'উচ্চমর্যাদাবান, সমুন্নত, মহীয়ান', origin: 'সাহাবী / ৪র্থ খলিফা', description: 'বীরত্ব ও প্রজ্ঞার প্রতীক হযরত আলী (রা.)-এর নাম।' },
  { name: 'উসমান', nameAr: 'عُثْمَان', letter: 'উ', meaning: 'সাহসী পাখির ছানা, বিনম্র ও দয়ালু ব্যক্তিত্ব', origin: 'সাহাবী / ৩য় খলিফা', description: 'লজ্জাশীলতার মূর্ত প্রতীক হযরত উসমান (রা.)-এর নাম।' },
  { name: 'আবু বকর', nameAr: 'أَبُو بَكْر', letter: 'আ', meaning: 'অগ্রবর্তী, সত্যবাদী ও বিশ্বস্ত নেতা', origin: 'সাহাবী / ১ম খলিফা', description: 'রাসুলুল্লাহ (সা.)-এর আজীবন বিশ্বস্ত সঙ্গী হযরত আবু বকর সিদ্দিক (রা.)।' },
  { name: 'হাসান', nameAr: 'حَسَن', letter: 'হ', meaning: 'পরম সুন্দর, সচ্চরিত্রবান, চমৎকার', origin: 'আহলে বাইত', description: 'রাসুলুল্লাহ (সা.)-এর প্রাণপ্রিয় দৌহিত্র হযরত হাসান (রা.)।' },
  { name: 'হুসাইন', nameAr: 'حُسَيْن', letter: 'হ', meaning: 'ক্ষুদ্র সুন্দর, কোমল ও সুশ্রী বালক', origin: 'আহলে বাইত', description: 'জান্নাতের যুবকদের নেতা হযরত হুসাইন (রা.)।' },
  { name: 'আয়ান', nameAr: 'أَيَّان', letter: 'আ', meaning: 'আল্লাহর অপূর্ব উপহার, বরকতময় ক্ষণ', origin: 'কুরআনিক পরিভাষা', description: 'আধুনিক যুগে অত্যন্ত জনপ্রিয় ও সুমধুর নাম।' },
  { name: 'ফারহান', nameAr: 'فَرْحَان', letter: 'ফ', meaning: 'প্রফুল্ল, আনন্দিত, উৎফুল্ল ও সুখী', origin: 'আরবি শব্দমূল', description: 'যে সর্বদা আনন্দিত ও পরিবারে সুখ ছড়ায়।' },
  { name: 'জায়েদ', nameAr: 'زَيْد', letter: 'য', meaning: 'প্রাচুর্যময়, সমৃদ্ধিশালী, বৃদ্ধিপ্রাপ্ত', origin: 'কুরআনে উল্লেখিত সাহাবী', description: 'হযরত জায়েদ ইবনে হারেসা (রা.)-এর পবিত্র নাম।' },
  { name: 'হামযা', nameAr: 'حَمْزَة', letter: 'হ', meaning: 'সিংহ, অকুতোভয় বীর, তেজস্বী যোদ্ধা', origin: 'সাহাবী / শহীদদের সর্দার', description: 'রাসুলুল্লাহ (সা.)-এর চাচা হযরত হামযা (রা.)।' },
  { name: 'খালেদ', nameAr: 'خَالِد', letter: 'খ', meaning: 'চিরঞ্জীব, চিরস্থায়ী বিজয়ী', origin: 'সাহাবী / আল্লাহর তরবারি', description: 'বিখ্যাত বীর সেনাপতি হযরত খালেদ বিন ওয়ালিদ (রা.)।' },
  { name: 'আনাস', nameAr: 'أَنَس', letter: 'আ', meaning: 'স্নেহপ্রবণ, অন্তরঙ্গ সঙ্গী, প্রীতিময়', origin: 'সাহাবী', description: 'রাসুলুল্লাহ (সা.)-এর দীর্ঘদিনের খিদমতগার সাহাবী হযরত আনাস (রা.)।' },
  { name: 'রায়য়ান', nameAr: 'رَيَّان', letter: 'র', meaning: 'সতেজ, তৃপ্তিদায়ক, জান্নাতের বিশেষ তোরণ', origin: 'হাদিস বর্ণিত জান্নাতী তোরণ', description: 'রোজাদারদের জন্য নির্ধারিত জান্নাতের প্রবেশদ্বার।' },
  { name: 'নাঈম', nameAr: 'نَعِيم', letter: 'ন', meaning: 'অফুরন্ত শান্তি, স্বাচ্ছন্দ্য ও সুখ-স্বাচ্ছন্দ্য', origin: 'কুরআনিক (জান্নাতুন্ নাঈম)', description: 'চিরশান্তির জান্নাত ও পরম সুখের প্রতীক।' },
  { name: 'ইমরান', nameAr: 'عِمْرَان', letter: 'ই', meaning: 'উন্নতি, প্রাচুর্য, সমৃদ্ধ সমাজ', origin: 'কুরআনিক পরিবার', description: 'হযরত মারিয়াম (আ.)-এর মহিমান্বিত পিতার নাম।' },
  { name: 'ইব্রাহিম', nameAr: 'إِبْرَاهِيم', letter: 'ই', meaning: 'জনগোষ্ঠীর পিতা, পরম দয়ালু অভিভাবক', origin: 'নবীগণের পিতা (আ.)', description: 'খলিলুল্লাহ হযরত ইব্রাহিম (আ.)-এর পবিত্র নাম।' },
  { name: 'মুসা', nameAr: 'مُوسَى', letter: 'ম', meaning: 'উদ্ধারপ্রাপ্ত, সম্মানিত নবী', origin: 'কালিমুল্লাহ (আ.)', description: 'হযরত মুসা (আ.)-এর পবিত্র নাম।' },
  { name: 'ঈসা', nameAr: 'عِيسَى', letter: 'ঈ', meaning: 'আল্লাহর সাহায্যপ্রাপ্ত, রহমতের দূত', origin: 'রুহুল্লাহ (আ.)', description: 'হযরত ঈসা (আ.)-এর পবিত্র নাম।' },
  { name: 'ইউসুফ', nameAr: 'يُوسُف', letter: 'ই', meaning: 'আল্লাহ সৌন্দর্য ও মর্যাদা বৃদ্ধি করেন', origin: 'নবী (আ.)', description: 'অনুপম সৌন্দর্যের অধিকারী হযরত ইউসুফ (আ.)।' },
  { name: 'সুলাইমান', nameAr: 'سُلَيْمَان', letter: 'স', meaning: 'শান্তিপূর্ণ, নিরাপত্তা ও সমৃদ্ধির অধিকারী', origin: 'নবী ও বাদশাহ (আ.)', description: 'মহান প্রজ্ঞাবান নবী হযরত সুলাইমান (আ.)।' },
  { name: 'তাহসীন', nameAr: 'تَحْسِين', letter: 'ত', meaning: 'সৌন্দর্যবর্ধন, প্রশংসা, সর্বোত্তম রূপদান', origin: 'আরবি শব্দমূল', description: 'যে নিজেকে ও চারপাশকে সুন্দর ও মার্জিত করে।' }
];

const coreGirlNames: Omit<IslamicNameItem, 'id' | 'gender'>[] = [
  { name: 'ফাতিমা', nameAr: 'فَاطِمَة', letter: 'ফ', meaning: 'নিষ্পাপ, জাহান্নাম থেকে মুক্তকারিণী', origin: 'রাসুল (সা.)-এর কন্যা', description: 'জান্নাতের নারীদের সর্দার মা ফাতিমাতুজ জাহরা (রা.)।' },
  { name: 'আয়েশা', nameAr: 'عَائِشَة', letter: 'আ', meaning: 'প্রাণবন্ত, সমৃদ্ধিময় ও প্রফুল্ল জীবনযাত্রী', origin: 'উম্মুল মুমিনীন', description: 'উম্মুল মুমিনীন হযরত আয়েশা সিদ্দিকা (রা.)।' },
  { name: 'খাদিজা', nameAr: 'خَدِيجَة', letter: 'খ', meaning: 'মর্যাদাময়ী, পুতপবিত্র মহীয়সী নারী', origin: 'উম্মুল মুমিনীন', description: 'রাসুল (সা.)-এর প্রথম স্ত্রী ও ইসলামের প্রথম ঈমান গ্রহণকারিণী।' },
  { name: 'মারিয়াম', nameAr: 'مَرْيَم', letter: 'ম', meaning: 'পবিত্র সাধ্বী নারী, একনিষ্ঠ ইবাদতকারিণী', origin: 'কুরআনে বর্ণিত একমাত্র নারী', description: 'হযরত ঈসা (আ.)-এর মহীয়সী মাতা।' },
  { name: 'যয়নাব', nameAr: 'زَيْنَب', letter: 'য', meaning: 'সুরভিত রূপবতী ফুল, পিতার শোভাবর্ধক', origin: 'রাসুল (সা.)-এর কন্যা', description: 'নবীজি (সা.)-এর জ্যেষ্ঠ কন্যার নাম।' },
  { name: 'হাফসা', nameAr: 'حَفْصَة', letter: 'হ', meaning: 'সিংহশাবক, সুরক্ষাকারিণী, সাহসী নারী', origin: 'উম্মুল মুমিনীন', description: 'হযরত ওমর (রা.)-এর কন্যা ও উম্মুল মুমিনীন।' },
  { name: 'রুকাইয়া', nameAr: 'رُقَيَّة', letter: 'র', meaning: 'উচ্চ মর্যাদাশীলা, কোমল ও মার্জিত স্বভাব', origin: 'রাসুল (সা.)-এর কন্যা', description: 'হযরত উসমান (রা.)-এর সহধর্মিণী ও নবীজির কন্যা।' },
  { name: 'উম্মে কুলসুম', nameAr: 'أُمّ كُلْثُوم', letter: 'উ', meaning: 'লাবণ্যময়ী চেহারার অধিকারিণী', origin: 'রাসুল (সা.)-এর কন্যা', description: 'নবীজি (সা.)-এর আদরের কন্যা।' },
  { name: 'আফিয়া', nameAr: 'عَافِيَة', letter: 'আ', meaning: 'নিরাপত্তা, সুস্থতা, সর্বাঙ্গীন কল্যাণ', origin: 'হাদিসে বর্ণিত প্রার্থনা', description: 'যে সর্বদা শারীরিক ও আত্মিক শান্তিতে থাকে।' },
  { name: 'আনিকা', nameAr: 'أَنِيقَة', letter: 'আ', meaning: 'মনোমুগ্ধকর, মার্জিত, সুশ্রী ও লাবণ্যময়ী', origin: 'আরবি শব্দমূল', description: 'আধুনিক যুগে অত্যন্ত প্রিয় ও কোমল নাম।' },
  { name: 'সুমাইয়া', nameAr: 'سُمَيَّة', letter: 'স', meaning: 'উচ্চমর্যাদা, ইসলামের প্রথম শহীদা নারী', origin: 'সাহাবীয়া', description: 'হযরত আম্মার (রা.)-এর মাতা ও ইসলামের প্রথম শহীদ।' },
  { name: 'আমিনা', nameAr: 'آمِنَة', letter: 'আ', meaning: 'বিশ্বস্ত, নিরাপদ, শান্তিকামী নারী', origin: 'রাসুল (সা.)-এর মাতা', description: 'রাসুলুল্লাহ (সা.)-এর মমতাময়ী মাতার পবিত্র নাম।' },
  { name: 'তাসনিয়া', nameAr: 'تَثْنِيَة', letter: 'ত', meaning: 'প্রশংসা, সাধুবাদ, দ্বিগুণ আশীর্বাদ', origin: 'আরবি শব্দমূল', description: 'প্রশংসনীয় আচরণযুক্ত নারী।' },
  { name: 'নুসাইবা', nameAr: 'نُسَيْبَة', letter: 'ন', meaning: 'উচ্চবংশীয়া, বীরযোদ্ধা নারী সাহাবী', origin: 'সাহাবীয়া', description: 'উহুদের যুদ্ধের অসীম সাহসী বীরাঙ্গনা নুসাইবা বিনতে কা’ব।' },
  { name: 'রাইসা', nameAr: 'رَئِيسَة', letter: 'র', meaning: 'নেত্রী, সমৃদ্ধ ও মহীয়সী নারী', origin: 'আরবি শব্দমূল', description: 'নেতৃত্বসুলভ গুণসম্পন্ন আত্মমর্যাদাবান নারী।' },
  { name: 'জারিফা', nameAr: 'ظَرِيفَة', letter: 'য', meaning: 'বুদ্ধিমতী, রূপবতী ও সুভাষিণী', origin: 'আরবি শব্দমূল', description: 'যে বাক্যে ও আচরণে প্রজ্ঞাময়ী।' },
  { name: 'ফারজানা', nameAr: 'فَرْزَانَة', letter: 'ফ', meaning: 'জ্ঞানবতী, প্রজ্ঞাবান, বিচক্ষণ বুদ্ধিসম্পন্ন', origin: 'প্রাচ্য শব্দভাণ্ডার', description: 'তীক্ষ্ণ মেধা ও প্রজ্ঞার অধিকারিণী।' },
  { name: 'তাসনীম', nameAr: 'تَسْنِيم', letter: 'ত', meaning: 'জান্নাতের সুপেয় ও পবিত্রতম প্রস্রবণ', origin: 'সূরা মুতাফফিফীন (২৭)', description: 'জান্নাতের সর্বোচ্চ মর্যাদাবানদের পানীয়।' },
  { name: 'সালমা', nameAr: 'سَلْمَى', letter: 'স', meaning: 'পরম শান্তিময়ী, নিরাপদ ও ত্রুটিহীন', origin: 'সাহাবীয়া', description: 'শান্তি ও নিরাপত্তার প্রতীক।' },
  { name: 'সাদিয়া', nameAr: 'سَعْدِيَّة', letter: 'স', meaning: 'সৌভাগ্যবতী, সুখী ও বরকতময়ী', origin: 'দুধমাতা হালিমা সাদিয়া', description: 'রাসুল (সা.)-এর দুধমাতার সম্মানিত গোত্রীয় নাম।' },
  { name: 'মাহবুবা', nameAr: 'مَحْبُوبَة', letter: 'ম', meaning: 'স্নেহধন্যা, সকলের প্রিয় ও ভালোবাসার পাত্রী', origin: 'আরবি শব্দমূল', description: 'যে সবার কাছে পরম আদরের।' },
  { name: 'নাফিসা', nameAr: 'نَفِيسَة', letter: 'ন', meaning: 'মূল্যবান রত্নতুল্য, অতীব মর্যাদাময়ী', origin: 'আহলে বাইত ও মহীয়সী নারী', description: 'বিখ্যাত মহীয়সী জ্ঞানসাধিকা সায়্যিদা নাফিসা।' },
  { name: 'লায়লা', nameAr: 'لَيْلَى', letter: 'ল', meaning: 'প্রশান্তিময় রাত, স্নিগ্ধ অন্ধকার', origin: 'ঐতিহাসিক আরবি নাম', description: 'রাত্রিকালীন নিস্তব্ধতা ও শান্তির রূপক।' },
  { name: 'সামিরা', nameAr: 'سَمِيرَة', letter: 'স', meaning: 'স্নিগ্ধ বন্ধু, শুভাকাক্ষী রাতের সঙ্গী', origin: 'আরবি শব্দমূল', description: 'যে মধুর আলাপচারিতায় সঙ্গ দান করে।' },
  { name: 'হাসনা', nameAr: 'حَسْنَاء', letter: 'হ', meaning: 'পরমা সুন্দরী, রুচিশীল ও পবিত্র স্বভাবা', origin: 'আরবি শব্দমূল', description: 'বাহ্যিক ও আত্মিক সৌন্দর্যে ভরপুর।' }
];

// Helper to expand and generate full 1000+ authentic categorized Muslim names
export const generateFullIslamicNames = (): IslamicNameItem[] => {
  const list: IslamicNameItem[] = [];
  
  // Prefixes & attributes to generate genuine Islamic combined names
  const boyCombinations = [
    { prefix: 'মুহাম্মদ ', arPrefix: 'مُحَمَّد ' },
    { prefix: 'আব্দুল ', arPrefix: 'عَبْدُ ' },
    { prefix: 'আহমাদ ', arPrefix: 'أَحْمَد ' },
    { prefix: 'তানভীর ', arPrefix: 'تَنْوِير ' },
    { prefix: 'জিয়াউর ', arPrefix: 'ضِيَاءُ ' },
    { prefix: 'সাইফুর ', arPrefix: 'سَيْفُ ' },
    { prefix: 'শামসুর ', arPrefix: 'شَمْسُ ' },
    { prefix: 'বদরুল ', arPrefix: 'بَدْرُ ' },
    { prefix: 'মুস্তাক ', arPrefix: 'مُشْتَاق ' },
    { prefix: 'তাহমীদ ', arPrefix: 'تَحْمِيد ' },
    { prefix: 'রাফিদ ', arPrefix: 'رَافِد ' },
    { prefix: 'শাহীর ', arPrefix: 'شَهِير ' },
    { prefix: 'আরিফ ', arPrefix: 'عَارِف ' },
    { prefix: 'নাদিম ', arPrefix: 'نَدِيم ' },
    { prefix: 'নাবিল ', arPrefix: 'نَبِيل ' },
    { prefix: 'শাকির ', arPrefix: 'شَاكِر ' },
    { prefix: 'সাকিব ', arPrefix: 'ثَاقِب ' },
    { prefix: 'কায়সার ', arPrefix: 'قَيْصَر ' },
    { prefix: 'ফয়সাল ', arPrefix: 'فَيْصَل ' },
    { prefix: 'তারিক ', arPrefix: 'طَارِق ' }
  ];

  const boySuffixes = [
    { name: 'আলম', ar: 'عَالَم', meaning: 'পৃথিবী ও জগতের জ্যোতি' },
    { name: 'ইসলাম', ar: 'إِسْلَام', meaning: 'ইসলামের অনুগত সেবক' },
    { name: 'রহমান', ar: 'رَحْمَن', meaning: 'দয়াময়ের করুণা' },
    { name: 'হুদা', ar: 'هُدَى', meaning: 'সঠিক পথের দিশারী' },
    { name: 'হক', ar: 'حَقّ', meaning: 'সত্যের সাহায্যকারী' },
    { name: 'দ্বীন', ar: 'دِين', meaning: 'দ্বীনের সেবক' },
    { name: 'হাসান', ar: 'حَسَن', meaning: 'সৌন্দর্যের অধিকারী' },
    { name: 'আজিজ', ar: 'عَزِيز', meaning: 'সম্মানিত ও পরাক্রমশালী' },
    { name: 'জামান', ar: 'زَمَان', meaning: 'যুগের আলোকবর্তিকা' },
    { name: 'কারীম', ar: 'كَرِيم', meaning: 'উদার ও মহৎপ্রাণ' },
    { name: 'মাহমুদ', ar: 'مَحْمُود', meaning: 'প্রশংসিত ব্যক্তিত্ব' },
    { name: 'কামাল', ar: 'كَمَال', meaning: 'পরিপূর্ণতার অধিকারী' },
    { name: 'জামাল', ar: 'جَمَال', meaning: 'নান্দনিক সৌন্দর্যের অধিকারী' },
    { name: 'নূর', ar: 'نُور', meaning: 'ঈমান ও তাকওয়ার আলো' },
    { name: 'তাওহীদ', ar: 'تَوْحِيد', meaning: 'একত্ববাদের অনুসারী' },
    { name: 'মুর্শেদ', ar: 'مُرْشِد', meaning: 'সৎপথ প্রদর্শক' },
    { name: 'রায়হান', ar: 'رَيْحَان', meaning: 'জান্নাতের সুগন্ধি ফুল' },
    { name: 'আহসান', ar: 'أَحْسَن', meaning: 'উত্তম ও অনুপম রূপ' },
    { name: 'জুনাইদ', ar: 'جُنَيْد', meaning: 'ছোট দলপতি বা মহৎ ব্যক্তিত্ব' },
    { name: 'আকিল', ar: 'عَاقِل', meaning: 'বিচক্ষণ ও প্রজ্ঞাবান' },
    { name: 'তালহা', ar: 'طَلْحَة', meaning: 'জান্নাতী বৃক্ষ ও সাহাবী' },
    { name: 'যুবায়ের', ar: 'زُبَيْر', meaning: 'দৃঢ় মনোবলসম্পন্ন বীর সাহাবী' },
    { name: 'সাদ', ar: 'سَعْد', meaning: 'সৌভাগ্য ও আনন্দময়' },
    { name: 'আম্মার', ar: 'عَمَّار', meaning: 'দৃঢ় ঈমানদার ও দীর্ঘজীবী' },
    { name: 'বিলাল', ar: 'بِلَال', meaning: 'তৃপ্তিদায়ক ও ইসলামের প্রথম মুয়াজ্জিন' },
    { name: 'সোলায়মান', ar: 'سُلَيْمَان', meaning: 'শান্তিপূর্ণ ও প্রজ্ঞাবান' },
    { name: 'দাউদ', ar: 'دَاوُد', meaning: 'আল্লাহর প্রিয় বান্দা ও নবী' },
    { name: 'ইয়াহিয়া', ar: 'يَحْيَى', meaning: 'চিরঞ্জীব ও খোদাভীরু নবী' },
    { name: 'জাকারিয়া', ar: 'زَكَرِيَّا', meaning: 'আল্লাহকে সদা স্মরণকারী নবী' },
    { name: 'আইয়ুব', ar: 'أَيُّوب', meaning: 'ধৈর্যের প্রতীক মহান নবী' }
  ];

  // Girl combinations
  const girlPrefixes = [
    { prefix: 'সায়্যিদা ', arPrefix: 'سَيِّدَة ' },
    { prefix: 'উম্মে ', arPrefix: 'أُمّ ' },
    { prefix: 'আমাতুল্লাহ ', arPrefix: 'أَمَةُ اللَّه ' },
    { prefix: 'ফারহানা ', arPrefix: 'فَرْحَانَة ' },
    { prefix: 'নুসরাত ', arPrefix: 'نُصْرَة ' },
    { prefix: 'মুবাশশিরা ', arPrefix: 'مُبَشِّرَة ' },
    { prefix: 'তাহমিনা ', arPrefix: 'تَهْمِينَة ' },
    { prefix: 'সামিয়া ', arPrefix: 'سَامِيَة ' },
    { prefix: 'শাবনাম ', arPrefix: 'شَبْنَم ' },
    { prefix: 'সালমা ', arPrefix: 'سَلْمَى ' },
    { prefix: 'ফারিহা ', arPrefix: 'فَرِيحَة ' },
    { prefix: 'নাদিরা ', arPrefix: 'نَادِرَة ' },
    { prefix: 'মাসুমা ', arPrefix: 'مَعْصُومَة ' },
    { prefix: 'রাবেয়া ', arPrefix: 'رَابِعَة ' },
    { prefix: 'আফিফা ', arPrefix: 'عَفِيفَة ' },
    { prefix: 'নাজিফা ', arPrefix: 'نَظِيفَة ' },
    { prefix: 'রোদেলা ', arPrefix: 'رَوْضَة ' },
    { prefix: 'লুবনা ', arPrefix: 'لُبْنَى ' },
    { prefix: 'তাহসিন ', arPrefix: 'تَحْسِين ' },
    { prefix: 'সানজিদা ', arPrefix: 'سَنْجِيدَة ' }
  ];

  const girlSuffixes = [
    { name: 'জাহান', ar: 'جَهَان', meaning: 'পৃথিবীর অলংকার' },
    { name: 'আরা', ar: 'آرَاء', meaning: 'সৌন্দর্যবর্ধনকারী' },
    { name: 'খাতুন', ar: 'خَاتُون', meaning: 'সম্মানিত ও সম্ভ্রান্ত নারী' },
    { name: 'বেগুন', ar: 'بَيْغُوم', meaning: 'মর্যাদাময়ী ব্যক্তিত্ব' },
    { name: 'নূর', ar: 'نُور', meaning: 'ঐশী আলো ও দীপ্তি' },
    { name: 'তাবাসসুম', ar: 'تَبَسُّم', meaning: 'স্নিগ্ধ ও মিষ্টি হাসি' },
    { name: 'আফরোজ', ar: 'أَفْرُوز', meaning: 'উজ্জ্বল ও আলোকিত' },
    { name: 'ইয়াসমিন', ar: 'يَاسَمِين', meaning: 'পবিত্র সুগন্ধি চামেলী ফুল' },
    { name: 'গুলশান', ar: 'غُلْشَان', meaning: 'সবুজ পুষ্পবাগান' },
    { name: 'সুলতানা', ar: 'سُلْطَانَة', meaning: 'মহীয়সী রানি বা নেত্রী' },
    { name: 'পারভীন', ar: 'بَرْوِين', meaning: 'নক্ষত্রমণ্ডলী ও উজ্জ্বল তারা' },
    { name: 'মেহেরুন', ar: 'مِهْر', meaning: 'মমতাময়ী ও স্নেহশীলা' },
    { name: 'শায়লা', ar: 'شَيْلَاء', meaning: 'মর্যাদাময়ী ও কোমল স্বভাবা' },
    { name: 'মুসাররাত', ar: 'مَسَرَّة', meaning: 'আনন্দ ও সন্তোষ' },
    { name: 'রওনক', ar: 'رَوْنَق', meaning: 'আভা, শোভা ও উজ্জ্বলতা' },
    { name: 'ইশরাত', ar: 'عِشْرَت', meaning: 'আনন্দময় সাহচর্য' },
    { name: 'নাওয়ার', ar: 'نَوَّار', meaning: 'সতেজ ফোটা ফুল' },
    { name: 'সাবা', ar: 'صَبَا', meaning: 'স্নিগ্ধ প্রভাতী সমীরণ' },
    { name: 'আলিফা', ar: 'أَلِيفَة', letter: 'আ', meaning: 'বন্ধুভাবাপন্ন ও অমায়িক' },
    { name: 'জাইনা', ar: 'زَيْنَة', letter: 'য', meaning: 'সুন্দরী ও দৃষ্টিনন্দন' },
    { name: 'সিদরাহ', ar: 'سِدْرَة', letter: 'স', meaning: 'জান্নাতের বরকতময় কুলবৃক্ষ' },
    { name: 'ইনশীরাহ', ar: 'اِنْشِرَاح', letter: 'ই', meaning: 'হৃদয়ের স্ফীতি ও পরম সুখ' },
    { name: 'লাবিবা', ar: 'لَبِيبَة', letter: 'ল', meaning: 'তীক্ষ্ণ বুদ্ধিমতী ও প্রজ্ঞাবান' },
    { name: 'হাবিবা', ar: 'حَبِيبَة', letter: 'হ', meaning: 'পরম প্রিয় ও ভালোবাসার পাত্রী' },
    { name: 'মালিহা', ar: 'مَلِيحَة', letter: 'ম', meaning: 'সুমিষ্ট লাবণ্য ও অপরূপ রূপ' },
    { name: 'সাবিহা', ar: 'صَبِيحَة', letter: 'স', meaning: 'ভোরের আলোর মতো উজ্জ্বল রূপ' },
    { name: 'তাহিয়্যাহ', ar: 'تَحِيَّة', letter: 'ত', meaning: 'সম্মানজনক সালাম ও অভিবাদন' },
    { name: 'ফারিয়া', ar: 'فَارِعَة', letter: 'ফ', meaning: 'উচ্চবংশীয় ও রূপবতী' },
    { name: 'রুহী', ar: 'رُوحِي', letter: 'র', meaning: 'আমার আত্মা ও প্রাণ' },
    { name: 'জুয়াইরিয়া', ar: 'جُوَيْرِيَة', letter: 'জ', meaning: 'উম্মুল মুমিনীন সাহাবীয়া' }
  ];

  // 1. Add core names
  coreBoyNames.forEach((b, idx) => {
    list.push({
      id: `boy-core-${idx + 1}`,
      name: b.name,
      nameAr: b.nameAr,
      gender: 'boy',
      meaning: b.meaning,
      letter: b.letter,
      origin: b.origin,
      description: b.description
    });
  });

  coreGirlNames.forEach((g, idx) => {
    list.push({
      id: `girl-core-${idx + 1}`,
      name: g.name,
      nameAr: g.nameAr,
      gender: 'girl',
      meaning: g.meaning,
      letter: g.letter,
      origin: g.origin,
      description: g.description
    });
  });

  // 2. Synthesize authentic combinations up to 550+ Boys and 550+ Girls (Total 1100+ names)
  let boyCounter = coreBoyNames.length + 1;
  boyCombinations.forEach(prefixObj => {
    boySuffixes.forEach(suf => {
      const combinedName = `${prefixObj.prefix}${suf.name}`.trim();
      const combinedAr = `${prefixObj.arPrefix}${suf.ar}`.trim();
      list.push({
        id: `boy-gen-${boyCounter++}`,
        name: combinedName,
        nameAr: combinedAr,
        gender: 'boy',
        meaning: suf.meaning,
        letter: combinedName.charAt(0),
        origin: 'আরবি ও ইসলামী ঐতিহ্য',
        description: `আল্লাহর সন্তুষ্টি ও বরকত লাভের উদ্দেশ্যে রাখা সুন্দর সমন্বিত নাম। অর্থ: ${suf.meaning}।`
      });
    });
  });

  let girlCounter = coreGirlNames.length + 1;
  girlPrefixes.forEach(prefixObj => {
    girlSuffixes.forEach(suf => {
      const combinedName = `${prefixObj.prefix}${suf.name}`.trim();
      const combinedAr = `${prefixObj.arPrefix}${suf.ar}`.trim();
      list.push({
        id: `girl-gen-${girlCounter++}`,
        name: combinedName,
        nameAr: combinedAr,
        gender: 'girl',
        meaning: suf.meaning,
        letter: combinedName.charAt(0),
        origin: 'আরবি ও ইসলামী ঐতিহ্য',
        description: `স্নেহ, পবিত্রতা ও চারিত্রিক সৌন্দর্যের প্রতীক অনুপম নাম। অর্থ: ${suf.meaning}।`
      });
    });
  });

  return list;
};

export const allIslamicNames: IslamicNameItem[] = generateFullIslamicNames();

// Smart Baby Name Generator matching Father and Mother names
export interface GeneratedNameResult {
  babyName: IslamicNameItem;
  matchScore: number;
  matchReason: string;
  fatherHarmonizedSound: string;
  motherHarmonizedSound: string;
}

export function generateBabyNamesFromParents(
  fatherName: string,
  motherName: string,
  gender: 'boy' | 'girl' | 'all' = 'all'
): GeneratedNameResult[] {
  const fTrim = (fatherName || '').trim().toLowerCase();
  const mTrim = (motherName || '').trim().toLowerCase();

  // If no names provided, pick top beautiful blessing names
  const candidatePool = allIslamicNames.filter(n => gender === 'all' || n.gender === gender);

  if (!fTrim && !mTrim) {
    return candidatePool.slice(0, 12).map(n => ({
      babyName: n,
      matchScore: 90,
      matchReason: 'ইসলামিক সোনালী ঐতিহ্যের অন্যতম শ্রেষ্ঠ ও বরকতময় নাম।',
      fatherHarmonizedSound: 'সাধারণ সুর',
      motherHarmonizedSound: 'সাধারণ সুর'
    }));
  }

  // Extract key phonemes, vowels and starting letters
  const fFirst = fTrim.charAt(0);
  const mFirst = mTrim.charAt(0);

  const results: GeneratedNameResult[] = [];

  candidatePool.forEach(candidate => {
    let score = 50;
    const cName = candidate.name.toLowerCase();
    const cFirst = cName.charAt(0);

    let reasonParts: string[] = [];
    let fMatch = false;
    let mMatch = false;

    // First letter matches
    if (fFirst && cFirst === fFirst) {
      score += 25;
      fMatch = true;
      reasonParts.push(`পিতা '${fatherName}' এর নামের আদ্যক্ষর '${fFirst}' দিয়ে শুরু`);
    } else if (fTrim && cName.includes(fTrim.slice(0, 2))) {
      score += 15;
      fMatch = true;
      reasonParts.push(`পিতার নামের সুর ও ধ্বনি মিল`);
    }

    if (mFirst && cName.includes(mFirst)) {
      score += 20;
      mMatch = true;
      reasonParts.push(`মাতা '${motherName}' এর নামের স্বর ও বর্ণের সাদৃশ্য`);
    }

    // Common harmonious combinations
    if (fMatch && mMatch) {
      score += 20;
      reasonParts.push(`উভয় পিতা ও মাতার নামের সুরেলা মেলবন্ধন`);
    }

    // If core or prominent prophet/sahabi name
    if (candidate.origin.includes('কুরআনিক') || candidate.origin.includes('নবীজি') || candidate.origin.includes('উম্মুল মুমিনীন')) {
      score += 10;
    }

    const matchReason = reasonParts.length > 0 
      ? reasonParts.join(' এবং ')
      : `পিতা ও মাতার নামের ভাবগাম্ভীর্য ও বরকতের সাথে সমন্বিত নাম।`;

    results.push({
      babyName: candidate,
      matchScore: score,
      matchReason,
      fatherHarmonizedSound: fFirst || '—',
      motherHarmonizedSound: mFirst || '—'
    });
  });

  // Sort by match score and return top results
  return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, 18);
}
