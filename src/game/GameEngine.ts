import * as THREE from 'three';
import { CarId, EnvironmentId, CameraViewMode, GameStats, NearMissAlert } from '../types/game';
import { CAR_CONFIGS, buildCarModel, CarMeshContainer } from './CarModels';
import { setupEnvironment, EnvironmentAssets } from './Environment';
import { SoundSystem } from '../audio/SoundSystem';

export interface GameEngineOptions {
  container: HTMLDivElement;
  carId: CarId;
  carColorHex?: string;
  environmentId: EnvironmentId;
  soundSystem: SoundSystem;
  onStatsUpdate: (stats: GameStats) => void;
  onNearMiss: (alert: NearMissAlert) => void;
  onGameOver: (stats: GameStats) => void;
}

interface ObstacleEntity {
  mesh: THREE.Object3D;
  isTraffic: boolean;
  trafficSpeed?: number;
  laneTargetX?: number;
  width: number;
  depth: number;
  passedPlayer: boolean;
}

interface CollectibleEntity {
  mesh: THREE.Object3D;
  type: 'nitro' | 'coin' | 'shield';
  radius: number;
  initialY: number;
  rotationSpeed: number;
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLife: number;
  startScale: number;
  endScale: number;
}

export class GameEngine {
  private container: HTMLDivElement;
  private sound: SoundSystem;
  private onStatsUpdate: (stats: GameStats) => void;
  private onNearMiss: (alert: NearMissAlert) => void;
  private onGameOver: (stats: GameStats) => void;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private envAssets: EnvironmentAssets;

  private carContainer: CarMeshContainer;
  private currentCarId: CarId;
  private carColorHex: string;
  private envId: EnvironmentId;

  // Car Physics & Motion
  private carX = 0;
  private speed = 0; // KM/H
  private nitro = 100;
  private score = 0;
  private distance = 0; // meters
  private multiplier = 1;
  private comboTimer = 0;
  private nearMissCount = 0;
  private coinsCount = 0;
  private maxSpeedReached = 0;
  private nitroUsedCount = 0;
  private isInvulnerable = false;
  private invulnerableTimer = 0;

  // Camera Settings
  public cameraMode: CameraViewMode = 'chase';
  private cameraShake = 0;

  // Entities
  private obstacles: ObstacleEntity[] = [];
  private collectibles: CollectibleEntity[] = [];
  private particles: Particle[] = [];

  // Game Loop State
  public isRunning = false;
  public isPaused = false;
  private animFrameId: number | null = null;
  private lastTime = 0;

  // Input states
  public keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    boost: false,
  };

  constructor(options: GameEngineOptions) {
    this.container = options.container;
    this.sound = options.soundSystem;
    this.onStatsUpdate = options.onStatsUpdate;
    this.onNearMiss = options.onNearMiss;
    this.onGameOver = options.onGameOver;
    this.currentCarId = options.carId;
    this.carColorHex = options.carColorHex || CAR_CONFIGS[options.carId].accentColor;
    this.envId = options.environmentId;

    // Three.js Scene Setup
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 3.2, -7.5);
    this.camera.lookAt(0, 1.2, 5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Environment
    const skyImageUrl = '/src/assets/images/skybox_night_city_1790234827416.jpg';
    this.envAssets = setupEnvironment(this.scene, this.envId, skyImageUrl);

    // Player Car
    this.carContainer = buildCarModel(this.currentCarId, this.carColorHex);
    this.scene.add(this.carContainer.group);

    // Event listeners
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'w') this.keys.up = true;
    if (key === 'arrowdown' || key === 's') this.keys.down = true;
    if (key === 'arrowleft' || key === 'a') this.keys.left = true;
    if (key === 'arrowright' || key === 'd') this.keys.right = true;
    if (key === ' ' || key === 'shift') this.keys.boost = true;
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'w') this.keys.up = false;
    if (key === 'arrowdown' || key === 's') this.keys.down = false;
    if (key === 'arrowleft' || key === 'a') this.keys.left = false;
    if (key === 'arrowright' || key === 'd') this.keys.right = false;
    if (key === ' ' || key === 'shift') this.keys.boost = false;
  };

  public setCameraMode(mode: CameraViewMode) {
    this.cameraMode = mode;
  }

  public changeCar(carId: CarId, colorHex?: string) {
    this.currentCarId = carId;
    if (colorHex) this.carColorHex = colorHex;
    this.scene.remove(this.carContainer.group);
    this.carContainer = buildCarModel(this.currentCarId, this.carColorHex);
    this.carContainer.group.position.x = this.carX;
    this.scene.add(this.carContainer.group);
  }

  public changeEnvironment(envId: EnvironmentId) {
    this.envId = envId;
    this.envAssets.cleanup();
    const skyImageUrl = '/src/assets/images/skybox_night_city_1790234827416.jpg';
    this.envAssets = setupEnvironment(this.scene, this.envId, skyImageUrl);
  }

  public start() {
    this.sound.init();
    this.speed = 0;
    this.score = 0;
    this.distance = 0;
    this.nitro = 100;
    this.multiplier = 1;
    this.comboTimer = 0;
    this.nearMissCount = 0;
    this.coinsCount = 0;
    this.maxSpeedReached = 0;
    this.nitroUsedCount = 0;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.carX = 0;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();

    this.carContainer.group.position.set(0, 0, 0);
    this.carContainer.group.rotation.set(0, 0, 0);

    // Clear old entities
    this.clearEntities();

    // Spawn starting obstacle spread
    for (let i = 0; i < 7; i++) {
      this.spawnObstacle(60 + i * 45);
    }

    // Spawn starting collectibles spread
    for (let i = 0; i < 5; i++) {
      this.spawnCollectible(80 + i * 55);
    }

    if (!this.animFrameId) {
      this.animFrameId = requestAnimationFrame(this.gameLoop);
    }
  }

  public pause() {
    this.isPaused = true;
    this.sound.stopAll();
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  public stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.sound.stopAll();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private clearEntities() {
    this.obstacles.forEach((o) => this.scene.remove(o.mesh));
    this.collectibles.forEach((c) => this.scene.remove(c.mesh));
    this.particles.forEach((p) => this.scene.remove(p.mesh));
    this.obstacles = [];
    this.collectibles = [];
    this.particles = [];
  }

  private spawnObstacle(zPos: number) {
    const isTraffic = Math.random() > 0.45;
    const roadWidth = 14;
    const xPos = (Math.random() - 0.5) * roadWidth;

    if (isTraffic) {
      // AI Traffic Car (cyber drone commuter)
      const trafficGroup = new THREE.Group();
      const bodyGeo = new THREE.BoxGeometry(1.6, 0.65, 3.2);
      const colors = [0x334155, 0x1e293b, 0x475569, 0x3f3f46];
      const bodyMat = new THREE.MeshStandardMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        metalness: 0.5,
        roughness: 0.4,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.5;
      body.castShadow = true;
      trafficGroup.add(body);

      // Cabin
      const cabinGeo = new THREE.BoxGeometry(1.2, 0.45, 1.5);
      const cabinMat = new THREE.MeshStandardMaterial({ color: 0x09090b });
      const cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.set(0, 0.8, -0.2);
      trafficGroup.add(cabin);

      // Taillights facing player
      const tailGeo = new THREE.BoxGeometry(0.3, 0.1, 0.05);
      const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
      const tailL = new THREE.Mesh(tailGeo, tailMat);
      tailL.position.set(-0.55, 0.55, -1.62);
      const tailR = tailL.clone();
      tailR.position.x = 0.55;
      trafficGroup.add(tailL, tailR);

      trafficGroup.position.set(xPos, 0, zPos);
      this.scene.add(trafficGroup);

      this.obstacles.push({
        mesh: trafficGroup,
        isTraffic: true,
        trafficSpeed: 40 + Math.random() * 25,
        laneTargetX: xPos,
        width: 1.7,
        depth: 3.3,
        passedPlayer: false,
      });
    } else {
      // Road Hazard Crate / Neon Barrier
      const isBarrier = Math.random() > 0.5;
      let mesh: THREE.Mesh;
      let width = 1.6;
      let depth = 1.6;

      if (isBarrier) {
        width = 2.8;
        depth = 0.6;
        const geo = new THREE.BoxGeometry(width, 1.2, depth);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xe11d48,
          roughness: 0.5,
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(xPos, 0.6, zPos);

        // Warning Hazard Stripes
        const stripeGeo = new THREE.PlaneGeometry(width * 0.9, 0.3);
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(0, 0.1, -depth / 2 - 0.01);
        stripe.rotation.y = Math.PI;
        mesh.add(stripe);
      } else {
        const geo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x475569,
          roughness: 0.6,
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(xPos, 0.8, zPos);

        // Glowing core
        const coreGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
        const core = new THREE.Mesh(coreGeo, coreMat);
        mesh.add(core);
      }

      mesh.castShadow = true;
      this.scene.add(mesh);

      this.obstacles.push({
        mesh,
        isTraffic: false,
        width,
        depth,
        passedPlayer: false,
      });
    }
  }

  private spawnCollectible(zPos: number) {
    const roll = Math.random();
    let type: 'nitro' | 'coin' | 'shield';
    if (roll < 0.55) {
      type = 'nitro';
    } else if (roll < 0.9) {
      type = 'coin';
    } else {
      type = 'shield';
    }

    const roadWidth = 13;
    const xPos = (Math.random() - 0.5) * roadWidth;
    let mesh: THREE.Object3D;

    if (type === 'nitro') {
      // Glowing Cyan Nitro Canister with orbit ring
      const group = new THREE.Group();
      const canGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.1, 16);
      const canMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const cylinder = new THREE.Mesh(canGeo, canMat);
      group.add(cylinder);

      // Orbiting pulse ring
      const ringGeo = new THREE.TorusGeometry(0.65, 0.06, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      mesh = group;
      mesh.position.set(xPos, 0.8, zPos);
    } else if (type === 'coin') {
      // Golden Arcade Gem / Crystal
      const gemGeo = new THREE.OctahedronGeometry(0.55, 0);
      const gemMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0xd97706,
        emissiveIntensity: 0.4,
      });
      mesh = new THREE.Mesh(gemGeo, gemMat);
      mesh.position.set(xPos, 0.8, zPos);
    } else {
      // Shield Orb
      const shieldGeo = new THREE.SphereGeometry(0.55, 16, 16);
      const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x818cf8,
        wireframe: true,
      });
      mesh = new THREE.Mesh(shieldGeo, shieldMat);
      mesh.position.set(xPos, 0.8, zPos);
    }

    this.scene.add(mesh);
    this.collectibles.push({
      mesh,
      type,
      radius: 0.8,
      initialY: mesh.position.y,
      rotationSpeed: 0.04 + Math.random() * 0.03,
    });
  }

  private triggerCrash() {
    this.sound.playCrash();
    this.cameraShake = 1.2;

    // Crash explosion particles
    for (let i = 0; i < 40; i++) {
      const pGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
      const pMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.4 ? 0xff0055 : 0xffaa00,
      });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.copy(this.carContainer.group.position);
      p.position.y += 0.5;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        Math.random() * 8 + 3,
        (Math.random() - 0.5) * 14
      );

      this.scene.add(p);
      this.particles.push({
        mesh: p,
        velocity: vel,
        lifetime: 0,
        maxLife: 1.2,
        startScale: 1,
        endScale: 0.1,
      });
    }

    this.isRunning = false;
    this.sound.stopAll();

    const stats: GameStats = {
      speed: Math.round(this.speed),
      score: Math.round(this.score),
      highScore: 0,
      distance: Math.round(this.distance),
      nitro: Math.round(this.nitro),
      multiplier: this.multiplier,
      nearMisses: this.nearMissCount,
      coinsCollected: this.coinsCount,
      nitroUsedCount: this.nitroUsedCount,
      maxSpeedReached: Math.round(this.maxSpeedReached),
      isInvulnerable: false,
      invulnerableTimeRemaining: 0,
    };

    setTimeout(() => {
      this.onGameOver(stats);
    }, 600);
  }

  private spawnNitroParticles() {
    if (Math.random() > 0.4) return;
    this.carContainer.exhaustPoints.forEach((localPt) => {
      const worldPt = localPt.clone().applyMatrix4(this.carContainer.group.matrixWorld);
      const pGeo = new THREE.BoxGeometry(0.12, 0.12, 0.35);
      const pMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.3 ? 0x00ffff : 0x38bdf8,
      });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.copy(worldPt);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 0.8,
        -12 - Math.random() * 6
      );

      this.scene.add(p);
      this.particles.push({
        mesh: p,
        velocity: vel,
        lifetime: 0,
        maxLife: 0.25,
        startScale: 1.2,
        endScale: 0.1,
      });
    });
  }

  private spawnTireSparks(isLeftDrift: boolean) {
    if (Math.random() > 0.5) return;
    const offset = isLeftDrift ? -0.8 : 0.8;
    const pGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const p = new THREE.Mesh(pGeo, pMat);
    p.position.set(this.carX + offset, 0.1, -1.0);

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 4 + (isLeftDrift ? -2 : 2),
      Math.random() * 2 + 0.5,
      -5 - Math.random() * 5
    );

    this.scene.add(p);
    this.particles.push({
      mesh: p,
      velocity: vel,
      lifetime: 0,
      maxLife: 0.3,
      startScale: 1,
      endScale: 0.1,
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifetime += dt;
      if (p.lifetime >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= 9.8 * dt; // gravity

      const progress = p.lifetime / p.maxLife;
      const scale = p.startScale + (p.endScale - p.startScale) * progress;
      p.mesh.scale.set(scale, scale, scale);
    }
  }

  private gameLoop = (currentTime: number) => {
    if (!this.isRunning) return;

    this.animFrameId = requestAnimationFrame(this.gameLoop);

    if (this.isPaused) {
      this.lastTime = currentTime;
      return;
    }

    const dt = Math.min(0.05, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    // Car Attributes
    const carSpec = CAR_CONFIGS[this.currentCarId];
    const isBoosting = this.keys.boost && this.nitro > 0 && this.speed > 30;

    if (isBoosting) {
      this.nitro = Math.max(0, this.nitro - 14 * dt);
      this.nitroUsedCount += dt;
      this.spawnNitroParticles();
    } else {
      this.nitro = Math.min(100, this.nitro + 3.5 * dt);
    }

    // Top Speed & Acceleration
    const topSpeedBase = carSpec.stats.topSpeed;
    const maxSpeed = isBoosting ? topSpeedBase * 1.35 : topSpeedBase;
    const accelRate = (isBoosting ? 38 : 22) * (carSpec.stats.acceleration / 8);

    if (this.keys.up) {
      this.speed = Math.min(maxSpeed, this.speed + accelRate * dt);
    } else {
      // Natural deceleration
      this.speed = Math.max(0, this.speed - 16 * dt);
    }

    if (this.keys.down) {
      // Braking
      this.speed = Math.max(0, this.speed - 48 * dt);
    }

    if (this.speed > this.maxSpeedReached) {
      this.maxSpeedReached = this.speed;
    }

    // Steering
    const steerSpeed = (4.8 + carSpec.stats.handling * 0.4) * (Math.min(1, this.speed / 40));
    let isSteeringLeft = false;
    let isSteeringRight = false;

    if (this.keys.left) {
      this.carX -= steerSpeed * dt;
      isSteeringLeft = true;
    }
    if (this.keys.right) {
      this.carX += steerSpeed * dt;
      isSteeringRight = true;
    }

    // Road Bounds check (-7.8 to 7.8)
    const roadLimit = 7.6;
    if (this.carX < -roadLimit) {
      this.carX = -roadLimit;
      this.speed = Math.max(10, this.speed - 40 * dt);
      this.spawnTireSparks(true);
    } else if (this.carX > roadLimit) {
      this.carX = roadLimit;
      this.speed = Math.max(10, this.speed - 40 * dt);
      this.spawnTireSparks(false);
    }

    // Drifting Audio & Sparks
    const isDrifting = (this.keys.down && (this.keys.left || this.keys.right) && this.speed > 50);
    this.sound.setDrift(isDrifting, 1);
    if (isDrifting) {
      this.spawnTireSparks(this.keys.left);
      this.multiplier = Math.min(8, this.multiplier + 0.5 * dt);
      this.comboTimer = 3.0;
    }

    // Combo multiplier timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.multiplier = 1;
      }
    }

    // Invulnerability timer
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
        this.carContainer.group.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            child.material.transparent = false;
            child.material.opacity = 1;
          }
        });
      }
    }

    // Update Car 3D mesh
    this.carContainer.group.position.x = this.carX;
    const targetRoll = (isSteeringLeft ? 0.08 : 0) - (isSteeringRight ? 0.08 : 0);
    const targetYaw = (isSteeringLeft ? 0.12 : 0) - (isSteeringRight ? 0.12 : 0);
    this.carContainer.group.rotation.z += (targetRoll - this.carContainer.group.rotation.z) * 0.15;
    this.carContainer.group.rotation.y += (targetYaw - this.carContainer.group.rotation.y) * 0.15;

    // Rotate Wheels
    const wheelRotSpeed = (this.speed * 0.1) * dt;
    this.carContainer.wheels.forEach((wheel) => {
      wheel.rotation.x += wheelRotSpeed;
    });

    // Distance & Score progression
    const deltaMeters = (this.speed * 1000 / 3600) * dt;
    this.distance += deltaMeters;
    this.score += deltaMeters * 1.5 * this.multiplier;

    // Sound updates
    this.sound.updateEngine(this.speed, this.keys.up, isBoosting);

    // Environment updates
    this.envAssets.update(this.speed);

    // Movement of Obstacles & Collisions
    const speedRatio = this.speed * 0.015;
    const carZ = 0;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      let moveDist = speedRatio;
      if (obs.isTraffic && obs.trafficSpeed) {
        // Traffic car moves in same direction
        const relSpeed = this.speed - obs.trafficSpeed;
        moveDist = relSpeed * 0.015;
      }
      obs.mesh.position.z -= moveDist;

      const zDist = Math.abs(obs.mesh.position.z - carZ);
      const xDist = Math.abs(obs.mesh.position.x - this.carX);

      // Collision Check
      if (zDist < (obs.depth / 2 + 1.2) && xDist < (obs.width / 2 + 0.65)) {
        if (this.isInvulnerable) {
          // Smash obstacle!
          this.sound.playCrash();
          this.score += 500 * this.multiplier;
          this.scene.remove(obs.mesh);
          this.obstacles.splice(i, 1);
          this.spawnObstacle(220 + Math.random() * 80);
          continue;
        } else {
          this.triggerCrash();
          return;
        }
      }

      // Near-Miss Check (weaving close without hitting)
      if (!obs.passedPlayer && obs.mesh.position.z < carZ && obs.mesh.position.z > -3.0) {
        obs.passedPlayer = true;
        if (xDist > (obs.width / 2 + 0.65) && xDist < (obs.width / 2 + 2.1) && this.speed > 70) {
          this.sound.playNearMiss();
          this.nearMissCount++;
          const bonusPts = 250 * this.multiplier;
          this.score += bonusPts;
          this.nitro = Math.min(100, this.nitro + 12);
          this.multiplier = Math.min(8, this.multiplier + 1);
          this.comboTimer = 3.5;

          this.onNearMiss({
            id: Date.now() + Math.random(),
            text: `NEAR MISS! +${bonusPts}`,
            points: bonusPts,
            timestamp: Date.now(),
          });
        }
      }

      // Recycle obstacle behind player
      if (obs.mesh.position.z < -25) {
        obs.mesh.position.z = 240 + Math.random() * 60;
        obs.mesh.position.x = (Math.random() - 0.5) * 14;
        obs.passedPlayer = false;
      }
    }

    // Collectibles update & pickup check
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      col.mesh.position.z -= speedRatio;
      col.mesh.rotation.y += col.rotationSpeed;
      col.mesh.position.y = col.initialY + Math.sin(currentTime * 0.004) * 0.15;

      const zDist = Math.abs(col.mesh.position.z - carZ);
      const xDist = Math.abs(col.mesh.position.x - this.carX);

      if (zDist < 1.4 && xDist < 1.25) {
        if (col.type === 'nitro') {
          this.sound.playNitroPickup();
          this.nitro = Math.min(100, this.nitro + 35);
          this.score += 200 * this.multiplier;
        } else if (col.type === 'coin') {
          this.sound.playCoinPickup();
          this.coinsCount++;
          this.score += 350 * this.multiplier;
        } else if (col.type === 'shield') {
          this.sound.playShieldPickup();
          this.isInvulnerable = true;
          this.invulnerableTimer = 6.0;
          this.score += 500;
        }

        this.scene.remove(col.mesh);
        this.collectibles.splice(i, 1);
        this.spawnCollectible(200 + Math.random() * 90);
        continue;
      }

      // Recycle collectible
      if (col.mesh.position.z < -20) {
        col.mesh.position.z = 220 + Math.random() * 90;
        col.mesh.position.x = (Math.random() - 0.5) * 13;
      }
    }

    // Update Particles
    this.updateParticles(dt);

    // Camera Choreography
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - 2.5 * dt);
    }

    const shakeX = (Math.random() - 0.5) * this.cameraShake * 0.35;
    const shakeY = (Math.random() - 0.5) * this.cameraShake * 0.35;

    if (this.cameraMode === 'chase') {
      const targetCamX = this.carX * 0.45 + shakeX;
      const targetCamY = 2.9 + shakeY;
      const targetCamZ = -6.8;
      this.camera.position.x += (targetCamX - this.camera.position.x) * 0.18;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 0.18;
      this.camera.position.z = targetCamZ;
      this.camera.lookAt(this.carX * 0.65, 1.2, 8);
    } else if (this.cameraMode === 'far') {
      const targetCamX = this.carX * 0.3 + shakeX;
      const targetCamY = 4.8 + shakeY;
      const targetCamZ = -9.5;
      this.camera.position.x += (targetCamX - this.camera.position.x) * 0.15;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 0.15;
      this.camera.position.z = targetCamZ;
      this.camera.lookAt(this.carX * 0.4, 1.0, 10);
    } else {
      // Hood / Bumper View
      this.camera.position.x = this.carX + shakeX * 0.5;
      this.camera.position.y = 0.95 + shakeY * 0.5;
      this.camera.position.z = 1.3;
      this.camera.lookAt(this.carX, 1.0, 30);
    }

    // Dynamic FOV widening on boost
    const baseFov = 60;
    const boostFov = isBoosting ? 15 : (this.speed / 28);
    this.camera.fov = baseFov + boostFov;
    this.camera.updateProjectionMatrix();

    // Render Scene
    this.renderer.render(this.scene, this.camera);

    // Send updated stats to React DOM overlay
    this.onStatsUpdate({
      speed: Math.round(this.speed),
      score: Math.round(this.score),
      highScore: 0,
      distance: Math.round(this.distance),
      nitro: Math.round(this.nitro),
      multiplier: this.multiplier,
      nearMisses: this.nearMissCount,
      coinsCollected: this.coinsCount,
      nitroUsedCount: this.nitroUsedCount,
      maxSpeedReached: Math.round(this.maxSpeedReached),
      isInvulnerable: this.isInvulnerable,
      invulnerableTimeRemaining: Math.ceil(this.invulnerableTimer),
    });
  };

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.envAssets.cleanup();
    this.clearEntities();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
