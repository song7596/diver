// hud.js - Manages DOM updates
export const elements = {
    depth: document.getElementById('val-depth'),
    tank: document.getElementById('val-tank'),
    barLung: document.getElementById('bar-lung'),
    barBcd: document.getElementById('bar-bcd'),
    barDcs: document.getElementById('bar-dcs'),
    safetystopVal: document.getElementById('val-safetystop'),
    safetystopContainer: document.getElementById('safety-stop-timer'),
    buoyancyInd: document.getElementById('buoyancy-indicator'),
    warningMsg: document.getElementById('warning-msg'),
    missionText: document.getElementById('mission-text'),
    missionTime: document.getElementById('val-mission-time'),
    missionCountdown: document.getElementById('mission-countdown'),
    targetBand: document.getElementById('target-band'),
    photoStack: document.getElementById('photo-stack'),
    flash: document.getElementById('flash-overlay')
};

export function updateHUD(state) {
    if (!state) return;

    // Numerical gauges
    elements.depth.innerText = state.depth.toFixed(1);
    elements.tank.innerText = state.tank.toFixed(0);

    // Bars (Percentage)
    const lungPct = Math.min(100, (state.lungVolActual / 6) * 100);
    const bcdPct = Math.min(100, (state.bcdVolSurface / 15) * 100);
    elements.barLung.style.height = `${lungPct}%`;
    elements.barBcd.style.height = `${bcdPct}%`;
    
    // DCS
    elements.barDcs.style.width = `${Math.min(100, state.dcsGauge)}%`;

    // Buoyancy Indicator
    if (state.netForce > 1) {
        elements.buoyancyInd.innerText = "↑ 양성부력";
        elements.buoyancyInd.style.color = "#ffeb3b";
        elements.buoyancyInd.style.borderColor = "#ffeb3b";
    } else if (state.netForce < -1) {
        elements.buoyancyInd.innerText = "↓ 음성부력";
        elements.buoyancyInd.style.color = "#f44336";
        elements.buoyancyInd.style.borderColor = "#f44336";
    } else {
        elements.buoyancyInd.innerText = "● 중성부력";
        elements.buoyancyInd.style.color = "#00ff00";
        elements.buoyancyInd.style.borderColor = "#00ff00";
    }
}

export function showWarning(msg) {
    elements.warningMsg.innerText = msg;
    elements.warningMsg.classList.remove('hidden');
}

export function hideWarning() {
    elements.warningMsg.classList.add('hidden');
}

export function flashScreen(color = 'white', durationMs = 500) {
    elements.flash.style.background = color;
    elements.flash.classList.remove('hidden');
    elements.flash.style.opacity = 1;
    setTimeout(() => {
        elements.flash.style.opacity = 0;
        setTimeout(() => elements.flash.classList.add('hidden'), 200);
    }, durationMs);
}

export function addPhotoFromCanvas(rendererCanvas) {
    const dataUrl = rendererCanvas.toDataURL("image/jpeg", 0.5);
    const polaroid = document.createElement('div');
    polaroid.className = 'polaroid';
    
    // Random rotation for stacking effect
    const angle = (Math.random() - 0.5) * 30;
    const x = (Math.random() - 0.5) * 20;
    const y = (Math.random() - 0.5) * 20;
    
    polaroid.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    
    const img = document.createElement('img');
    img.src = dataUrl;
    
    polaroid.appendChild(img);
    elements.photoStack.appendChild(polaroid);
}
