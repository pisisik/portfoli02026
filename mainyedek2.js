import * as THREE from 'three';
import {OrbitControls} from 
'three/examples/jsm/controls/OrbitControls';


const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

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



  
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
scene.add(ambientLight);







renderer.shadowMap.enabled = true;









function animate(time) {
    sphere.rotation.x = time / 90000;
    sphere.rotation.y = time / 90000;
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
