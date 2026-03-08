// Game Configuration
const config = {
    canvas: null,
    ctx: null,
    width: 1200,
    height: 800,
    buckets: [],
    particles: [],
    dataCubes: [],
    score: 0,
    round: 1,
    combo: 0,
    comboTimer: 0,
    gameState: 'menu',
    roundData: [
        { name: 'Physical Stomp', bucketCount: 4, spawnRate: 1500, duration: 30000, message: 'S3 replicates across 3 AZs!', regions: ['us-east-1', 'us-west-2', 'eu-west-1'] },
        { name: 'Atomic Breath', bucketCount: 5, spawnRate: 1200, duration: 30000, message: '11 Nines of Durability!', regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'] },
        { name: 'Sneak Attack', bucketCount: 6, spawnRate: 900, duration: 30000, message: 'Versioning Active!', regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'sa-east-1'] },
        { name: 'Object Lock', bucketCount: 7, spawnRate: 700, duration: 30000, message: 'Compliance Mode Enabled!', regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'sa-east-1', 'ap-northeast-1'] }
    ],
    currentRoundData: null,
    roundStartTime: 0,
    spawnTimer: 0,
    hits: 0,
    misses: 0,
    godzilla: {
        x: 100,
        y: 500,
        state: 'idle',
        animationTimer: 0,
        targetX: 100,
        targetY: 500
    },
    regions: [
        { name: 'us-west-2', x: 180, y: 300, label: 'US West' },
        { name: 'us-east-1', x: 280, y: 340, label: 'US East' },      // Below US West as requested
        { name: 'eu-west-1', x: 680, y: 250, label: 'EU West' },      // Moved right more
        { name: 'ap-southeast-1', x: 880, y: 520, label: 'Asia Pacific' },  // Moved down more
        { name: 'sa-east-1', x: 380, y: 520, label: 'South America' },
        { name: 'ap-northeast-1', x: 950, y: 280, label: 'Asia NE' }
    ],
    backgroundParticles: [],
    menuAnimation: {
        buckets: [],
        godzilla: { x: 200, y: 450, breathTimer: 0 },
        dataCubes: [],
        awsBlocks: []
    },
    gameOverData: null,
    soundEnabled: true,
    audioContext: null,
    comboBadges: [],
    godzillaTrail: [],
    isPaused: false,
    scaleX: 1,
    scaleY: 1,
    images: {
        godzilla: null,
        s3Bucket: null,
        awsDatacenter: null,
        worldMap: null,
        loaded: false,
        loadCount: 0,
        totalImages: 4
    }
};

// Image Loading
function loadImages() {
    const imageSources = {
        godzilla: 'assets/images/godzilla.png',
        s3Bucket: 'assets/images/s3-bucket.png',
        awsDatacenter: 'assets/images/aws-datacenter.png',
        worldMap: 'assets/images/world-map.png'
    };
    
    Object.keys(imageSources).forEach(key => {
        const img = new Image();
        img.onload = () => {
            config.images.loadCount++;
            if (config.images.loadCount === config.images.totalImages) {
                config.images.loaded = true;
                console.log('All images loaded successfully!');
            }
        };
        img.onerror = () => {
            console.warn(`Failed to load ${key} image. Using fallback graphics.`);
            config.images.loadCount++;
            if (config.images.loadCount === config.images.totalImages) {
                config.images.loaded = true;
            }
        };
        img.src = imageSources[key];
        config.images[key] = img;
    });
}

// Initialize game
function init() {
    config.canvas = document.getElementById('gameCanvas');
    config.ctx = config.canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    // FIX 4: Handle orientation change with a small delay to let browser finish rotating
    window.addEventListener('orientationchange', () => {
        setTimeout(resizeCanvas, 200);
    });
    setupEventListeners();
    loadHighScores();
    loadImages();
    initBackgroundParticles();
    gameLoop();
}

function initBackgroundParticles() {
    for (let i = 0; i < 50; i++) {
        config.backgroundParticles.push({
            x: Math.random() * config.width,
            y: Math.random() * config.height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.2
        });
    }
    
    initMenuAnimationPositions();
}

function initMenuAnimation() {
    // Deprecated - now using initMenuAnimationPositions() called from resizeCanvas
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    const isMobile = window.innerWidth <= 768;
    
    // Base design dimensions
    const baseWidth = 1200;
    const baseHeight = 800;
    
    if (isMobile) {
        // Mobile: use full viewport
        config.canvas.width = window.innerWidth;
        config.canvas.height = window.innerHeight;
        
        // Calculate scale to fit base design into mobile screen
        config.scaleX = config.canvas.width / baseWidth;
        config.scaleY = config.canvas.height / baseHeight;
    } else {
        // Desktop: use container size with max dimensions
        config.canvas.width = container.clientWidth;
        config.canvas.height = container.clientHeight;
        
        config.scaleX = config.canvas.width / baseWidth;
        config.scaleY = config.canvas.height / baseHeight;
    }
    
    config.width = config.canvas.width;
    config.height = config.canvas.height;
    
    // Reinitialize menu animation positions for new canvas size
    if (config.menuAnimation) {
        initMenuAnimationPositions();
    }
}

// Initialize menu animation positions based on current canvas size
function initMenuAnimationPositions() {
    config.menuAnimation.buckets = [];
    config.menuAnimation.dataCubes = [];
    config.menuAnimation.awsBlocks = [];
    
    config.menuAnimation.godzilla = {
        x: config.width * 0.15,
        y: config.height * 0.7
    };
    
    for (let i = 0; i < 4; i++) {
        const baseX = config.width * 0.5 + (i * config.width * 0.15);
        const baseY = config.height * 0.25 + Math.sin(i) * (config.height * 0.12);
        config.menuAnimation.buckets.push({
            x: baseX,
            y: baseY,
            baseY: baseY,
            rotation: 0,
            floatOffset: i * Math.PI / 3,
            scale: 0.8
        });
    }
    
    for (let i = 0; i < 40; i++) {
        config.menuAnimation.dataCubes.push({
            x: Math.random() * config.width,
            y: Math.random() * config.height,
            size: Math.random() * 8 + 4,
            speedX: (Math.random() - 0.5) * 1.5,
            speedY: Math.random() * 0.5 + 0.2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.03,
            opacity: Math.random() * 0.4 + 0.3,
            color: Math.random() > 0.5 ? '#00f3ff' : '#ff6b35'
        });
    }
    
    const isMobile = window.innerWidth <= 768;
    const awsY = isMobile ? config.height * 0.55 : config.height * 0.75;
    const awsSpacing = isMobile ? config.width * 0.18 : config.width * 0.15;
    const awsStartX = isMobile ? config.width * 0.1 : config.width * 0.15;
    
    for (let i = 0; i < 5; i++) {
        const blockX = awsStartX + (i * awsSpacing);
        const blockY = awsY;
        config.menuAnimation.awsBlocks.push({
            x: blockX,
            y: blockY,
            width: config.width * 0.08,
            height: config.height * 0.15 + Math.random() * (config.height * 0.05),
            glowPhase: Math.random() * Math.PI * 2
        });
    }
}

// Helper function to scale coordinates
function scaleX(x) {
    return x * config.scaleX;
}

function scaleY(y) {
    return y * config.scaleY;
}

function scaleSize(size) {
    return size * Math.min(config.scaleX, config.scaleY);
}

// Sound System
function initAudio() {
    if (!config.audioContext) {
        config.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!config.soundEnabled || !config.audioContext) return;
    
    const ctx = config.audioContext;
    const now = ctx.currentTime;
    
    switch(type) {
        case 'hit':
            const hitOsc = ctx.createOscillator();
            const hitGain = ctx.createGain();
            hitOsc.connect(hitGain);
            hitGain.connect(ctx.destination);
            hitOsc.frequency.setValueAtTime(800, now);
            hitOsc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
            hitGain.gain.setValueAtTime(0.3, now);
            hitGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            hitOsc.start(now);
            hitOsc.stop(now + 0.3);
            break;
            
        case 'laser':
            const laserOsc = ctx.createOscillator();
            const laserGain = ctx.createGain();
            laserOsc.connect(laserGain);
            laserGain.connect(ctx.destination);
            laserOsc.frequency.setValueAtTime(1200, now);
            laserOsc.frequency.exponentialRampToValueAtTime(2400, now + 0.15);
            laserGain.gain.setValueAtTime(0.2, now);
            laserGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            laserOsc.start(now);
            laserOsc.stop(now + 0.15);
            break;
            
        case 'spawn':
            const spawnOsc = ctx.createOscillator();
            const spawnGain = ctx.createGain();
            spawnOsc.connect(spawnGain);
            spawnGain.connect(ctx.destination);
            spawnOsc.frequency.setValueAtTime(200, now);
            spawnOsc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
            spawnGain.gain.setValueAtTime(0.15, now);
            spawnGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            spawnOsc.start(now);
            spawnOsc.stop(now + 0.2);
            break;
            
        case 'miss':
            const missOsc = ctx.createOscillator();
            const missGain = ctx.createGain();
            missOsc.connect(missGain);
            missGain.connect(ctx.destination);
            missOsc.frequency.setValueAtTime(150, now);
            missOsc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
            missGain.gain.setValueAtTime(0.2, now);
            missGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            missOsc.start(now);
            missOsc.stop(now + 0.2);
            break;
            
        case 'roundStart':
            const roundOsc = ctx.createOscillator();
            const roundGain = ctx.createGain();
            roundOsc.connect(roundGain);
            roundGain.connect(ctx.destination);
            roundOsc.frequency.setValueAtTime(400, now);
            roundOsc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
            roundGain.gain.setValueAtTime(0.25, now);
            roundGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            roundOsc.start(now);
            roundOsc.stop(now + 0.3);
            break;
            
        case 'retreat':
            const retreatOsc1 = ctx.createOscillator();
            const retreatOsc2 = ctx.createOscillator();
            const retreatOsc3 = ctx.createOscillator();
            const retreatGain = ctx.createGain();
            retreatOsc1.type = 'sawtooth';
            retreatOsc2.type = 'triangle';
            retreatOsc3.type = 'sine';
            retreatOsc1.connect(retreatGain);
            retreatOsc2.connect(retreatGain);
            retreatOsc3.connect(retreatGain);
            retreatGain.connect(ctx.destination);
            retreatOsc1.frequency.setValueAtTime(350, now);
            retreatOsc1.frequency.exponentialRampToValueAtTime(60, now + 2.5);
            retreatOsc2.frequency.setValueAtTime(525, now);
            retreatOsc2.frequency.exponentialRampToValueAtTime(90, now + 2.5);
            retreatOsc3.frequency.setValueAtTime(175, now);
            retreatOsc3.frequency.exponentialRampToValueAtTime(40, now + 2.5);
            retreatGain.gain.setValueAtTime(0.35, now);
            retreatGain.gain.linearRampToValueAtTime(0.45, now + 0.3);
            retreatGain.gain.linearRampToValueAtTime(0.4, now + 1.0);
            retreatGain.gain.linearRampToValueAtTime(0.25, now + 1.8);
            retreatGain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);
            retreatOsc1.start(now); retreatOsc2.start(now); retreatOsc3.start(now);
            retreatOsc1.stop(now + 2.5); retreatOsc2.stop(now + 2.5); retreatOsc3.stop(now + 2.5);
            setTimeout(() => {
                if (!config.soundEnabled || !config.audioContext) return;
                const splash1Osc = ctx.createOscillator();
                const splash1Gain = ctx.createGain();
                const splash1Now = ctx.currentTime;
                splash1Osc.type = 'square';
                splash1Osc.connect(splash1Gain);
                splash1Gain.connect(ctx.destination);
                splash1Osc.frequency.setValueAtTime(800, splash1Now);
                splash1Osc.frequency.exponentialRampToValueAtTime(120, splash1Now + 0.5);
                splash1Gain.gain.setValueAtTime(0.3, splash1Now);
                splash1Gain.gain.exponentialRampToValueAtTime(0.01, splash1Now + 0.5);
                splash1Osc.start(splash1Now);
                splash1Osc.stop(splash1Now + 0.5);
            }, 1000);
            setTimeout(() => {
                if (!config.soundEnabled || !config.audioContext) return;
                const splash2Osc = ctx.createOscillator();
                const splash2Gain = ctx.createGain();
                const splash2Now = ctx.currentTime;
                splash2Osc.type = 'square';
                splash2Osc.connect(splash2Gain);
                splash2Gain.connect(ctx.destination);
                splash2Osc.frequency.setValueAtTime(500, splash2Now);
                splash2Osc.frequency.exponentialRampToValueAtTime(80, splash2Now + 0.6);
                splash2Gain.gain.setValueAtTime(0.25, splash2Now);
                splash2Gain.gain.exponentialRampToValueAtTime(0.01, splash2Now + 0.6);
                splash2Osc.start(splash2Now);
                splash2Osc.stop(splash2Now + 0.6);
            }, 1600);
            setTimeout(() => {
                if (!config.soundEnabled || !config.audioContext) return;
                const bubbleOsc = ctx.createOscillator();
                const bubbleGain = ctx.createGain();
                const bubbleNow = ctx.currentTime;
                bubbleOsc.type = 'sine';
                bubbleOsc.connect(bubbleGain);
                bubbleGain.connect(ctx.destination);
                bubbleOsc.frequency.setValueAtTime(300, bubbleNow);
                bubbleOsc.frequency.exponentialRampToValueAtTime(50, bubbleNow + 0.8);
                bubbleGain.gain.setValueAtTime(0.15, bubbleNow);
                bubbleGain.gain.exponentialRampToValueAtTime(0.01, bubbleNow + 0.8);
                bubbleOsc.start(bubbleNow);
                bubbleOsc.stop(bubbleNow + 0.8);
            }, 2200);
            break;
            
        case 'victory':
            const vic1 = ctx.createOscillator();
            const vic2 = ctx.createOscillator();
            const vic3 = ctx.createOscillator();
            const vicGain = ctx.createGain();
            vic1.connect(vicGain); vic2.connect(vicGain); vic3.connect(vicGain);
            vicGain.connect(ctx.destination);
            vic1.frequency.setValueAtTime(523, now);
            vic2.frequency.setValueAtTime(659, now + 0.2);
            vic3.frequency.setValueAtTime(784, now + 0.4);
            vicGain.gain.setValueAtTime(0.25, now);
            vicGain.gain.setValueAtTime(0.25, now + 0.6);
            vicGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
            vic1.start(now); vic1.stop(now + 0.3);
            vic2.start(now + 0.2); vic2.stop(now + 0.5);
            vic3.start(now + 0.4); vic3.stop(now + 1.2);
            break;
            
        case 'comboMilestone':
            const comboOsc1 = ctx.createOscillator();
            const comboOsc2 = ctx.createOscillator();
            const comboGain = ctx.createGain();
            comboOsc1.connect(comboGain); comboOsc2.connect(comboGain);
            comboGain.connect(ctx.destination);
            comboOsc1.frequency.setValueAtTime(880, now);
            comboOsc1.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
            comboOsc2.frequency.setValueAtTime(1320, now);
            comboOsc2.frequency.exponentialRampToValueAtTime(2640, now + 0.15);
            comboGain.gain.setValueAtTime(0.2, now);
            comboGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            comboOsc1.start(now); comboOsc2.start(now);
            comboOsc1.stop(now + 0.15); comboOsc2.stop(now + 0.15);
            break;
            
        case 'roundComplete':
            const rcOsc = ctx.createOscillator();
            const rcGain = ctx.createGain();
            rcOsc.connect(rcGain);
            rcGain.connect(ctx.destination);
            rcOsc.frequency.setValueAtTime(600, now);
            rcOsc.frequency.exponentialRampToValueAtTime(900, now + 0.2);
            rcOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
            rcGain.gain.setValueAtTime(0.25, now);
            rcGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            rcOsc.start(now);
            rcOsc.stop(now + 0.4);
            break;
    }
}

function toggleSound() {
    config.soundEnabled = !config.soundEnabled;
    const btn = document.getElementById('soundToggleBtn');
    if (config.soundEnabled) {
        btn.textContent = '🔊 SOUND: ON';
        btn.classList.remove('muted');
        initAudio();
    } else {
        btn.textContent = '🔇 SOUND: OFF';
        btn.classList.add('muted');
    }
}

function togglePause() {
    if (config.gameState !== 'playing') return;
    config.isPaused = !config.isPaused;
    const overlay = document.getElementById('pause-overlay');
    if (config.isPaused) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

function addGodzillaTrail(x, y) {
    config.godzillaTrail.push({
        x: x,
        y: y,
        opacity: 0.8,
        size: 40,
        createdAt: Date.now()
    });
    if (config.godzillaTrail.length > 15) {
        config.godzillaTrail.shift();
    }
}

function updateGodzillaTrail() {
    for (let i = config.godzillaTrail.length - 1; i >= 0; i--) {
        const trail = config.godzillaTrail[i];
        const age = Date.now() - trail.createdAt;
        if (age > 500) {
            config.godzillaTrail.splice(i, 1);
            continue;
        }
        trail.opacity = 0.8 * (1 - age / 500);
        trail.size = 40 + (age / 500) * 20;
    }
}

function drawGodzillaTrail() {
    config.godzillaTrail.forEach(trail => {
        const gradient = config.ctx.createRadialGradient(
            trail.x, trail.y, 0,
            trail.x, trail.y, trail.size
        );
        gradient.addColorStop(0, `rgba(0, 243, 255, ${trail.opacity * 0.6})`);
        gradient.addColorStop(0.5, `rgba(0, 243, 255, ${trail.opacity * 0.3})`);
        gradient.addColorStop(1, 'rgba(0, 243, 255, 0)');
        config.ctx.fillStyle = gradient;
        config.ctx.beginPath();
        config.ctx.arc(trail.x, trail.y, trail.size, 0, Math.PI * 2);
        config.ctx.fill();
    });
}

function setupEventListeners() {
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('howToPlayBtn').addEventListener('click', () => showScreen('howto'));
    document.getElementById('highScoresBtn').addEventListener('click', () => showScreen('scores'));
    document.getElementById('soundToggleBtn').addEventListener('click', toggleSound);
    document.getElementById('backFromHowTo').addEventListener('click', () => showScreen('menu'));
    document.getElementById('backFromScores').addEventListener('click', () => showScreen('menu'));
    
    document.getElementById('replayBtn').addEventListener('click', () => { startGame(); });
    
    document.getElementById('mainMenuBtn').addEventListener('click', () => {
        config.gameState = 'menu';
        config.isPaused = false;
        config.buckets = [];
        config.particles = [];
        config.dataCubes = [];
        config.comboBadges = [];
        config.godzillaTrail = [];
        document.getElementById('pause-overlay').classList.remove('active');
        showScreen('menu');
    });
    
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('resumeBtn').addEventListener('click', togglePause);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && config.gameState === 'playing') {
            togglePause();
        }
    });
    
    document.getElementById('submitScore').addEventListener('click', submitPlayerScore);
    document.getElementById('skipScore').addEventListener('click', skipPlayerScore);
    document.getElementById('playerName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitPlayerScore();
    });
    
    config.canvas.addEventListener('click', handleClick);
    config.canvas.addEventListener('touchstart', handleTouch);
}

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`${screenName}-screen`).classList.add('active');
    document.getElementById('game-ui').classList.remove('active');
    if (screenName === 'scores') {
        displayHighScores();
    }
}

function startGame() {
    initAudio();
    config.score = 0;
    config.round = 1;
    config.combo = 0;
    config.hits = 0;
    config.misses = 0;
    config.buckets = [];
    config.particles = [];
    config.dataCubes = [];
    config.comboBadges = [];
    config.godzillaTrail = [];
    config.gameState = 'playing';
    config.currentRoundData = config.roundData[0];
    config.roundStartTime = Date.now();
    config.spawnTimer = 0;
    playSound('roundStart');
    
    const isMobile = window.innerWidth <= 768;
    const isPortrait = window.innerHeight > window.innerWidth;
    
    let startX, startY;
    if (isMobile) {
        if (isPortrait) {
            startX = config.width * 0.2;
            startY = config.height * 0.65;
        } else {
            startX = config.width * 0.15;
            startY = config.height * 0.65;
        }
    } else {
        startX = config.width * 0.1;
        startY = config.height * 0.7;
    }
    
    config.godzilla = {
        x: startX,
        y: startY,
        state: 'idle',
        animationTimer: 0,
        targetX: startX,
        targetY: startY
    };
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('game-ui').classList.add('active');
    updateUI();
    
    for (let i = 0; i < 30; i++) {
        spawnDataCube();
    }
}

function handleClick(e) {
    if (config.gameState !== 'playing' || config.isPaused) return;
    const rect = config.canvas.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) * (config.canvas.width / rect.width);
    const canvasY = (e.clientY - rect.top) * (config.canvas.height / rect.height);
    checkBucketHit(canvasX, canvasY);
}

function handleTouch(e) {
    if (config.gameState !== 'playing' || config.isPaused) return;
    e.preventDefault();
    const rect = config.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const canvasX = (touch.clientX - rect.left) * (config.canvas.width / rect.width);
    const canvasY = (touch.clientY - rect.top) * (config.canvas.height / rect.height);
    checkBucketHit(canvasX, canvasY);
}

function checkBucketHit(x, y) {
    for (let i = config.buckets.length - 1; i >= 0; i--) {
        const bucket = config.buckets[i];
        const dist = Math.hypot(x - bucket.x, y - bucket.y);
        if (dist < bucket.radius) {
            config.godzilla.targetX = bucket.x - 80;
            config.godzilla.targetY = bucket.y;
            config.godzilla.state = 'stomping';
            config.godzilla.animationTimer = 500;
            config.buckets.splice(i, 1);
            config.score += 100 * (config.combo + 1);
            config.combo++;
            config.hits++;
            config.comboTimer = 2000;
            playSound('hit');
            if (config.combo > 0 && config.combo % 5 === 0) {
                playSound('comboMilestone');
                createComboBadge(config.combo, bucket.x, bucket.y);
            }
            createExplosion(bucket.x, bucket.y);
            createDataCubeFlow(bucket.x, bucket.y);
            updateUI();
            return;
        }
    }
    config.combo = 0;
    config.misses++;
    updateUI();
}

function spawnBucket() {
    const activeRegions = config.currentRoundData.regions;
    const randomRegionName = activeRegions[Math.floor(Math.random() * activeRegions.length)];
    const region = config.regions.find(r => r.name === randomRegionName);
    
    playSound('spawn');
    
    const isMobile = window.innerWidth <= 768;
    const bucketSize = isMobile ? 70 : 50;
    
    if (!region) {
        console.warn('Region not found:', randomRegionName);
        const fallbackRegion = config.regions[0];
        const bucket = {
            x: scaleX(fallbackRegion.x + (Math.random() - 0.5) * 100),
            y: scaleY(fallbackRegion.y + (Math.random() - 0.5) * 100),
            radius: scaleSize(bucketSize),
            lifetime: 1500,
            createdAt: Date.now(),
            glow: 0,
            rotation: 0,
            region: fallbackRegion.name
        };
        config.buckets.push(bucket);
        return;
    }
    
    const bucket = {
        x: scaleX(region.x + (Math.random() - 0.5) * 100),
        y: scaleY(region.y + (Math.random() - 0.5) * 100),
        radius: scaleSize(bucketSize),
        lifetime: 1500,
        createdAt: Date.now(),
        glow: 0,
        rotation: 0,
        region: region.name
    };
    config.buckets.push(bucket);
}

function spawnDataCube() {
    config.dataCubes.push({
        x: Math.random() * config.width,
        y: Math.random() * config.height,
        size: Math.random() * 15 + 8,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        opacity: Math.random() * 0.4 + 0.3,
        color: Math.random() > 0.5 ? '#00f3ff' : '#ff6b35'
    });
}

function createExplosion(x, y) {
    for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30;
        const speed = Math.random() * 5 + 3;
        config.particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: 0.015,
            size: Math.random() * 4 + 2,
            color: Math.random() > 0.5 ? '#00f3ff' : '#ff6b35',
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2
        });
    }
}

function createDataCubeFlow(x, y) {
    for (let i = 0; i < 15; i++) {
        config.dataCubes.push({
            x: x, y: y,
            size: Math.random() * 6 + 3,
            speedX: (Math.random() - 0.5) * 4,
            speedY: -Math.random() * 3 - 2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            opacity: 1,
            color: '#00f3ff',
            lifetime: 1500,
            createdAt: Date.now()
        });
    }
}

function createComboBadge(comboCount, x, y) {
    config.comboBadges.push({
        x: x, y: y,
        combo: comboCount,
        scale: 0.5,
        opacity: 1,
        life: 1,
        createdAt: Date.now()
    });
}

function updateComboBadges() {
    for (let i = config.comboBadges.length - 1; i >= 0; i--) {
        const badge = config.comboBadges[i];
        const age = Date.now() - badge.createdAt;
        const progress = age / 2000;
        if (progress >= 1) {
            config.comboBadges.splice(i, 1);
            continue;
        }
        if (progress < 0.3) {
            badge.scale = 0.5 + (progress / 0.3) * 1.5;
        } else {
            badge.opacity = 1 - ((progress - 0.3) / 0.7);
        }
        badge.y -= 1;
    }
}

function drawComboBadges() {
    config.comboBadges.forEach(badge => {
        config.ctx.save();
        config.ctx.translate(badge.x, badge.y);
        config.ctx.scale(badge.scale, badge.scale);
        config.ctx.globalAlpha = badge.opacity;
        const gradient = config.ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
        config.ctx.fillStyle = gradient;
        config.ctx.beginPath();
        config.ctx.arc(0, 0, 60, 0, Math.PI * 2);
        config.ctx.fill();
        config.ctx.strokeStyle = '#FFD700';
        config.ctx.lineWidth = 3;
        config.ctx.shadowColor = '#FFD700';
        config.ctx.shadowBlur = 20;
        config.ctx.beginPath();
        config.ctx.arc(0, 0, 45, 0, Math.PI * 2);
        config.ctx.stroke();
        config.ctx.shadowBlur = 10;
        config.ctx.fillStyle = '#FFFFFF';
        config.ctx.font = 'bold 32px Arial';
        config.ctx.textAlign = 'center';
        config.ctx.textBaseline = 'middle';
        config.ctx.fillText(`${badge.combo}x`, 0, -5);
        config.ctx.font = 'bold 14px Arial';
        config.ctx.fillStyle = '#FFD700';
        config.ctx.fillText('COMBO!', 0, 18);
        config.ctx.shadowBlur = 0;
        config.ctx.restore();
    });
}

function updateUI() {
    document.getElementById('score').textContent = config.score;
    document.getElementById('round').textContent = config.round;
    document.getElementById('combo').textContent = config.combo;
}

function update(deltaTime) {
    if (config.gameState !== 'playing' || config.isPaused) return;
    
    const elapsed = Date.now() - config.roundStartTime;
    if (elapsed > config.currentRoundData.duration) {
        nextRound();
        return;
    }
    
    config.spawnTimer += deltaTime;
    if (config.spawnTimer > config.currentRoundData.spawnRate) {
        if (config.buckets.length < config.currentRoundData.bucketCount) {
            spawnBucket();
        }
        config.spawnTimer = 0;
    }
    
    config.comboTimer = Math.max(0, config.comboTimer - deltaTime);
    if (config.comboTimer === 0 && config.combo > 0) {
        config.combo = 0;
        updateUI();
    }
    
    if (config.godzilla.state === 'stomping') {
        config.godzilla.animationTimer -= deltaTime;
        if (config.godzilla.animationTimer <= 0) {
            config.godzilla.state = 'idle';
        }
    }
    
    const oldX = config.godzilla.x;
    const oldY = config.godzilla.y;
    config.godzilla.x += (config.godzilla.targetX - config.godzilla.x) * 0.1;
    config.godzilla.y += (config.godzilla.targetY - config.godzilla.y) * 0.1;
    
    const moved = Math.hypot(config.godzilla.x - oldX, config.godzilla.y - oldY);
    if (moved > 2) {
        addGodzillaTrail(config.godzilla.x, config.godzilla.y);
    }
    
    updateGodzillaTrail();
    
    for (let i = config.buckets.length - 1; i >= 0; i--) {
        const bucket = config.buckets[i];
        const age = Date.now() - bucket.createdAt;
        if (age > bucket.lifetime) {
            config.buckets.splice(i, 1);
            config.misses++;
            playSound('miss');
        } else {
            bucket.glow = Math.sin(age / 200) * 0.5 + 0.5;
            bucket.rotation += 0.01;
        }
    }
    
    for (let i = config.particles.length - 1; i >= 0; i--) {
        const p = config.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.vx *= 0.98;
        p.vy *= 0.98;
        if (p.rotationSpeed) p.rotation += p.rotationSpeed;
        if (p.life <= 0) { config.particles.splice(i, 1); }
    }
    
    for (let i = config.dataCubes.length - 1; i >= 0; i--) {
        const cube = config.dataCubes[i];
        cube.x += cube.speedX;
        cube.y += cube.speedY;
        cube.rotation += cube.rotationSpeed;
        if (cube.lifetime) {
            const age = Date.now() - cube.createdAt;
            if (age > cube.lifetime) { config.dataCubes.splice(i, 1); continue; }
            cube.opacity = 1 - (age / cube.lifetime);
        }
        if (cube.x < -20) cube.x = config.width + 20;
        if (cube.x > config.width + 20) cube.x = -20;
        if (cube.y < -20) cube.y = config.height + 20;
        if (cube.y > config.height + 20) cube.y = -20;
    }
    
    config.backgroundParticles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = config.width;
        if (p.x > config.width) p.x = 0;
        if (p.y < 0) p.y = config.height;
        if (p.y > config.height) p.y = 0;
    });
    
    updateComboBadges();
    
    while (config.dataCubes.length < 30) {
        spawnDataCube();
    }
}

function nextRound() {
    if (config.round < config.roundData.length) {
        playSound('roundComplete');
        config.round++;
        config.currentRoundData = config.roundData[config.round - 1];
        config.roundStartTime = Date.now();
        config.buckets = [];
    } else {
        endGame();
    }
}

function endGame() {
    config.gameState = 'gameOver';
    const accuracy = config.hits / (config.hits + config.misses) * 100;
    let ending = '';
    if (accuracy < 50) ending = 'Bronze: Godzilla Retreats';
    else if (accuracy < 80) ending = 'Silver: Stalemate';
    else if (accuracy < 95) ending = 'Gold: Godzilla\'s Rampage';
    else ending = 'Secret: The Impossible!';
    playSound('retreat');
    config.gameOverData = {
        score: config.score,
        accuracy: accuracy,
        ending: ending,
        animationProgress: 0,
        victoryPlayed: false
    };
    setTimeout(() => {
        showNameInputModal(config.score, accuracy, ending);
    }, 3000);
}

function draw() {
    const gradient = config.ctx.createRadialGradient(config.width / 2, config.height / 2, 0, config.width / 2, config.height / 2, config.width);
    gradient.addColorStop(0, '#1a2332');
    gradient.addColorStop(0.5, '#0f1621');
    gradient.addColorStop(1, '#050a12');
    config.ctx.fillStyle = gradient;
    config.ctx.fillRect(0, 0, config.width, config.height);
    
    const fogGradient = config.ctx.createLinearGradient(0, 0, 0, config.height);
    fogGradient.addColorStop(0, 'rgba(0, 243, 255, 0.02)');
    fogGradient.addColorStop(0.5, 'rgba(0, 243, 255, 0.05)');
    fogGradient.addColorStop(1, 'rgba(255, 107, 53, 0.03)');
    config.ctx.fillStyle = fogGradient;
    config.ctx.fillRect(0, 0, config.width, config.height);
    
    drawBackgroundParticles();
    
    if (config.gameState === 'menu') {
        drawMenuAnimation();
    } else if (config.gameState === 'playing') {
        drawWorldMap();
        drawGrid();
        drawRegionalMap();
        drawDataCubes();
        drawGodzillaTrail();
        drawGodzilla();
        drawBuckets();
        drawParticles();
        drawComboBadges();
        drawRoundInfo();
    } else if (config.gameState === 'gameOver') {
        drawGameOverAnimation();
    }
}

function drawMenuAnimation() {
    const time = Date.now() * 0.001;
    
    drawWorldMap();
    drawGrid();
    
    config.menuAnimation.dataCubes.forEach(cube => {
        cube.x += cube.speedX;
        cube.y += cube.speedY;
        cube.rotation += cube.rotationSpeed;
        if (cube.x < -20) cube.x = config.width + 20;
        if (cube.x > config.width + 20) cube.x = -20;
        if (cube.y < -20) cube.y = config.height + 20;
        if (cube.y > config.height + 20) cube.y = -20;
        
        config.ctx.save();
        config.ctx.translate(cube.x, cube.y);
        config.ctx.rotate(cube.rotation);
        const size = cube.size;
        const alpha = cube.opacity;
        config.ctx.shadowColor = cube.color;
        config.ctx.shadowBlur = 15;
        const frontGradient = config.ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
        frontGradient.addColorStop(0, cube.color.replace(')', `, ${alpha * 0.9})`).replace('rgb', 'rgba'));
        frontGradient.addColorStop(1, cube.color.replace(')', `, ${alpha * 0.6})`).replace('rgb', 'rgba'));
        config.ctx.fillStyle = frontGradient;
        config.ctx.fillRect(-size / 2, -size / 2, size, size);
        config.ctx.fillStyle = cube.color.replace(')', `, ${alpha * 0.4})`).replace('rgb', 'rgba');
        config.ctx.beginPath();
        config.ctx.moveTo(-size / 2, -size / 2);
        config.ctx.lineTo(0, -size / 2 - size / 3);
        config.ctx.lineTo(size / 2, -size / 2);
        config.ctx.closePath();
        config.ctx.fill();
        config.ctx.fillStyle = cube.color.replace(')', `, ${alpha * 0.3})`).replace('rgb', 'rgba');
        config.ctx.beginPath();
        config.ctx.moveTo(size / 2, -size / 2);
        config.ctx.lineTo(size / 2 + size / 3, 0);
        config.ctx.lineTo(size / 2 + size / 3, size / 2);
        config.ctx.lineTo(size / 2, size / 2);
        config.ctx.closePath();
        config.ctx.fill();
        config.ctx.shadowBlur = 0;
        config.ctx.restore();
    });
    
    config.menuAnimation.awsBlocks.forEach((block, i) => {
        const glowIntensity = (Math.sin(time * 2 + block.glowPhase) + 1) / 2;
        const pulsePhase = Math.sin(time * 2 + i * 0.5) * 0.2 + 0.8;
        const centerX = scaleX(block.x + block.width / 2);
        const centerY = scaleY(block.y + block.height / 2);
        const auraRadius = scaleSize(100);
        const circleRadius = scaleSize(80);
        const innerRadius = scaleSize(60 + (Math.sin(time * 3 + i) * 0.5 + 0.5) * 10);
        
        const auraGradient = config.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, auraRadius);
        auraGradient.addColorStop(0, `rgba(0, 243, 255, ${0.3 * pulsePhase})`);
        auraGradient.addColorStop(0.5, `rgba(0, 243, 255, ${0.15 * pulsePhase})`);
        auraGradient.addColorStop(1, 'rgba(0, 243, 255, 0)');
        config.ctx.fillStyle = auraGradient;
        config.ctx.beginPath();
        config.ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
        config.ctx.fill();
        
        config.ctx.strokeStyle = `rgba(0, 243, 255, ${0.8 * pulsePhase})`;
        config.ctx.lineWidth = 3;
        config.ctx.setLineDash([5, 5]);
        config.ctx.lineDashOffset = -time * 20;
        config.ctx.beginPath();
        config.ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
        config.ctx.stroke();
        config.ctx.setLineDash([]);
        
        config.ctx.strokeStyle = `rgba(0, 243, 255, ${Math.sin(time * 3 + i) * 0.5 + 0.5})`;
        config.ctx.lineWidth = 2;
        config.ctx.beginPath();
        config.ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        config.ctx.stroke();
        
        const regionLabels = ['US West', 'US East', 'EU West', 'Asia Pacific', 'South America'];
        config.ctx.fillStyle = 'rgba(0, 243, 255, 0.8)';
        config.ctx.font = `bold ${scaleSize(14)}px Arial`;
        config.ctx.textAlign = 'center';
        config.ctx.shadowColor = '#00f3ff';
        config.ctx.shadowBlur = 10;
        config.ctx.fillText(regionLabels[i] || 'AWS', centerX, centerY - scaleSize(95));
        config.ctx.shadowBlur = 0;
        
        config.ctx.save();
        config.ctx.translate(centerX, centerY);
        config.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        config.ctx.shadowBlur = 20;
        config.ctx.shadowOffsetX = 5;
        config.ctx.shadowOffsetY = 10;
        
        if (config.images.awsDatacenter && config.images.awsDatacenter.complete && config.images.awsDatacenter.naturalWidth > 0) {
            const imgSize = scaleSize(60);
            config.ctx.shadowColor = '#00f3ff';
            config.ctx.shadowBlur = 20 * glowIntensity;
            config.ctx.drawImage(config.images.awsDatacenter, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
        } else {
            const blockSize = scaleSize(50);
            const blockHeight = scaleSize(60);
            const blockGradient = config.ctx.createLinearGradient(-blockSize / 2, 0, blockSize / 2, 0);
            blockGradient.addColorStop(0, '#0d1f2d');
            blockGradient.addColorStop(0.2, '#1a3a4a');
            blockGradient.addColorStop(0.5, '#2a4a5a');
            blockGradient.addColorStop(0.8, '#1a3a4a');
            blockGradient.addColorStop(1, '#0d1f2d');
            config.ctx.fillStyle = blockGradient;
            config.ctx.fillRect(-blockSize / 2, -blockHeight / 2, blockSize, blockHeight);
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 3; col++) {
                    const wx = -blockSize / 2 + scaleSize(5) + col * scaleSize(13);
                    const wy = -blockHeight / 2 + scaleSize(5) + row * scaleSize(10);
                    const windowGlow = Math.random() > 0.3 ? glowIntensity : 0.3;
                    config.ctx.fillStyle = `rgba(0, 243, 255, ${windowGlow})`;
                    config.ctx.shadowColor = '#00f3ff';
                    config.ctx.shadowBlur = 8 * windowGlow;
                    config.ctx.fillRect(wx, wy, scaleSize(10), scaleSize(6));
                }
            }
        }
        config.ctx.shadowBlur = 0;
        config.ctx.restore();
        
        config.ctx.fillStyle = '#ff6b35';
        config.ctx.font = `bold ${scaleSize(12)}px Arial`;
        config.ctx.textAlign = 'center';
        config.ctx.shadowColor = '#ff6b35';
        config.ctx.shadowBlur = 10;
        config.ctx.fillText('AWS', centerX, centerY + scaleSize(50));
        config.ctx.shadowBlur = 0;
    });
    
    const menuGodzilla = config.menuAnimation.godzilla;
    const breathe = Math.sin(time * 2) * scaleSize(3);
    const sway = Math.sin(time * 1.5) * scaleSize(5);
    
    if (Math.sin(time * 0.5) > 0.3) {
        config.ctx.save();
        config.ctx.translate(menuGodzilla.x, menuGodzilla.y);
        const beamLength = config.width * 0.5;
        const beamWidth = scaleSize(30);
        const mouthX = scaleSize(40);
        const mouthY = scaleSize(-100);
        const chargeGradient = config.ctx.createRadialGradient(mouthX, mouthY, 0, mouthX, mouthY, scaleSize(50));
        chargeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        chargeGradient.addColorStop(0.3, 'rgba(0, 243, 255, 0.8)');
        chargeGradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
        config.ctx.fillStyle = chargeGradient;
        config.ctx.beginPath();
        config.ctx.arc(mouthX, mouthY, scaleSize(50), 0, Math.PI * 2);
        config.ctx.fill();
        const coreGradient = config.ctx.createLinearGradient(mouthX, mouthY, mouthX + beamLength, mouthY);
        coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        coreGradient.addColorStop(0.3, 'rgba(150, 230, 255, 0.8)');
        coreGradient.addColorStop(1, 'rgba(0, 180, 255, 0)');
        config.ctx.fillStyle = coreGradient;
        config.ctx.shadowColor = '#ffffff';
        config.ctx.shadowBlur = 30;
        config.ctx.beginPath();
        config.ctx.moveTo(mouthX, mouthY - beamWidth * 0.3);
        config.ctx.lineTo(mouthX + beamLength, mouthY - beamWidth * 0.2);
        config.ctx.lineTo(mouthX + beamLength, mouthY + beamWidth * 0.2);
        config.ctx.lineTo(mouthX, mouthY + beamWidth * 0.3);
        config.ctx.closePath();
        config.ctx.fill();
        const glowGradient = config.ctx.createLinearGradient(mouthX, mouthY, mouthX + beamLength, mouthY);
        glowGradient.addColorStop(0, 'rgba(0, 243, 255, 0.8)');
        glowGradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.5)');
        glowGradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
        config.ctx.fillStyle = glowGradient;
        config.ctx.shadowColor = '#00f3ff';
        config.ctx.shadowBlur = 60;
        config.ctx.beginPath();
        config.ctx.moveTo(mouthX, mouthY - beamWidth);
        config.ctx.lineTo(mouthX + beamLength, mouthY - beamWidth * 0.6);
        config.ctx.lineTo(mouthX + beamLength, mouthY + beamWidth * 0.6);
        config.ctx.lineTo(mouthX, mouthY + beamWidth);
        config.ctx.closePath();
        config.ctx.fill();
        for (let i = 0; i < 30; i++) {
            const px = mouthX + Math.random() * beamLength;
            const py = mouthY + (Math.random() - 0.5) * beamWidth;
            config.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random()})`;
            config.ctx.shadowBlur = 15;
            config.ctx.beginPath();
            config.ctx.arc(px, py, scaleSize(2) + Math.random() * scaleSize(4), 0, Math.PI * 2);
            config.ctx.fill();
        }
        config.ctx.shadowBlur = 0;
        config.ctx.restore();
    }

    // Draw Godzilla on menu
    config.ctx.save();
    config.ctx.translate(menuGodzilla.x + sway, menuGodzilla.y + breathe);
    config.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    config.ctx.shadowBlur = 80;
    config.ctx.shadowOffsetY = 40;
    if (config.images.godzilla && config.images.godzilla.complete && config.images.godzilla.naturalWidth > 0) {
        const imgWidth = config.width * 0.35;
        const aspectRatio = config.images.godzilla.naturalHeight / config.images.godzilla.naturalWidth;
        const imgHeight = imgWidth * aspectRatio;
        config.ctx.shadowColor = '#00f3ff';
        config.ctx.shadowBlur = 60;
        config.ctx.drawImage(config.images.godzilla, -imgWidth / 2, -imgHeight + scaleSize(120), imgWidth, imgHeight);
    } else {
        const fallbackScale = scaleSize(5.5);
        config.ctx.scale(fallbackScale, fallbackScale);
        drawFallbackGodzilla({ state: 'idle' });
    }
    config.ctx.shadowBlur = 0;
    config.ctx.restore();

    // Draw floating S3 buckets
    config.menuAnimation.buckets.forEach((bucket, i) => {
        bucket.floatOffset += 0.02;
        const floatAmount = Math.sin(bucket.floatOffset) * (config.height * 0.03);
        const currentY = bucket.baseY + floatAmount;
        const glowPhase = (Math.sin(time * 2 + i) + 1) / 2;
        config.ctx.save();
        config.ctx.translate(bucket.x, currentY);
        const bucketSize = config.width * 0.08;
        config.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        config.ctx.shadowBlur = 30;
        config.ctx.shadowOffsetY = 15;
        const auraGradient = config.ctx.createRadialGradient(0, 0, 0, 0, 0, bucketSize * 0.8);
        auraGradient.addColorStop(0, `rgba(0, 243, 255, ${0.6 * glowPhase})`);
        auraGradient.addColorStop(0.5, `rgba(0, 243, 255, ${0.3 * glowPhase})`);
        auraGradient.addColorStop(1, 'rgba(0, 243, 255, 0)');
        config.ctx.fillStyle = auraGradient;
        config.ctx.beginPath();
        config.ctx.arc(0, 0, bucketSize * 0.8, 0, Math.PI * 2);
        config.ctx.fill();
        config.ctx.shadowColor = 'transparent';
        config.ctx.shadowBlur = 0;
        if (config.images.s3Bucket && config.images.s3Bucket.complete && config.images.s3Bucket.naturalWidth > 0) {
            config.ctx.shadowColor = '#00f3ff';
            config.ctx.shadowBlur = 30 * glowPhase;
            config.ctx.drawImage(config.images.s3Bucket, -bucketSize / 2, -bucketSize / 2, bucketSize, bucketSize);
        } else {
            drawFallbackBucket(bucketSize * 0.4, glowPhase);
        }
        config.ctx.shadowBlur = 0;
        config.ctx.restore();
    });
}

function drawGameOverAnimation() {
    const time = Date.now() * 0.001;
    const isMobile = window.innerWidth <= 768;

    if (!config.gameOverData.victoryPlayed) {
        playSound('victory');
        config.gameOverData.victoryPlayed = true;
    }

    const skyGradient = config.ctx.createLinearGradient(0, 0, 0, config.height * 0.6);
    skyGradient.addColorStop(0, '#4a6b7a');
    skyGradient.addColorStop(0.5, '#3a5565');
    skyGradient.addColorStop(1, '#2a4555');
    config.ctx.fillStyle = skyGradient;
    config.ctx.fillRect(0, 0, config.width, config.height * 0.6);

    const oceanGradient = config.ctx.createLinearGradient(0, config.height * 0.6, 0, config.height);
    oceanGradient.addColorStop(0, '#2a5565');
    oceanGradient.addColorStop(0.5, '#1a3545');
    oceanGradient.addColorStop(1, '#0a2535');
    config.ctx.fillStyle = oceanGradient;
    config.ctx.fillRect(0, config.height * 0.6, config.width, config.height * 0.4);

    const beachY = config.height * 0.65;
    config.ctx.fillStyle = '#8a7a6a';
    config.ctx.fillRect(0, beachY, config.width, config.height * 0.05);

    const waveBaseY = config.height * 0.7;
    for (let layer = 0; layer < 3; layer++) {
        const layerOffset = layer * 30;
        const layerAlpha = 0.3 + layer * 0.2;
        config.ctx.fillStyle = `rgba(42, 85, 101, ${layerAlpha})`;
        config.ctx.beginPath();
        config.ctx.moveTo(0, waveBaseY + layerOffset);
        for (let x = 0; x < config.width; x += 5) {
            const waveHeight = Math.sin(x * 0.01 + time * 1.5 + layer * 0.5) * 15 +
                               Math.sin(x * 0.03 + time * 2 + layer) * 8;
            config.ctx.lineTo(x, waveBaseY + layerOffset + waveHeight);
        }
        config.ctx.lineTo(config.width, config.height);
        config.ctx.lineTo(0, config.height);
        config.ctx.closePath();
        config.ctx.fill();

        config.ctx.strokeStyle = `rgba(200, 220, 230, ${0.6 + layer * 0.2})`;
        config.ctx.lineWidth = 3 + layer;
        config.ctx.beginPath();
        for (let x = 0; x < config.width; x += 5) {
            const waveHeight = Math.sin(x * 0.01 + time * 1.5 + layer * 0.5) * 15 +
                               Math.sin(x * 0.03 + time * 2 + layer) * 8;
            if (x === 0) config.ctx.moveTo(x, waveBaseY + layerOffset + waveHeight);
            else config.ctx.lineTo(x, waveBaseY + layerOffset + waveHeight);
        }
        config.ctx.stroke();
    }

    if (config.gameOverData) {
        config.gameOverData.animationProgress += 0.008;
        const progress = Math.min(config.gameOverData.animationProgress, 1);
        const startX = isMobile ? config.width * 0.3 : 300;
        const godzillaX = startX + progress * (config.width * 0.4);
        const godzillaY = config.height * 0.55 + progress * 250;
        const godzillaScale = 1 - progress * 0.6;

        if (progress > 0.3) {
            const splashIntensity = Math.min((progress - 0.3) * 2, 1);
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2;
                const splashDist = 100 * splashIntensity;
                const splashX = godzillaX + Math.cos(angle) * splashDist;
                const splashY = godzillaY + Math.sin(angle) * splashDist * 0.5;
                config.ctx.fillStyle = `rgba(200, 220, 230, ${0.6 * (1 - splashIntensity)})`;
                config.ctx.beginPath();
                config.ctx.arc(splashX, splashY, 5 + Math.random() * 10, 0, Math.PI * 2);
                config.ctx.fill();
            }
        }

        config.ctx.save();
        config.ctx.translate(godzillaX, godzillaY);
        config.ctx.scale(godzillaScale, godzillaScale);
        if (config.images.godzilla && config.images.godzilla.complete && config.images.godzilla.naturalWidth > 0) {
            const imgWidth = isMobile ? scaleSize(400) : 500;
            const aspectRatio = config.images.godzilla.naturalHeight / config.images.godzilla.naturalWidth;
            const imgHeight = imgWidth * aspectRatio;
            config.ctx.globalAlpha = Math.max(1 - progress * 0.8, 0.2);
            config.ctx.drawImage(config.images.godzilla, -imgWidth / 2, -imgHeight + 100, imgWidth, imgHeight);
            config.ctx.globalAlpha = 1;
        }
        config.ctx.restore();

        const bucketX = config.width * 0.15;
        const bucketY = config.height * 0.6;
        const bucketBounce = Math.sin(time * 3) * 15;
        config.ctx.save();
        config.ctx.translate(bucketX, bucketY + bucketBounce);
        if (config.images.s3Bucket && config.images.s3Bucket.complete && config.images.s3Bucket.naturalWidth > 0) {
            const imgSize = isMobile ? scaleSize(220) : 280;
            config.ctx.shadowColor = '#00f3ff';
            config.ctx.shadowBlur = 60;
            config.ctx.drawImage(config.images.s3Bucket, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
        }
        config.ctx.restore();

        config.ctx.fillStyle = '#00f3ff';
        const fontSize = isMobile ? scaleSize(60) : 80;
        config.ctx.font = `bold ${fontSize}px Arial`;
        config.ctx.textAlign = 'center';
        config.ctx.shadowColor = '#00f3ff';
        config.ctx.shadowBlur = 40;
        const textPulse = Math.sin(time * 4) * 0.1 + 1;
        config.ctx.save();
        config.ctx.translate(config.width / 2, config.height * 0.25);
        config.ctx.scale(textPulse, textPulse);
        config.ctx.fillText('S3 WINS!', 0, 0);
        config.ctx.restore();
        config.ctx.shadowBlur = 0;
    }
}

function drawBackgroundParticles() {
    config.backgroundParticles.forEach(p => {
        config.ctx.fillStyle = `rgba(0, 243, 255, ${p.opacity})`;
        config.ctx.beginPath();
        config.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        config.ctx.fill();
    });
}

function drawRegionalMap() {
    const activeRegions = config.currentRoundData.regions;
    const time = Date.now() * 0.001;

    config.regions.forEach((region, index) => {
        const isActive = activeRegions.includes(region.name);
        const alpha = isActive ? 0.8 : 0.2;
        const pulsePhase = Math.sin(time * 2 + index * 0.5) * 0.2 + 0.8;

        const x = scaleX(region.x);
        const y = scaleY(region.y);
        const radius = scaleSize(80);
        const auraRadius = scaleSize(100);

        if (isActive) {
            const auraGradient = config.ctx.createRadialGradient(x, y, 0, x, y, auraRadius);
            auraGradient.addColorStop(0, `rgba(0, 243, 255, ${0.3 * pulsePhase})`);
            auraGradient.addColorStop(0.5, `rgba(0, 243, 255, ${0.15 * pulsePhase})`);
            auraGradient.addColorStop(1, 'rgba(0, 243, 255, 0)');
            config.ctx.fillStyle = auraGradient;
            config.ctx.beginPath();
            config.ctx.arc(x, y, auraRadius, 0, Math.PI * 2);
            config.ctx.fill();
        }

        config.ctx.strokeStyle = `rgba(0, 243, 255, ${alpha * pulsePhase})`;
        config.ctx.lineWidth = isActive ? 3 : 2;
        config.ctx.setLineDash([5, 5]);
        config.ctx.lineDashOffset = -time * 20;
        config.ctx.beginPath();
        config.ctx.arc(x, y, radius, 0, Math.PI * 2);
        config.ctx.stroke();
        config.ctx.setLineDash([]);

        if (isActive) {
            const innerPulse = Math.sin(time * 3 + index) * 0.5 + 0.5;
            const innerRadius = scaleSize(60 + innerPulse * 10);
            config.ctx.strokeStyle = `rgba(0, 243, 255, ${innerPulse})`;
            config.ctx.lineWidth = 2;
            config.ctx.beginPath();
            config.ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
            config.ctx.stroke();
        }

        config.ctx.fillStyle = `rgba(0, 243, 255, ${alpha})`;
        config.ctx.font = `bold ${scaleSize(14)}px Arial`;
        config.ctx.textAlign = 'center';
        if (isActive) {
            config.ctx.shadowColor = '#00f3ff';
            config.ctx.shadowBlur = 10;
        }
        config.ctx.fillText(region.label, x, y - scaleSize(95));
        config.ctx.shadowBlur = 0;

        if (isActive) {
            const blockSize = scaleSize(40);
            const blockX = x - blockSize / 2;
            const blockY = y - blockSize / 2;
            const blockHeight = blockSize * 1.2;

            config.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            config.ctx.shadowBlur = 15;
            config.ctx.shadowOffsetX = 5;
            config.ctx.shadowOffsetY = 8;
            config.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            config.ctx.fillRect(blockX + 5, blockY + 5, blockSize, blockHeight);
            config.ctx.shadowBlur = 0;
            config.ctx.shadowOffsetX = 0;
            config.ctx.shadowOffsetY = 0;

            const blockGradient = config.ctx.createLinearGradient(blockX, blockY, blockX + blockSize, blockY);
            blockGradient.addColorStop(0, '#0d1f2d');
            blockGradient.addColorStop(0.2, '#1a3a4a');
            blockGradient.addColorStop(0.5, '#2a4a5a');
            blockGradient.addColorStop(0.8, '#1a3a4a');
            blockGradient.addColorStop(1, '#0d1f2d');
            config.ctx.fillStyle = blockGradient;
            config.ctx.fillRect(blockX, blockY, blockSize, blockHeight);

            const leftGradient = config.ctx.createLinearGradient(blockX, blockY, blockX - 8, blockY + 8);
            leftGradient.addColorStop(0, '#1a3a4a');
            leftGradient.addColorStop(1, '#0a1a2a');
            config.ctx.fillStyle = leftGradient;
            config.ctx.beginPath();
            config.ctx.moveTo(blockX, blockY);
            config.ctx.lineTo(blockX - 8, blockY + 8);
            config.ctx.lineTo(blockX - 8, blockY + blockHeight + 8);
            config.ctx.lineTo(blockX, blockY + blockHeight);
            config.ctx.closePath();
            config.ctx.fill();

            const topGradient = config.ctx.createLinearGradient(blockX, blockY, blockX + blockSize / 2, blockY - 8);
            topGradient.addColorStop(0, '#2a4a5a');
            topGradient.addColorStop(1, '#1a3a4a');
            config.ctx.fillStyle = topGradient;
            config.ctx.beginPath();
            config.ctx.moveTo(blockX, blockY);
            config.ctx.lineTo(blockX - 8, blockY + 8);
            config.ctx.lineTo(blockX + blockSize - 8, blockY + 8);
            config.ctx.lineTo(blockX + blockSize, blockY);
            config.ctx.closePath();
            config.ctx.fill();

            config.ctx.strokeStyle = 'rgba(100, 150, 180, 0.3)';
            config.ctx.lineWidth = 1;
            config.ctx.strokeRect(blockX, blockY, blockSize, blockHeight);

            const rows = 4, cols = 3;
            const windowWidth = 6, windowHeight = 5, windowSpacing = 9;
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const wx = blockX + 6 + col * windowSpacing;
                    const wy = blockY + 8 + row * windowSpacing;
                    const windowGlow = Math.sin(time * 3 + row + col) * 0.5 + 0.5;
                    const glowIntensity = 0.3 + windowGlow * 0.6;
                    config.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    config.ctx.fillRect(wx - 1, wy - 1, windowWidth + 2, windowHeight + 2);
                    const windowGradient = config.ctx.createRadialGradient(
                        wx + windowWidth / 2, wy + windowHeight / 2, 0,
                        wx + windowWidth / 2, wy + windowHeight / 2, windowWidth
                    );
                    windowGradient.addColorStop(0, `rgba(0, 243, 255, ${glowIntensity})`);
                    windowGradient.addColorStop(0.7, `rgba(0, 200, 255, ${glowIntensity * 0.6})`);
                    windowGradient.addColorStop(1, `rgba(0, 150, 255, ${glowIntensity * 0.2})`);
                    config.ctx.fillStyle = windowGradient;
                    config.ctx.fillRect(wx, wy, windowWidth, windowHeight);
                    if (windowGlow > 0.6) {
                        config.ctx.shadowColor = '#00f3ff';
                        config.ctx.shadowBlur = 8;
                        config.ctx.fillRect(wx, wy, windowWidth, windowHeight);
                        config.ctx.shadowBlur = 0;
                    }
                    config.ctx.fillStyle = `rgba(255, 255, 255, ${glowIntensity * 0.3})`;
                    config.ctx.fillRect(wx, wy, windowWidth / 2, windowHeight / 3);
                }
            }

            // FIX 1: Use scaled coordinates for AWS label and antenna
            config.ctx.fillStyle = '#ff6b35';
            config.ctx.font = 'bold 12px Arial';
            config.ctx.textAlign = 'center';
            config.ctx.shadowColor = '#ff6b35';
            config.ctx.shadowBlur = 10;
            config.ctx.fillText('AWS', x, y + blockHeight / 2 + 25);
            config.ctx.shadowBlur = 0;

            config.ctx.strokeStyle = '#00f3ff';
            config.ctx.lineWidth = 2;
            config.ctx.shadowColor = '#00f3ff';
            config.ctx.shadowBlur = 10;
            config.ctx.beginPath();
            config.ctx.moveTo(x, blockY);
            config.ctx.lineTo(x, blockY - 10);
            config.ctx.stroke();

            const signalPulse = Math.sin(time * 4) * 0.5 + 0.5;
            config.ctx.strokeStyle = `rgba(0, 243, 255, ${signalPulse})`;
            config.ctx.lineWidth = 1;
            config.ctx.beginPath();
            config.ctx.arc(x, blockY - 10, 5, 0, Math.PI * 2);
            config.ctx.stroke();
            config.ctx.beginPath();
            config.ctx.arc(x, blockY - 10, 8, 0, Math.PI * 2);
            config.ctx.stroke();
            config.ctx.shadowBlur = 0;
        }
    });

    // FIX 1: Draw connections using scaled coordinates
    if (activeRegions.length > 1) {
        for (let i = 0; i < activeRegions.length - 1; i++) {
            const r1 = config.regions.find(r => r.name === activeRegions[i]);
            const r2 = config.regions.find(r => r.name === activeRegions[i + 1]);
            if (!r1 || !r2) continue;

            // Use scaleX/scaleY so lines match region dots in portrait and landscape
            const r1x = scaleX(r1.x), r1y = scaleY(r1.y);
            const r2x = scaleX(r2.x), r2y = scaleY(r2.y);

            const flowPhase = (time * 0.5 + i) % 1;
            const gradient = config.ctx.createLinearGradient(r1x, r1y, r2x, r2y);
            gradient.addColorStop(0, 'rgba(0, 243, 255, 0.1)');
            gradient.addColorStop(flowPhase, 'rgba(0, 243, 255, 0.8)');
            gradient.addColorStop(Math.min(flowPhase + 0.1, 1), 'rgba(0, 243, 255, 0.1)');
            config.ctx.strokeStyle = gradient;
            config.ctx.lineWidth = 2;
            config.ctx.beginPath();
            config.ctx.moveTo(r1x, r1y);
            config.ctx.lineTo(r2x, r2y);
            config.ctx.stroke();

            // Packet also uses scaled coords
            const packetX = r1x + (r2x - r1x) * flowPhase;
            const packetY = r1y + (r2y - r1y) * flowPhase;
            config.ctx.fillStyle = '#00f3ff';
            config.ctx.shadowColor = '#00f3ff';
            config.ctx.shadowBlur = 15;
            config.ctx.beginPath();
            config.ctx.arc(packetX, packetY, 4, 0, Math.PI * 2);
            config.ctx.fill();
            config.ctx.shadowBlur = 0;
        }
    }
}

function drawWorldMap() {
    if (config.images.worldMap && config.images.worldMap.complete && config.images.worldMap.naturalWidth > 0) {
        config.ctx.save();
        const imgWidth = config.images.worldMap.naturalWidth;
        const imgHeight = config.images.worldMap.naturalHeight;
        const imgAspect = imgWidth / imgHeight;
        const canvasAspect = config.width / config.height;
        let drawWidth, drawHeight, offsetX, offsetY;
        // Use "contain" behavior - fit entire image while maintaining aspect ratio
        if (canvasAspect > imgAspect) {
            // Canvas is wider - fit to height
            drawHeight = config.height;
            drawWidth = config.height * imgAspect;
            offsetX = (config.width - drawWidth) / 2;
            offsetY = 0;
        } else {
            // Canvas is taller - fit to width
            drawWidth = config.width;
            drawHeight = config.width / imgAspect;
            offsetX = 0;
            offsetY = (config.height - drawHeight) / 2;
        }
        config.ctx.globalAlpha = 0.4;
        config.ctx.drawImage(config.images.worldMap, offsetX, offsetY, drawWidth, drawHeight);
        config.ctx.globalAlpha = 1.0;
        config.ctx.restore();
    } else {
        config.ctx.save();
        config.ctx.strokeStyle = 'rgba(0, 150, 200, 0.15)';
        config.ctx.lineWidth = 1;
        config.ctx.setLineDash([3, 6]);
        for (let y = 150; y < config.height - 100; y += 100) {
            config.ctx.beginPath();
            config.ctx.moveTo(50, y);
            config.ctx.lineTo(config.width - 50, y);
            config.ctx.stroke();
        }
        for (let x = 100; x < config.width - 100; x += 120) {
            config.ctx.beginPath();
            config.ctx.moveTo(x, 100);
            config.ctx.lineTo(x, config.height - 100);
            config.ctx.stroke();
        }
        config.ctx.setLineDash([]);
        config.ctx.fillStyle = 'rgba(0, 120, 160, 0.12)';
        config.ctx.strokeStyle = 'rgba(0, 200, 255, 0.35)';
        config.ctx.lineWidth = 2;
        // North America
        config.ctx.beginPath();
        config.ctx.moveTo(150, 200); config.ctx.lineTo(200, 180); config.ctx.lineTo(280, 190);
        config.ctx.lineTo(320, 220); config.ctx.lineTo(310, 280); config.ctx.lineTo(280, 340);
        config.ctx.lineTo(240, 360); config.ctx.lineTo(180, 350); config.ctx.lineTo(140, 310);
        config.ctx.lineTo(130, 250); config.ctx.closePath(); config.ctx.fill(); config.ctx.stroke();
        // South America
        config.ctx.beginPath();
        config.ctx.moveTo(280, 380); config.ctx.lineTo(320, 400); config.ctx.lineTo(350, 450);
        config.ctx.lineTo(360, 520); config.ctx.lineTo(340, 580); config.ctx.lineTo(310, 590);
        config.ctx.lineTo(280, 570); config.ctx.lineTo(270, 520); config.ctx.lineTo(260, 450);
        config.ctx.closePath(); config.ctx.fill(); config.ctx.stroke();
        // Europe
        config.ctx.beginPath();
        config.ctx.moveTo(480, 180); config.ctx.lineTo(540, 170); config.ctx.lineTo(580, 190);
        config.ctx.lineTo(590, 230); config.ctx.lineTo(570, 260); config.ctx.lineTo(520, 270);
        config.ctx.lineTo(480, 250); config.ctx.lineTo(470, 210); config.ctx.closePath();
        config.ctx.fill(); config.ctx.stroke();
        // Africa
        config.ctx.beginPath();
        config.ctx.moveTo(500, 290); config.ctx.lineTo(560, 300); config.ctx.lineTo(580, 340);
        config.ctx.lineTo(580, 420); config.ctx.lineTo(560, 500); config.ctx.lineTo(520, 530);
        config.ctx.lineTo(480, 520); config.ctx.lineTo(460, 460); config.ctx.lineTo(470, 380);
        config.ctx.lineTo(480, 320); config.ctx.closePath(); config.ctx.fill(); config.ctx.stroke();
        // Asia
        config.ctx.beginPath();
        config.ctx.moveTo(620, 160); config.ctx.lineTo(720, 150); config.ctx.lineTo(820, 170);
        config.ctx.lineTo(900, 190); config.ctx.lineTo(960, 220); config.ctx.lineTo(980, 280);
        config.ctx.lineTo(970, 340); config.ctx.lineTo(920, 380); config.ctx.lineTo(850, 400);
        config.ctx.lineTo(780, 390); config.ctx.lineTo(720, 360); config.ctx.lineTo(680, 310);
        config.ctx.lineTo(650, 250); config.ctx.lineTo(620, 200); config.ctx.closePath();
        config.ctx.fill(); config.ctx.stroke();
        // Australia
        config.ctx.beginPath();
        config.ctx.moveTo(860, 470); config.ctx.lineTo(920, 460); config.ctx.lineTo(960, 490);
        config.ctx.lineTo(970, 530); config.ctx.lineTo(950, 560); config.ctx.lineTo(900, 570);
        config.ctx.lineTo(860, 550); config.ctx.lineTo(850, 510); config.ctx.closePath();
        config.ctx.fill(); config.ctx.stroke();
        config.ctx.restore();
    }
}

function drawGrid() {
    const time = Date.now() * 0.0005;
    config.ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
    config.ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < config.width; x += gridSize) {
        const wave = Math.sin(time + x * 0.01) * 3;
        config.ctx.beginPath();
        config.ctx.moveTo(x, 0);
        config.ctx.lineTo(x + wave, config.height);
        config.ctx.stroke();
    }
    for (let y = 0; y < config.height; y += gridSize) {
        const wave = Math.sin(time + y * 0.01) * 3;
        config.ctx.beginPath();
        config.ctx.moveTo(0, y);
        config.ctx.lineTo(config.width, y + wave);
        config.ctx.stroke();
    }
    for (let x = gridSize; x < config.width; x += gridSize * 2) {
        for (let y = gridSize; y < config.height; y += gridSize * 2) {
            const glowPhase = Math.sin(time * 2 + x * 0.01 + y * 0.01);
            if (glowPhase > 0.7) {
                config.ctx.fillStyle = `rgba(0, 243, 255, ${(glowPhase - 0.7) * 2})`;
                config.ctx.shadowColor = '#00f3ff';
                config.ctx.shadowBlur = 8;
                config.ctx.beginPath();
                config.ctx.arc(x, y, 2, 0, Math.PI * 2);
                config.ctx.fill();
            }
        }
    }
    config.ctx.shadowBlur = 0;
}

function drawBuckets() {
    config.buckets.forEach(bucket => {
        config.ctx.save();
        config.ctx.translate(bucket.x, bucket.y);
        const radius = bucket.radius;
        const glowPhase = bucket.glow;
        config.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        config.ctx.shadowBlur = 35;
        config.ctx.shadowOffsetX = 12;
        config.ctx.shadowOffsetY = 18;
        const glowSize = 50 * glowPhase;
        const auraGradient = config.ctx.createRadialGradient(0, 0, 0, 0, 0, radius + glowSize);
        auraGradient.addColorStop(0, `rgba(0, 243, 255, ${0.9 * glowPhase})`);
        auraGradient.addColorStop(0.3, `rgba(0, 243, 255, ${0.6 * glowPhase})`);
        auraGradient.addColorStop(0.6, `rgba(0, 200, 255, ${0.3 * glowPhase})`);
        auraGradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
        config.ctx.fillStyle = auraGradient;
        config.ctx.beginPath();
        config.ctx.arc(0, 0, radius + glowSize, 0, Math.PI * 2);
        config.ctx.fill();
        config.ctx.shadowColor = 'transparent';
        config.ctx.shadowBlur = 0;
        if (config.images.s3Bucket && config.images.s3Bucket.complete && config.images.s3Bucket.naturalWidth > 0) {
            const imgSize = radius * 2.2;
            config.ctx.shadowColor = '#00f3ff';
            config.ctx.shadowBlur = 30 * glowPhase;
            config.ctx.drawImage(config.images.s3Bucket, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
            config.ctx.shadowBlur = 0;
        } else {
            drawFallbackBucket(radius, glowPhase);
        }
        config.ctx.restore();

        const age = Date.now() - bucket.createdAt;
        const lifePercent = 1 - (age / bucket.lifetime);
        if (lifePercent < 0.4) {
            let ringColor;
            if (lifePercent < 0.15) ringColor = '#ff0000';
            else if (lifePercent < 0.25) ringColor = '#ff3030';
            else ringColor = '#ff6b35';
            config.ctx.strokeStyle = ringColor;
            config.ctx.lineWidth = 5;
            config.ctx.shadowColor = ringColor;
            config.ctx.shadowBlur = 20;
            config.ctx.beginPath();
            config.ctx.arc(bucket.x, bucket.y, radius + 20, 0, Math.PI * 2);
            config.ctx.stroke();
            config.ctx.shadowBlur = 0;
        }
    });
}

function drawParticles() {
    config.particles.forEach(p => {
        const color = p.color || '#00f3ff';
        const size = p.size || 3;
        config.ctx.save();
        config.ctx.translate(p.x, p.y);
        config.ctx.rotate(p.rotation || 0);
        config.ctx.fillStyle = color.replace(')', `, ${p.life * 0.3})`).replace('rgb', 'rgba');
        config.ctx.fillRect(-size * 2, -size * 2, size * 4, size * 4);
        config.ctx.fillStyle = color.replace(')', `, ${p.life})`).replace('rgb', 'rgba');
        config.ctx.shadowColor = color;
        config.ctx.shadowBlur = 10;
        config.ctx.fillRect(-size, -size, size * 2, size * 2);
        config.ctx.fillStyle = color.replace(')', `, ${p.life * 0.7})`).replace('rgb', 'rgba');
        config.ctx.beginPath();
        config.ctx.moveTo(-size, -size);
        config.ctx.lineTo(0, -size - size / 2);
        config.ctx.lineTo(size, -size);
        config.ctx.closePath();
        config.ctx.fill();
        config.ctx.fillStyle = color.replace(')', `, ${p.life * 0.5})`).replace('rgb', 'rgba');
        config.ctx.beginPath();
        config.ctx.moveTo(size, -size);
        config.ctx.lineTo(size + size / 2, 0);
        config.ctx.lineTo(size + size / 2, size);
        config.ctx.lineTo(size, size);
        config.ctx.closePath();
        config.ctx.fill();
        config.ctx.shadowBlur = 0;
        config.ctx.restore();
    });
    config.ctx.shadowBlur = 0;
}

function saveHighScore(score, accuracy, playerName = 'Anonymous') {
    const scores = JSON.parse(localStorage.getItem('zillaScores') || '[]');
    scores.push({ name: playerName, score, accuracy: accuracy.toFixed(1), date: new Date().toLocaleDateString() });
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('zillaScores', JSON.stringify(scores.slice(0, 10)));
}

function loadHighScores() {
    return JSON.parse(localStorage.getItem('zillaScores') || '[]');
}

function displayHighScores() {
    const scores = loadHighScores();
    const list = document.getElementById('scoresList');
    if (scores.length === 0) {
        list.innerHTML = '<p>No high scores yet. Be the first!</p>';
    } else {
        list.innerHTML = '<h3>Top 10 Scores</h3>' + scores.map((s, i) =>
            `<div class="score-entry">
                <span>#${i + 1}</span>
                <span>${s.name || 'Anonymous'}</span>
                <span>${s.score}</span>
                <span>${s.accuracy}%</span>
                <span>${s.date}</span>
            </div>`
        ).join('');
    }
}

function showNameInputModal(score, accuracy, ending) {
    const modal = document.getElementById('name-input-modal');
    const finalStats = document.getElementById('finalStats');
    const playerNameInput = document.getElementById('playerName');
    finalStats.innerHTML = `
        <p><strong>Final Score:</strong> ${score}</p>
        <p><strong>Accuracy:</strong> ${accuracy.toFixed(1)}%</p>
        <p><strong>Ending:</strong> ${ending}</p>
    `;
    playerNameInput.value = '';
    modal.classList.add('active');
    config.pendingScore = { score, accuracy };
    setTimeout(() => playerNameInput.focus(), 100);
}

function submitPlayerScore() {
    const playerName = document.getElementById('playerName').value.trim() || 'Anonymous';
    const { score, accuracy } = config.pendingScore;
    saveHighScore(score, accuracy, playerName);
    document.getElementById('name-input-modal').classList.remove('active');
    showScreen('scores');
}

function skipPlayerScore() {
    const { score, accuracy } = config.pendingScore;
    saveHighScore(score, accuracy, 'Anonymous');
    document.getElementById('name-input-modal').classList.remove('active');
    showScreen('menu');
}

let lastTime = 0;
function gameLoop(timestamp = 0) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    update(deltaTime);
    draw();
    requestAnimationFrame(gameLoop);
}

function drawGodzilla() {
    const g = config.godzilla;
    const time = Date.now() * 0.001;
    config.ctx.save();
    config.ctx.translate(g.x, g.y);
    const breathe = Math.sin(time * 2) * 2;
    const sway = Math.sin(time * 1.5) * 3;
    config.ctx.translate(sway, breathe);
    const scale = g.state === 'stomping' ? 1.15 : 1;
    const bounce = g.state === 'stomping' ? Math.sin(g.animationTimer / 50) * 5 : 0;
    config.ctx.translate(0, bounce);
    config.ctx.scale(scale, scale);

    if (config.images.godzilla && config.images.godzilla.complete && config.images.godzilla.naturalWidth > 0) {
        const isMobile = window.innerWidth <= 768;
        const baseSize = isMobile ? 280 : 220;
        const imgWidth = scaleSize(baseSize);
        const aspectRatio = config.images.godzilla.naturalHeight / config.images.godzilla.naturalWidth;
        const imgHeight = imgWidth * aspectRatio;
        const feetY = -imgHeight + 60;

        config.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        config.ctx.shadowBlur = 30;
        config.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        config.ctx.beginPath();
        config.ctx.ellipse(0, feetY + imgHeight - scaleSize(20), scaleSize(70), scaleSize(25), 0, 0, Math.PI * 2);
        config.ctx.fill();
        config.ctx.shadowBlur = 0;

        if (g.state === 'stomping') {
            if (g.animationTimer === 500) { playSound('laser'); }
            const mouthY = feetY + imgHeight * 0.25;
            drawNeonLaserBeam(g, scaleSize(80), mouthY);
        }

        if (g.state === 'stomping') {
            config.ctx.shadowColor = '#00f3ff';
            config.ctx.shadowBlur = 40;
        }
        config.ctx.drawImage(config.images.godzilla, -imgWidth / 2, feetY, imgWidth, imgHeight);
        config.ctx.shadowBlur = 0;
    } else {
        config.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        config.ctx.shadowBlur = 30;
        config.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        config.ctx.beginPath();
        config.ctx.ellipse(0, scaleSize(20), scaleSize(70), scaleSize(25), 0, 0, Math.PI * 2);
        config.ctx.fill();
        config.ctx.shadowBlur = 0;
        if (g.state === 'stomping') {
            if (g.animationTimer === 500) { playSound('laser'); }
            drawNeonLaserBeam(g, scaleSize(80), scaleSize(-80));
        }
        drawFallbackGodzilla(g);
    }
    config.ctx.shadowBlur = 0;
    config.ctx.restore();
}

function drawNeonLaserBeam(g, mouthX = 30, mouthY = -50) {
    const time = Date.now() * 0.001;
    const beamLength = 200;
    const beamWidth = 12;

    const chargeGradient = config.ctx.createRadialGradient(mouthX, mouthY, 0, mouthX, mouthY, 20);
    chargeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    chargeGradient.addColorStop(0.3, 'rgba(0, 243, 255, 0.8)');
    chargeGradient.addColorStop(0.6, 'rgba(0, 150, 255, 0.4)');
    chargeGradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
    config.ctx.fillStyle = chargeGradient;
    config.ctx.beginPath();
    config.ctx.arc(mouthX, mouthY, 20, 0, Math.PI * 2);
    config.ctx.fill();

    const coreGradient = config.ctx.createLinearGradient(mouthX, mouthY, mouthX + beamLength, mouthY);
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    coreGradient.addColorStop(0.1, 'rgba(200, 240, 255, 0.95)');
    coreGradient.addColorStop(0.5, 'rgba(100, 220, 255, 0.8)');
    coreGradient.addColorStop(1, 'rgba(0, 180, 255, 0)');
    config.ctx.fillStyle = coreGradient;
    config.ctx.shadowColor = '#ffffff';
    config.ctx.shadowBlur = 15;
    config.ctx.beginPath();
    config.ctx.moveTo(mouthX, mouthY - beamWidth * 0.3);
    config.ctx.lineTo(mouthX + beamLength, mouthY - beamWidth * 0.15);
    config.ctx.lineTo(mouthX + beamLength, mouthY + beamWidth * 0.15);
    config.ctx.lineTo(mouthX, mouthY + beamWidth * 0.3);
    config.ctx.closePath();
    config.ctx.fill();

    const innerGradient = config.ctx.createLinearGradient(mouthX, mouthY, mouthX + beamLength, mouthY);
    innerGradient.addColorStop(0, 'rgba(0, 243, 255, 0.9)');
    innerGradient.addColorStop(0.3, 'rgba(0, 200, 255, 0.8)');
    innerGradient.addColorStop(0.7, 'rgba(0, 150, 255, 0.5)');
    innerGradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
    config.ctx.fillStyle = innerGradient;
    config.ctx.shadowColor = '#00f3ff';
    config.ctx.shadowBlur = 40;
    config.ctx.beginPath();
    config.ctx.moveTo(mouthX, mouthY - beamWidth * 0.5);
    config.ctx.lineTo(mouthX + beamLength, mouthY - beamWidth * 0.3);
    config.ctx.lineTo(mouthX + beamLength, mouthY + beamWidth * 0.3);
    config.ctx.lineTo(mouthX, mouthY + beamWidth * 0.5);
    config.ctx.closePath();
    config.ctx.fill();

    const outerGradient = config.ctx.createLinearGradient(mouthX, mouthY, mouthX + beamLength, mouthY);
    outerGradient.addColorStop(0, 'rgba(0, 243, 255, 0.6)');
    outerGradient.addColorStop(0.3, 'rgba(0, 200, 255, 0.4)');
    outerGradient.addColorStop(0.7, 'rgba(0, 150, 255, 0.2)');
    outerGradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
    config.ctx.fillStyle = outerGradient;
    config.ctx.shadowBlur = 60;
    config.ctx.beginPath();
    config.ctx.moveTo(mouthX, mouthY - beamWidth);
    config.ctx.lineTo(mouthX + beamLength, mouthY - beamWidth * 0.6);
    config.ctx.lineTo(mouthX + beamLength, mouthY + beamWidth * 0.6);
    config.ctx.lineTo(mouthX, mouthY + beamWidth);
    config.ctx.closePath();
    config.ctx.fill();

    for (let i = 0; i < 30; i++) {
        const progress = (i / 30) + (time * 2) % 1;
        const px = mouthX + progress * beamLength;
        const py = mouthY + (Math.random() - 0.5) * beamWidth * 0.8;
        const size = 3 + Math.random() * 5;
        const alpha = 0.6 + Math.random() * 0.4;
        config.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        config.ctx.shadowColor = '#ffffff';
        config.ctx.shadowBlur = 15;
        config.ctx.beginPath();
        config.ctx.arc(px, py, size, 0, Math.PI * 2);
        config.ctx.fill();
        config.ctx.fillStyle = `rgba(0, 243, 255, ${alpha * 0.6})`;
        config.ctx.shadowColor = '#00f3ff';
        config.ctx.shadowBlur = 20;
        config.ctx.beginPath();
        config.ctx.arc(px, py, size * 1.5, 0, Math.PI * 2);
        config.ctx.fill();
    }

    config.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    config.ctx.lineWidth = 2;
    config.ctx.shadowColor = '#00f3ff';
    config.ctx.shadowBlur = 10;
    for (let i = 0; i < 5; i++) {
        const arcOffset = (time * 5 + i) % 1;
        const startX = mouthX + arcOffset * beamLength * 0.3;
        const endX = startX + beamLength * 0.2;
        const arcHeight = (Math.random() - 0.5) * beamWidth * 0.6;
        config.ctx.beginPath();
        config.ctx.moveTo(startX, mouthY);
        config.ctx.quadraticCurveTo(startX + (endX - startX) / 2, mouthY + arcHeight, endX, mouthY + (Math.random() - 0.5) * beamWidth * 0.4);
        config.ctx.stroke();
    }

    const impactX = mouthX + beamLength;
    const impactGradient = config.ctx.createRadialGradient(impactX, mouthY, 0, impactX, mouthY, 50);
    impactGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    impactGradient.addColorStop(0.3, 'rgba(0, 243, 255, 0.7)');
    impactGradient.addColorStop(0.6, 'rgba(0, 200, 255, 0.4)');
    impactGradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
    config.ctx.fillStyle = impactGradient;
    config.ctx.shadowColor = '#00f3ff';
    config.ctx.shadowBlur = 50;
    config.ctx.beginPath();
    config.ctx.arc(impactX, mouthY, 50, 0, Math.PI * 2);
    config.ctx.fill();

    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + time * 3;
        const sparkLength = 20 + Math.random() * 15;
        const sparkX = impactX + Math.cos(angle) * sparkLength;
        const sparkY = mouthY + Math.sin(angle) * sparkLength;
        config.ctx.strokeStyle = `rgba(0, 243, 255, ${0.7 + Math.random() * 0.3})`;
        config.ctx.lineWidth = 2;
        config.ctx.shadowBlur = 15;
        config.ctx.beginPath();
        config.ctx.moveTo(impactX, mouthY);
        config.ctx.lineTo(sparkX, sparkY);
        config.ctx.stroke();
    }
    config.ctx.shadowBlur = 0;
}

function drawDataCubes() {
    config.dataCubes.forEach(cube => {
        config.ctx.save();
        config.ctx.translate(cube.x, cube.y);
        config.ctx.rotate(cube.rotation);
        const size = cube.size;
        const alpha = cube.opacity;
        const frontGradient = config.ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
        frontGradient.addColorStop(0, cube.color.replace(')', `, ${alpha * 0.9})`).replace('rgb', 'rgba'));
        frontGradient.addColorStop(1, cube.color.replace(')', `, ${alpha * 0.6})`).replace('rgb', 'rgba'));
        config.ctx.fillStyle = frontGradient;
        config.ctx.fillRect(-size / 2, -size / 2, size, size);
        config.ctx.fillStyle = cube.color.replace(')', `, ${alpha * 0.4})`).replace('rgb', 'rgba');
        config.ctx.beginPath();
        config.ctx.moveTo(-size / 2, -size / 2);
        config.ctx.lineTo(0, -size / 2 - size / 3);
        config.ctx.lineTo(size / 2, -size / 2);
        config.ctx.closePath();
        config.ctx.fill();
        config.ctx.fillStyle = cube.color.replace(')', `, ${alpha * 0.3})`).replace('rgb', 'rgba');
        config.ctx.beginPath();
        config.ctx.moveTo(size / 2, -size / 2);
        config.ctx.lineTo(size / 2 + size / 3, 0);
        config.ctx.lineTo(size / 2, size / 2);
        config.ctx.closePath();
        config.ctx.fill();
        config.ctx.shadowColor = cube.color;
        config.ctx.shadowBlur = 8;
        config.ctx.strokeStyle = cube.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        config.ctx.lineWidth = 1;
        config.ctx.strokeRect(-size / 2, -size / 2, size, size);
        config.ctx.shadowBlur = 0;
        config.ctx.restore();
    });
}

function drawRoundInfo() {
    // Scale all elements for mobile
    const isMobile = window.innerWidth <= 768;
    const isLandscape = window.innerWidth > window.innerHeight;
    
    // Larger box on mobile
    const boxWidth = isMobile ? scaleSize(500) : scaleSize(400);
    const boxHeight = isMobile ? scaleSize(70) : scaleSize(55);  // Reduced height for tighter spacing
    const boxX = config.width / 2 - boxWidth / 2;
    
    // Position - moved down a bit on mobile
    let boxY;
    if (isMobile) {
        // Position from bottom - moved down from 200 to 170
        boxY = config.height - boxHeight - scaleSize(170);
    } else {
        boxY = scaleSize(10);  // Desktop: near top
    }
    
    // Timer - ABOVE the box on mobile, larger font
    const elapsed = Date.now() - config.roundStartTime;
    const remaining = Math.ceil((config.currentRoundData.duration - elapsed) / 1000);
    config.ctx.fillStyle = remaining < 10 ? '#ff3030' : '#00f3ff';
    const timerSize = isMobile ? 34 : 18;  // Increased from 28 to 34
    config.ctx.font = `bold ${scaleSize(timerSize)}px Arial`;
    config.ctx.textAlign = 'center';
    config.ctx.shadowColor = remaining < 10 ? '#ff3030' : '#00f3ff';
    config.ctx.shadowBlur = 15;
    config.ctx.fillText(`Time: ${remaining}s`, config.width / 2, boxY - scaleSize(20));
    config.ctx.shadowBlur = 0;
    
    // Round name display - box and text properly positioned
    config.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    config.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    
    config.ctx.fillStyle = '#00f3ff';
    const titleSize = isMobile ? 36 : 26;  // Slightly smaller to fit better
    config.ctx.font = `bold ${scaleSize(titleSize)}px Arial`;
    config.ctx.textAlign = 'center';
    config.ctx.shadowColor = '#00f3ff';
    config.ctx.shadowBlur = 15;
    config.ctx.fillText(config.currentRoundData.name, config.width / 2, boxY + scaleSize(28));  // Moved up slightly
    
    const messageSize = isMobile ? 20 : 15;  // Slightly smaller
    config.ctx.font = `${scaleSize(messageSize)}px Arial`;
    config.ctx.fillStyle = '#ff6b35';
    config.ctx.shadowColor = '#ff6b35';
    config.ctx.shadowBlur = 10;
    config.ctx.fillText(config.currentRoundData.message, config.width / 2, boxY + scaleSize(50));  // Reduced spacing
    
    config.ctx.shadowBlur = 0;
}

function drawFallbackGodzilla(g) {
    const spikeGlow = g.state === 'stomping' ? 1 : 0.5;
    config.ctx.fillStyle = '#1a1a1a';
    config.ctx.fillRect(-28, 0, 56, 65);
    const headGradient = config.ctx.createRadialGradient(0, -10, 0, 0, -10, 20);
    headGradient.addColorStop(0, '#2a2a2a');
    headGradient.addColorStop(1, '#0d0d0d');
    config.ctx.fillStyle = headGradient;
    config.ctx.beginPath();
    config.ctx.arc(0, -12, 20, 0, Math.PI * 2);
    config.ctx.fill();
    for (let i = 0; i < 5; i++) {
        config.ctx.fillStyle = `rgba(255, 107, 53, ${0.6 + spikeGlow * 0.4})`;
        config.ctx.shadowColor = '#ff6b35';
        config.ctx.shadowBlur = 15;
        config.ctx.beginPath();
        config.ctx.moveTo(-15 + i * 8, 10 + i * 5);
        config.ctx.lineTo(-10 + i * 8, -5 + i * 5);
        config.ctx.lineTo(-5 + i * 8, 10 + i * 5);
        config.ctx.closePath();
        config.ctx.fill();
    }
    config.ctx.shadowBlur = 0;
    config.ctx.fillStyle = g.state === 'stomping' ? '#ff3030' : '#ffaa00';
    config.ctx.shadowColor = g.state === 'stomping' ? '#ff3030' : '#ffaa00';
    config.ctx.shadowBlur = 10;
    config.ctx.beginPath();
    config.ctx.arc(-8, -15, 3, 0, Math.PI * 2);
    config.ctx.arc(8, -15, 3, 0, Math.PI * 2);
    config.ctx.fill();
    config.ctx.shadowBlur = 0;
}

function drawFallbackBucket(radius, glowPhase) {
    const bodyGradient = config.ctx.createLinearGradient(-radius, 0, radius, 0);
    bodyGradient.addColorStop(0, '#001a24');
    bodyGradient.addColorStop(0.3, '#006685');
    bodyGradient.addColorStop(0.5, '#00a8cc');
    bodyGradient.addColorStop(0.7, '#006685');
    bodyGradient.addColorStop(1, '#001a24');
    config.ctx.fillStyle = bodyGradient;
    config.ctx.fillRect(-radius * 0.85, -radius * 0.9, radius * 1.7, radius * 1.9);
    config.ctx.fillStyle = '#00f3ff';
    config.ctx.beginPath();
    config.ctx.ellipse(0, -radius * 0.9, radius * 0.85, radius * 0.28, 0, 0, Math.PI * 2);
    config.ctx.fill();
    const time = Date.now() * 0.001;
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + time;
        const r = radius * 0.4;
        const px = Math.cos(angle) * r * 0.6;
        const py = -radius * 0.7 + Math.sin(angle) * r * 0.15;
        config.ctx.fillStyle = `rgba(0, 243, 255, ${0.6 + Math.sin(time * 2 + i) * 0.4})`;
        config.ctx.shadowColor = '#00f3ff';
        config.ctx.shadowBlur = 8;
        config.ctx.fillRect(px - 3, py - 3, 6, 6);
    }
    config.ctx.shadowBlur = 0;
    config.ctx.fillStyle = '#ffffff';
    config.ctx.shadowColor = '#00f3ff';
    config.ctx.shadowBlur = 15;
    config.ctx.font = 'bold 28px Arial';
    config.ctx.textAlign = 'center';
    config.ctx.textBaseline = 'middle';
    config.ctx.fillText('S3', 0, 0);
    config.ctx.shadowBlur = 0;
}

// Initialize the game when page loads
window.addEventListener('load', init);
