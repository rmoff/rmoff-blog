// WHACKY INTERACTIVE EFFECTS - NOW WITH TOGGLE FUNCTIONALITY!
// Making it even more ridiculous AND making it toggleable!

document.addEventListener('DOMContentLoaded', function() {

    // Check if whacky mode is enabled from localStorage
    const isWhackyMode = localStorage.getItem('whacky-mode') === 'true';

    // Apply whacky mode if it was previously enabled
    if (isWhackyMode) {
        enableWhackyMode();
    }

    function enableWhackyMode() {
        document.body.classList.add('whacky-mode');
        localStorage.setItem('whacky-mode', 'true');

        // Enable all the whacky effects
        enableWhackyEffects();
    }

    function disableWhackyMode() {
        document.body.classList.remove('whacky-mode');
        localStorage.setItem('whacky-mode', 'false');

        // Disable whacky effects
        disableWhackyEffects();
    }

    function toggleWhackyMode() {
        if (document.body.classList.contains('whacky-mode')) {
            disableWhackyMode();
        } else {
            enableWhackyMode();
        }
    }

    function enableWhackyEffects() {
        // Add whacky-specific event listeners and effects

        // Add click sound wave effect
        document.addEventListener('click', createSoundWave);

        // Add typing effect
        document.addEventListener('keydown', handleTyping);

        // Add hover sparkles to headings
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            heading.addEventListener('mouseenter', handleHeadingHover);
        });

        // Start random glitch effects
        startRandomGlitch();

        // Add system status indicator
        addSystemStatusIndicator();

        // Add cursor trails
        document.addEventListener('mousemove', handleMouseMove);

        console.log('🎮 WHACKY MODE ACTIVATED! Welcome to the most beautifully awful blog theme ever created! 🎮');
        console.log('💡 Type "quack" to toggle modes');
    }

    function disableWhackyEffects() {
        // Remove whacky-specific event listeners
        document.removeEventListener('click', createSoundWave);
        document.removeEventListener('keydown', handleTyping);
        document.removeEventListener('mousemove', handleMouseMove);

        // Clear intervals
        if (window.whackyGlitchInterval) {
            clearInterval(window.whackyGlitchInterval);
        }
        if (window.whackyStatusInterval) {
            clearInterval(window.whackyStatusInterval);
        }

        // Remove system status indicator
        const statusIndicator = document.getElementById('whacky-status');
        if (statusIndicator) {
            document.body.removeChild(statusIndicator);
        }

        // Remove typing indicator
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            document.body.removeChild(typingIndicator);
        }

        console.log('📝 Professional mode restored. The blog is now suitable for serious readers.');
    }

    // Add some sound effects (visual representation)
    function createSoundWave(e) {
        if (!document.body.classList.contains('whacky-mode')) return;

        const wave = document.createElement('div');
        wave.style.position = 'fixed';
        wave.style.left = e.clientX + 'px';
        wave.style.top = e.clientY + 'px';
        wave.style.width = '0px';
        wave.style.height = '2px';
        wave.style.backgroundColor = '#00ff00';
        wave.style.borderRadius = '50%';
        wave.style.pointerEvents = 'none';
        wave.style.zIndex = '9999';
        wave.style.boxShadow = '0 0 10px #00ff00';

        document.body.appendChild(wave);

        let size = 0;
        const maxSize = 50;
        const interval = setInterval(() => {
            size += 2;
            wave.style.width = size + 'px';
            wave.style.height = size + 'px';
            wave.style.left = (e.clientX - size/2) + 'px';
            wave.style.top = (e.clientY - size/2) + 'px';
            wave.style.opacity = (maxSize - size) / maxSize;

            if (size >= maxSize) {
                clearInterval(interval);
                document.body.removeChild(wave);
            }
        }, 20);
    }

    // Add typing sound effect visualization
    let typingTimer;
    function handleTyping(e) {
        if (!document.body.classList.contains('whacky-mode')) return;

        clearTimeout(typingTimer);

        // Create a small typing indicator
        const indicator = document.createElement('div');
        indicator.innerHTML = '▪';
        indicator.style.position = 'fixed';
        indicator.style.top = '10px';
        indicator.style.right = '10px';
        indicator.style.color = '#00ff00';
        indicator.style.fontSize = '20px';
        indicator.style.fontFamily = 'Courier New, monospace';
        indicator.style.zIndex = '9999';
        indicator.style.animation = 'blink-cursor 0.5s infinite';
        indicator.id = 'typing-indicator';

        // Remove existing indicator
        const existing = document.getElementById('typing-indicator');
        if (existing) {
            document.body.removeChild(existing);
        }

        document.body.appendChild(indicator);

        // Remove after 1 second of no typing
        typingTimer = setTimeout(() => {
            if (document.getElementById('typing-indicator')) {
                document.body.removeChild(indicator);
            }
        }, 1000);
    }

    function handleHeadingHover() {
        if (!document.body.classList.contains('whacky-mode')) return;
        createSparkles(this);
    }

    function createSparkles(element) {
        const rect = element.getBoundingClientRect();
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.innerHTML = '✨';
                sparkle.style.position = 'fixed';
                sparkle.style.left = (rect.left + Math.random() * rect.width) + 'px';
                sparkle.style.top = (rect.top + Math.random() * rect.height) + 'px';
                sparkle.style.fontSize = '16px';
                sparkle.style.pointerEvents = 'none';
                sparkle.style.zIndex = '9999';
                sparkle.style.animation = 'float-up 2s ease-out forwards';

                document.body.appendChild(sparkle);

                setTimeout(() => {
                    if (document.body.contains(sparkle)) {
                        document.body.removeChild(sparkle);
                    }
                }, 2000);
            }, i * 100);
        }
    }

    // Add some random glitch effects
    function randomGlitch() {
        if (!document.body.classList.contains('whacky-mode')) return;

        const elements = document.querySelectorAll('h1, h2, h3');
        if (elements.length > 0) {
            const randomElement = elements[Math.floor(Math.random() * elements.length)];
            randomElement.style.textShadow = '2px 0 #ff00ff, -2px 0 #00ffff';

            setTimeout(() => {
                randomElement.style.textShadow = '';
            }, 100);
        }
    }

    function startRandomGlitch() {
        // Randomly glitch every 10-30 seconds
        window.whackyGlitchInterval = setInterval(randomGlitch, Math.random() * 20000 + 10000);
    }

    // Add a fake "system status" indicator
    function addSystemStatusIndicator() {
        const statusIndicator = document.createElement('div');
        statusIndicator.innerHTML = 'SYSTEM: OPTIMAL 🟢';
        statusIndicator.style.position = 'fixed';
        statusIndicator.style.bottom = '10px';
        statusIndicator.style.left = '10px';
        statusIndicator.style.background = 'rgba(0, 0, 0, 0.8)';
        statusIndicator.style.color = '#00ff00';
        statusIndicator.style.padding = '5px 10px';
        statusIndicator.style.borderRadius = '5px';
        statusIndicator.style.fontFamily = 'Courier New, monospace';
        statusIndicator.style.fontSize = '12px';
        statusIndicator.style.border = '1px solid #00ff00';
        statusIndicator.style.zIndex = '9999';
        statusIndicator.style.opacity = '0.7';
        statusIndicator.id = 'whacky-status';

        document.body.appendChild(statusIndicator);

        // Update status randomly
        const statuses = [
            'SYSTEM: OPTIMAL 🟢',
            'SYSTEM: PROCESSING 🟡',
            'SYSTEM: OVERCLOCKED 🔴',
            'SYSTEM: CAFFEINATED ☕',
            'SYSTEM: DEBUGGING 🐛',
            'SYSTEM: COMPILING 💻'
        ];

        window.whackyStatusInterval = setInterval(() => {
            statusIndicator.innerHTML = statuses[Math.floor(Math.random() * statuses.length)];
        }, 5000);
    }

    // Add "quack" trigger
    let quackSequence = [];
    const quackTarget = 'quack';
    let quackTimer;

    document.addEventListener('keydown', function(e) {
        // Convert keycode to character
        const char = String.fromCharCode(e.keyCode).toLowerCase();

        // Only track alphabetic characters
        if (char >= 'a' && char <= 'z') {
            quackSequence.push(char);

            // Keep only the last 5 characters (length of "quack")
            if (quackSequence.length > quackTarget.length) {
                quackSequence.shift();
            }

            // Check if we have the sequence
            if (quackSequence.join('') === quackTarget) {
                toggleWhackyMode();
                quackSequence = []; // Reset sequence

                // Show brief activation message
                const message = document.createElement('div');
                message.innerHTML = '🦆 QUACK! 🦆';
                message.style.position = 'fixed';
                message.style.top = '50%';
                message.style.left = '50%';
                message.style.transform = 'translate(-50%, -50%)';
                message.style.background = 'rgba(0, 0, 0, 0.9)';
                message.style.color = '#ffff00';
                message.style.padding = '20px';
                message.style.borderRadius = '10px';
                message.style.fontSize = '24px';
                message.style.fontFamily = 'Comic Sans MS, cursive';
                message.style.zIndex = '10000';
                message.style.border = '3px solid #ffff00';
                message.style.boxShadow = '0 0 20px #ffff00';

                document.body.appendChild(message);

                setTimeout(() => {
                    if (document.body.contains(message)) {
                        document.body.removeChild(message);
                    }
                }, 1500);
            }

            // Clear sequence after 3 seconds of inactivity
            clearTimeout(quackTimer);
            quackTimer = setTimeout(() => {
                quackSequence = [];
            }, 3000);
        }
    });

    // Add some fun cursor trails
    let cursorTrail = [];
    function handleMouseMove(e) {
        if (!document.body.classList.contains('whacky-mode')) return;

        cursorTrail.push({x: e.clientX, y: e.clientY, time: Date.now()});

        // Keep only recent trail points
        cursorTrail = cursorTrail.filter(point => Date.now() - point.time < 1000);

        // Occasionally add a trail effect
        if (Math.random() < 0.1) {
            const trail = document.createElement('div');
            trail.innerHTML = '•';
            trail.style.position = 'fixed';
            trail.style.left = e.clientX + 'px';
            trail.style.top = e.clientY + 'px';
            trail.style.color = '#00ffff';
            trail.style.fontSize = '8px';
            trail.style.pointerEvents = 'none';
            trail.style.zIndex = '9998';
            trail.style.animation = 'fade-out 1s ease-out forwards';

            document.body.appendChild(trail);

            setTimeout(() => {
                if (document.body.contains(trail)) {
                    document.body.removeChild(trail);
                }
            }, 1000);
        }
    }

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fade-out {
            0% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0); }
        }

        @keyframes float-up {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(-50px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Enable whacky effects if mode is already active
    if (isWhackyMode) {
        enableWhackyEffects();
    }

    console.log('🎮 Whacky Mode Toggle System Loaded!');
    console.log('💡 Activate with: Type "quack"');
    console.log('🦆 Secret duck mode activated by typing!');
});
