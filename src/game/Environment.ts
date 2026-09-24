import * as THREE from 'three';
import { EnvironmentId } from '../types/game';

export interface EnvironmentAssets {
  scene: THREE.Scene;
  roadSegments: THREE.Mesh[];
  roadLines: THREE.Mesh[];
  guardRails: THREE.Mesh[];
  sceneryObjects: THREE.Object3D[];
  overheadGates: THREE.Group[];
  sunOrMoon?: THREE.Mesh;
  skyDome?: THREE.Mesh;
  update: (speed: number) => void;
  cleanup: () => void;
}

export const ENV_CONFIGS: Record<EnvironmentId, {
  id: EnvironmentId;
  name: string;
  subtitle: string;
  skyColor: number;
  fogColor: number;
  fogDensity: number;
  roadColor: number;
  roadLineColor: number;
  barrierColor: number;
  buildingLightColors: number[];
  accentColor: string;
}> = {
  tokyo_night: {
    id: 'tokyo_night',
    name: 'Neo Tokyo Expressway',
    subtitle: 'Cyberpunk metropolis bathed in neon rain & holographic towers',
    skyColor: 0x050512,
    fogColor: 0x070716,
    fogDensity: 0.008,
    roadColor: 0x0c0d14,
    roadLineColor: 0x00ffff,
    barrierColor: 0xec4899,
    buildingLightColors: [0x00ffff, 0xec4899, 0x8b5cf6, 0x3b82f6],
    accentColor: '#00ffff',
  },
  sunset_coast: {
    id: 'sunset_coast',
    name: 'Synthwave Highway 84',
    subtitle: 'Golden retro sunset with low-poly palms and outrun horizon',
    skyColor: 0x22092c,
    fogColor: 0x3d0c45,
    fogDensity: 0.007,
    roadColor: 0x140a1c,
    roadLineColor: 0xf59e0b,
    barrierColor: 0xff007f,
    buildingLightColors: [0xf59e0b, 0xff007f, 0xec4899, 0xa855f7],
    accentColor: '#f59e0b',
  },
  cyber_matrix: {
    id: 'cyber_matrix',
    name: 'Hyper Warp Grid',
    subtitle: 'High-velocity digital continuum with pulsing light matrices',
    skyColor: 0x020208,
    fogColor: 0x030310,
    fogDensity: 0.009,
    roadColor: 0x050814,
    roadLineColor: 0x10b981,
    barrierColor: 0x06b6d4,
    buildingLightColors: [0x10b981, 0x06b6d4, 0x6366f1, 0x14b8a6],
    accentColor: '#10b981',
  },
};

export function setupEnvironment(
  scene: THREE.Scene,
  envId: EnvironmentId,
  skyTextureUrl?: string
): EnvironmentAssets {
  const config = ENV_CONFIGS[envId];

  // Fog
  scene.fog = new THREE.FogExp2(config.fogColor, config.fogDensity);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
  dirLight.position.set(20, 40, -20);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 150;
  scene.add(dirLight);

  // Background Sky Dome / Cylinder
  let skyDome: THREE.Mesh | undefined;
  if (skyTextureUrl) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      skyTextureUrl,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        const skyGeo = new THREE.CylinderGeometry(280, 280, 160, 32, 1, true);
        const skyMat = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.BackSide,
          fog: false,
        });
        skyDome = new THREE.Mesh(skyGeo, skyMat);
        skyDome.position.set(0, 40, 200);
        scene.add(skyDome);
      },
      undefined,
      () => {
        // Fallback dome if texture load fails
        const skyGeo = new THREE.SphereGeometry(300, 24, 16);
        const skyMat = new THREE.MeshBasicMaterial({
          color: config.skyColor,
          side: THREE.BackSide,
        });
        skyDome = new THREE.Mesh(skyGeo, skyMat);
        scene.add(skyDome);
      }
    );
  } else {
    const skyGeo = new THREE.SphereGeometry(300, 24, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: config.skyColor,
      side: THREE.BackSide,
    });
    skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyDome);
  }

  // Synthwave Sun for Sunset Coast
  let sunOrMoon: THREE.Mesh | undefined;
  if (envId === 'sunset_coast') {
    const sunGeo = new THREE.CircleGeometry(45, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xff3366,
      fog: false,
    });
    sunOrMoon = new THREE.Mesh(sunGeo, sunMat);
    sunOrMoon.position.set(0, 35, 400);
    scene.add(sunOrMoon);
  }

  // Road geometry: modular 4 segments of 250m each = 1000m continuous loop
  const roadWidth = 18;
  const segmentLength = 250;
  const totalSegments = 4;
  const roadSegments: THREE.Mesh[] = [];
  const roadLines: THREE.Mesh[] = [];
  const guardRails: THREE.Mesh[] = [];
  const sceneryObjects: THREE.Object3D[] = [];
  const overheadGates: THREE.Group[] = [];

  const roadMat = new THREE.MeshStandardMaterial({
    color: config.roadColor,
    roughness: 0.7,
    metalness: 0.25,
  });

  const lineMat = new THREE.MeshBasicMaterial({
    color: config.roadLineColor,
  });

  const barrierMat = new THREE.MeshBasicMaterial({
    color: config.barrierColor,
  });

  const roadGeo = new THREE.PlaneGeometry(roadWidth, segmentLength);

  for (let i = 0; i < totalSegments; i++) {
    const segment = new THREE.Mesh(roadGeo, roadMat);
    segment.rotation.x = -Math.PI / 2;
    segment.position.z = i * segmentLength + segmentLength / 2;
    segment.receiveShadow = true;
    scene.add(segment);
    roadSegments.push(segment);

    // Left and Right glowing guardrails
    const railGeo = new THREE.BoxGeometry(0.35, 0.6, segmentLength);
    const railL = new THREE.Mesh(railGeo, barrierMat);
    railL.position.set(-roadWidth / 2, 0.3, segment.position.z);
    const railR = railL.clone();
    railR.position.x = roadWidth / 2;
    scene.add(railL, railR);
    guardRails.push(railL, railR);
  }

  // Road centerline dashes (continuous series)
  const lineCount = 80;
  const lineSpacing = 12.5;
  for (let i = 0; i < lineCount; i++) {
    const lineGeo = new THREE.PlaneGeometry(0.35, 5);
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.02, i * lineSpacing);
    scene.add(line);
    roadLines.push(line);

    // Lane dividing dashed lines left and right
    const lineL = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 3), lineMat);
    lineL.rotation.x = -Math.PI / 2;
    lineL.position.set(-4.5, 0.02, i * lineSpacing);
    const lineR = lineL.clone();
    lineR.position.x = 4.5;
    scene.add(lineL, lineR);
    roadLines.push(lineL, lineR);
  }

  // Neon speed checkpoint arches
  const archCount = 3;
  for (let i = 0; i < archCount; i++) {
    const gateGroup = new THREE.Group();
    const beamGeo = new THREE.BoxGeometry(roadWidth + 3, 0.8, 0.8);
    const beamMat = new THREE.MeshBasicMaterial({ color: config.barrierColor });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 8;

    const postGeo = new THREE.BoxGeometry(0.8, 8, 0.8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x181824 });
    const postL = new THREE.Mesh(postGeo, postMat);
    postL.position.set(-(roadWidth + 2) / 2, 4, 0);
    const postR = postL.clone();
    postR.position.x = (roadWidth + 2) / 2;

    // Glowing speed sign
    const signGeo = new THREE.BoxGeometry(6, 1.6, 0.2);
    const signMat = new THREE.MeshBasicMaterial({ color: config.roadLineColor });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 7.8, 0.45);

    gateGroup.add(beam, postL, postR, sign);
    gateGroup.position.set(0, 0, 150 + i * 320);
    scene.add(gateGroup);
    overheadGates.push(gateGroup);
  }

  // Scenery generator: Buildings / Palms / Cyber pillars
  const sceneryCount = 40;
  for (let i = 0; i < sceneryCount; i++) {
    const isLeft = i % 2 === 0;
    const xDist = (isLeft ? -1 : 1) * (roadWidth / 2 + 10 + Math.random() * 25);
    const zPos = (i / sceneryCount) * (segmentLength * totalSegments);

    if (envId === 'tokyo_night' || envId === 'cyber_matrix') {
      // Cyber Skyscraper
      const width = 12 + Math.random() * 15;
      const height = 25 + Math.random() * 65;
      const depth = 12 + Math.random() * 15;
      const bldgGeo = new THREE.BoxGeometry(width, height, depth);
      const bldgMat = new THREE.MeshStandardMaterial({
        color: 0x090a12,
        roughness: 0.8,
        metalness: 0.3,
      });
      const bldg = new THREE.Mesh(bldgGeo, bldgMat);
      bldg.position.set(xDist, height / 2, zPos);

      // Neon window strips / billboard
      const stripColor = config.buildingLightColors[Math.floor(Math.random() * config.buildingLightColors.length)];
      const stripGeo = new THREE.PlaneGeometry(width * 0.7, 1.2);
      const stripMat = new THREE.MeshBasicMaterial({ color: stripColor });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(0, height * 0.3, depth / 2 + 0.1);
      bldg.add(strip);

      // Rooftop beacon
      const beaconGeo = new THREE.CylinderGeometry(0.2, 0.2, 6, 8);
      const beacon = new THREE.Mesh(beaconGeo, new THREE.MeshBasicMaterial({ color: stripColor }));
      beacon.position.set(0, height / 2 + 3, 0);
      bldg.add(beacon);

      scene.add(bldg);
      sceneryObjects.push(bldg);
    } else {
      // Synthwave low-poly Palm Tree or Pyramid
      const palmGroup = new THREE.Group();
      const trunkGeo = new THREE.CylinderGeometry(0.35, 0.6, 9, 6);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1f0b24 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 4.5;
      trunk.rotation.z = (isLeft ? -1 : 1) * 0.1;
      palmGroup.add(trunk);

      // Palm fronds
      for (let f = 0; f < 5; f++) {
        const frondGeo = new THREE.ConeGeometry(2.5, 0.4, 4);
        const frondMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
        const frond = new THREE.Mesh(frondGeo, frondMat);
        frond.position.set(0, 9, 0);
        frond.rotation.y = (f / 5) * Math.PI * 2;
        frond.rotation.z = Math.PI / 3;
        palmGroup.add(frond);
      }

      palmGroup.position.set(xDist, 0, zPos);
      scene.add(palmGroup);
      sceneryObjects.push(palmGroup);
    }
  }

  // Animation & scrolling update
  const totalTrackLength = segmentLength * totalSegments;

  const update = (speed: number) => {
    const moveZ = speed * 0.015;

    // Scroll road segments
    roadSegments.forEach((segment) => {
      segment.position.z -= moveZ;
      if (segment.position.z < -segmentLength / 2) {
        segment.position.z += totalTrackLength;
      }
    });

    // Guard rails
    guardRails.forEach((rail) => {
      rail.position.z -= moveZ;
      if (rail.position.z < -segmentLength / 2) {
        rail.position.z += totalTrackLength;
      }
    });

    // Road lines
    roadLines.forEach((line) => {
      line.position.z -= moveZ;
      if (line.position.z < -10) {
        line.position.z += lineCount * (lineSpacing / 3);
      }
    });

    // Overhead Gates
    overheadGates.forEach((gate) => {
      gate.position.z -= moveZ;
      if (gate.position.z < -30) {
        gate.position.z += archCount * 320;
      }
    });

    // Scenery objects
    sceneryObjects.forEach((obj) => {
      obj.position.z -= moveZ;
      if (obj.position.z < -40) {
        obj.position.z += totalTrackLength;
      }
    });

    // Slow rotate skybox or sun pulse
    if (skyDome) {
      skyDome.rotation.y += 0.0002;
    }
  };

  const cleanup = () => {
    roadSegments.forEach((s) => scene.remove(s));
    roadLines.forEach((l) => scene.remove(l));
    guardRails.forEach((r) => scene.remove(r));
    sceneryObjects.forEach((o) => scene.remove(o));
    overheadGates.forEach((g) => scene.remove(g));
    if (skyDome) scene.remove(skyDome);
    if (sunOrMoon) scene.remove(sunOrMoon);
    scene.remove(ambientLight);
    scene.remove(dirLight);
  };

  return {
    scene,
    roadSegments,
    roadLines,
    guardRails,
    sceneryObjects,
    overheadGates,
    sunOrMoon,
    skyDome,
    update,
    cleanup,
  };
}
