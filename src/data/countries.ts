export interface CountryOption {
  code: string;
  name: string;
  nameBn: string;
  flag: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'BD', name: 'Bangladesh', nameBn: 'বাংলাদেশ', flag: '🇧🇩' },
  { code: 'SA', name: 'Saudi Arabia', nameBn: 'সৌদি আরব', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', nameBn: 'সংযুক্ত আরব আমিরাত (দুবাই)', flag: '🇦🇪' },
  { code: 'US', name: 'United States', nameBn: 'যুক্তরাষ্ট্র (USA)', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', nameBn: 'যুক্তরাজ্য (UK)', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', nameBn: 'কানাডা', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', nameBn: 'অস্ট্রেলিয়া', flag: '🇦🇺' },
  { code: 'QA', name: 'Qatar', nameBn: 'কাতার', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', nameBn: 'কুয়েত', flag: '🇰🇼' },
  { code: 'OM', name: 'Oman', nameBn: 'ওমান', flag: '🇴🇲' },
  { code: 'BH', name: 'Bahrain', nameBn: 'বাহরাইন', flag: '🇧🇭' },
  { code: 'MY', name: 'Malaysia', nameBn: 'মালয়েশিয়া', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', nameBn: 'সিঙ্গাপুর', flag: '🇸🇬' },
  { code: 'IT', name: 'Italy', nameBn: 'ইতালি', flag: '🇮🇹' },
  { code: 'DE', name: 'Germany', nameBn: 'জার্মানি', flag: '🇩🇪' },
  { code: 'FR', name: 'France', nameBn: 'ফ্রান্স', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', nameBn: 'স্পেন', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', nameBn: 'পর্তুগাল', flag: '🇵🇹' },
  { code: 'SE', name: 'Sweden', nameBn: 'সুইডেন', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', nameBn: 'সুইজারল্যান্ড', flag: '🇨🇭' },
  { code: 'NL', name: 'Netherlands', nameBn: 'নেদারল্যান্ডস', flag: '🇳🇱' },
  { code: 'JP', name: 'Japan', nameBn: 'জাপান', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', nameBn: 'দক্ষিণ কোরিয়া', flag: '🇰🇷' },
  { code: 'IE', name: 'Ireland', nameBn: 'আয়ারল্যান্ড', flag: '🇮🇪' },
  { code: 'NZ', name: 'New Zealand', nameBn: 'নিউজিল্যান্ড', flag: '🇳🇿' },
  { code: 'TR', name: 'Turkey', nameBn: 'তুরস্ক', flag: '🇹🇷' },
  { code: 'ZA', name: 'South Africa', nameBn: 'দক্ষিণ আফ্রিকা', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', nameBn: 'মিশর', flag: '🇪🇬' },
  { code: 'IN', name: 'India', nameBn: 'ভারত', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan', nameBn: 'পাকিস্তান', flag: '🇵🇰' },
  { code: 'BE', name: 'Belgium', nameBn: 'বেলজিয়াম', flag: '🇧🇪' },
  { code: 'AT', name: 'Austria', nameBn: 'অস্ট্রিয়া', flag: '🇦🇹' },
  { code: 'DK', name: 'Denmark', nameBn: 'ডেনমার্ক', flag: '🇩🇰' },
  { code: 'NO', name: 'Norway', nameBn: 'নরওয়ে', flag: '🇳🇴' },
  { code: 'FI', name: 'Finland', nameBn: 'ফিনল্যান্ড', flag: '🇫🇮' },
  { code: 'PL', name: 'Poland', nameBn: 'পোল্যান্ড', flag: '🇵🇱' },
  { code: 'RU', name: 'Russia', nameBn: 'রাশিয়া', flag: '🇷🇺' },
  { code: 'CN', name: 'China', nameBn: 'চীন', flag: '🇨🇳' },
  { code: 'TH', name: 'Thailand', nameBn: 'থাইল্যান্ড', flag: '🇹🇭' },
  { code: 'MV', name: 'Maldives', nameBn: 'মালদ্বীপ', flag: '🇲🇻' },
  { code: 'NP', name: 'Nepal', nameBn: 'নেপাল', flag: '🇳🇵' },
  { code: 'LK', name: 'Sri Lanka', nameBn: 'শ্রীলঙ্কা', flag: '🇱🇰' },
  { code: 'JO', name: 'Jordan', nameBn: 'জর্ডান', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', nameBn: 'লেবানন', flag: '🇱🇧' },
  { code: 'BR', name: 'Brazil', nameBn: 'ব্রাজিল', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', nameBn: 'আর্জেন্টিনা', flag: '🇦🇷' },
  { code: 'OTHER', name: 'Other Country', nameBn: 'অন্যান্য দেশ', flag: '🌍' }
];

export function getCountryDisplay(countryName?: string): { name: string, flag: string } {
  if (!countryName || countryName.trim() === '' || countryName === 'Bangladesh' || countryName === 'বাংলাদেশ') {
    return { name: 'বাংলাদেশ', flag: '🇧🇩' };
  }
  const match = COUNTRIES.find(c => 
    c.name.toLowerCase() === countryName.toLowerCase() || 
    c.nameBn.toLowerCase() === countryName.toLowerCase() ||
    c.code.toLowerCase() === countryName.toLowerCase()
  );
  if (match) {
    return { name: match.nameBn, flag: match.flag };
  }
  return { name: countryName, flag: '🌍' };
}

export function isProbashi(countryName?: string): boolean {
  if (!countryName) return false;
  const normalized = countryName.trim().toLowerCase();
  return normalized !== '' && 
         normalized !== 'bangladesh' && 
         normalized !== 'বাংলাদেশ' && 
         normalized !== 'bd';
}
