import * as THREE from 'three';
import { RunnerConfig } from './types';

export interface CharacterRig {
  root: THREE.Group;
  body: THREE.Group;
  torso: THREE.Group;
  neck: THREE.Mesh;
  head: THREE.Group;
  headMesh: THREE.Mesh;
  hair: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftHand: THREE.Group;
  rightHand: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftShin: THREE.Group;
  rightShin: THREE.Group;
  leftShoe: THREE.Mesh;
  rightShoe: THREE.Mesh;
  baton: THREE.Group;
  dustParticles: THREE.Points;
  setBatonVisible: (visible: boolean) => void;
  updateFaceTexture: (textureUrl: string | null) => void;
  updateDust: (delta: number, isMoving: boolean) => void;
}

/**
 * Creates high-fidelity procedural default Bengali face canvas texture
 * when the user plays without uploading a photo.
 */
function createRealisticFaceTexture(skinTone = '#e0ac69', isFemale = false): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 1. Base skin tone with radial gradient for 3D facial depth
    const grad = ctx.createRadialGradient(256, 256, 60, 256, 256, 260);
    grad.addColorStop(0, skinTone);
    grad.addColorStop(0.85, skinTone);
    // Darken slightly towards perimeter for natural contour
    grad.addColorStop(1, 'rgba(0,0,0,0.18)');

    ctx.fillStyle = skinTone;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Subtle cheek blush
    const blushGradL = ctx.createRadialGradient(160, 310, 10, 160, 310, 70);
    blushGradL.addColorStop(0, 'rgba(239, 68, 68, 0.12)');
    blushGradL.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = blushGradL;
    ctx.fillRect(90, 240, 140, 140);

    const blushGradR = ctx.createRadialGradient(352, 310, 10, 352, 310, 70);
    blushGradR.addColorStop(0, 'rgba(239, 68, 68, 0.12)');
    blushGradR.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = blushGradR;
    ctx.fillRect(282, 240, 140, 140);

    // 2. Realistic Eyebrows
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = isFemale ? 6 : 9;
    ctx.lineCap = 'round';

    // Left Eyebrow
    ctx.beginPath();
    ctx.moveTo(140, 195);
    ctx.quadraticCurveTo(185, 175, 230, 190);
    ctx.stroke();

    // Right Eyebrow
    ctx.beginPath();
    ctx.moveTo(372, 195);
    ctx.quadraticCurveTo(327, 175, 282, 190);
    ctx.stroke();

    // 3. Eyes (Almond shape, white cornea, brown iris, black pupil, specular highlight)
    const drawEye = (centerX: number, centerY: number) => {
      // Eyelid crease
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY - 8, 30, Math.PI * 0.8, Math.PI * 0.2, true);
      ctx.stroke();

      // Cornea (Eye White)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 34, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Upper Eyelash line
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = isFemale ? 5 : 3.5;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - 2, 34, 18, 0, Math.PI * 0.95, Math.PI * 0.05, true);
      ctx.stroke();

      // Iris (Warm dark brown with ring)
      const irisGrad = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, 15);
      irisGrad.addColorStop(0, '#451a03');
      irisGrad.addColorStop(0.7, '#291002');
      irisGrad.addColorStop(1, '#090401');
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Catchlight / Specular reflection
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX - 4.5, centerY - 4.5, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + 3.5, centerY + 3.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    };

    drawEye(185, 222);
    drawEye(327, 222);

    // 4. Nose (Subtle bridge and shaded nostrils)
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(256, 215);
    ctx.lineTo(252, 280);
    ctx.quadraticCurveTo(256, 292, 268, 292);
    ctx.stroke();

    // Nostrils
    ctx.fillStyle = 'rgba(67, 20, 7, 0.45)';
    ctx.beginPath();
    ctx.ellipse(244, 294, 6, 3.5, -0.2, 0, Math.PI * 2);
    ctx.ellipse(268, 294, 6, 3.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 5. Lips (Natural healthy Bengali smile)
    ctx.fillStyle = isFemale ? '#be123c' : '#a855f7';
    ctx.fillStyle = isFemale ? 'rgba(190, 24, 93, 0.65)' : 'rgba(180, 83, 9, 0.45)';

    // Upper lip
    ctx.beginPath();
    ctx.moveTo(215, 342);
    ctx.quadraticCurveTo(256, 332, 297, 342);
    ctx.quadraticCurveTo(256, 346, 215, 342);
    ctx.fill();

    // Lower lip with soft highlight
    ctx.beginPath();
    ctx.moveTo(217, 343);
    ctx.quadraticCurveTo(256, 368, 295, 343);
    ctx.fill();

    // Lip center line
    ctx.strokeStyle = 'rgba(76, 29, 149, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(212, 342);
    ctx.quadraticCurveTo(256, 345, 300, 342);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates upgraded 3D stylized-realistic humanoid runner character
 */
export function createCharacter(config: RunnerConfig, hasBaton = true): CharacterRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const skinColor = new THREE.Color(config.skinTone || '#e0ac69');
  const hairColor = new THREE.Color(config.hairColor || '#1c1917');
  const outfitColor = new THREE.Color(config.outfitColor || '#1A3636');
  const isFemale = config.gender === 'female';

  // 1. Enhanced PBR Materials
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.55,
    metalness: 0.05,
  });

  const outfitMaterial = new THREE.MeshStandardMaterial({
    color: outfitColor,
    roughness: 0.65,
    metalness: 0.08,
  });

  const goldZariMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.85,
  });

  const pantsMaterial = new THREE.MeshStandardMaterial({
    color: config.outfit === 'panjabi' ? 0xf8fafc : 0x1e293b,
    roughness: 0.75,
    metalness: 0.05,
  });

  const shoeUpperMaterial = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.6,
  });

  const shoeSoleMaterial = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.8,
  });

  const hairMaterial = new THREE.MeshStandardMaterial({
    color: hairColor,
    roughness: 0.7,
  });

  // 2. Torso with Realistic Proportions & Collar
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.05;
  body.add(torsoGroup);

  const torsoWidth = isFemale ? 0.42 : 0.48;
  const torsoChestGeo = new THREE.BoxGeometry(torsoWidth, 0.68, 0.28);
  const torso = new THREE.Mesh(torsoChestGeo, outfitMaterial);
  torso.castShadow = true;
  torso.receiveShadow = true;
  torsoGroup.add(torso);

  // Mandarin Stand Collar (পাঞ্জাবি / শার্টের কলার)
  const collarGeo = new THREE.CylinderGeometry(0.13, 0.14, 0.08, 16);
  const collar = new THREE.Mesh(collarGeo, outfitMaterial);
  collar.position.set(0, 0.36, 0.02);
  collar.castShadow = true;
  torsoGroup.add(collar);

  // Golden Placket Buttons (পাঞ্জাবির সোনালী বোতাম)
  for (let b = 0; b < 3; b++) {
    const button = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.01, 8),
      goldZariMaterial
    );
    button.rotation.x = Math.PI / 2;
    button.position.set(0, 0.22 - b * 0.11, 0.145);
    torsoGroup.add(button);
  }

  // Saree / Salwar Zari Border Embellishment
  if (isFemale && (config.outfit === 'saree' || config.outfit === 'salwar')) {
    const palluGeo = new THREE.BoxGeometry(0.18, 0.72, 0.31);
    const pallu = new THREE.Mesh(palluGeo, outfitMaterial);
    pallu.position.set(-0.09, 0.02, 0);
    pallu.rotation.z = 0.22;
    pallu.castShadow = true;
    torsoGroup.add(pallu);

    // Gold embroidered border strip
    const borderStrip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.74, 0.32), goldZariMaterial);
    borderStrip.position.set(-0.16, 0.02, 0);
    borderStrip.rotation.z = 0.22;
    torsoGroup.add(borderStrip);
  }

  // 3. Neck & Sculpted Head
  const neckGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.14, 12);
  const neck = new THREE.Mesh(neckGeo, skinMaterial);
  neck.position.set(0, 0.42, 0);
  neck.castShadow = true;
  torsoGroup.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.62, 0);
  body.add(headGroup);

  // Sculpted Head Mesh with smooth edges
  const headGeo = new THREE.BoxGeometry(0.32, 0.38, 0.34);
  const headMaterials: THREE.Material[] = [
    skinMaterial, // right
    skinMaterial, // left
    skinMaterial, // top
    skinMaterial, // bottom
    skinMaterial, // front (Face texture)
    skinMaterial, // back
  ];

  const headMesh = new THREE.Mesh(headGeo, headMaterials);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Anatomical Ears
  [-0.175, 0.175].forEach((xSide) => {
    const ear = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.12, 0.08),
      skinMaterial
    );
    ear.position.set(xSide, 0, -0.02);
    headGroup.add(ear);
  });

  // Face Texture Updater
  const textureLoader = new THREE.TextureLoader();
  const updateFaceTexture = (textureUrl: string | null) => {
    if (textureUrl) {
      textureLoader.load(textureUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        (headMesh.material as THREE.Material[])[4] = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.5,
          metalness: 0.04,
        });
        headMesh.material = [...(headMesh.material as THREE.Material[])];
      });
    } else {
      // Use realistic default procedural face texture
      const defaultFaceTex = createRealisticFaceTexture(config.skinTone, isFemale);
      (headMesh.material as THREE.Material[])[4] = new THREE.MeshStandardMaterial({
        map: defaultFaceTex,
        roughness: 0.55,
      });
      headMesh.material = [...(headMesh.material as THREE.Material[])];
    }
  };

  updateFaceTexture(config.faceDataUrl);

  // 4. Layered Hairstyles
  const hair = new THREE.Group();
  if (config.hairStyle === 'short' || config.hairStyle === 'classic') {
    // Top Crown
    const crown = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.36), hairMaterial);
    crown.position.set(0, 0.16, -0.01);
    hair.add(crown);

    // Front Sweep Fringe
    const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.08, 0.08), hairMaterial);
    fringe.position.set(0, 0.18, 0.16);
    hair.add(fringe);

    // Sideburns
    [-0.17, 0.17].forEach((sideX) => {
      const sideburn = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.12), hairMaterial);
      sideburn.position.set(sideX, 0.06, 0.02);
      hair.add(sideburn);
    });
  } else if (config.hairStyle === 'curly') {
    // Volumetric textured curls
    for (let c = 0; c < 9; c++) {
      const curl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), hairMaterial);
      curl.position.set(
        (Math.random() - 0.5) * 0.3,
        0.18 + Math.random() * 0.05,
        (Math.random() - 0.5) * 0.3
      );
      hair.add(curl);
    }
  } else {
    // Long hair / flowing style
    const crown = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.36), hairMaterial);
    crown.position.set(0, 0.15, -0.01);
    hair.add(crown);

    const backBraid = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), hairMaterial);
    backBraid.position.set(0, -0.12, -0.2);
    hair.add(backBraid);
  }
  headGroup.add(hair);

  // 5. Jointed Limbs with Realistic Hands & Shoes
  // Arms
  const armWidth = torsoWidth / 2 + 0.09;
  
  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-armWidth, 0.28, 0);
  const leftShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), outfitMaterial);
  leftShoulder.position.y = -0.15;
  leftShoulder.castShadow = true;
  leftArm.add(leftShoulder);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.3, 0);
  const leftLowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.1), skinMaterial);
  leftLowerArm.position.y = -0.14;
  leftLowerArm.castShadow = true;
  leftForearm.add(leftLowerArm);

  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.28, 0);
  const leftPalm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.07), skinMaterial);
  leftPalm.position.y = -0.04;
  leftHand.add(leftPalm);
  leftForearm.add(leftHand);
  leftArm.add(leftForearm);
  torsoGroup.add(leftArm);

  // Right Arm (holds the baton)
  const rightArm = new THREE.Group();
  rightArm.position.set(armWidth, 0.28, 0);
  const rightShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), outfitMaterial);
  rightShoulder.position.y = -0.15;
  rightShoulder.castShadow = true;
  rightArm.add(rightShoulder);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.3, 0);
  const rightLowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.1), skinMaterial);
  rightLowerArm.position.y = -0.14;
  rightLowerArm.castShadow = true;
  rightForearm.add(rightLowerArm);

  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.28, 0);
  const rightPalm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.07), skinMaterial);
  rightPalm.position.y = -0.04;
  rightHand.add(rightPalm);
  rightForearm.add(rightHand);
  rightArm.add(rightForearm);
  torsoGroup.add(rightArm);

  // 6. Upgraded Golden Baton with Filigree Rings
  const baton = new THREE.Group();
  const batonCoreGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.42, 12);
  const batonCore = new THREE.Mesh(batonCoreGeo, goldZariMaterial);
  baton.add(batonCore);

  [-0.14, 0, 0.14].forEach((ringY) => {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.028, 0.005, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.9, roughness: 0.1 })
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = ringY;
    baton.add(band);
  });

  // Glowing energy tip
  const tipLight = new THREE.PointLight(0xfef08a, 0.8, 2);
  tipLight.position.set(0, 0.21, 0);
  baton.add(tipLight);

  baton.rotation.x = Math.PI / 2;
  baton.position.set(0, -0.06, 0.08);
  baton.visible = hasBaton;
  rightHand.add(baton);

  const setBatonVisible = (visible: boolean) => {
    baton.visible = visible;
  };

  // 7. Legs & Realistic Shoes with Outsoles
  const legX = torsoWidth / 4;

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-legX, -0.34, 0);
  const leftThigh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 0.14), pantsMaterial);
  leftThigh.position.y = -0.18;
  leftThigh.castShadow = true;
  leftLeg.add(leftThigh);

  const leftShin = new THREE.Group();
  leftShin.position.set(0, -0.36, 0);
  const leftLowerLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.12), pantsMaterial);
  leftLowerLeg.position.y = -0.18;
  leftLowerLeg.castShadow = true;
  leftShin.add(leftLowerLeg);

  // Left Shoe (Upper + White Outsole)
  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.24), shoeUpperMaterial);
  leftShoe.position.set(0, -0.35, 0.04);
  leftShoe.castShadow = true;
  const leftSole = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.25), shoeSoleMaterial);
  leftSole.position.set(0, -0.045, 0);
  leftShoe.add(leftSole);
  leftShin.add(leftShoe);
  leftLeg.add(leftShin);
  torsoGroup.add(leftLeg);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(legX, -0.34, 0);
  const rightThigh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 0.14), pantsMaterial);
  rightThigh.position.y = -0.18;
  rightThigh.castShadow = true;
  rightLeg.add(rightThigh);

  const rightShin = new THREE.Group();
  rightShin.position.set(0, -0.36, 0);
  const rightLowerLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.12), pantsMaterial);
  rightLowerLeg.position.y = -0.18;
  rightLowerLeg.castShadow = true;
  rightShin.add(rightLowerLeg);

  // Right Shoe (Upper + White Outsole)
  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.24), shoeUpperMaterial);
  rightShoe.position.set(0, -0.35, 0.04);
  rightShoe.castShadow = true;
  const rightSole = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.25), shoeSoleMaterial);
  rightSole.position.set(0, -0.045, 0);
  rightShoe.add(rightSole);
  rightShin.add(rightShoe);
  rightLeg.add(rightShin);
  torsoGroup.add(rightLeg);

  // 8. Ground Running Dust Particle System
  const dustCount = 18;
  const dustGeo = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount * 3; i++) {
    dustPositions[i] = (Math.random() - 0.5) * 0.4;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

  const dustMat = new THREE.PointsMaterial({
    color: 0xd6bd98,
    size: 0.1,
    transparent: true,
    opacity: 0.6,
  });
  const dustParticles = new THREE.Points(dustGeo, dustMat);
  dustParticles.position.set(0, 0.05, -0.2);
  root.add(dustParticles);

  const updateDust = (delta: number, isMoving: boolean) => {
    if (!isMoving) {
      dustParticles.visible = false;
      return;
    }
    dustParticles.visible = true;
    const pos = dustParticles.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3 + 2] -= delta * 3; // move backward
      pos[i * 3 + 1] += delta * 0.5; // drift up
      if (pos[i * 3 + 2] < -1.2) {
        pos[i * 3] = (Math.random() - 0.5) * 0.35;
        pos[i * 3 + 1] = 0.02 + Math.random() * 0.06;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
      }
    }
    dustParticles.geometry.attributes.position.needsUpdate = true;
  };

  return {
    root,
    body,
    torso: torsoGroup,
    neck,
    head: headGroup,
    headMesh,
    hair,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftHand,
    rightHand,
    leftLeg,
    rightLeg,
    leftShin,
    rightShin,
    leftShoe,
    rightShoe,
    baton,
    dustParticles,
    setBatonVisible,
    updateFaceTexture,
    updateDust,
  };
}

/**
 * Natural, fluid running kinematics with heel-to-toe stride,
 * torso breathing, counter-arm swinging and spine roll
 */
export function animateRunning(rig: CharacterRig, time: number, speedMultiplier = 1): void {
  const t = time * 13 * speedMultiplier;

  // Alternating leg swings with natural knee flex and foot angle
  rig.leftLeg.rotation.x = Math.sin(t) * 0.8;
  rig.rightLeg.rotation.x = -Math.sin(t) * 0.8;

  rig.leftShin.rotation.x = Math.max(0, -Math.sin(t) * 1.05);
  rig.rightShin.rotation.x = Math.max(0, Math.sin(t) * 1.05);

  rig.leftShoe.rotation.x = Math.sin(t) * 0.25;
  rig.rightShoe.rotation.x = -Math.sin(t) * 0.25;

  // Counter-arm sprint swing
  rig.leftArm.rotation.x = -Math.sin(t) * 0.72;
  rig.rightArm.rotation.x = Math.sin(t) * 0.72;

  rig.leftForearm.rotation.x = -0.55 - Math.abs(Math.sin(t)) * 0.35;
  rig.rightForearm.rotation.x = -0.55 - Math.abs(Math.sin(t)) * 0.35;

  // Running bounce, spine tilt and shoulder sway
  rig.body.position.y = Math.abs(Math.sin(t * 2)) * 0.09;
  rig.body.rotation.y = Math.sin(t) * 0.07;
  rig.torso.rotation.x = 0.14; // Forward athletic sprint lean
}

/**
 * Jumping pose
 */
export function animateJumping(rig: CharacterRig, progress: number): void {
  rig.leftLeg.rotation.x = -0.65;
  rig.rightLeg.rotation.x = -0.45;
  rig.leftShin.rotation.x = 1.15;
  rig.rightShin.rotation.x = 0.9;

  rig.leftArm.rotation.x = -1.35;
  rig.rightArm.rotation.x = -1.15;
  rig.leftForearm.rotation.x = -0.4;
  rig.rightForearm.rotation.x = -0.4;

  rig.torso.rotation.x = -0.08;
  rig.body.position.y = Math.sin(progress * Math.PI) * 1.85;
}

/**
 * Sliding pose
 */
export function animateSliding(rig: CharacterRig): void {
  rig.torso.rotation.x = -0.75; // Low lean-back slide
  rig.body.position.y = -0.52; // Drop close to track

  rig.leftLeg.rotation.x = -1.45;
  rig.rightLeg.rotation.x = -1.25;
  rig.leftShin.rotation.x = 0.15;
  rig.rightShin.rotation.x = 0.15;

  rig.leftArm.rotation.x = 0.9;
  rig.rightArm.rotation.x = 0.7;
}

/**
 * Baton handover animation between two runners
 */
export function animateBatonPass(
  giver: CharacterRig,
  receiver: CharacterRig,
  progress: number
): void {
  giver.rightArm.rotation.x = -1.25 * Math.min(progress * 1.5, 1);
  giver.rightForearm.rotation.x = -0.15;

  receiver.leftArm.rotation.x = 1.15 * Math.min(progress * 1.5, 1);
  receiver.head.rotation.y = -0.45 * (1 - progress);

  if (progress >= 0.5) {
    giver.setBatonVisible(false);
    receiver.setBatonVisible(true);
  } else {
    giver.setBatonVisible(true);
    receiver.setBatonVisible(false);
  }
}
