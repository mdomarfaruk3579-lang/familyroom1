const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="100" fill="#1A3636"/>
  <circle cx="256" cy="256" r="220" fill="none" stroke="#C19A6B" stroke-width="8" opacity="0.4"/>
  <g fill="#C19A6B" transform="translate(106, 106)">
    <!-- Family Tree Icon -->
    <circle cx="150" cy="70" r="35"/>
    <circle cx="70" cy="190" r="30"/>
    <circle cx="230" cy="190" r="30"/>
    <path d="M150 105 v45 M150 150 H70 v15 M150 150 H230 v15 M150 150 v100" stroke="#C19A6B" stroke-width="14" stroke-linecap="round"/>
    <rect x="120" y="240" width="60" height="20" rx="6" fill="#C19A6B"/>
  </g>
  <text x="256" y="440" font-family="'Hind Siliguri', 'Segoe UI', sans-serif" font-size="44" font-weight="bold" fill="#EAE6DF" text-anchor="middle">ফ্যামিলি রুম</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');

// Function to generate raw PNG binary with zlib
function createPng(width, height, isMaskable = false) {
  // Color palette in RGBA
  // Background: #1A3636 (26, 54, 54, 255)
  // Gold accent: #C19A6B (193, 154, 107, 255)
  // Cream: #EAE6DF (234, 230, 223, 255)
  
  const bgR = 26, bgG = 54, bgB = 54;
  const goldR = 193, goldG = 154, goldB = 107;
  const creamR = 234, creamG = 230, creamB = 223;

  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const cx = width / 2;
  const cy = height / 2;
  const scale = width / 512;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter byte 0 (None)
    for (let x = 0; x < width; x++) {
      let r = bgR, g = bgG, b = bgB, a = 255;
      
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Outer ring
      if (!isMaskable && Math.abs(dist - 220 * scale) < 6 * scale) {
        r = goldR; g = goldG; b = goldB;
      }
      
      // Central icon geometry approximation:
      // Head 1 (top center)
      const dHead1 = Math.hypot(x - cx, y - (cy - 60 * scale));
      if (dHead1 < 32 * scale) {
        r = goldR; g = goldG; b = goldB;
      }

      // Head 2 (left)
      const dHead2 = Math.hypot(x - (cx - 70 * scale), y - (cy + 20 * scale));
      if (dHead2 < 26 * scale) {
        r = goldR; g = goldG; b = goldB;
      }

      // Head 3 (right)
      const dHead3 = Math.hypot(x - (cx + 70 * scale), y - (cy + 20 * scale));
      if (dHead3 < 26 * scale) {
        r = goldR; g = goldG; b = goldB;
      }

      // Connecting branches
      if (y >= cy - 25 * scale && y <= cy + 60 * scale && Math.abs(x - cx) < 6 * scale) {
        r = goldR; g = goldG; b = goldB;
      }
      if (Math.abs(y - (cy - 10 * scale)) < 6 * scale && x >= cx - 70 * scale && x <= cx + 70 * scale) {
        r = goldR; g = goldG; b = goldB;
      }
      if (x >= cx - 40 * scale && x <= cx + 40 * scale && y >= cy + 70 * scale && y <= cy + 86 * scale) {
        r = creamR; g = creamG; b = creamB;
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // Deflate image data
  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation for PNG chunks
function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  const crcValue = crc32(toCrc);
  crcBuf.writeUInt32BE(crcValue, 0);

  return Buffer.concat([lengthBuf, toCrc, crcBuf]);
}

// Simple CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(48, 48, false));

console.log('PWA icons created successfully in /public!');
