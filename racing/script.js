// 3D Racing Game
let scene, camera, renderer;
let car, road, obstacles = [];
let gameStarted = false;
let gameOver = false;
let score = 0;
let speed = 0;
let maxSpeed = 0.5;
let acceleration = 0.01;
let carX = 0;

const roadWidth = 6;
const laneWidth = roadWidth / 3;

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.Fog(0x87CEEB, 1, 100);

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 3, 5);
  camera.lookAt(0, 0, -10);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('game-container').appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);

  // Create car
  createCar();
  
  // Create road
  createRoad();

  // Event listeners
  window.addEventListener('resize', onWindowResize);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.getElementById('restart-btn').addEventListener('click', restart);

  animate();
}

function createCar() {
  const carGroup = new THREE.Group();
  
  // Car body
  const bodyGeometry = new THREE.BoxGeometry(1, 0.5, 1.5);
  const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.5;
  carGroup.add(body);
  
  // Car top
  const topGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.8);
  const topMaterial = new THREE.MeshPhongMaterial({ color: 0xCC0000 });
  const top = new THREE.Mesh(topGeometry, topMaterial);
  top.position.set(0, 0.95, -0.1);
  carGroup.add(top);
  
  // Wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.2, 16);
  const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
  
  const wheelPositions = [
    [-0.5, 0.2, 0.6],
    [0.5, 0.2, 0.6],
    [-0.5, 0.2, -0.6],
    [0.5, 0.2, -0.6]
  ];
  
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(...pos);
    carGroup.add(wheel);
  });
  
  carGroup.position.set(0, 0, 0);
  car = carGroup;
  scene.add(car);
}

function createRoad() {
  const roadGeometry = new THREE.PlaneGeometry(roadWidth, 200);
  const roadMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
  road = new THREE.Mesh(roadGeometry, roadMaterial);
  road.rotation.x = -Math.PI / 2;
  road.position.z = -100;
  scene.add(road);
  
  // Road markings
  for (let i = 0; i < 40; i++) {
    const markingGeometry = new THREE.PlaneGeometry(0.2, 2);
    const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const marking = new THREE.Mesh(markingGeometry, markingMaterial);
    marking.rotation.x = -Math.PI / 2;
    marking.position.set(-laneWidth, 0.01, -i * 5);
    scene.add(marking);
    
    const marking2 = new THREE.Mesh(markingGeometry, markingMaterial);
    marking2.rotation.x = -Math.PI / 2;
    marking2.position.set(laneWidth, 0.01, -i * 5);
    scene.add(marking2);
  }
}

function createObstacle() {
  const lanes = [-laneWidth, 0, laneWidth];
  const lane = lanes[Math.floor(Math.random() * lanes.length)];
  
  const obstacleGeometry = new THREE.BoxGeometry(1, 0.8, 1.5);
  const colors = [0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF];
  const obstacleMaterial = new THREE.MeshPhongMaterial({ 
    color: colors[Math.floor(Math.random() * colors.length)] 
  });
  const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
  obstacle.position.set(lane, 0.4, -50);
  
  obstacles.push(obstacle);
  scene.add(obstacle);
}

const keys = {
  left: false,
  right: false
};

function onKeyDown(event) {
  if (event.code === 'Space' && !gameStarted) {
    gameStarted = true;
    document.getElementById('instructions').style.display = 'none';
  }
  
  if (gameOver) return;
  
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
    keys.left = true;
  }
  if (event.code === 'ArrowRight' || event.code === 'KeyD') {
    keys.right = true;
  }
}

function onKeyUp(event) {
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
    keys.left = false;
  }
  if (event.code === 'ArrowRight' || event.code === 'KeyD') {
    keys.right = false;
  }
}

function updateCarPosition() {
  if (keys.left && carX > -laneWidth) {
    carX -= 0.05;
  }
  if (keys.right && carX < laneWidth) {
    carX += 0.05;
  }
  
  car.position.x = carX;
}

function checkCollision() {
  obstacles.forEach(obstacle => {
    const distance = Math.sqrt(
      Math.pow(car.position.x - obstacle.position.x, 2) +
      Math.pow(car.position.z - obstacle.position.z, 2)
    );
    
    if (distance < 1.2) {
      endGame();
    }
  });
}

function endGame() {
  gameOver = true;
  gameStarted = false;
  document.getElementById('final-score').textContent = score;
  document.getElementById('game-over').classList.remove('hidden');
}

function restart() {
  gameOver = false;
  gameStarted = false;
  score = 0;
  speed = 0;
  carX = 0;
  car.position.x = 0;
  
  obstacles.forEach(obstacle => scene.remove(obstacle));
  obstacles = [];
  
  document.getElementById('game-over').classList.add('hidden');
  document.getElementById('instructions').style.display = 'block';
  document.getElementById('score').textContent = 'Score: 0';
  document.getElementById('speed').textContent = 'Speed: 0';
}

function animate() {
  requestAnimationFrame(animate);
  
  if (gameStarted && !gameOver) {
    // Increase speed
    if (speed < maxSpeed) {
      speed += acceleration * 0.1;
    }
    
    // Update score
    score += Math.floor(speed * 100);
    document.getElementById('score').textContent = 'Score: ' + score;
    document.getElementById('speed').textContent = 'Speed: ' + Math.floor(speed * 200);
    
    // Move road markings
    scene.children.forEach(child => {
      if (child.geometry && child.geometry.type === 'PlaneGeometry' && 
          child.material.color.getHex() === 0xFFFFFF) {
        child.position.z += speed;
        if (child.position.z > 10) {
          child.position.z = -190;
        }
      }
    });
    
    // Move obstacles
    obstacles.forEach((obstacle, index) => {
      obstacle.position.z += speed;
      
      if (obstacle.position.z > 5) {
        scene.remove(obstacle);
        obstacles.splice(index, 1);
      }
    });
    
    // Create new obstacles
    if (Math.random() < 0.02) {
      createObstacle();
    }
    
    // Update car position
    updateCarPosition();
    
    // Check collisions
    checkCollision();
  }
  
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
