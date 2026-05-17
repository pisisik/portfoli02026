import * as THREE from 'three';
import {OrbitControls} from 
'three/examples/jsm/controls/OrbitControls';


const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf8f8f0);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const orbitControls = 
new OrbitControls(camera, renderer.domElement);

camera.position.set(0, 10, 5);
orbitControls.minPolarAngle = Math.PI / 2;
orbitControls.maxPolarAngle = Math.PI / 2;
orbitControls.update();

// grid
//const axesHelper = new THREE.AxesHelper(5);
//scene.add(axesHelper);

// webcam
//const gridHelper = new THREE.GridHelper(15,50);
//scene.add(gridHelper);

const video = document.createElement('video');
video.autoplay = true;
video.muted = true;
video.playsInline = true;

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;

    // Webcam verisi geldiğinde videoyu başlat
    video.addEventListener('loadeddata', () => {
      video.play();
    });
  })
  .catch(err => {
    console.error("Webcam açılamadı:", err);
  });

const videoTexture = new THREE.VideoTexture(video);
videoTexture.colorSpace = THREE.SRGBColorSpace;
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.generateMipmaps = false;


videoTexture.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = videoTexture;

const material = new THREE.MeshStandardMaterial({
  map: videoTexture,      // webcam görüntüsü yüzeye basılıyor
  roughness: 0.2,
  metalness: 0.3,
  clearcoat: 1,
  clearcoatRoughness: 0.05
});

material.envMapIntensity = 9; 



  // BAROK İNCİ GEOMETRİSİ
const radius = 1.2;
const geometry = new THREE.SphereGeometry(radius, 64, 64);

const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);


sphere.castShadow = true;
const planeGeometry = new THREE.PlaneGeometry(200, 200, 200, 50);

const pos = planeGeometry.attributes.position;

for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const y = pos.getY(i);

  const n = simpleNoise(x, y); // hafif noise

  pos.setZ(i, n); // z eksenine hafif çıkıntı
}

pos.needsUpdate = true;
planeGeometry.computeVertexNormals();
const planeMaterial = new THREE.MeshStandardMaterial({
  color:(0x333333),   // kırık beyaz zemin
  roughness: 1,
  metalness: 0.0
});

function simpleNoise(x, y) {
  return (Math.sin(x * 0.2) + Math.cos(y * 0.25)) * 0.4;
}

const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2; // düz yatır
plane.position.y = -1.4;           // sphere’in altına koy
plane.receiveShadow = true;      // ⭐ gölgeyi al
scene.add(plane);

  
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
scene.add(ambientLight);
const shadowLight = new THREE.DirectionalLight(0xffffff, 1.5);
shadowLight.position.set(5, 10, 5);
shadowLight.castShadow = true;
scene.add(shadowLight);



renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;




const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener('pointermove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});




function animate(time) {
  // Raycaster’ı güncelle
  raycaster.setFromCamera(mouse, camera);

  // Sphere ile çarpışma kontrolü
  const intersects = raycaster.intersectObject(sphere);

  if (intersects.length > 0) {
    const point = intersects[0].point; // dokunulan nokta

    // Sphere geometry’sine eriş
    const pos = sphere.geometry.attributes.position;

    // Her vertex’i dolaş
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);

      // Vertex pozisyonu
      const vertex = new THREE.Vector3(vx, vy, vz);

      // Dokunulan noktaya uzaklık
      const dist = vertex.distanceTo(point);

      // Etki yarıçapı
      const radius = 0.7;

      if (dist < radius) {
        // Hamur etkisi: vertex’i biraz içeri çek
        const force = (radius - dist) * 0.1;
        vertex.lerp(point, force);

        pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
    }

    pos.needsUpdate = true;
    sphere.geometry.computeVertexNormals();
  }

  sphere.rotation.y += 0.0005;

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

