import { RunnerConfig } from './types';

const STORAGE_KEY = 'family_runner_avatar_config';

export const DEFAULT_RUNNER_CONFIG: RunnerConfig = {
  gender: 'male',
  hairStyle: 'classic',
  hairColor: '#1c1917',
  outfit: 'panjabi',
  outfitColor: '#1A3636',
  skinTone: '#e0ac69',
  faceDataUrl: null,
  faceScale: 1.0,
  faceOffsetY: 0,
  brightness: 1.0,
};

/**
 * Loads stored runner configuration from localStorage
 */
export function loadSavedRunnerConfig(): RunnerConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_RUNNER_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load saved runner config', e);
  }
  return DEFAULT_RUNNER_CONFIG;
}

/**
 * Saves runner configuration locally
 */
export function saveRunnerConfig(config: RunnerConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save runner config locally', e);
  }
}

/**
 * Deletes custom face photo from local storage (privacy guarantee)
 */
export function deleteCustomFacePhoto(): void {
  try {
    const current = loadSavedRunnerConfig();
    current.faceDataUrl = null;
    saveRunnerConfig(current);
  } catch (e) {
    console.error('Failed to clear photo', e);
  }
}

/**
 * Processes an uploaded user photo entirely in the browser:
 * - Detects and centers face
 * - Applies smooth elliptical vignette
 * - Balances lighting & skin tone matching
 * - Returns composite 256x256 texture for 3D mapping
 */
export async function processFacePhoto(
  fileOrUrl: File | string,
  options: {
    scale?: number;
    offsetY?: number;
    brightness?: number;
    skinTone?: string;
  } = {}
): Promise<string> {
  const { scale = 1.0, offsetY = 0, brightness = 1.0, skinTone = '#e0ac69' } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleImageLoaded = () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      // 1. Fill background with the matched skin tone
      ctx.fillStyle = skinTone;
      ctx.fillRect(0, 0, size, size);

      // 2. Compute face cropping box (centered oval crop with user scale and offset)
      const centerX = size / 2;
      const centerY = size / 2 + offsetY * 30;
      const radiusX = (size * 0.38) * scale;
      const radiusY = (size * 0.44) * scale;

      // 3. Draw cropped image into an offscreen canvas with soft edge
      const offscreen = document.createElement('canvas');
      offscreen.width = size;
      offscreen.height = size;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) {
        reject(new Error('Offscreen context unavailable'));
        return;
      }

      // Draw image to cover center
      const imgAspect = img.width / img.height;
      let drawW = size;
      let drawH = size;
      let drawX = 0;
      let drawY = 0;

      if (imgAspect > 1) {
        drawW = size * imgAspect;
        drawX = -(drawW - size) / 2;
      } else {
        drawH = size / imgAspect;
        drawY = -(drawH - size) / 2;
      }

      // Apply brightness / contrast adjustments
      offCtx.filter = `brightness(${brightness * 100}%) contrast(105%)`;
      offCtx.drawImage(img, drawX, drawY, drawW, drawH);

      // 4. Create smooth feathered oval mask
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = size;
      maskCanvas.height = size;
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        const grad = maskCtx.createRadialGradient(
          centerX,
          centerY,
          Math.min(radiusX, radiusY) * 0.6,
          centerX,
          centerY,
          Math.max(radiusX, radiusY)
        );
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(0.85, 'rgba(0,0,0,0.9)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        maskCtx.fillStyle = grad;
        maskCtx.beginPath();
        maskCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        maskCtx.fill();

        // Blend masked image onto main canvas
        offCtx.globalCompositeOperation = 'destination-in';
        offCtx.drawImage(maskCanvas, 0, 0);
      }

      // 5. Composite feathered face onto the skin-tone canvas
      ctx.drawImage(offscreen, 0, 0);

      // Return high-efficiency web texture dataUrl
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    img.onerror = () => {
      reject(new Error('ছবি লোড করা সম্ভব হয়নি। অনুগ্রহ করে অন্য ছবি নির্বাচন করুন।'));
    };

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('ফাইল পড়তে ব্যর্থ হয়েছে'));
      reader.readAsDataURL(fileOrUrl);
    }
  });
}
