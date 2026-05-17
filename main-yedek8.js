import * as THREE from 'three';
import {OrbitControls} from 
'three/examples/jsm/controls/OrbitControls';


const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xD7D9D9);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
window.camera = camera;
window.addEventListener('pointerup', () => {
  console.log('📷 Kamera pozisyonu:', camera.position);
  console.log('🎯 OrbitControls hedefi:', orbitControls.target);
});
const orbitControls = 

new OrbitControls(camera, renderer.domElement);
orbitControls.enableZoom = false;
camera.position.set(0, 0, 10);
orbitControls.minPolarAngle = Math.PI / 2.18;
orbitControls.maxPolarAngle = Math.PI / 2.18;
orbitControls.update();

// grid
//const axesHelper = new THREE.AxesHelper(5);
//scene.add(axesHelper);

// webcam
//const gridHelper = new THREE.GridHelper(15,50);
//scene.add(gridHelper);




const material = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color(0xf5f2e8), // inci rengi
  roughness: 0.15,
  metalness: 0.05,
  clearcoat: 1,
  clearcoatRoughness: 0.1,
  envMapIntensity: 1.2
});




material.envMapIntensity = 9; 



  // BAROK İNCİ GEOMETRİSİ
const radius = 1.2;
const geometry = new THREE.SphereGeometry(radius, 64, 64);

const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);
// İnci için orijinal vertex pozisyonlarını kaydet
const originalPositions = sphere.geometry.attributes.position.array.slice();

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
  return (Math.sin(x * 0.33) + Math.cos(y * 0.33)) * 0.7;
}

const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2; // düz yatır
plane.position.y = -1.6;           // sphere’in altına koy
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


//Mouse Move

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener('pointermove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});


//Double Click
//window.addEventListener("dblclick", () => {
  //raycaster.setFromCamera(mouse, camera);
  //const hit = raycaster.intersectObject(sphere);

  //if (hit.length > 0) {
    //window.location.href = "/Nana.html"; 
  //}
//});

function animate(time) {
  // Raycaster’ı güncelle
  raycaster.setFromCamera(mouse, camera);

  // Sphere ile çarpışma kontrolü
  const intersects = raycaster.intersectObject(sphere);

  const pos = sphere.geometry.attributes.position;

  if (intersects.length > 0) {
    const point = intersects[0].point; // dokunulan nokta

    // Her vertex’i dolaş
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);

      const vertex = new THREE.Vector3(vx, vy, vz);
      const dist = vertex.distanceTo(point);
      const radius = 0.7;

      if (dist < radius) {
        const force = (radius - dist) * 0.1;
        vertex.lerp(point, force);
        pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
    }

    pos.needsUpdate = true;
    sphere.geometry.computeVertexNormals();
  }


  sphere.rotation.y += 0.001;
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
