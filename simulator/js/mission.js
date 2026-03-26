// mission.js - Progression Logic
import { elements, addPhotoFromCanvas, flashScreen } from './hud.js';
import { getRendererCanvas } from './scene.js';

const MISSIONS = [
    { targetDepth: 5, tolerance: 0.5, requiredTime: 30, text: '미션 1: 5m 하강 후 대기' },
    { targetDepth: 10, tolerance: 0.5, requiredTime: 45, text: '미션 2: 10m 하강 후 대기' },
    { targetDepth: 20, tolerance: 0.5, requiredTime: 90, text: '미션 3: 20m 심해 산호 대기' },
    { targetDepth: 5, tolerance: 0.5, requiredTime: 180, text: '안전정지: 5m 유지 (3분)', isSafetyStop: true },
    { targetDepth: 0, tolerance: 0.5, requiredTime: 5, text: '출수: 수면으로 천천히 이동' }
];

let currentMissionIndex = 0;
let stableTime = 0;

export function updateMissions(dt, depth) {
    if (currentMissionIndex >= MISSIONS.length) {
        document.getElementById('mission-text').innerText = "모든 미션 완료!";
        elements.missionCountdown.classList.add('hidden');
        return;
    }

    const m = MISSIONS[currentMissionIndex];
    elements.missionText.innerText = m.text;
    
    // Draw target band on gauge (approx mapping to pixels if we wanted, or just simple text)
    elements.targetBand.classList.remove('hidden');
    elements.targetBand.innerText = `목표: ${m.targetDepth}m`;

    if (m.isSafetyStop) {
        elements.safetystopContainer.classList.remove('hidden');
    }

    // Check if in range
    const inRange = Math.abs(depth - m.targetDepth) <= m.tolerance;
    
    if (inRange) {
        stableTime += dt;
        elements.missionCountdown.classList.remove('hidden');
        
        const remain = Math.max(0, m.requiredTime - stableTime);
        elements.missionTime.innerText = remain.toFixed(0);
        
        if (m.isSafetyStop) {
            const min = Math.floor(remain / 60);
            const sec = Math.floor(remain % 60).toString().padStart(2, '0');
            elements.safetystopVal.innerText = `${min}:${sec}`;
        }
        
        if (remain <= 0) {
            // Mission Complete
            if (!m.isSafetyStop) {
                flashScreen('white', 600);
                setTimeout(() => addPhotoFromCanvas(getRendererCanvas()), 300);
            }
            currentMissionIndex++;
            stableTime = 0;
            elements.missionCountdown.classList.add('hidden');
            if (m.isSafetyStop) {
                elements.safetystopContainer.classList.add('hidden');
            }
        }
    } else {
        // Reset timer if out of bounds
        if (stableTime > 0) {
            stableTime -= dt * 2; // Punish leaving the zone
            if (stableTime < 0) stableTime = 0;
            const remain = Math.max(0, m.requiredTime - stableTime);
            elements.missionTime.innerText = remain.toFixed(0);
        }
    }
}

export function isSafetyStopActive() {
    const m = MISSIONS[currentMissionIndex];
    return m && m.isSafetyStop && stableTime > 0;
}
