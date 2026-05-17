import * as THREE from 'three';
import {OrbitControls} from 
'three/examples/jsm/controls/OrbitControls';


const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const orbitControls = 
new OrbitControls(camera, renderer.domElement);

camera.position.set(0, 2, 5);
orbitControls.update();

// grid
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// webcam
const gridHelper = new THREE.GridHelper(15,50);
scene.add(gridHelper);

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

  // MALZEME
  const material = new THREE.MeshStandardMaterial({
    color: 0xf5f2e8,   // inci rengi
    roughness: 0,
    metalness: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.00,
    envMapIntensity: 8,
  });



material.envMapIntensity = 15; 



  // BAROK İNCİ GEOMETRİSİ
  const radius = 1.2;
  const geometry = new THREE.SphereGeometry(radius, 64, 64);

  // Rastgele deformasyon
  const pos = geometry.attributes.position;
  const deform = 0.3;
  for (let i=0; i<pos.count; i++){
    pos.setXYZ(
      i,
      pos.getX(i) + (Math.random()-0.5)*deform,
      pos.getY(i) + (Math.random()-0.5)*deform,
      pos.getZ(i) + (Math.random()-0.5)*deform
    );
  }
  geometry.computeVertexNormals();

  const pearl = new THREE.Mesh(geometry, material);
  scene.add(pearl);



  
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
scene.add(ambientLight);

const directionalLight = 
new THREE.DirectionalLight(0xFFFFFF, 20);
scene.add(directionalLight);
directionalLight.position.set(-2, 4, 2);


const dLightHelper = 
new THREE.DirectionalLightHelper(directionalLight, 3);
scene.add(dLightHelper);

renderer.shadowMap.enabled = true;


directionalLight.castShadow = true;







function animate(time) {
    pearl.rotation.x = time / 90000;
    pearl.rotation.y = time / 90000;
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
