// Temple Runner 3D - Enhanced with Bosses, Biomes, Camera Scripting & Optimization
// ----------------------------------------------------------------------------------
// Features:
// - Jump-over pits (gaps in the floor)
// - Vine slide sections with vine obstacles
// - Enemy with behavior changes as difficulty rises
// - Shield & Magnet power-ups
// - More detailed character + enemy models
// - Main menu and in-game instructions
// - Boss encounters at score milestones
// - Dynamic biome system (Jungle, Desert, Ruins, Lava, Ice)
// - Scripted camera movements for dramatic moments
// - Object pooling for optimization

/* -------------------- CONFIG -------------------- */

const CONFIG = {
  lanes: [-2, 0, 2],
  groundSegmentLength: 20,
  initialGroundSegments: 12,
  worldSpeed: 0.22,
  maxSpeed: 0.7,
  speedIncreasePerSecond: 0.015,
  obstacleSpawnDistance: 25,
  coinSpawnChance: 0.7,
  slideDuration: 0.55,
  gravity: -0.03,
  jumpInitialVelocity: 0.38,
  camera: {
    baseY: 4.7,
    baseZ: 8.8,
    followSmoothing: 0.09,
    shakeIntensity: 0.16,
    shakeDuration: 0.25
  },
  score: {
    distanceFactor: 9,
    coinValue: 12,
    multiplierIncreaseInterval: 1800,
    maxMultiplier: 5
  },
  enemy: {
    baseDistance: -12,
    catchDistanceZ: -2,
    baseRunFactor: 0.94,
    aggressiveRunFactor: 1.05,
    behaviorChangeScore: 6000
  },
  powerUps: {
    shieldDuration: 7,
    magnetDuration: 7,
    spawnIntervalMin: 10,
    spawnIntervalMax: 18,
    magnetRadius: 6,
    magnetPullSpeed: 14
  },
  pits: {
    chance: 0.15,
    length: 12
  },
  vines: {
    chance: 0.15,
    length: 30,
    obstacleSpacing: 7
  },
  biomes: {
    transitionDuration: 2.0,
    scoreThresholds: [0, 3000, 6000, 9000, 12000]
  },
  boss: {
    scoreThresholds: [5000, 10000, 15000],
    duration: 15,
    attackInterval: 2.5,
    projectileSpeed: 0.15,
    healthPerStage: 5
  }
};

/* -------------------- BIOME DEFINITIONS -------------------- */

const BIOMES = {
  jungle: {
    name: "Jungle Temple",
    skyColor: 0x050812,
    fogColor: 0x050812,
    groundColor: 0x7a624a,
    wallColor: 0x3f2b1c,
    ambientLight: 0.35,
    fogNear: 6,
    fogFar: 130
  },
  desert: {
    name: "Desert Ruins",
    skyColor: 0x1a1410,
    fogColor: 0x2a1e10,
    groundColor: 0xc4a86a,
    wallColor: 0x8b7355,
    ambientLight: 0.45,
    fogNear: 8,
    fogFar: 150
  },
  ruins: {
    name: "Ancient Ruins",
    skyColor: 0x0a0a12,
    fogColor: 0x15151a,
    groundColor: 0x6a7075,
    wallColor: 0x3a3f45,
    ambientLight: 0.30,
    fogNear: 5,
    fogFar: 120
  },
  lava: {
    name: "Lava Depths",
    skyColor: 0x1a0505,
    fogColor: 0x2a0a0a,
    groundColor: 0x4a2020,
    wallColor: 0x2a1010,
    ambientLight: 0.25,
    fogNear: 4,
    fogFar: 100
  },
  ice: {
    name: "Frozen Temple",
    skyColor: 0x0a0f14,
    fogColor: 0x0f1419,
    groundColor: 0x9dbfcf,
    wallColor: 0x5a7a8a,
    ambientLight: 0.40,
    fogNear: 7,
    fogFar: 140
  }
};

const BIOME_ORDER = ['jungle', 'desert', 'ruins', 'lava', 'ice'];

/* -------------------- GLOBALS -------------------- */

let scene, camera, renderer;
let player, playerState;
let guardian, guardianState;
let boss = null;
let bossState = null;

let groundSegments = [];
let obstacles = [];
let coins = [];
let powerUps = [];
let vineSegments = [];
let pitZones = [];
let bossProjectiles = [];

let ui = {};
let gameState;
let cameraScript = null;
let currentBiome = BIOMES.jungle;

// Object pools for optimization
let objectPools = {
  coins: [],
  obstacles: [],
  powerUps: []
};

let lastTime = 0;
let obstacleZCursor = -40;
let nextPowerUpTime = 0;
let rng = Math.random;
let directionalLight = null;

/* -------------------- STATE MODELS -------------------- */

function createGameState() {
  return {
    inMenu: true,
    started: false,
    over: false,
    speed: CONFIG.worldSpeed,
    distanceScore: 0,
    coins: 0,
    multiplier: 1,
    bestScore: Number(localStorage.getItem("templeRunnerBestScore") || "0"),
    cameraShakeTime: 0,
    shieldTime: 0,
    magnetTime: 0,
    mode: "RUN",
    vineSlideDirection: 1,
    currentBiomeIndex: 0,
    biomeTransitionProgress: 0,
    bossActive: false,
    bossHealth: 0,
    nextBossIndex: 0,
    bossDefeated: []
  };
}

function createPlayerState() {
  return {
    laneIndex: 1,
    targetLaneIndex: 1,
    isJumping: false,
    jumpVelocity: 0,
    isSliding: false,
    slideTimer: 0,
    runTime: 0
  };
}

function createGuardianState() {
  return {
    distanceZ: CONFIG.enemy.baseDistance,
    runTime: 0
  };
}

/* -------------------- INIT -------------------- */

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050812);
  scene.fog = new THREE.Fog(0x050812, 6, 130);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, CONFIG.camera.baseY, CONFIG.camera.baseZ);
  camera.lookAt(0, 1.2, -10);

  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance",
    stencil: false,
    depth: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById("game-container").appendChild(renderer.domElement);

  addLights();
  addEnvironment();

  player = createPlayerMesh();
  scene.add(player);
  playerState = createPlayerState();

  guardian = createGuardianMesh();
  scene.add(guardian);
  guardianState = createGuardianState();
  positionGuardianBehindPlayer();

  for (let i = 0; i < CONFIG.initialGroundSegments; i++) {
    createGroundSegment(-i * CONFIG.groundSegmentLength);
  }

  cacheUI();
  gameState = createGameState();
  obstacleZCursor = -40;
  scheduleNextPowerUp();

  lastTime = performance.now();
  window.addEventListener("resize", onWindowResize);
  document.addEventListener("keydown", onKeyDown);
  ui.restartBtn.addEventListener("click", restart);
  ui.playBtn.addEventListener("click", startFromMenu);

  requestAnimationFrame(loop);
}

/* -------------------- SCENE CREATION -------------------- */

function addLights() {
  const ambient = new THREE.AmbientLight(0xffffff, currentBiome.ambientLight);
  ambient.name = "ambientLight";
  scene.add(ambient);

  directionalLight = new THREE.DirectionalLight(0xfff2d5, 0.9);
  directionalLight.position.set(10, 18, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 120;
  scene.add(directionalLight);

  // Torches near start area
  const torchColor = 0xffaa33;
  for (let i = 0; i < 2; i++) {
    const offsetX = i === 0 ? -3.5 : 3.5;
    const torchLight = new THREE.PointLight(torchColor, 0.9, 25);
    torchLight.position.set(offsetX, 3, 5);
    scene.add(torchLight);

    const torchGeom = new THREE.CylinderGeometry(0.05, 0.15, 1, 8);
    const torchMat = new THREE.MeshStandardMaterial({
      color: 0x3b2a17,
      metalness: 0.1,
      roughness: 0.7
    });
    const torch = new THREE.Mesh(torchGeom, torchMat);
    torch.castShadow = true;
    torch.position.copy(torchLight.position);
    torch.position.y -= 0.5;
    scene.add(torch);

    const flameGeom = new THREE.SphereGeometry(0.25, 8, 8);
    const flameMat = new THREE.MeshBasicMaterial({
      color: torchColor,
      transparent: true,
      opacity: 0.9
    });
    const flame = new THREE.Mesh(flameGeom, flameMat);
    flame.position.copy(torchLight.position);
    flame.position.y += 0.2;
    scene.add(flame);
  }
}

function addEnvironment() {
  // Distant pillars and archways
  const pillarGeom = new THREE.BoxGeometry(0.7, 6, 0.7);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x3f2b1c,
    roughness: 0.8
  });

  for (let i = 0; i < 20; i++) {
    const z = -i * 22 - 25;

    const leftPillar = new THREE.Mesh(pillarGeom, pillarMat);
    leftPillar.position.set(-6.5 + (i % 2) * 0.5, 3, z);
    leftPillar.castShadow = true;
    scene.add(leftPillar);

    const rightPillar = leftPillar.clone();
    rightPillar.position.x = 6.5 - (i % 2) * 0.5;
    scene.add(rightPillar);

    if (i % 2 === 0) {
      const archGeom = new THREE.BoxGeometry(13, 0.7, 0.5);
      const archMat = new THREE.MeshStandardMaterial({
        color: 0x4b3623,
        roughness: 0.85
      });
      const arch = new THREE.Mesh(archGeom, archMat);
      arch.position.set(0, 5.8, z);
      arch.castShadow = true;
      scene.add(arch);
    }
  }

  // Jungle canopy
  const canopyGeom = new THREE.SphereGeometry(6, 18, 18, 0, Math.PI * 2, 0, Math.PI / 2);
  const canopyMat = new THREE.MeshBasicMaterial({
    color: 0x06140a,
    transparent: true,
    opacity: 0.75
  });

  for (let i = 0; i < 10; i++) {
    const canopy = new THREE.Mesh(canopyGeom, canopyMat);
    canopy.position.set(i % 2 === 0 ? -4 : 4, 11, -i * 30 - 20);
    scene.add(canopy);
  }
}

/* -------------------- BIOME SYSTEM -------------------- */

function getBiomeForScore(score) {
  const thresholds = CONFIG.biomes.scoreThresholds;
  let biomeIndex = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (score >= thresholds[i]) {
      biomeIndex = i;
      break;
    }
  }
  return BIOME_ORDER[Math.min(biomeIndex, BIOME_ORDER.length - 1)];
}

function applyBiome(biomeName, instant = false) {
  const biome = BIOMES[biomeName];
  if (!biome) return;
  
  currentBiome = biome;
  
  if (instant) {
    scene.background = new THREE.Color(biome.skyColor);
    scene.fog = new THREE.Fog(biome.fogColor, biome.fogNear, biome.fogFar);
    
    const ambient = scene.getObjectByName("ambientLight");
    if (ambient) ambient.intensity = biome.ambientLight;
  } else {
    // Smooth transition handled in updateBiomes()
  }
}

function updateBiomes(dt) {
  const score = Math.floor(gameState.distanceScore);
  const targetBiomeName = getBiomeForScore(score);
  const targetBiomeIndex = BIOME_ORDER.indexOf(targetBiomeName);
  
  if (targetBiomeIndex !== gameState.currentBiomeIndex) {
    if (gameState.biomeTransitionProgress === 0) {
      // Start camera script for biome transition
      startCameraScript("biomeTransition");
    }
    
    gameState.biomeTransitionProgress += dt / CONFIG.biomes.transitionDuration;
    
    if (gameState.biomeTransitionProgress >= 1.0) {
      gameState.biomeTransitionProgress = 0;
      gameState.currentBiomeIndex = targetBiomeIndex;
      applyBiome(targetBiomeName, true);
    } else {
      // Interpolate colors
      const fromBiome = BIOMES[BIOME_ORDER[gameState.currentBiomeIndex]];
      const toBiome = BIOMES[targetBiomeName];
      const t = gameState.biomeTransitionProgress;
      
      const skyColor = lerpColor(fromBiome.skyColor, toBiome.skyColor, t);
      const fogColor = lerpColor(fromBiome.fogColor, toBiome.fogColor, t);
      
      scene.background = new THREE.Color(skyColor);
      scene.fog.color = new THREE.Color(fogColor);
      scene.fog.near = fromBiome.fogNear + (toBiome.fogNear - fromBiome.fogNear) * t;
      scene.fog.far = fromBiome.fogFar + (toBiome.fogFar - fromBiome.fogFar) * t;
      
      const ambient = scene.getObjectByName("ambientLight");
      if (ambient) {
        ambient.intensity = fromBiome.ambientLight + (toBiome.ambientLight - fromBiome.ambientLight) * t;
      }
    }
  }
}

function lerpColor(color1, color2, t) {
  const c1 = new THREE.Color(color1);
  const c2 = new THREE.Color(color2);
  return c1.lerp(c2, t).getHex();
}

/* -------------------- CAMERA SCRIPTING -------------------- */

function startCameraScript(scriptName, params = {}) {
  cameraScript = {
    name: scriptName,
    time: 0,
    duration: params.duration || 2.0,
    data: params
  };
}

function updateCameraScript(dt) {
  if (!cameraScript) return false;
  
  cameraScript.time += dt;
  const t = Math.min(cameraScript.time / cameraScript.duration, 1.0);
  
  switch (cameraScript.name) {
    case "biomeTransition":
      // Smooth zoom out and in
      const zoomDelta = Math.sin(t * Math.PI) * 2.0;
      camera.position.z = CONFIG.camera.baseZ + zoomDelta;
      camera.position.y = CONFIG.camera.baseY + zoomDelta * 0.5;
      break;
      
    case "bossIntro":
      // Dramatic boss reveal
      const introProgress = Math.min(t * 1.5, 1.0);
      const camZ = CONFIG.camera.baseZ - 5 + introProgress * 5;
      camera.position.z = camZ;
      camera.position.y = CONFIG.camera.baseY + 3 - introProgress * 3;
      camera.lookAt(cameraScript.data.bossPos || new THREE.Vector3(0, 2, -15));
      break;
      
    case "bossDefeat":
      // Victory camera pan
      const panT = Math.min(t * 1.2, 1.0);
      camera.position.y = CONFIG.camera.baseY + Math.sin(panT * Math.PI) * 1.5;
      break;
  }
  
  if (t >= 1.0) {
    cameraScript = null;
    return true; // Script finished
  }
  
  return false;
}

/* -------------------- BOSS SYSTEM -------------------- */

function shouldSpawnBoss(score) {
  const nextThreshold = CONFIG.boss.scoreThresholds[gameState.nextBossIndex];
  return nextThreshold && score >= nextThreshold && !gameState.bossActive;
}

function createBossMesh(bossIndex) {
  const group = new THREE.Group();
  
  // Larger, more menacing version based on boss index
  const scale = 1.5 + bossIndex * 0.3;
  const colors = [0x8b0000, 0x4b0082, 0xff4500];
  const bossColor = colors[bossIndex % colors.length];
  
  // Main body
  const bodyGeom = new THREE.BoxGeometry(1.2, 1.6, 0.7);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: bossColor,
    metalness: 0.5,
    roughness: 0.3,
    emissive: bossColor,
    emissiveIntensity: 0.3
  });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.y = 2.0;
  body.castShadow = true;
  
  // Head
  const headGeom = new THREE.BoxGeometry(0.8, 0.8, 0.6);
  const headMat = new THREE.MeshStandardMaterial({
    color: bossColor,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xff0000,
    emissiveIntensity: 0.8
  });
  const head = new THREE.Mesh(headGeom, headMat);
  head.position.y = 3.0;
  head.castShadow = true;
  
  // Eyes
  const eyeGeom = new THREE.SphereGeometry(0.12, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
  leftEye.position.set(-0.2, 3.1, 0.35);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.2;
  
  // Horns
  const hornGeom = new THREE.ConeGeometry(0.2, 0.8, 8);
  const hornMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
  const leftHorn = new THREE.Mesh(hornGeom, hornMat);
  leftHorn.position.set(-0.35, 3.6, 0);
  leftHorn.rotation.z = Math.PI / 6;
  leftHorn.castShadow = true;
  const rightHorn = leftHorn.clone();
  rightHorn.position.x = 0.35;
  rightHorn.rotation.z = -Math.PI / 6;
  
  // Arms
  const armGeom = new THREE.BoxGeometry(0.3, 1.0, 0.3);
  const leftArm = new THREE.Mesh(armGeom, bodyMat);
  leftArm.position.set(-0.75, 2.0, 0);
  leftArm.castShadow = true;
  const rightArm = leftArm.clone();
  rightArm.position.x = 0.75;
  rightArm.castShadow = true;
  
  // Legs
  const legGeom = new THREE.BoxGeometry(0.35, 1.2, 0.35);
  const leftLeg = new THREE.Mesh(legGeom, bodyMat);
  leftLeg.position.set(-0.3, 0.6, 0);
  leftLeg.castShadow = true;
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.3;
  rightLeg.castShadow = true;
  
  group.add(body, head, leftEye, rightEye, leftHorn, rightHorn, leftArm, rightArm, leftLeg, rightLeg);
  group.scale.multiplyScalar(scale);
  
  group.userData = {
    body, head, leftArm, rightArm, leftLeg, rightLeg, leftEye, rightEye
  };
  
  return group;
}

function spawnBoss() {
  if (gameState.bossActive) return;
  
  const bossIndex = gameState.nextBossIndex;
  boss = createBossMesh(bossIndex);
  boss.position.set(0, 0, -30);
  scene.add(boss);
  
  bossState = {
    health: CONFIG.boss.healthPerStage,
    maxHealth: CONFIG.boss.healthPerStage,
    attackTimer: CONFIG.boss.attackInterval,
    startTime: performance.now() / 1000,
    bossIndex: bossIndex,
    defeated: false
  };
  
  gameState.bossActive = true;
  gameState.bossHealth = bossState.health;
  
  // Start boss intro camera
  startCameraScript("bossIntro", { 
    duration: 2.5,
    bossPos: boss.position
  });
  
  ui.modeIndicator.textContent = "BOSS!";
  ui.modeIndicator.style.color = "#ff3b3b";
}

function updateBoss(dt) {
  if (!gameState.bossActive || !boss || !bossState) return;
  
  const elapsed = (performance.now() / 1000) - bossState.startTime;
  
  // Boss stays ahead, moving side to side
  boss.position.z = player.position.z - 25 + Math.sin(elapsed * 0.5) * 2;
  boss.position.x = Math.sin(elapsed * 0.8) * 1.5;
  boss.position.y = 0;
  
  // Animate boss
  const phase = Math.sin(elapsed * 5);
  const { leftArm, rightArm, leftLeg, rightLeg, head } = boss.userData;
  leftArm.rotation.x = 0.3 * phase;
  rightArm.rotation.x = -0.3 * phase;
  leftLeg.rotation.x = 0.4 * phase;
  rightLeg.rotation.x = -0.4 * phase;
  head.rotation.y = Math.sin(elapsed * 2) * 0.3;
  
  // Attack pattern
  bossState.attackTimer -= dt;
  if (bossState.attackTimer <= 0) {
    bossState.attackTimer = CONFIG.boss.attackInterval;
    spawnBossProjectile();
  }
  
  // Check for defeat condition
  if (bossState.health <= 0 && !bossState.defeated) {
    defeatBoss();
  }
  else if (elapsed > CONFIG.boss.duration && !bossState.defeated) {
    // Time-based defeat
    defeatBoss();
  }
}

function spawnBossProjectile() {
  const projectileGeom = new THREE.SphereGeometry(0.3, 12, 12);
  const projectileMat = new THREE.MeshStandardMaterial({
    color: 0xff4400,
    emissive: 0xff2200,
    emissiveIntensity: 1.0
  });
  const projectile = new THREE.Mesh(projectileGeom, projectileMat);
  
  // Spawn at boss position, target a random lane
  const targetLane = CONFIG.lanes[Math.floor(rng() * 3)];
  projectile.position.copy(boss.position);
  projectile.position.y = 1.5;
  
  projectile.userData = {
    velocity: new THREE.Vector3(
      (targetLane - boss.position.x) * 0.05,
      0,
      CONFIG.boss.projectileSpeed
    )
  };
  
  bossProjectiles.push(projectile);
  scene.add(projectile);
}

function updateBossProjectiles(dt) {
  for (let i = bossProjectiles.length - 1; i >= 0; i--) {
    const proj = bossProjectiles[i];
    proj.position.add(proj.userData.velocity);
    proj.rotation.x += 0.1;
    proj.rotation.y += 0.15;
    
    // Check collision with player
    const dx = player.position.x - proj.position.x;
    const dy = player.position.y - proj.position.y;
    const dz = player.position.z - proj.position.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    
    if (distSq < 0.7 * 0.7) {
      if (gameState.shieldTime > 0) {
        gameState.shieldTime = Math.max(gameState.shieldTime - 1, 0);
        gameState.cameraShakeTime = CONFIG.camera.shakeDuration * 0.5;
        // Damage boss when blocked
        if (bossState) {
          bossState.health = Math.max(0, bossState.health - 1);
          gameState.bossHealth = bossState.health;
        }
      } else {
        triggerGameOver();
      }
      scene.remove(proj);
      bossProjectiles.splice(i, 1);
      continue;
    }
    
    // Remove if too far
    if (proj.position.z > player.position.z + 10) {
      scene.remove(proj);
      bossProjectiles.splice(i, 1);
    }
  }
}

function defeatBoss() {
  if (!bossState || bossState.defeated) return;
  
  bossState.defeated = true;
  gameState.bossDefeated.push(gameState.nextBossIndex);
  gameState.nextBossIndex++;
  
  // Victory bonus
  gameState.distanceScore += 1000 * gameState.multiplier;
  gameState.coins += 10;
  
  // Start victory camera
  startCameraScript("bossDefeat", { duration: 2.0 });
  
  // Remove boss
  if (boss) {
    scene.remove(boss);
    boss = null;
  }
  
  // Clear projectiles
  for (const proj of bossProjectiles) {
    scene.remove(proj);
  }
  bossProjectiles = [];
  
  gameState.bossActive = false;
  bossState = null;
  
  ui.modeIndicator.style.color = "";
}

/* PLAYER MODEL */

function createPlayerMesh() {
  const group = new THREE.Group();

  // Torso
  const torsoGeom = new THREE.BoxGeometry(0.7, 1.1, 0.4);
  const torsoMat = new THREE.MeshStandardMaterial({ color: 0x4f3422 });
  const torso = new THREE.Mesh(torsoGeom, torsoMat);
  torso.position.y = 1.2;
  torso.castShadow = true;

  // Belt
  const beltGeom = new THREE.BoxGeometry(0.72, 0.12, 0.42);
  const beltMat = new THREE.MeshStandardMaterial({
    color: 0x8c6b2f,
    metalness: 0.25,
    roughness: 0.6
  });
  const belt = new THREE.Mesh(beltGeom, beltMat);
  belt.position.set(0, 0.68, 0);
  belt.castShadow = true;

  // Head
  const headGeom = new THREE.SphereGeometry(0.32, 18, 18);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffd3a3 });
  const head = new THREE.Mesh(headGeom, headMat);
  head.position.y = 2.1;
  head.castShadow = true;

  // Hair band / helmet
  const headBandGeom = new THREE.TorusGeometry(0.34, 0.06, 8, 16);
  const headBandMat = new THREE.MeshStandardMaterial({
    color: 0x3a2a19,
    metalness: 0.1,
    roughness: 0.7
  });
  const headBand = new THREE.Mesh(headBandGeom, headBandMat);
  headBand.rotation.x = Math.PI / 2;
  headBand.position.y = 2.07;
  headBand.castShadow = true;

  // Legs
  const legGeom = new THREE.BoxGeometry(0.25, 0.8, 0.25);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1b3d6b });
  const leftLeg = new THREE.Mesh(legGeom, legMat);
  leftLeg.position.set(-0.18, 0.4, 0);
  leftLeg.castShadow = true;

  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.18;

  // Boots
  const bootGeom = new THREE.BoxGeometry(0.28, 0.2, 0.35);
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const leftBoot = new THREE.Mesh(bootGeom, bootMat);
  leftBoot.position.set(-0.18, 0.1, 0.1);
  leftBoot.castShadow = true;
  const rightBoot = leftBoot.clone();
  rightBoot.position.x = 0.18;

  // Arms (upper)
  const armGeom = new THREE.BoxGeometry(0.18, 0.5, 0.18);
  const armMat = new THREE.MeshStandardMaterial({ color: 0xffd3a3 });
  const leftUpperArm = new THREE.Mesh(armGeom, armMat);
  leftUpperArm.position.set(-0.45, 1.6, 0);
  leftUpperArm.castShadow = true;
  const rightUpperArm = leftUpperArm.clone();
  rightUpperArm.position.x = 0.45;

  // Forearms
  const forearmGeom = new THREE.BoxGeometry(0.16, 0.5, 0.16);
  const leftForearm = new THREE.Mesh(forearmGeom, armMat);
  leftForearm.position.set(-0.55, 1.2, 0.1);
  leftForearm.castShadow = true;
  const rightForearm = leftForearm.clone();
  rightForearm.position.x = 0.55;

  // Shield visual bubble
  const shieldGeom = new THREE.SphereGeometry(0.95, 20, 20);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0x00e0ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending
  });
  const shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
  shieldMesh.position.y = 1.3;

  group.add(
    torso,
    belt,
    head,
    headBand,
    leftLeg,
    rightLeg,
    leftBoot,
    rightBoot,
    leftUpperArm,
    rightUpperArm,
    leftForearm,
    rightForearm,
    shieldMesh
  );

  group.userData = {
    torso,
    head,
    leftLeg,
    rightLeg,
    leftUpperArm,
    rightUpperArm,
    leftForearm,
    rightForearm,
    shieldMesh
  };

  group.position.set(CONFIG.lanes[1], 1, 0);
  group.castShadow = true;
  return group;
}

/* GUARDIAN MODEL */

function createGuardianMesh() {
  const group = new THREE.Group();

  const bodyGeom = new THREE.BoxGeometry(0.9, 1.3, 0.5);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.2,
    roughness: 0.6
  });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.y = 1.3;
  body.castShadow = true;

  const shoulderGeom = new THREE.BoxGeometry(1.2, 0.3, 0.5);
  const shoulder = new THREE.Mesh(shoulderGeom, bodyMat);
  shoulder.position.y = 1.9;
  shoulder.castShadow = true;

  const headGeom = new THREE.BoxGeometry(0.5, 0.6, 0.3);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.4,
    roughness: 0.4,
    emissive: 0x220000,
    emissiveIntensity: 0.7
  });
  const head = new THREE.Mesh(headGeom, headMat);
  head.position.y = 2.4;
  head.castShadow = true;

  const hornGeom = new THREE.ConeGeometry(0.12, 0.4, 8);
  const hornMat = new THREE.MeshStandardMaterial({ color: 0x5a2f18 });
  const leftHorn = new THREE.Mesh(hornGeom, hornMat);
  leftHorn.position.set(-0.2, 2.7, 0);
  leftHorn.rotation.z = Math.PI / 8;
  leftHorn.castShadow = true;
  const rightHorn = leftHorn.clone();
  rightHorn.position.x = 0.2;
  rightHorn.rotation.z = -Math.PI / 8;

  const jawGeom = new THREE.BoxGeometry(0.5, 0.2, 0.3);
  const jawMat = new THREE.MeshStandardMaterial({
    color: 0x371c10,
    roughness: 0.8
  });
  const jaw = new THREE.Mesh(jawGeom, jawMat);
  jaw.position.set(0, 2.1, 0.15);
  jaw.castShadow = true;

  const limbGeom = new THREE.BoxGeometry(0.2, 0.9, 0.2);
  const limbMat = bodyMat;
  const leftArm = new THREE.Mesh(limbGeom, limbMat);
  leftArm.position.set(-0.6, 1.3, 0);
  leftArm.castShadow = true;
  const rightArm = leftArm.clone();
  rightArm.position.x = 0.6;

  const legGeom = new THREE.BoxGeometry(0.28, 0.8, 0.28);
  const leftLeg = new THREE.Mesh(legGeom, limbMat);
  leftLeg.position.set(-0.22, 0.4, 0);
  leftLeg.castShadow = true;
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.22;

  group.add(
    body,
    shoulder,
    head,
    leftHorn,
    rightHorn,
    jaw,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg
  );

  group.userData = {
    body,
    head,
    leftHorn,
    rightHorn,
    jaw,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg
  };

  return group;
}

function positionGuardianBehindPlayer() {
  guardian.position.set(
    player.position.x,
    1,
    player.position.z + guardianState.distanceZ
  );
}

/* GROUND, PITS, VINES */

function createGroundSegment(z) {
  const deckGeom = new THREE.BoxGeometry(8, 0.4, CONFIG.groundSegmentLength);
  const deckMat = new THREE.MeshStandardMaterial({
    color: currentBiome.groundColor,
    roughness: 0.9
  });

  const deck = new THREE.Mesh(deckGeom, deckMat);
  deck.position.set(0, -0.2, z);
  deck.receiveShadow = true;

  // Decide if this segment is a pit
  let isPit = rng() < CONFIG.pits.chance && z < -40; // avoid pits very near start
  if (isPit) {
    // Mark pit zone for this segment range
    pitZones.push({
      startZ: z - CONFIG.groundSegmentLength / 2,
      endZ: z + CONFIG.groundSegmentLength / 2
    });

    deck.visible = false; // the floor is missing (pit)
  }

  groundSegments.push(deck);
  scene.add(deck);

  const wallGeom = new THREE.BoxGeometry(0.5, 2.5, CONFIG.groundSegmentLength);
  const wallMat = new THREE.MeshStandardMaterial({
    color: currentBiome.wallColor,
    roughness: 0.9
  });

  const leftWall = new THREE.Mesh(wallGeom, wallMat);
  leftWall.position.set(-4.25, 1.1, z);
  leftWall.receiveShadow = true;
  groundSegments.push(leftWall);
  scene.add(leftWall);

  const rightWall = leftWall.clone();
  rightWall.position.x = 4.25;
  groundSegments.push(rightWall);
  scene.add(rightWall);

  // Chance to create a vine section starting here (non-pit zone)
  if (!isPit && rng() < CONFIG.vines.chance && z < -60) {
    createVineSection(z - CONFIG.vines.length);
  }
}

function isOverPit(z) {
  for (let i = 0; i < pitZones.length; i++) {
    const p = pitZones[i];
    if (z > p.startZ && z < p.endZ) return true;
  }
  return false;
}

function createVineSection(startZ) {
  const length = CONFIG.vines.length;
  const endZ = startZ - length;
  const laneX = 0;
  const vineGeom = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
  const vineMat = new THREE.MeshStandardMaterial({
    color: 0x30743a,
    roughness: 0.6,
    metalness: 0.1
  });

  const vine = new THREE.Mesh(vineGeom, vineMat);
  vine.position.set(laneX, 4, startZ - length / 2);
  vine.rotation.z = Math.PI / 2;
  vine.castShadow = true;

  vineSegments.push({ mesh: vine, startZ, endZ });
  scene.add(vine);

  // Obstacles on vine: swinging logs you must slide under
  const obstacleCount = Math.floor(length / CONFIG.vines.obstacleSpacing);
  const logGeom = new THREE.BoxGeometry(1.2, 0.3, 0.3);
  const logMat = new THREE.MeshStandardMaterial({
    color: 0x5a3c21,
    roughness: 0.8
  });

  for (let i = 1; i < obstacleCount; i++) {
    const z = startZ - i * CONFIG.vines.obstacleSpacing;
    const log = new THREE.Mesh(logGeom, logMat);
    log.position.set(laneX, 1.7, z);
    log.castShadow = true;
    log.userData.vineObstacle = true;
    obstacles.push(log);
    scene.add(log);
  }
}

/* OBSTACLES & COINS & POWER-UPS */

/* Object Pooling for Optimization */

function getPooledCoin() {
  if (objectPools.coins.length > 0) {
    const coin = objectPools.coins.pop();
    coin.visible = true;
    return coin;
  }
  
  // Create new coin
  const coinGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 24);
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.8,
    roughness: 0.25,
    emissive: 0x775500,
    emissiveIntensity: 0.6
  });
  const coin = new THREE.Mesh(coinGeom, coinMat);
  coin.castShadow = true;
  coin.rotation.x = Math.PI / 2;
  return coin;
}

function returnCoinToPool(coin) {
  coin.visible = false;
  scene.remove(coin);
  if (objectPools.coins.length < 50) { // Max pool size
    objectPools.coins.push(coin);
  }
}

function createObstaclePattern(z) {
  const patternType = Math.floor(rng() * 4);
  const lanes = [0, 1, 2];

  if (patternType === 0) {
    createObstacle(lanes[Math.floor(rng() * 3)], z);
  } else if (patternType === 1) {
    createObstacle(0, z);
    createObstacle(2, z);
  } else if (patternType === 2) {
    const side = rng() < 0.5 ? 0 : 2;
    createObstacle(1, z);
    createObstacle(side, z);
  } else if (patternType === 3) {
    for (let lane of lanes) {
      createObstacle(lane, z, { low: true });
    }
  }

  if (rng() < CONFIG.coinSpawnChance) {
    createCoinLine(z - 6);
  }
}

function createObstacle(laneIndex, z, options = {}) {
  const isLow = !!options.low;
  const width = 0.9;
  const height = isLow ? 0.6 : 1.7;
  const depth = 0.9;

  const geom = new THREE.BoxGeometry(width, height, depth);
  const mat = new THREE.MeshStandardMaterial({
    color: isLow ? 0x703311 : 0x8b0000,
    roughness: 0.6,
    metalness: 0.05
  });
  const obs = new THREE.Mesh(geom, mat);
  obs.position.set(CONFIG.lanes[laneIndex], height / 2, z);
  obs.castShadow = true;
  obs.userData = { laneIndex, isLow };

  obstacles.push(obs);
  scene.add(obs);
}

function createCoinLine(z) {
  const laneIndex = Math.floor(rng() * 3);
  const x = CONFIG.lanes[laneIndex];
  const count = 4;
  const spacing = 2;
  for (let i = 0; i < count; i++) {
    createCoin(x, z - i * spacing);
  }
}

function createCoin(x, z) {
  const coin = getPooledCoin();
  coin.position.set(x, 1.35, z);
  coin.userData = { spinSpeed: 0.15 + rng() * 0.15 };

  coins.push(coin);
  scene.add(coin);
}

/* POWER-UPS */

function scheduleNextPowerUp() {
  const now = performance.now() / 1000;
  const delay =
    CONFIG.powerUps.spawnIntervalMin +
    rng() * (CONFIG.powerUps.spawnIntervalMax - CONFIG.powerUps.spawnIntervalMin);
  nextPowerUpTime = now + delay;
}

function trySpawnPowerUp() {
  const now = performance.now() / 1000;
  if (now < nextPowerUpTime) return;
  scheduleNextPowerUp();

  const types = ["shield", "magnet"];
  const type = types[Math.floor(rng() * types.length)];
  const laneIndex = Math.floor(rng() * 3);
  const x = CONFIG.lanes[laneIndex];
  const z = obstacleZCursor - CONFIG.obstacleSpawnDistance - 10;

  const mesh = createPowerUpMesh(type);
  mesh.position.set(x, 1.5, z);
  mesh.userData.type = type;
  powerUps.push(mesh);
  scene.add(mesh);
}

function createPowerUpMesh(type) {
  let geom, mat;
  if (type === "shield") {
    geom = new THREE.SphereGeometry(0.45, 16, 16);
    mat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x003366,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.85
    });
  } else {
    geom = new THREE.TorusGeometry(0.4, 0.16, 10, 20);
    mat = new THREE.MeshStandardMaterial({
      color: 0xff0044,
      emissive: 0x330008,
      emissiveIntensity: 0.9,
      metalness: 0.7,
      roughness: 0.35
    });
  }
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  return mesh;
}

/* -------------------- INPUT & UI -------------------- */

function cacheUI() {
  ui.score = document.getElementById("score");
  ui.coins = document.getElementById("coins");
  ui.multiplier = document.getElementById("multiplier");
  ui.modeIndicator = document.getElementById("mode-indicator");
  ui.instructions = document.getElementById("instructions");
  ui.gameOverPanel = document.getElementById("game-over");
  ui.finalScore = document.getElementById("final-score");
  ui.finalCoins = document.getElementById("final-coins");
  ui.bestScore = document.getElementById("best-score");
  ui.restartBtn = document.getElementById("restart-btn");
  ui.mainMenu = document.getElementById("main-menu");
  ui.playBtn = document.getElementById("play-btn");
}

function startFromMenu() {
  gameState.inMenu = false;
  ui.mainMenu.style.display = "none";
  ui.instructions.style.display = "block";
}

function startGameIfNeeded() {
  if (!gameState.started && !gameState.over && !gameState.inMenu) {
    gameState.started = true;
    ui.instructions.style.display = "none";
  }
}

function onKeyDown(e) {
  const code = e.code;

  if (code === "Space" || code === "Enter") {
    if (gameState.inMenu) {
      startFromMenu();
      return;
    }
    startGameIfNeeded();
    if (gameState.over) restart();
  }

  if (!gameState.started || gameState.over) return;

  if (code === "ArrowLeft") {
    if (playerState.targetLaneIndex > 0) playerState.targetLaneIndex--;
  } else if (code === "ArrowRight") {
    if (playerState.targetLaneIndex < CONFIG.lanes.length - 1) {
      playerState.targetLaneIndex++;
    }
  } else if (code === "ArrowUp") {
    if (!playerState.isJumping && !playerState.isSliding) {
      playerState.isJumping = true;
      playerState.jumpVelocity = CONFIG.jumpInitialVelocity;
    }
  } else if (code === "ArrowDown") {
    if (!playerState.isSliding && !playerState.isJumping) {
      playerState.isSliding = true;
      playerState.slideTimer = CONFIG.slideDuration;
    }
  }
}

/* -------------------- MAIN LOOP -------------------- */

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1); // Cap dt to prevent large jumps
  lastTime = now;

  if (gameState.started && !gameState.over) {
    updateDifficulty(dt);
    updateBiomes(dt);
    
    // Check for boss spawn
    const score = Math.floor(gameState.distanceScore);
    if (shouldSpawnBoss(score)) {
      spawnBoss();
    }
    
    if (gameState.bossActive) {
      updateBoss(dt);
      updateBossProjectiles(dt);
    } else {
      updateGround(dt);
      updateObstacles(dt);
      trySpawnPowerUp();
    }
    
    updateCoins(dt);
    updatePowerUps(dt);
    updatePlayer(dt);
    
    if (!gameState.bossActive) {
      updateGuardian(dt);
    }
    
    // Update camera (scripted or normal)
    if (!updateCameraScript(dt)) {
      updateCamera(dt);
    }
    
    checkCollisions();
    updateHUD();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

/* -------------------- UPDATE SYSTEMS -------------------- */

function updateDifficulty(dt) {
  gameState.speed = Math.min(
    CONFIG.maxSpeed,
    gameState.speed + CONFIG.speedIncreasePerSecond * dt
  );

  gameState.distanceScore +=
    gameState.speed * CONFIG.score.distanceFactor * gameState.multiplier;

  const dist = Math.floor(gameState.distanceScore);
  const newMultiplier =
    1 +
    Math.min(
      CONFIG.score.maxMultiplier - 1,
      Math.floor(dist / CONFIG.score.multiplierIncreaseInterval)
    );
  if (newMultiplier !== gameState.multiplier) {
    gameState.multiplier = newMultiplier;
  }

  if (gameState.shieldTime > 0) {
    gameState.shieldTime -= dt;
    if (gameState.shieldTime < 0) gameState.shieldTime = 0;
  }

  if (gameState.magnetTime > 0) {
    gameState.magnetTime -= dt;
    if (gameState.magnetTime < 0) gameState.magnetTime = 0;
  }

  // Change mode indicator (RUN/VINE) based on whether any vine section is near
  const nearVine = vineSegments.some(
    v => v.startZ < player.position.z - 5 && v.endZ > player.position.z - 40
  );
  gameState.mode = nearVine ? "VINE" : "RUN";
}

function updateGround(dt) {
  const speed = gameState.speed;
  for (let i = groundSegments.length - 1; i >= 0; i--) {
    const seg = groundSegments[i];
    seg.position.z += speed;
    if (seg.position.z > 25) {
      scene.remove(seg);
      groundSegments.splice(i, 1);
    }
  }

  while (groundSegments.length < CONFIG.initialGroundSegments * 3) {
    const last = groundSegments[groundSegments.length - 1];
    const lastZ = last ? last.position.z : 0;
    const newZ = lastZ - CONFIG.groundSegmentLength;
    createGroundSegment(newZ);
  }

  while (player.position.z - obstacleZCursor > CONFIG.obstacleSpawnDistance) {
    const spawnZ = obstacleZCursor - CONFIG.obstacleSpawnDistance;
    createObstaclePattern(spawnZ);
    obstacleZCursor -= CONFIG.obstacleSpawnDistance;
  }

  // Move vine sections
  for (let i = vineSegments.length - 1; i >= 0; i--) {
    const v = vineSegments[i];
    v.mesh.position.z += speed;
    v.startZ += speed;
    v.endZ += speed;
    if (v.mesh.position.z > 25) {
      scene.remove(v.mesh);
      vineSegments.splice(i, 1);
    }
  }
}

function updatePlayer(dt) {
  const p = playerState;
  const targetX = CONFIG.lanes[p.targetLaneIndex];
  player.position.x += (targetX - player.position.x) * 10 * dt;

  if (p.isJumping) {
    player.position.y += p.jumpVelocity;
    p.jumpVelocity += CONFIG.gravity;
    if (player.position.y <= 1) {
      player.position.y = 1;
      p.isJumping = false;
      p.jumpVelocity = 0;
    }
  }

  if (p.isSliding) {
    p.slideTimer -= dt;
    if (p.slideTimer <= 0) p.isSliding = false;
  }

  // Life-like run animation (simplified)
  p.runTime += dt * 9;
  const phase = Math.sin(p.runTime);
  const phase2 = Math.sin(p.runTime + Math.PI);

  const {
    leftLeg,
    rightLeg,
    leftUpperArm,
    rightUpperArm,
    leftForearm,
    rightForearm,
    head,
    torso,
    shieldMesh
  } = player.userData;

  if (!p.isSliding) {
    // Legs swing opposite, heel slightly up
    leftLeg.rotation.x = 0.7 * phase;
    rightLeg.rotation.x = -0.7 * phase;
    leftLeg.position.z = 0.05 * Math.max(0, phase);
    rightLeg.position.z = 0.05 * Math.max(0, -phase);

    // Arms swing opposite to legs, slight elbow bend
    leftUpperArm.rotation.x = 0.6 * phase2;
    rightUpperArm.rotation.x = -0.6 * phase2;
    leftForearm.rotation.x = 0.3 * Math.max(0, -phase2);
    rightForearm.rotation.x = 0.3 * Math.max(0, phase2);

    // Subtle bob for torso/head
    const bob = 0.04 * Math.abs(phase);
    torso.position.y = 1.2 + bob;
    head.position.y = 2.1 + bob * 0.8;
  } else {
    torso.position.y = 0.9;
    head.position.y = 1.7;
    leftLeg.rotation.x = 0.2;
    rightLeg.rotation.x = 0.2;
    leftUpperArm.rotation.x = 0;
    rightUpperArm.rotation.x = 0;
    leftForearm.rotation.x = 0;
    rightForearm.rotation.x = 0;
  }

  if (gameState.shieldTime > 0) {
    const t = gameState.shieldTime;
    const intensity = 0.5 + 0.5 * Math.sin(t * 8);
    shieldMesh.material.opacity = 0.35 + 0.25 * intensity;
    shieldMesh.scale.setScalar(1.0 + 0.05 * intensity);
  } else {
    shieldMesh.material.opacity = 0;
    shieldMesh.scale.setScalar(1.0);
  }

  player.position.z = 0;
}

function updateGuardian(dt) {
  // Enemy behavior changes after certain score
  const aggressive =
    Math.floor(gameState.distanceScore) >= CONFIG.enemy.behaviorChangeScore;
  const runFactor = aggressive
    ? CONFIG.enemy.aggressiveRunFactor
    : CONFIG.enemy.baseRunFactor;

  const currentDistance = guardianState.distanceZ;
  const targetDistance = aggressive ? CONFIG.enemy.baseDistance + 3 : CONFIG.enemy.baseDistance;

  const diff = targetDistance - currentDistance;
  const baseFollowSpeed = gameState.speed * runFactor;
  const catchUp = diff * 0.25;

  guardianState.distanceZ += (baseFollowSpeed + catchUp) * dt * -1;
  guardianState.distanceZ = Math.max(
    targetDistance - 5,
    Math.min(-2, guardianState.distanceZ)
  );

  guardian.position.x += (player.position.x - guardian.position.x) * 3 * dt;
  guardian.position.z = player.position.z + guardianState.distanceZ;
  guardian.position.y = 1;

  // Animation
  guardianState.runTime += dt * 9.5;
  const phase = Math.sin(guardianState.runTime);
  const {
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    head,
    jaw,
    leftHorn,
    rightHorn
  } = guardian.userData;

  leftLeg.rotation.x = 0.5 * phase;
  rightLeg.rotation.x = -0.5 * phase;
  leftArm.rotation.x = 0.4 * -phase;
  rightArm.rotation.x = 0.4 * phase;
  head.position.y = 2.4 + 0.03 * Math.abs(phase);
  jaw.position.y = 2.1 + 0.02 * (1 - Math.abs(phase));
  leftHorn.rotation.y = 0.1 * phase;
  rightHorn.rotation.y = -0.1 * phase;
}

function updateCamera(dt) {
  const extraY = guardianState.distanceZ > -5 ? 0.3 : 0;
  const targetY =
    CONFIG.camera.baseY + 0.5 * (player.position.y - 1) + extraY;
  const targetZ = CONFIG.camera.baseZ;

  camera.position.y += (targetY - camera.position.y) * CONFIG.camera.followSmoothing;
  camera.position.z += (targetZ - camera.position.z) * CONFIG.camera.followSmoothing;
  camera.position.x += (player.position.x - camera.position.x) * CONFIG.camera.followSmoothing;

  if (gameState.cameraShakeTime > 0) {
    gameState.cameraShakeTime -= dt;
    const factor =
      CONFIG.camera.shakeIntensity *
      (gameState.cameraShakeTime / CONFIG.camera.shakeDuration);
    camera.position.x += (rng() - 0.5) * factor;
    camera.position.y += (rng() - 0.5) * factor;
  }

  camera.lookAt(player.position.x, player.position.y + 0.5, player.position.z - 8);
}

function updateObstacles(dt) {
  const speed = gameState.speed;
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.position.z += speed;
    if (!obs.userData.vineObstacle) obs.rotation.y += 0.02;
    if (obs.position.z > 15) {
      scene.remove(obs);
      obstacles.splice(i, 1);
    }
  }
}

function updateCoins(dt) {
  const speed = gameState.speed;
  const magnetActive = gameState.magnetTime > 0;
  const magnetRadius = CONFIG.powerUps.magnetRadius;
  const magnetPull = CONFIG.powerUps.magnetPullSpeed;

  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.position.z += speed;
    c.rotation.z += c.userData.spinSpeed;

    if (magnetActive) {
      const dx = player.position.x - c.position.x;
      const dy = player.position.y + 0.4 - c.position.y;
      const dz = player.position.z - c.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < magnetRadius && dist > 0.001) {
        const t = (magnetPull * dt) / dist;
        c.position.x += dx * t;
        c.position.y += dy * t;
        c.position.z += dz * t;
      }
    }

    if (c.position.z > 15) {
      returnCoinToPool(c);
      coins.splice(i, 1);
    }
  }
}

function updatePowerUps(dt) {
  const speed = gameState.speed;
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];
    p.position.z += speed;
    p.rotation.y += 1.5 * dt;
    p.position.y = 1.5 + 0.2 * Math.sin(performance.now() * 0.005);

    if (p.position.z > 15) {
      scene.remove(p);
      powerUps.splice(i, 1);
    }
  }
}

/* -------------------- COLLISIONS -------------------- */

function checkCollisions() {
  if (gameState.over) return;

  const px = player.position.x;
  const py = player.position.y;
  const pz = player.position.z;

  // Pits: if over a pit and not jumping high enough -> fall
  if (isOverPit(pz) && py <= 1.05) {
    if (gameState.shieldTime > 0) {
      gameState.shieldTime = Math.max(gameState.shieldTime - 2, 0);
      gameState.cameraShakeTime = CONFIG.camera.shakeDuration;
    } else {
      triggerGameOver();
      return;
    }
  }

  // Guardian catch
  if (
    guardianState.distanceZ >= CONFIG.enemy.catchDistanceZ &&
    gameState.shieldTime <= 0
  ) {
    triggerGameOver();
    return;
  }

  // Obstacles
  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    const dx = Math.abs(px - obs.position.x);
    const dz = Math.abs(pz - obs.position.z);
    if (dz < 0.8 && dx < 0.8) {
      if (obs.userData.vineObstacle) {
        // Vine obstacle: must slide
        if (!playerState.isSliding) {
          if (gameState.shieldTime > 0) {
            gameState.shieldTime = Math.max(gameState.shieldTime - 1.5, 0);
            gameState.cameraShakeTime = CONFIG.camera.shakeDuration * 0.7;
            scene.remove(obs);
            obstacles.splice(i, 1);
            i--;
          } else {
            triggerGameOver();
            return;
          }
        }
      } else {
        const isLow = obs.userData.isLow;
        const needSlide = isLow;
        const needJump = !isLow;
        const playerSliding = playerState.isSliding;
        const playerHigh = py >= 1.8;

        let hit = false;
        if (needSlide && !playerSliding) hit = true;
        if (needJump && !playerHigh) hit = true;

        if (hit) {
          if (gameState.shieldTime > 0) {
            gameState.shieldTime = Math.max(gameState.shieldTime - 1.5, 0);
            gameState.cameraShakeTime = CONFIG.camera.shakeDuration * 0.7;
            scene.remove(obs);
            obstacles.splice(i, 1);
            i--;
          } else {
            triggerGameOver();
            return;
          }
        }
      }
    }
  }

  // Coins
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    const dx = px - c.position.x;
    const dy = py - c.position.y;
    const dz = pz - c.position.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq < 0.8 * 0.8) {
      collectCoin(c, i);
    }
  }

  // Power-ups
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];
    const dx = px - p.position.x;
    const dy = py - p.position.y;
    const dz = pz - p.position.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq < 0.9 * 0.9) {
      applyPowerUp(p.userData.type);
      scene.remove(p);
      powerUps.splice(i, 1);
    }
  }
}

function collectCoin(coin, index) {
  gameState.coins += 1;
  gameState.distanceScore += CONFIG.score.coinValue * gameState.multiplier;
  returnCoinToPool(coin);
  coins.splice(index, 1);
}

function applyPowerUp(type) {
  if (type === "shield") {
    gameState.shieldTime = CONFIG.powerUps.shieldDuration;
    gameState.cameraShakeTime = CONFIG.camera.shakeDuration * 0.5;
  } else if (type === "magnet") {
    gameState.magnetTime = CONFIG.powerUps.magnetDuration;
  }
}

/* -------------------- GAME OVER / RESTART -------------------- */

function triggerGameOver() {
  gameState.over = true;
  gameState.started = false;
  gameState.cameraShakeTime = CONFIG.camera.shakeDuration;

  const finalScore = Math.floor(gameState.distanceScore);
  ui.finalScore.textContent = finalScore;
  ui.finalCoins.textContent = gameState.coins;

  if (finalScore > gameState.bestScore) {
    gameState.bestScore = finalScore;
    localStorage.setItem("templeRunnerBestScore", String(finalScore));
  }
  ui.bestScore.textContent = gameState.bestScore;

  ui.gameOverPanel.classList.remove("hidden");
}

function restart() {
  // Clean up all entities
  for (let obs of obstacles) scene.remove(obs);
  for (let c of coins) returnCoinToPool(c);
  for (let seg of groundSegments) scene.remove(seg);
  for (let p of powerUps) scene.remove(p);
  for (let v of vineSegments) scene.remove(v.mesh);
  for (let proj of bossProjectiles) scene.remove(proj);
  
  if (boss) {
    scene.remove(boss);
    boss = null;
  }

  obstacles = [];
  coins = [];
  groundSegments = [];
  powerUps = [];
  vineSegments = [];
  pitZones = [];
  bossProjectiles = [];
  bossState = null;
  cameraScript = null;

  // Reset biome
  gameState = createGameState();
  gameState.inMenu = false;
  applyBiome('jungle', true);

  for (let i = 0; i < CONFIG.initialGroundSegments; i++) {
    createGroundSegment(-i * CONFIG.groundSegmentLength);
  }

  playerState = createPlayerState();
  player.position.set(CONFIG.lanes[playerState.laneIndex], 1, 0);

  guardianState = createGuardianState();
  positionGuardianBehindPlayer();

  obstacleZCursor = -40;
  scheduleNextPowerUp();

  ui.gameOverPanel.classList.add("hidden");
  ui.instructions.style.display = "block";
  ui.modeIndicator.style.color = "";
  updateHUD();
}

/* -------------------- HUD & UTIL -------------------- */

function updateHUD() {
  const score = Math.floor(gameState.distanceScore);
  ui.score.textContent = "Score: " + score;
  ui.coins.textContent = "Coins: " + gameState.coins;
  ui.multiplier.textContent = "x" + gameState.multiplier;
  
  if (gameState.bossActive && bossState) {
    ui.modeIndicator.textContent = `BOSS ${bossState.health}/${bossState.maxHealth}`;
  } else {
    const biomeName = BIOMES[BIOME_ORDER[gameState.currentBiomeIndex]].name;
    ui.modeIndicator.textContent = `${gameState.mode} - ${biomeName}`;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* -------------------- START -------------------- */

// Wait for DOM and Three.js to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof THREE !== 'undefined') {
      init();
    } else {
      console.error('THREE.js is not loaded');
    }
  });
} else {
  // DOM already loaded
  if (typeof THREE !== 'undefined') {
    init();
  } else {
    // Wait a bit for Three.js to load
    setTimeout(function() {
      if (typeof THREE !== 'undefined') {
        init();
      } else {
        console.error('THREE.js failed to load');
      }
    }, 100);
  }
}