// deathConditions.js - Game over verifications
import { showWarning, hideWarning, flashScreen } from './hud.js';
import { CONSTANTS } from './physics.js';
import { isSafetyStopActive } from './mission.js';

export function checkDeath(state) {
    let reason = null;
    
    // 1. Air Depth (Tank Empty)
    if (state.tank <= 0) {
        reason = "공기 탱크 소진 (Out of Air)";
    }
    
    // 2. DCS (Rapid ascent)
    if (state.dcsGauge >= 100) {
        reason = "감압병 발병: 치명적인 급상승 (DCS Hit)";
    }
    
    // 3. Lung Over-expansion
    // Max surface lung is 6L. If actual volume exceeds 130% of this capacity (7.8L) -> Pop
    const safeMaxVolume = CONSTANTS.MAX_LUNG_VOL * 1.1; // 6.6L
    const fatalVolume = CONSTANTS.MAX_LUNG_VOL * 1.3;   // 7.8L
    
    if (state.lungVolActual > fatalVolume) {
        reason = "폐과팽창상해 (Lung Over-expansion)";
    } else if (state.lungVolActual > safeMaxVolume) {
        showWarning("폐 팽창 경고! 호기하세요!");
        // Small screen shake or flash could be added
        if (Math.random() > 0.9) flashScreen('rgba(255,0,0,0.3)', 100);
    } else {
        hideWarning();
    }
    
    // 4. Skipped Safety Stop (Surfaced during safety stop)
    if (state.depth < 1 && isSafetyStopActive()) {
        reason = "안전정지 누락 출수 (Missed Safety Stop)";
    }

    if (reason) {
        document.getElementById('game-over-reason').innerText = reason;
        document.getElementById('game-over-screen').classList.remove('hidden');
        return true; // Is dead
    }
    
    return false; // Alive
}
