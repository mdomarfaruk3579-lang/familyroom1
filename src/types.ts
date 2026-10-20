export interface TimelineItem {
  id?: string;
  dateOrYear: string;
  title: string;
  description?: string;
}

export interface Member {
  id: string;
  name: string;
  nameEn?: string;
  role: string;
  birthYear?: string;
  deathYear?: string;
  dob?: string; // dd/mm/yyyy
  phone?: string;
  email?: string;
  socialLinks?: {
    facebook?: string;
    whatsapp?: string;
    instagram?: string;
    other?: string;
  };
  timeline?: TimelineItem[];
  timelineEnded?: boolean;
  bio?: string;
  photoUrl?: string;
  gallery?: string[];
  type: string; // 'grandpa', 'grandma', 'son', 'daughter', 'spouse', 'grandchild', 'great-grandchild', etc.
  parentId?: string | null;
  spouseId?: string | null;
  gender?: 'male' | 'female';
  order: number;
  createdAt?: number;
}

export interface User {
  uid: string;
  email: string | null;
  role: 'admin' | 'user';
}

export interface AboutPost {
  id: string;
  title: string;
  content: string;
  photoUrl?: string;
  createdAt: number;
  order: number;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  createdAt: number;
}
