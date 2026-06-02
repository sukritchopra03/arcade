import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import BackButton from './BackButton';
import './Racing.css';

export default function Racing() {
  const containerRef = useRef(null);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [phase, setPhase] = useState('menu'); // menu | playing | over
  const [finalScore, setFinalScore] = useState(0);
  
  const stateRef = useRef({ restart: null, cleanup: null });

  useEffect(() => {
    if (!containerRef.current) return;

    let scene, camera, renderer, car;
    let obstacles = [], roadMarkings = [];
    let gameStarted = false, gameOver = false;
    let sc = 0, spd = 0;
    let carX = 0;
    
    const roadWidth = 6.2;
    const laneWidth = roadWidth / 3;
    const keys = { left: false, right: false };
    let animId;

    // 1. Scene, Camera, Renderer Setup
    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0518);
    scene.fog = new THREE.FogExp2(0x0a0518, 0.015);

    camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    camera.position.set(0, 3.8, 6.2);
    camera.lookAt(0, 0.8, -12);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // 2. Neon Lighting
    scene.add(new THREE.AmbientLight(0x2b1e4a, 0.85));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(15, 30, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 3. Cyber Road
    const roadGeo = new THREE.PlaneGeometry(roadWidth, 400);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x0c0b1a, roughness: 0.7 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -200;
    road.receiveShadow = true;
    scene.add(road);

    // Road markings
    const mGeo = new THREE.PlaneGeometry(0.18, 2.2);
    const mMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
    for (let i = 0; i < 70; i++) {
      [-laneWidth / 2, laneWidth / 2].forEach(x => {
        const m = new THREE.Mesh(mGeo, mMat);
        m.rotation.x = -Math.PI / 2;
        m.position.set(x * 2, 0.02, -i * 6);
        scene.add(m);
        roadMarkings.push(m);
      });
    }

    // Glowing Neon Side Barriers
    const barrierGeo = new THREE.BoxGeometry(0.35, 0.6, 400);
    const barrierMatL = new THREE.MeshStandardMaterial({ color: 0x00ffd4, emissive: 0x00ffd4, emissiveIntensity: 0.45 });
    const barrierMatR = new THREE.MeshStandardMaterial({ color: 0xff007f, emissive: 0xff007f, emissiveIntensity: 0.45 });
    
    const lBarrier = new THREE.Mesh(barrierGeo, barrierMatL);
    lBarrier.position.set(-roadWidth / 2 - 0.2, 0.3, -200);
    scene.add(lBarrier);
    
    const rBarrier = new THREE.Mesh(barrierGeo, barrierMatR);
    rBarrier.position.set(roadWidth / 2 + 0.2, 0.3, -200);
    scene.add(rBarrier);

    // 4. Car Mesh (Sleek Cyber Wedge design)
    car = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(1.1, 0.45, 1.95);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff007f, metalness: 0.8, roughness: 0.15 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.4;
    body.castShadow = true;
    car.add(body);

    const cabinGeo = new THREE.BoxGeometry(0.85, 0.38, 1.0);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 0.78, -0.15);
    car.add(cabin);

    // Headlights
    const hlGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0x00ffd4 });
    [[-0.38, 0.4, -0.98], [0.38, 0.4, -0.98]].forEach(p => {
      const hl = new THREE.Mesh(hlGeo, hlMat);
      hl.position.set(...p);
      car.add(hl);
    });

    // Wheels
    const wGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.18, 12);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x18181b });
    [[-0.56, 0.2, 0.65], [0.56, 0.2, 0.65], [-0.56, 0.2, -0.65], [0.56, 0.2, -0.65]].forEach(p => {
      const w = new THREE.Mesh(wGeo, wMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(...p);
      car.add(w);
    });

    scene.add(car);

    // 5. Spawn Obstacles
    function createObstacle() {
      const lanes = [-laneWidth * 1.0, 0, laneWidth * 1.0];
      const lane = lanes[Math.floor(Math.random() * 3)];
      const obstacleColors = [0x00ffd4, 0xffd166, 0xff007f, 0x06b6d4];
      const colorSelected = obstacleColors[Math.floor(Math.random() * obstacleColors.length)];

      const geo = new THREE.BoxGeometry(1.0, 0.85, 1.6);
      const mat = new THREE.MeshStandardMaterial({
        color: colorSelected,
        emissive: colorSelected,
        emissiveIntensity: 0.18,
        metalness: 0.4,
        roughness: 0.4
      });
      const obs = new THREE.Mesh(geo, mat);
      obs.position.set(lane, 0.42, -90);
      obs.castShadow = true;
      obstacles.push(obs);
      scene.add(obs);
    }

    // 6. Animation Engine Loop
    function animate() {
      animId = requestAnimationFrame(animate);

      if (gameStarted && !gameOver) {
        spd = Math.min(0.72, spd + 0.00015);
        sc += Math.floor(spd * 85);
        setScore(sc);
        setSpeed(Math.floor(spd * 280));

        // Move road markings
        roadMarkings.forEach(m => {
          m.position.z += spd * 12;
          if (m.position.z > 10) m.position.z -= 400;
        });

        // Move and clear obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
          obstacles[i].position.z += spd * 12;
          if (obstacles[i].position.z > 8) {
            scene.remove(obstacles[i]);
            obstacles.splice(i, 1);
          }
        }
        
        // Spawn obstacles organically
        if (Math.random() < 0.024) createObstacle();

        // Steering Physics
        if (keys.left && carX > -laneWidth * 1.25) carX -= 0.085;
        if (keys.right && carX < laneWidth * 1.25) carX += 0.085;
        car.position.x = carX;
        car.rotation.y = (keys.left ? 0.12 : keys.right ? -0.12 : 0);

        // Check Collisions
        for (const obs of obstacles) {
          const dx = Math.abs(car.position.x - obs.position.x);
          const dz = Math.abs(car.position.z - obs.position.z);
          if (dx < 0.95 && dz < 1.45) {
            gameOver = true;
            gameStarted = false;
            setFinalScore(sc);
            setPhase('over');
          }
        }
      }

      renderer.render(scene, camera);
    }

    animate();

    // 7. Interactive Controls
    const onKeyDown = e => {
      if ((e.code === 'Space' || e.code === 'Enter') && !gameStarted && !gameOver) {
        gameStarted = true;
        setPhase('playing');
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    };

    const onKeyUp = e => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // 8. Resizing
    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 9. Exposed Hooks
    stateRef.current.restart = () => {
      gameOver = false;
      gameStarted = false;
      sc = 0;
      spd = 0;
      carX = 0;
      car.position.x = 0;
      obstacles.forEach(o => scene.remove(o));
      obstacles = [];
      setScore(0);
      setSpeed(0);
      setPhase('menu');
    };

    stateRef.current.cleanup = () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      cancelAnimationFrame(animId);
      
      obstacles.forEach(o => scene.remove(o));
      roadMarkings.forEach(m => scene.remove(m));
      scene.remove(car);
      scene.remove(lBarrier);
      scene.remove(rBarrier);
      
      renderer.dispose();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };

    return () => {
      stateRef.current.cleanup?.();
    };
  }, []);

  return (
    <div className="racing-root relative overflow-hidden bg-[#0a0518]">
      <div ref={containerRef} className="racing-container w-full h-full" />
      
      {phase === 'menu' && (
        <div className="racing-overlay absolute inset-0 flex flex-col items-center justify-center bg-black/75 z-20 font-mono text-center px-4">
          <span className="text-xs text-cyan-400 tracking-[0.4em]">// SYNTHWAVE_RACER</span>
          <h1 className="text-4xl md:text-6xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 mt-2 mb-4 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            3D Racing
          </h1>
          <p className="text-sm text-gray-300 mb-6">STEER: ← / → or A / D keys</p>
          
          <button 
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))}
            className="relative group px-6 py-3 text-cyan-400 hover:text-white uppercase transition-colors duration-300 tracking-widest font-black text-sm"
          >
            <span className="relative z-10">ENGAGE ENGINES [SPACE]</span>
            <span className="absolute inset-0 border border-cyan-500 group-hover:border-cyan-400 rounded bg-cyan-950/20 group-hover:bg-cyan-950/40 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]" />
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <div className="racing-hud absolute top-6 left-6 right-6 flex justify-between z-20 font-mono pointer-events-none">
          <div className="rhud-item bg-black/60 border border-cyan-500/20 text-cyan-400 px-4 py-2 rounded-xl backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            SCORE: {score}
          </div>
          <div className="rhud-item speed bg-black/60 border border-pink-500/20 text-pink-400 px-4 py-2 rounded-xl backdrop-blur-sm shadow-[0_0_15px_rgba(255,0,127,0.1)]">
            SPEED: {speed} KM/H
          </div>
        </div>
      )}

      {phase === 'over' && (
        <div className="racing-gameover absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#07070f]/95 border border-pink-500/30 p-8 md:p-12 rounded-2xl text-center z-30 font-mono shadow-[0_0_50px_rgba(255,0,127,0.15)] max-w-sm w-full">
          <span className="text-[10px] text-pink-500 tracking-[0.4em]">// SESSION_TERMINATED</span>
          <h2 className="text-3xl font-black text-white mt-2 mb-4 uppercase">CRASHED</h2>
          <div className="bg-black/40 border border-white/5 p-4 rounded-xl mb-6 text-sm text-cyan-300 uppercase tracking-wide">
            Final Score: {finalScore}
          </div>
          
          <button 
            onClick={() => stateRef.current.restart?.()}
            className="relative group px-6 py-2.5 text-cyan-400 hover:text-white uppercase transition-colors tracking-widest text-xs font-bold w-full"
          >
            <span className="relative z-10">RE-ENGAGE ENGINES</span>
            <span className="absolute inset-0 border border-cyan-500 group-hover:border-cyan-400 rounded bg-cyan-950/20 transition-all duration-300" />
          </button>
        </div>
      )}
      
      <BackButton />
    </div>
  );
}
