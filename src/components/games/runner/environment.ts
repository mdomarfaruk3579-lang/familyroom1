import * as THREE from 'three';
import { EraId, EraInfo } from './types';

export const ERAS_CONFIG: Record<EraId, EraInfo> = {
  1: {
    id: 1,
    name: 'Present',
    nameBn: 'বর্তমান',
    period: '২০২৪ - আধুনিক ঢাকা',
    description: 'আধুনিক পাকা রাস্তা, আকাশচুম্বী দালান ও আধুনিক যানবাহন',
    groundColor: 0x27272a, // dark tarmac
    roadColor: 0x3f3f46,
    fogColor: 0xe0f2fe,
    skyColor: 0xbae6fd,
    ambientColor: 0xffffff,
    obstacleTypes: ['barrier', 'cones', 'sign'],
  },
  2: {
    id: 2,
    name: '90s Era',
    nameBn: '৯০-এর দশক',
    period: '১৯৯০ - লাল ইটের অলিগলি',
    description: 'স্মৃতিময় পাড়ার অলিগলি, রিকশার টুংটাং শব্দ ও লাল ইটের দেওয়াল',
    groundColor: 0x78350f, // brick-ish
    roadColor: 0x92400e,
    fogColor: 0xfef3c7,
    skyColor: 0xfde68a,
    ambientColor: 0xffedd5,
    obstacleTypes: ['rickshaw', 'crates', 'lamp'],
  },
  3: {
    id: 3,
    name: '60s Era',
    nameBn: '৬০-এর দশক',
    period: '১৯৬০ - বাদল দিনের মেঠোপথ',
    description: 'বৃষ্টিভেজা কাঁচা মেঠোপথ, গরুর গাড়ি, তালগাছ ও কাদার জলছাপ',
    groundColor: 0x14532d, // lush green
    roadColor: 0x713f12, // brown mud road
    fogColor: 0xdcfce7,
    skyColor: 0xbbf7d0,
    ambientColor: 0xf0fdf4,
    obstacleTypes: ['mud', 'cart', 'log'],
  },
  4: {
    id: 4,
    name: 'Old Days',
    nameBn: 'পুরনো দিন',
    period: '১৯৩০ - সুবর্ণ নদীর ঘাট',
    description: 'শান্ত নদীর তীর, পালতোলা ডিঙি নৌকা, সোনালী ধানের খড় ও ভোরের কুয়াশা',
    groundColor: 0x854d0e, // golden earth
    roadColor: 0xa16207,
    fogColor: 0xfef2f2,
    skyColor: 0xfecdd3,
    ambientColor: 0xffedd5,
    obstacleTypes: ['haystack', 'boat', 'fence'],
  },
};

export const LANE_POSITIONS = [-2.2, 0, 2.2];

export interface ObstacleInstance {
  mesh: THREE.Group;
  lane: number;
  z: number;
  type: string;
  isPassed: boolean;
  canSlideUnder: boolean;
  canJumpOver: boolean;
  box: THREE.Box3;
}

export interface CoinInstance {
  mesh: THREE.Mesh;
  lane: number;
  z: number;
  collected: boolean;
}

export interface EnvironmentScene {
  group: THREE.Group;
  roadMesh: THREE.Mesh;
  groundMesh: THREE.Mesh;
  sceneryObjects: THREE.Group[];
  obstacles: ObstacleInstance[];
  coins: CoinInstance[];
  keyPiece: THREE.Group | null;
  update: (playerZ: number, delta: number) => void;
  cleanup: () => void;
}

/**
 * Builds the 3D track, era-specific side scenery, obstacles, coins and key piece.
 */
export function createEraEnvironment(
  eraId: EraId,
  trackLength = 320
): EnvironmentScene {
  const group = new THREE.Group();
  const era = ERAS_CONFIG[eraId];

  // 1. Ground & Road
  const roadWidth = 7.5;
  const roadGeo = new THREE.PlaneGeometry(roadWidth, trackLength + 60);
  const roadMat = new THREE.MeshStandardMaterial({
    color: era.roadColor,
    roughness: 0.8,
    metalness: 0.1,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.rotation.x = -Math.PI / 2;
  roadMesh.position.set(0, 0, trackLength / 2);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  // Road lane divider dashes
  if (eraId === 1 || eraId === 2) {
    const dashCount = Math.floor(trackLength / 6);
    const dashGeo = new THREE.PlaneGeometry(0.15, 2.5);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    for (let i = 0; i < dashCount; i++) {
      [-1.1, 1.1].forEach((x) => {
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.01, i * 6 + 4);
        group.add(dash);
      });
    }
  }

  // Side Ground Terrain
  const groundGeo = new THREE.PlaneGeometry(80, trackLength + 80);
  const groundMat = new THREE.MeshStandardMaterial({
    color: era.groundColor,
    roughness: 0.9,
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.set(0, -0.05, trackLength / 2);
  groundMesh.receiveShadow = true;
  group.add(groundMesh);

  // River on one side for Era 4
  if (eraId === 4) {
    const waterGeo = new THREE.PlaneGeometry(28, trackLength + 60);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.8,
    });
    const river = new THREE.Mesh(waterGeo, waterMat);
    river.rotation.x = -Math.PI / 2;
    river.position.set(-18, -0.15, trackLength / 2);
    group.add(river);
  }

  // 2. Side Scenery along the track
  const sceneryObjects: THREE.Group[] = [];
  const scenerySpacing = 16;
  const numScenery = Math.floor(trackLength / scenerySpacing);

  for (let i = 0; i < numScenery; i++) {
    const z = i * scenerySpacing + 10;
    
    // Left side building / tree / scenery
    const leftItem = createSceneryItem(eraId, -6.5 - Math.random() * 2, z, true);
    group.add(leftItem);
    sceneryObjects.push(leftItem);

    // Right side building / tree / scenery
    const rightItem = createSceneryItem(eraId, 6.5 + Math.random() * 2, z, false);
    group.add(rightItem);
    sceneryObjects.push(rightItem);
  }

  // 3. Obstacles throughout the level
  const obstacles: ObstacleInstance[] = [];
  const obstacleInterval = 22; // obstacle every ~22 units
  const startZ = 28;
  const endZ = trackLength - 30;

  for (let z = startZ; z < endZ; z += obstacleInterval + (Math.random() * 8 - 4)) {
    const laneIndex = Math.floor(Math.random() * 3);
    const laneX = LANE_POSITIONS[laneIndex];
    const type = era.obstacleTypes[Math.floor(Math.random() * era.obstacleTypes.length)];

    const { mesh, canSlideUnder, canJumpOver } = createObstacleMesh(type, eraId);
    mesh.position.set(laneX, 0, z);
    group.add(mesh);

    const box = new THREE.Box3().setFromObject(mesh);
    obstacles.push({
      mesh,
      lane: laneIndex,
      z,
      type,
      isPassed: false,
      canSlideUnder,
      canJumpOver,
      box,
    });
  }

  // 4. Gold Coins (বংশলতার মুদ্রা)
  const coins: CoinInstance[] = [];
  const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 12);
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.9,
    roughness: 0.2,
    emissive: 0x713f12,
  });

  for (let z = 14; z < trackLength - 20; z += 9) {
    const laneIndex = Math.floor(Math.random() * 3);
    const laneX = LANE_POSITIONS[laneIndex];

    const coin = new THREE.Mesh(coinGeo, coinMat);
    coin.rotation.z = Math.PI / 2;
    coin.position.set(laneX, 0.8, z);
    group.add(coin);

    coins.push({
      mesh: coin,
      lane: laneIndex,
      z,
      collected: false,
    });
  }

  // 5. The Golden Key Piece at the end of the level
  const keyPiece = createKeyPieceMesh(eraId);
  keyPiece.position.set(0, 1.2, trackLength - 8);
  group.add(keyPiece);

  // High-performance update loop (culls distant coins for silky 60fps)
  const update = (playerZ: number, delta: number) => {
    // Only animate coins within active camera view distance
    const minZ = playerZ - 6;
    const maxZ = playerZ + 45;
    for (let i = 0; i < coins.length; i++) {
      const coin = coins[i];
      if (!coin.collected && coin.z >= minZ && coin.z <= maxZ) {
        coin.mesh.rotation.y += delta * 3.2;
      }
    }

    // Spin key piece
    if (keyPiece && playerZ > trackLength - 60) {
      keyPiece.rotation.y += delta * 2;
      keyPiece.position.y = 1.2 + Math.sin(Date.now() * 0.003) * 0.2;
    }
  };

  const cleanup = () => {
    // Traverse and dispose materials and geometries
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
      }
    });
  };

  return {
    group,
    roadMesh,
    groundMesh,
    sceneryObjects,
    obstacles,
    coins,
    keyPiece,
    update,
    cleanup,
  };
}

/**
 * Creates era-appropriate scenery objects
 */
function createSceneryItem(eraId: EraId, x: number, z: number, isLeft: boolean): THREE.Group {
  const item = new THREE.Group();
  item.position.set(x, 0, z);

  if (eraId === 1) {
    // Modern City Buildings & Streetlights
    const h = 8 + Math.random() * 10;
    const w = 4 + Math.random() * 2;
    const bGeo = new THREE.BoxGeometry(w, h, 6);
    const bMat = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? 0x334155 : 0x475569,
      roughness: 0.4,
      metalness: 0.3,
    });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.y = h / 2;
    bMesh.castShadow = true;
    item.add(bMesh);

    // Glass window lines
    const winGeo = new THREE.BoxGeometry(w + 0.05, 0.6, 6.05);
    const winMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
    for (let wh = 2; wh < h - 1; wh += 2.5) {
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.y = wh;
      item.add(win);
    }
  } else if (eraId === 2) {
    // 90s Vintage Brick House & Dhaka Rickshaw Garages
    const h = 4 + Math.random() * 3;
    const w = 4.5;
    const brickMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 });
    const bMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 5), brickMat);
    bMesh.position.y = h / 2;
    item.add(bMesh);

    // Vintage Corrugated Tin roof
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7 });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.5, 1.4, 4), roofMat);
    roof.position.y = h + 0.7;
    roof.rotation.y = Math.PI / 4;
    item.add(roof);
  } else if (eraId === 3) {
    // 60s Village Palm / Coconut Trees and Thatch Huts
    if (Math.random() > 0.4) {
      // Palm Tree
      const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 7, 6);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x573e27 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 3.5;
      item.add(trunk);

      // Fronds
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x166534 });
      for (let l = 0; l < 6; l++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.2, 4), leafMat);
        leaf.position.set(0, 7, 0);
        leaf.rotation.x = 0.9;
        leaf.rotation.y = (l * Math.PI) / 3;
        item.add(leaf);
      }
    } else {
      // Clay & bamboo rural hut
      const hut = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 2.5, 3.5),
        new THREE.MeshStandardMaterial({ color: 0xa16207 })
      );
      hut.position.y = 1.25;
      item.add(hut);
    }
  } else {
    // Old Days River Ghat, Bamboo & Golden Straw Stacks
    if (isLeft) {
      // Wooden Country Boat (Dinghy) moored at ghat
      const boatMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
      const boat = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4.5, 4), boatMat);
      boat.rotation.z = Math.PI / 2;
      boat.rotation.y = Math.PI / 6;
      boat.position.set(-2, 0.2, 0);
      item.add(boat);
    } else {
      // Golden Haystack (খড়ের গাদা)
      const hayMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.9 });
      const hay = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.8, 8), hayMat);
      hay.position.y = 1.9;
      item.add(hay);
    }
  }

  return item;
}

/**
 * Creates era-specific obstacles
 */
function createObstacleMesh(
  type: string,
  eraId: EraId
): { mesh: THREE.Group; canSlideUnder: boolean; canJumpOver: boolean } {
  const mesh = new THREE.Group();
  let canSlideUnder = false;
  let canJumpOver = true;

  if (type === 'barrier' || type === 'sign') {
    // Modern Road Barrier
    const barGeo = new THREE.BoxGeometry(1.6, 0.8, 0.2);
    const barMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.3 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.y = 0.45;
    bar.castShadow = true;
    mesh.add(bar);
    canJumpOver = true;
  } else if (type === 'cones') {
    // Traffic Cones
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
    for (let c = -0.4; c <= 0.4; c += 0.8) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.7, 8), coneMat);
      cone.position.set(c, 0.35, 0);
      cone.castShadow = true;
      mesh.add(cone);
    }
    canJumpOver = true;
  } else if (type === 'rickshaw') {
    // 90s Cycle Rickshaw
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 1.4), hoodMat);
    hood.position.y = 0.8;
    hood.castShadow = true;
    mesh.add(hood);
    canJumpOver = false;
  } else if (type === 'crates' || type === 'lamp') {
    // Wooden Crates or low overhead wire (can slide under)
    if (Math.random() > 0.4) {
      const crateMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 1.2), crateMat);
      crate.position.y = 0.38;
      crate.castShadow = true;
      mesh.add(crate);
      canJumpOver = true;
    } else {
      // Low wire / clothesline (must slide)
      const wireMat = new THREE.MeshStandardMaterial({ color: 0x44403c });
      const wire = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.1), wireMat);
      wire.position.y = 1.35;
      mesh.add(wire);
      canSlideUnder = true;
      canJumpOver = false;
    }
  } else if (type === 'mud' || type === 'log') {
    // 60s Mud / Rain puddle or fallen log
    const mudGeo = new THREE.BoxGeometry(1.7, 0.1, 2.2);
    const mudMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.2 });
    const mud = new THREE.Mesh(mudGeo, mudMat);
    mud.position.y = 0.05;
    mesh.add(mud);
    canJumpOver = true;
  } else if (type === 'cart') {
    // Bullock Cart obstacle
    const cartMat = new THREE.MeshStandardMaterial({ color: 0x573e27, roughness: 0.8 });
    const cart = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.6), cartMat);
    cart.position.y = 0.6;
    cart.castShadow = true;
    mesh.add(cart);
    canJumpOver = false;
  } else if (type === 'haystack') {
    // Haystack
    const hayMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
    const hay = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.6, 8), hayMat);
    hay.position.y = 0.8;
    hay.castShadow = true;
    mesh.add(hay);
    canJumpOver = false;
  } else {
    // Bamboo rail fence
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0xa16207 });
    const fence = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.15), fenceMat);
    fence.position.y = 0.3;
    fence.castShadow = true;
    mesh.add(fence);
    canJumpOver = true;
  }

  return { mesh, canSlideUnder, canJumpOver };
}

/**
 * Creates the glowing Golden Key Piece (সিন্দুকের চাবির টুকরো)
 */
function createKeyPieceMesh(eraId: EraId): THREE.Group {
  const group = new THREE.Group();

  const keyMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.9,
    roughness: 0.15,
    emissive: 0xca8a04,
  });

  // Key handle & teeth
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 12), keyMat);
  stem.rotation.z = Math.PI / 2;
  group.add(stem);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 8, 16), keyMat);
  ring.position.x = -0.55;
  group.add(ring);

  const tooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.08), keyMat);
  tooth1.position.set(0.28, -0.15, 0);
  group.add(tooth1);

  const tooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), keyMat);
  tooth2.position.set(0.42, -0.2, 0);
  group.add(tooth2);

  // Soft glowing point light
  const light = new THREE.PointLight(0xfef08a, 1.8, 6);
  group.add(light);

  group.scale.set(1.4, 1.4, 1.4);
  return group;
}
