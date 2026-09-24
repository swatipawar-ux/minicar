import * as THREE from 'three';
import { CarId } from '../types/game';

export interface CarMeshContainer {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  exhaustPoints: THREE.Vector3[];
  headlights: THREE.Light[];
  underglowLight: THREE.PointLight;
  bodyMesh: THREE.Mesh;
  brakeLights: THREE.Mesh[];
}

export function buildCarModel(type: CarId, customColorHex?: string): CarMeshContainer {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const brakeLights: THREE.Mesh[] = [];
  const headlights: THREE.Light[] = [];
  const exhaustPoints: THREE.Vector3[] = [];

  // Default colors
  let primaryColor = 0xff0055;
  if (customColorHex) {
    primaryColor = parseInt(customColorHex.replace('#', '0x'), 16);
  } else if (type === 'muscle') {
    primaryColor = 0xf59e0b;
  } else if (type === 'cyber') {
    primaryColor = 0x64748b;
  } else if (type === 'phantom') {
    primaryColor = 0x8b5cf6;
  }

  const primaryMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    metalness: type === 'cyber' ? 0.9 : 0.6,
    roughness: type === 'cyber' ? 0.2 : 0.25,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x050510,
    metalness: 0.9,
    roughness: 0.1,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x111115,
    metalness: 0.4,
    roughness: 0.6,
  });

  const neonMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
  });

  let mainBodyMesh: THREE.Mesh;

  if (type === 'sport') {
    // Supercar Body
    const lowerBodyGeo = new THREE.BoxGeometry(1.6, 0.4, 3.4);
    mainBodyMesh = new THREE.Mesh(lowerBodyGeo, primaryMat);
    mainBodyMesh.position.y = 0.45;
    mainBodyMesh.castShadow = true;
    group.add(mainBodyMesh);

    // Aerodynamic Cabin
    const cabinGeo = new THREE.BoxGeometry(1.15, 0.45, 1.6);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 0.75, -0.2);
    cabin.castShadow = true;
    group.add(cabin);

    // Front hood slope
    const hoodGeo = new THREE.BoxGeometry(1.3, 0.2, 1.0);
    const hood = new THREE.Mesh(hoodGeo, primaryMat);
    hood.position.set(0, 0.52, 1.1);
    group.add(hood);

    // Rear Spoiler
    const wingGeo = new THREE.BoxGeometry(1.5, 0.08, 0.35);
    const wing = new THREE.Mesh(wingGeo, trimMat);
    wing.position.set(0, 0.95, -1.6);
    group.add(wing);

    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), trimMat);
    postL.position.set(-0.5, 0.8, -1.6);
    const postR = postL.clone();
    postR.position.x = 0.5;
    group.add(postL, postR);

    // Front Splitter
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.3), trimMat);
    splitter.position.set(0, 0.2, 1.7);
    group.add(splitter);

    exhaustPoints.push(new THREE.Vector3(-0.4, 0.38, -1.75));
    exhaustPoints.push(new THREE.Vector3(0.4, 0.38, -1.75));
  } else if (type === 'muscle') {
    // Widebody Muscle Car
    const bodyGeo = new THREE.BoxGeometry(1.85, 0.65, 3.5);
    mainBodyMesh = new THREE.Mesh(bodyGeo, primaryMat);
    mainBodyMesh.position.y = 0.55;
    mainBodyMesh.castShadow = true;
    group.add(mainBodyMesh);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.35, 0.5, 1.8);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 0.9, -0.3);
    group.add(cabin);

    // Hood scoop (blower / intake)
    const scoopGeo = new THREE.BoxGeometry(0.55, 0.25, 0.7);
    const scoop = new THREE.Mesh(scoopGeo, trimMat);
    scoop.position.set(0, 0.95, 0.8);
    group.add(scoop);

    // Twin Racing Stripes
    const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.68, 3.52), trimMat);
    stripeL.position.set(-0.25, 0.55, 0);
    const stripeR = stripeL.clone();
    stripeR.position.x = 0.25;
    group.add(stripeL, stripeR);

    // Ducktail spoiler
    const ducktail = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 0.15), trimMat);
    ducktail.position.set(0, 0.85, -1.75);
    ducktail.rotation.x = 0.2;
    group.add(ducktail);

    exhaustPoints.push(new THREE.Vector3(-0.55, 0.35, -1.8));
    exhaustPoints.push(new THREE.Vector3(0.55, 0.35, -1.8));
  } else if (type === 'cyber') {
    // Angular Cyber Truck / Wedge
    const lowerGeo = new THREE.BoxGeometry(1.95, 0.6, 3.6);
    mainBodyMesh = new THREE.Mesh(lowerGeo, primaryMat);
    mainBodyMesh.position.y = 0.65;
    mainBodyMesh.castShadow = true;
    group.add(mainBodyMesh);

    // Angular roof pyramid top
    const roofGeo = new THREE.CylinderGeometry(0.8, 1.85, 0.65, 4);
    const roof = new THREE.Mesh(roofGeo, primaryMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 1.15, -0.2);
    group.add(roof);

    // Front horizontal LED light bar
    const lightBarGeo = new THREE.BoxGeometry(1.85, 0.08, 0.08);
    const lightBarMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const frontLightBar = new THREE.Mesh(lightBarGeo, lightBarMat);
    frontLightBar.position.set(0, 0.75, 1.82);
    group.add(frontLightBar);

    // Rear laser light bar
    const rearBarGeo = new THREE.BoxGeometry(1.85, 0.08, 0.08);
    const rearBarMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const rearLightBar = new THREE.Mesh(rearBarGeo, rearBarMat);
    rearLightBar.position.set(0, 0.8, -1.82);
    group.add(rearLightBar);
    brakeLights.push(rearLightBar);

    exhaustPoints.push(new THREE.Vector3(-0.5, 0.45, -1.85));
    exhaustPoints.push(new THREE.Vector3(0.5, 0.45, -1.85));
  } else {
    // Phantom Prototype X
    const protoGeo = new THREE.BoxGeometry(1.7, 0.35, 3.6);
    mainBodyMesh = new THREE.Mesh(protoGeo, primaryMat);
    mainBodyMesh.position.y = 0.38;
    mainBodyMesh.castShadow = true;
    group.add(mainBodyMesh);

    // Aerodynamic Bubble Cockpit
    const bubbleGeo = new THREE.SphereGeometry(0.65, 16, 12);
    const bubble = new THREE.Mesh(bubbleGeo, glassMat);
    bubble.scale.set(0.9, 0.65, 1.8);
    bubble.position.set(0, 0.65, -0.1);
    group.add(bubble);

    // Shark fin dorsal stabilizer
    const finGeo = new THREE.BoxGeometry(0.06, 0.5, 1.4);
    const fin = new THREE.Mesh(finGeo, primaryMat);
    fin.position.set(0, 0.8, -1.0);
    group.add(fin);

    // Giant Prototype Wing
    const wingGeo = new THREE.BoxGeometry(1.8, 0.06, 0.45);
    const wing = new THREE.Mesh(wingGeo, trimMat);
    wing.position.set(0, 0.9, -1.75);
    group.add(wing);

    exhaustPoints.push(new THREE.Vector3(-0.35, 0.35, -1.85));
    exhaustPoints.push(new THREE.Vector3(0.35, 0.35, -1.85));
  }

  // --- Common Elements: Headlights & Taillights ---
  if (type !== 'cyber') {
    const headGeo = new THREE.BoxGeometry(0.35, 0.12, 0.1);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x99ffff });
    const headL = new THREE.Mesh(headGeo, headMat);
    headL.position.set(-0.65, 0.5, 1.71);
    const headR = headL.clone();
    headR.position.x = 0.65;
    group.add(headL, headR);

    // Taillights
    const tailGeo = new THREE.BoxGeometry(0.35, 0.12, 0.1);
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const tailL = new THREE.Mesh(tailGeo, tailMat);
    tailL.position.set(-0.65, 0.55, -1.71);
    const tailR = tailL.clone();
    tailR.position.x = 0.65;
    group.add(tailL, tailR);
    brakeLights.push(tailL, tailR);
  }

  // Headlight spot/point lights pointing forward
  const headSpotL = new THREE.SpotLight(0x00ffff, 1.5, 45, Math.PI / 6, 0.5);
  headSpotL.position.set(-0.6, 0.5, 1.8);
  headSpotL.target.position.set(-0.6, 0.1, 20);
  group.add(headSpotL);
  group.add(headSpotL.target);
  headlights.push(headSpotL);

  const headSpotR = new THREE.SpotLight(0x00ffff, 1.5, 45, Math.PI / 6, 0.5);
  headSpotR.position.set(0.6, 0.5, 1.8);
  headSpotR.target.position.set(0.6, 0.1, 20);
  group.add(headSpotR);
  group.add(headSpotR.target);
  headlights.push(headSpotR);

  // --- Neon Chassis Underglow ---
  const underglowLight = new THREE.PointLight(0x00ffff, 2.0, 4.0);
  underglowLight.position.set(0, 0.15, 0);
  group.add(underglowLight);

  // Underglow neon neon tube mesh
  const tubeGeo = new THREE.BoxGeometry(1.3, 0.04, 2.6);
  const underglowMesh = new THREE.Mesh(tubeGeo, neonMat);
  underglowMesh.position.set(0, 0.15, 0);
  group.add(underglowMesh);

  // --- Wheels ---
  const wheelRadius = type === 'cyber' ? 0.36 : 0.32;
  const wheelWidth = type === 'muscle' ? 0.32 : 0.24;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 18);
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.8,
  });

  const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, wheelWidth + 0.02, 6);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.85,
    roughness: 0.2,
  });

  const widthOffset = type === 'muscle' || type === 'cyber' ? 0.95 : 0.85;
  const wheelPositions = [
    [-widthOffset, wheelRadius, 1.05],
    [widthOffset, wheelRadius, 1.05],
    [-widthOffset, wheelRadius, -1.05],
    [widthOffset, wheelRadius, -1.05],
  ];

  wheelPositions.forEach((pos) => {
    const wheelGroup = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, wheelMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;

    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;

    wheelGroup.add(tire, rim);
    wheelGroup.position.set(pos[0], pos[1], pos[2]);
    group.add(wheelGroup);
    wheels.push(tire);
  });

  return {
    group,
    wheels,
    exhaustPoints,
    headlights,
    underglowLight,
    bodyMesh: mainBodyMesh,
    brakeLights,
  };
}

export const CAR_CONFIGS: Record<CarId, {
  id: CarId;
  name: string;
  tagline: string;
  category: string;
  accentColor: string;
  availableColors: string[];
  stats: {
    topSpeed: number;
    acceleration: number;
    handling: number;
    nitroEfficiency: number;
  };
  dimensions: { width: number; height: number; length: number };
}> = {
  sport: {
    id: 'sport',
    name: 'Apex GT',
    tagline: 'Balanced track weapon with razor aerodynamics',
    category: 'Supercar',
    accentColor: '#ec4899',
    availableColors: ['#ec4899', '#06b6d4', '#ef4444', '#10b981', '#f59e0b', '#ffffff'],
    stats: {
      topSpeed: 195,
      acceleration: 8,
      handling: 9,
      nitroEfficiency: 7,
    },
    dimensions: { width: 1.6, height: 0.9, length: 3.4 },
  },
  muscle: {
    id: 'muscle',
    name: 'V8 Torquer',
    tagline: 'Raw American brute force & thunderous torque',
    category: 'Muscle',
    accentColor: '#f59e0b',
    availableColors: ['#f59e0b', '#dc2626', '#1e293b', '#2563eb', '#84cc16'],
    stats: {
      topSpeed: 215,
      acceleration: 9,
      handling: 6,
      nitroEfficiency: 8,
    },
    dimensions: { width: 1.85, height: 0.95, length: 3.5 },
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Crusher',
    tagline: 'Reinforced exoskeleton engineered for collision resistance',
    category: 'Heavy Armor',
    accentColor: '#06b6d4',
    availableColors: ['#64748b', '#06b6d4', '#0f172a', '#e2e8f0', '#9333ea'],
    stats: {
      topSpeed: 185,
      acceleration: 7,
      handling: 7,
      nitroEfficiency: 9,
    },
    dimensions: { width: 1.95, height: 1.2, length: 3.6 },
  },
  phantom: {
    id: 'phantom',
    name: 'Phantom Prototype',
    tagline: 'Experimental le mans hypercar with apex velocity',
    category: 'Hypercar',
    accentColor: '#8b5cf6',
    availableColors: ['#8b5cf6', '#3b82f6', '#06b6d4', '#f43f5e', '#10b981'],
    stats: {
      topSpeed: 235,
      acceleration: 10,
      handling: 10,
      nitroEfficiency: 9,
    },
    dimensions: { width: 1.7, height: 0.85, length: 3.6 },
  },
};
