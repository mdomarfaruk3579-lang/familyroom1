import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { GalleryImage } from '../types';
import { Image as ImageIcon, Plus, Trash2, X, Download } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Gallery() {
  const [photos, setPhotos] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  const { t, lang } = useLanguage();
  
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage));
      setPhotos(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large (max 5MB)');
      return;
    }

    setUploading(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          await addDoc(collection(db, 'gallery'), {
            url: dataUrl,
            createdAt: Date.now()
          });
          
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        };
      };
    } catch (error) {
      console.error("Error setting up upload:", error);
      alert('Error uploading image');
      setUploading(false);
    }
  };

  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!photoToDelete) return;
    try {
      await deleteDoc(doc(db, 'gallery', photoToDelete));
      if (selectedPhoto?.id === photoToDelete) {
        setSelectedPhoto(null);
      }
      setPhotoToDelete(null);
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      alert(`ছবি মুছে ফেলতে সমস্যা হয়েছে: ${error.message}`);
      setPhotoToDelete(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPhotoToDelete(id);
  };

  const handleDownload = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `family-photo-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#EAE6DF] border-t-[#1A3636]"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto py-8 px-4"
    >
      <div className="text-center mb-12">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl sm:text-4xl font-serif font-bold text-[#1A3636] mb-3 flex items-center justify-center gap-3"
        >
          <ImageIcon className="w-8 h-8 text-[#C19A6B]" /> {t('gallery')}
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[#736B65] max-w-2xl mx-auto text-sm sm:text-base"
        >
          {lang === 'bn' ? 'আমাদের পরিবারের সুন্দর স্মৃতি ও মুহূর্তগুলো।' : 'Precious moments and cherished memories of our family.'}
        </motion.p>
        
        {isAdmin && (
          <div className="mt-6 flex justify-center">
            <label className="cursor-pointer bg-[#1A3636] hover:bg-[#2E7D61] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold shadow-md transition-all flex items-center gap-2 text-sm sm:text-base">
              <Plus className="w-5 h-5" /> {uploading ? (lang === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...') : (lang === 'bn' ? 'নতুন ছবি যোগ করুন' : 'Add New Photo')}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} ref={fileInputRef} />
            </label>
          </div>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {photos.map((photo, idx) => (
            <motion.div 
              key={photo.id} 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedPhoto(photo)}
              className="group relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-[#EAE6DF] bg-white cursor-pointer"
            >
              <img 
                src={photo.url} 
                alt="Gallery" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                referrerPolicy="no-referrer" 
              />
              {isAdmin && (
                <button
                  onClick={(e) => handleDeleteClick(e, photo.id)}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-red-500/90 text-white p-1.5 sm:p-2 rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md z-10"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-white rounded-3xl border border-[#EAE6DF] shadow-sm"
        >
          <ImageIcon className="w-16 h-16 mx-auto text-[#d8d2c9] mb-4" />
          <h3 className="text-xl font-serif font-bold text-[#1A3636] mb-2">গ্যালারিতে কোনো ছবি নেই</h3>
          <p className="text-[#888]">অ্যাডমিন প্যানেল থেকে ছবি আপলোড করলে এখানে দেখা যাবে।</p>
        </motion.div>
      )}

      {/* Fullscreen Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/92 p-4 pt-20 sm:pt-22 backdrop-blur-md"
            onClick={() => setSelectedPhoto(null)}
          >
            {/* Top Action Bar - Positioned clearly below the app's header bar */}
            <div 
              className="fixed top-18 sm:top-20 right-4 sm:right-8 z-[75] flex items-center gap-2.5 bg-stone-900/85 border border-white/20 px-3.5 py-1.5 rounded-full backdrop-blur-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => handleDownload(e, selectedPhoto.url)}
                className="flex items-center gap-1.5 text-white hover:text-amber-200 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                title="Save / Download Image"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>সেভ করুন</span>
              </button>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="flex items-center gap-1.5 text-white hover:text-red-200 bg-red-600/30 hover:bg-red-600/60 border border-red-400/30 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                title="Close Lightbox"
              >
                <X className="w-4 h-4 text-red-300" />
                <span>বন্ধ করুন</span>
              </button>
            </div>

            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-5xl w-full h-full max-h-[82vh] flex flex-col items-center justify-center mt-6"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedPhoto.url} 
                alt="Enlarged gallery view" 
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
                referrerPolicy="no-referrer"
              />

              {isAdmin && (
                <button
                  onClick={(e) => handleDeleteClick(e, selectedPhoto.id)}
                  className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-red-600/90 hover:bg-red-600 text-white p-3 rounded-full backdrop-blur-md transition-all shadow-xl active:scale-95"
                  title="Delete Image"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {photoToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setPhotoToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#1A3636] mb-2">ছবি মুছুন</h3>
              <p className="text-[#736B65] mb-6">আপনি কি নিশ্চিত যে এই ছবিটি গ্যালারি থেকে মুছে ফেলতে চান?</p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setPhotoToDelete(null)}
                  className="px-5 py-2.5 rounded-full font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  না, বাতিল করুন
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2.5 rounded-full font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md"
                >
                  হ্যাঁ, মুছে ফেলুন
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
