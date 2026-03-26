// main.js - Entry point and game loop
import { initScene, updateScene } from './scene.js';
import { state, updatePhysics } from './physics.js';
import { updateHUD } from './hud.js';
import { initGestures, startCamera, isCameraReady } from './gesture.js';
import { updateMissions } from './mission.js';
import { checkDeath } from './deathConditions.js';

let isRunning = false;
let lastTime = 0;

function init() {
    // UI Elements
    const startBtn = document.getElementById('btn-start');
    const startScreen = document.getElementById('start-screen');
    const videoElem = document.getElementById('input_video');
    const pipCanvas = document.getElementById('pip_canvas');

    // Init 3D Scene
    initScene(document.getElementById('canvas-container'));
    
    // Init MediaPipe
    initGestures(videoElem, pipCanvas);
    
    // Allow start after small delay for UI load
    setTimeout(() => {
        startBtn.disabled = false;
        document.querySelector('#start-screen p').innerText = "카메라를 켜고 안정적인 장소에서 준비하세요.";
    }, 1000);

    startBtn.addEventListener('click', async () => {
        startBtn.disabled = true;
        document.querySelector('#start-screen p').innerText = "카메라 로딩 중...";
        await startCamera();
        
        // Wait till MediaPipe returns first frame
        const checkReady = setInterval(() => {
            if (isCameraReady()) {
                clearInterval(checkReady);
                startScreen.style.display = 'none';
                lastTime = performance.now();
                isRunning = true;
                requestAnimationFrame(loop);
            }
        }, 100);
    });
}

function loop(time) {
    if (!isRunning) return;
    
    const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap delta time
    lastTime = time;

    // 1. Calculate buoyancies and movement based on gestural states
    updatePhysics(dt);
    
    // 2. Scene / Camera / Fish updates
    updateScene(state.depth);
    
    // 3. UI and gauges update
    updateHUD(state);
    
    // 4. Mission progression
    updateMissions(dt, state.depth);
    
    // 5. Check if we died
    if (checkDeath(state)) {
        isRunning = false;
        return; // Halt loop
    }
    
    requestAnimationFrame(loop);
}

// Bootstrap
window.addEventListener('DOMContentLoaded', init);
