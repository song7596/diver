// physics.js - Handles Boyle's Law and buoyancy

export const CONSTANTS = {
    MASS: 80, // kg
    BASE_VOL: 75, // L
    WATER_DENSITY: 1.025, // kg/L
    MAX_LUNG_VOL: 6, // L (at surface)
    MAX_BCD_VOL: 15, // L (at surface)
    ATM_PRESSURE: 1, // bar at surface
    SEC_PER_FRAME: 1/60,
    GRAVITY: 9.8 // m/s^2 roughly, but we'll use a scaled logical force 
};

export const state = {
    depth: 0.1, // m (start slightly underwater)
    velocity: 0, // m/s
    tank: 200, // bar
    
    // Surface equivalents
    lungVolSurface: 3, // Half full
    bcdVolSurface: 0,  // Empty initially
    
    // Actual volumes at depth
    lungVolActual: 3,
    bcdVolActual: 0,
    
    netForce: 0,
    dcsGauge: 0
};

export function updatePhysics(dt) {
    // 1. Calculate pressure (Boyle's Law)
    // P = 1 atm + depth / 10
    const pressure = CONSTANTS.ATM_PRESSURE + Math.max(0, state.depth) / 10;
    
    // 2. Volumes at depth (V1*P1 = V2*P2)
    state.lungVolActual = state.lungVolSurface / pressure;
    state.bcdVolActual = state.bcdVolSurface / pressure;
    
    // 3. Total Buoyancy
    const totalVolume = CONSTANTS.BASE_VOL + state.lungVolActual + state.bcdVolActual;
    const buoyantForce = totalVolume * CONSTANTS.WATER_DENSITY; // kg conceptually
    
    // Net Force = Buoyancy - Gravity(Mass)
    state.netForce = buoyantForce - CONSTANTS.MASS;
    
    // 4. Movement (F = ma => a = F/m)
    // Scale down acceleration for gameplay realism (water resistance)
    const drag = state.velocity * Math.abs(state.velocity) * 1.5; // simple quadratic drag
    const acceleration = (state.netForce - drag) / CONSTANTS.MASS;
    
    state.velocity += acceleration * dt * 5; // Multiplier for responsiveness
    state.depth += state.velocity * dt;
    
    // Boundaries
    if (state.depth <= 0) {
        state.depth = 0;
        if (state.velocity < 0) state.velocity = 0;
    }
    
    if (state.depth > 40) { // Max depth limit for safety
        state.depth = 40;
        state.velocity = 0;
    }

    // 5. DCS Calculation (Rapid ascent check)
    if (state.velocity < -0.15) { // Faster than 9m/min (0.15m/s)
        state.dcsGauge += Math.abs(state.velocity) * dt * 5; 
    } else {
        // Slow recovery if stationary or descending
        state.dcsGauge -= dt * 0.5;
    }
    state.dcsGauge = Math.max(0, Math.min(100, state.dcsGauge));
    
    // 6. Tank utilization (rough burn rate based on time and depth)
    // approx. 200 bar -> 20 mins. 10 bar/min. Adjust by pressure.
    const consumeRate = (10 / 60) * pressure * dt;
    state.tank -= consumeRate;
    if (state.tank < 0) state.tank = 0;
}

export function injectBCD(dt) {
    if (state.tank > 0 && state.bcdVolSurface < CONSTANTS.MAX_BCD_VOL) {
        state.bcdVolSurface += 1.0 * dt; // 1L per second
        if (state.bcdVolSurface > CONSTANTS.MAX_BCD_VOL) state.bcdVolSurface = CONSTANTS.MAX_BCD_VOL;
    }
}

export function releaseBCD(dt) {
    if (state.bcdVolSurface > 0) {
        state.bcdVolSurface -= 1.5 * dt; // 1.5L per second deflate
        if (state.bcdVolSurface < 0) state.bcdVolSurface = 0;
    }
}

export function changeLungVol(delta) {
    state.lungVolSurface += delta;
    if (state.lungVolSurface < 0.5) state.lungVolSurface = 0.5;
    if (state.lungVolSurface > CONSTANTS.MAX_LUNG_VOL) state.lungVolSurface = CONSTANTS.MAX_LUNG_VOL;
}
