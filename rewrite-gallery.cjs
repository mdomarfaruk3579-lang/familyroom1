const fs = require('fs');
const code = `import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { GalleryImage } from '../types';
import { Image as ImageIcon, Plus, Trash2, X, Download } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Gallery() {
  const [photos, setPhotos] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  
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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('আপনি কি নিশ্চিত যে এই ছবিটি মুছে ফেলতে চান? (Are you sure you want to delete this photo?)')) {
      try {
        await deleteDoc(doc(db, 'gallery', id));
        if (selectedPhoto?.id === id) {
          setSelectedPhoto(null);
        }
      } catch (error) {
        console.error("Error deleting photo:", error);
        alert('ছবি মুছে ফেলতে সমস্যা হয়েছে।');
      }
    }
  };

  const handleDownload = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = \`family-photo-\${Date.now()}.jpg\`;
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
          className="text-4xl font-serif font-bold text-[#1A3636] mb-4 flex items-center justify-center gap-3"
        >
          <ImageIcon className="w-8 h-8 text-[#C19A6B]" /> ফ্যামিলি গ্যালারি
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[#736B65] max-w-2xl mx-auto"
        >
          আমাদের পরিবারের সুন্দর স্মৃতি ও মুহূর্তগুলো।
        </motion.p>
        
        {isAdmin && (
          <div className="mt-6 flex justify-center">
            <label className="cursor-pointer bg-[#1A3636] hover:bg-[#2E7D61] text-white px-6 py-3 rounded-full font-bold shadow-md transition-all flex items-center gap-2">
              <Plus className="w-5 h-5" /> {uploading ? 'আপলোড হচ্ছে...' : 'নতুন ছবি যোগ করুন'}
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
                  onClick={(e) => handleDelete(e, photo.id)}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-5xl w-full h-full max-h-[90vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedPhoto.url} 
                alt="Enlarged gallery view" 
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" 
                referrerPolicy="no-referrer"
              />
              
              <div className="absolute top-0 right-0 sm:top-4 sm:right-4 flex items-center gap-2">
                <button
                  onClick={(e) => handleDownload(e, selectedPhoto.url)}
                  className="bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-md transition-colors"
                  title="Download Image"
                >
                  <Download className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-md transition-colors"
                  title="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {isAdmin && (
                <button
                  onClick={(e) => handleDelete(e, selectedPhoto.id)}
                  className="absolute bottom-4 right-4 sm:bottom-4 sm:right-4 bg-red-600/80 hover:bg-red-600 text-white p-3 rounded-full backdrop-blur-md transition-colors shadow-lg"
                  title="Delete Image"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
`
fs.writeFileSync('src/pages/Gallery.tsx', code);
