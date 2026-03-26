// scene.js - Three.js WebGL rendering logic
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, diverHands;
let fishGroup;
const clock = new THREE.Clock();

export function initScene(container) {
    scene = new THREE.Scene();
    
    // Blue Gradient / Fog based on depth
    scene.background = new THREE.Color(0x006994);
    scene.fog = new THREE.FogExp2(0x006994, 0.02);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 0); // Camera is the diver's head

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 100, 0); // From surface
    scene.add(dirLight);

    // Environment: Sea floor
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x9e927c }); // Sand color
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -30; // 30m depth floor
    scene.add(floor);

    // Environment: Cliff wall (Left side)
    const wallGeo = new THREE.PlaneGeometry(100, 40);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x444455 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(-10, -10, -20);
    wall.rotation.y = Math.PI / 4;
    scene.add(wall);

    // Load Diver Hands (GLB)
    const loader = new GLTFLoader();
    loader.load('assets/base_basic_shaded.glb', (gltf) => {
        diverHands = gltf.scene;
        // Position relative to camera to act as hands
        diverHands.position.set(0, -1.5, -2);
        diverHands.rotation.y = Math.PI; // Face outwards
        camera.add(diverHands);
        scene.add(camera);
    }, undefined, (error) => console.error("Error loading GLB:", error));

    // Particles/Fish
    fishGroup = new THREE.Group();
    const texLoader = new THREE.TextureLoader();
    texLoader.load('assets/fish.png', (tx) => {
        const fishGeo = new THREE.PlaneGeometry(0.5, 0.3);
        const fishMat = new THREE.MeshBasicMaterial({ map: tx, side: THREE.DoubleSide, transparent: true });
        
        for (let i = 0; i < 30; i++) {
            const f = new THREE.Mesh(fishGeo, fishMat);
            f.position.set(
                (Math.random() - 0.5) * 40,
                -Math.random() * 30, // distributed depth
                -5 - Math.random() * 20
            );
            f.userData = { speed: 0.5 + Math.random() * 0.5, offset: Math.random() * Math.PI * 2 };
            fishGroup.add(f);
        }
        scene.add(fishGroup);
    });

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

export function updateScene(depth) {
    const dt = clock.getDelta();

    // Camera move based on depth (inverted, as depth goes down, Y goes down)
    camera.position.y = -depth;
    
    // Light attenuation based on depth
    const lightInt = Math.max(0.1, 1 - (depth / 40));
    scene.children.forEach(c => {
        if (c.type === 'DirectionalLight') c.intensity = lightInt * 0.8;
    });
    
    // Fog density increases
    scene.fog.density = 0.02 + (depth * 0.001);
    
    // Background color darker
    const b = Math.max(0, 148 - depth * 3.5); // 0x006994 -> R:0, G:105, B:148
    const g = Math.max(0, 105 - depth * 2.5);
    scene.background.setRGB(0, g/255, b/255);
    scene.fog.color.setRGB(0, g/255, b/255);

    // Animate fish
    if (fishGroup) {
        fishGroup.children.forEach(fish => {
            fish.position.x += fish.userData.speed * dt;
            fish.position.y += Math.sin(clock.elapsedTime * 2 + fish.userData.offset) * 0.05 * dt;
            if (fish.position.x > 20) fish.position.x = -20;
        });
    }

    renderer.render(scene, camera);
}

export function getRendererCanvas() {
    return renderer.domElement;
}
