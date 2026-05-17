import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const video = document.getElementById("bgVideo");
const videoTexture = new THREE.VideoTexture(video);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.format = THREE.RGBFormat;
videoTexture.colorSpace = THREE.SRGBColorSpace;
video.play().catch(() => {});

scene.background = videoTexture;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableZoom   = false;
orbitControls.enablePan    = false;
orbitControls.enableRotate = false;
camera.position.set(0, 0, 10);
orbitControls.minPolarAngle = Math.PI / 2.18;
orbitControls.maxPolarAngle = Math.PI / 2.18;
orbitControls.update();

const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#F5EDE4"),
    roughness: 0.55,
    metalness: 0.65,
    clearcoat: 0.3,
    clearcoatRoughness: 0.6,
    sheen: 1,
    sheenColor: new THREE.Color("#ff9100"),
    sheenRoughness: 0.5,
    envMapIntensity: 9,
    side: THREE.FrontSide,
});

const SPHERE_RADIUS = 1.2;
const geometry = new THREE.SphereGeometry(SPHERE_RADIUS, 64, 64);
const sphere   = new THREE.Mesh(geometry, material);
scene.add(sphere);

const originalPositions = sphere.geometry.attributes.position.array.slice();

scene.add(new THREE.AmbientLight(0xFFE7C7,0.2 ));
const shadowLight = new THREE.DirectionalLight(0xffffff, 1.5);
shadowLight.position.set(5, 10, 25);
shadowLight.castShadow = true;
scene.add(shadowLight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

// ── Mouse ──
const mouse     = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

window.addEventListener('pointermove', (event) => {
    mouse.x =  (event.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// ── Get the closest point on the sphere surface toward the mouse ──
// This works regardless of which face the ray hits (front or back).
function getInfluencePoint() {
    raycaster.setFromCamera(mouse, camera);
    const ray = raycaster.ray;

    // Vector from ray origin to sphere center
    const sphereCenter = new THREE.Vector3(0, 0, 0);
    const oc = ray.origin.clone().sub(sphereCenter);

    // Closest point on the ray to sphere center
    const t = -oc.dot(ray.direction);
    const closest = ray.origin.clone().addScaledVector(ray.direction, Math.max(t, 0));

    // Distance from sphere center to that point
    const dist = closest.distanceTo(sphereCenter);

    // Only influence if ray passes within interaction radius of sphere
    const INTERACT_RADIUS = SPHERE_RADIUS * 1.5; // a bit larger than sphere
    if (dist > INTERACT_RADIUS) return null;

    // Project that closest point onto the sphere surface
    const onSurface = closest.clone().sub(sphereCenter).normalize().multiplyScalar(SPHERE_RADIUS);

    // Transform to sphere local space (accounting for rotation)
    const localPoint = sphere.worldToLocal(onSurface.clone());
    return localPoint;
}

function animate() {
    const pos          = sphere.geometry.attributes.position;
    const influencePoint = getInfluencePoint();

    if (influencePoint) {
        for (let i = 0; i < pos.count; i++) {
            const vertex = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
            const dist   = vertex.distanceTo(influencePoint);
            const radius = 0.7;
            if (dist < radius) {
                const force = (radius - dist) * 0.8;
                vertex.lerp(influencePoint, force);
                pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }
        }
        pos.needsUpdate = true;
        sphere.geometry.computeVertexNormals();
    }

    // Slow recovery
    for (let i = 0; i < pos.count; i++) {
        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        const oz = originalPositions[i * 3 + 2];
        pos.setXYZ(i,
            pos.getX(i) + (ox - pos.getX(i)) * 0.010,
            pos.getY(i) + (oy - pos.getY(i)) * 0.010,
            pos.getZ(i) + (oz - pos.getZ(i)) * 0.010,
        );
    }
    pos.needsUpdate = true;
    sphere.geometry.computeVertexNormals();

    sphere.rotation.y += 0.002;
    renderer.render(scene, camera);
}


// ── Sphere image texture on hover ──
const textureLoader = new THREE.TextureLoader();
let projectTexture = null;
let isHoveringProject = false;

// Orijinal malzeme rengini sakla
const originalColor = material.color.clone();

document.querySelectorAll('.projectLink').forEach(link => {
    link.addEventListener('mouseenter', () => {
        const imgPath = link.getAttribute('data-image');
        if (!imgPath) return;
        
        isHoveringProject = true;
        
        textureLoader.load(imgPath, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            projectTexture = texture;
            
            // Küreye texture uygula
            material.map = texture;
            material.color.set(0xffffff); // texture rengi bozmasın diye beyaz
            material.needsUpdate = true;
        });
    });

    link.addEventListener('mouseleave', () => {
        isHoveringProject = false;
        projectTexture = null;
        
        // Orijinal metalik görünüme dön
        material.map = null;
        material.color.copy(originalColor);
        material.needsUpdate = true;
    });
});



renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});