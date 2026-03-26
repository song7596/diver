// gesture.js - MediaPipe Initialization and parsing
import { changeLungVol, injectBCD, releaseBCD } from './physics.js';

let faceMesh, hands, camera;
let isReady = false;
let previousMouthDist = 0;

export function initGestures(videoElement, canvasElement) {
    const canvasCtx = canvasElement.getContext('2d');
    
    // Face Mesh Setup
    faceMesh = new FaceMesh({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }});
    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    faceMesh.onResults((results) => {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            // Upper lip (13), Lower lip (14)
            const upperLip = landmarks[13];
            const lowerLip = landmarks[14];
            const mouthDist = Math.abs(upperLip.y - lowerLip.y);
            
            // Calculate delta
            const delta = mouthDist - previousMouthDist;
            previousMouthDist = mouthDist;
            
            // Thresholds
            if (delta > 0.002) {
                // Inhale
                changeLungVol(delta * 100); 
            } else if (delta < -0.001) {
                // Exhale
                changeLungVol(delta * 50); // Slower exhale
            }
        }
    });

    // Hands Setup
    hands = new Hands({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }});
    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            // Index finger tip (8), PIP (6)
            // Thumb tip (4), IP (3)
            
            // BCD Release: Index bent (Tip y > PIP y roughly, or distance to palm)
            const indexTip = landmarks[8];
            const indexPip = landmarks[6];
            
            // BCD Inject: Thumb bent
            const thumbTip = landmarks[4];
            const thumbIp = landmarks[3];
            
            // Deflate BCD
            if (indexTip.y > indexPip.y) {
                releaseBCD(1/60); // Called ~60 times a sec
            }
            
            // Inflate BCD
            // Note: simple threshold, using x distance inversion based on handedness normally
            const palmBase = landmarks[0];
            const thumbToPalm = Math.hypot(thumbTip.x - palmBase.x, thumbTip.y - palmBase.y);
            const indexToPalm = Math.hypot(indexTip.x - palmBase.x, indexTip.y - palmBase.y);
            
            // If thumb is tucked in
            if (thumbToPalm < 0.2) {
                injectBCD(1/60);
            }
        }
        canvasCtx.restore();
    });

    // Camera Init
    camera = new Camera(videoElement, {
        onFrame: async () => {
            await faceMesh.send({image: videoElement});
            await hands.send({image: videoElement});
            isReady = true;
        },
        width: 320,
        height: 240
    });
}

export function startCamera() {
    return camera.start();
}

export function isCameraReady() {
    return isReady;
}
