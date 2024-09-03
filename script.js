let speed = 0; // Speed in km/h
let position = 0;
let acceleration = 0; // Acceleration in km/h/s
let lastSpeed = 0;
let interval;

const needle = document.getElementById('needle');
const speedometerSpeed = document.getElementById('speedometer-speed');
const increaseSound = document.getElementById('increaseSound');
const decreaseSound = document.getElementById('decreaseSound');
const hornSound = document.getElementById('hornSound');
const hornButton = document.getElementById('hornButton');
const maxSpeed = 100; // Max speed in km/h
const maxAcceleration = 5; // Max acceleration in km/h/s
const carElement = document.getElementById('car');
const speedElement = document.getElementById('speed');
const distanceElement = document.getElementById('distance');
const increaseSpeedButton = document.getElementById('increaseSpeed');
const decreaseSpeedButton = document.getElementById('decreaseSpeed');
const speedCanvas = document.getElementById('speedGraph');
const accelerationCanvas = document.getElementById('accelerationGraph');
const speedCtx = speedCanvas.getContext('2d');
const accelerationCtx = accelerationCanvas.getContext('2d');
const speedGraphData = [];
const accelerationGraphData = [];
const graphInterval = 100; // Update graph every 100 ms
let lastGraphTime = 0;
let time = 0;

// Update position and speed display
function updatePosition() {
    let speedInMetersPerSecond = speed * 1000 / 3600;
    position += speedInMetersPerSecond / 50;
    speedElement.textContent = speed.toFixed(0);
    distanceElement.textContent = (position * 50).toFixed(2);

    let animationDuration = speed > 0 ? Math.max(0.1, 10 / speed) : 0;

    document.querySelectorAll('.lane-marker').forEach(marker => {
        marker.style.animationDuration = `${animationDuration}s`;
        marker.style.animationPlayState = speed > 0 ? 'running' : 'paused';
    });

    document.querySelectorAll('.tree').forEach(tree => {
        tree.style.animationDuration = `${animationDuration * 2}s`;
        tree.style.animationPlayState = speed > 0 ? 'running' : 'paused';
    });

    updateGraphs();
}

// Change speed and update position
function changeSpeed(amount) {
    const previousSpeed = speed;
    speed = Math.max(0, Math.min(maxSpeed, speed + amount));
    acceleration = (speed - previousSpeed) / (graphInterval / 1000); // Correct acceleration calculation
    updatePosition();
}


// Ensure that speed and acceleration values are clamped within their allowed ranges
function updateGraphs() {
    if (time - lastGraphTime >= graphInterval / 1000) {
        // Clamp speed and acceleration values
        const clampedSpeed = Math.max(0, Math.min(speed, maxSpeed));
        const clampedAcceleration = Math.max(-maxAcceleration, Math.min(acceleration, maxAcceleration));

        // Update speed graph data
        speedGraphData.push({ time, value: clampedSpeed });
        if (speedGraphData.length > speedCanvas.width / 2) {
            speedGraphData.shift();
        }

        // Update acceleration graph data
        accelerationGraphData.push({ time, value: clampedAcceleration });
        if (accelerationGraphData.length > accelerationCanvas.width / 2) {
            accelerationGraphData.shift();
        }

        lastGraphTime = time;
    }

    // Clear and redraw speed graph
    speedCtx.clearRect(0, 0, speedCanvas.width, speedCanvas.height);
    drawGraph(speedCtx, speedGraphData, maxSpeed, 'Speed (km/h)', 'blue', speedCanvas, true);

    // Clear and redraw acceleration graph
    accelerationCtx.clearRect(0, 0, accelerationCanvas.width, accelerationCanvas.height);
    drawGraph(accelerationCtx, accelerationGraphData, maxAcceleration, 'Acceleration (km/h/s)', 'red', accelerationCanvas, false);
}


function playIncreaseSound() {
    increaseSound.currentTime = 0; // Reset the audio playback
    increaseSound.play();
}

// Play sound when decreasing speed
function playDecreaseSound() {
    decreaseSound.currentTime = 0;
    decreaseSound.play();
}

// Play horn sound
function playHornSound() {
    hornSound.currentTime = 0;
    hornSound.play();
}

// Update changeSpeed to include sound effects
function changeSpeed(amount) {
    const previousSpeed = speed;
    speed = Math.max(0, Math.min(maxSpeed, speed + amount));
    acceleration = (speed - previousSpeed) / (graphInterval / 1000);

    // Play the appropriate sound effect
    if (amount > 0) {
        playIncreaseSound();
    } else if (amount < 0) {
        playDecreaseSound();
    }

    updatePosition();
}

// Attach the horn sound to the horn button
hornButton.addEventListener('click', playHornSound);

// Ensure the graph is drawn within proper bounds
function drawGraph(ctx, data, maxValue, label, color, canvas, isSpeedGraph) {
    const padding = 30; // Padding around the graph
    const graphWidth = canvas.width - 2 * padding;
    const graphHeight = canvas.height - 2 * padding;

    // Draw Y-axis with proper bounds, considering negative acceleration
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();

    const yAxisTicks = 5;
    for (let i = 0; i <= yAxisTicks; i++) {
        const y = canvas.height - padding - i * (graphHeight / yAxisTicks);
        const valueLabel = ((maxValue / yAxisTicks) * i).toFixed(1);
        ctx.beginPath();
        ctx.moveTo(padding - 5, y);
        ctx.lineTo(padding, y);
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${valueLabel}`, padding - 10, y + 5);
    }

    // Adjust for negative acceleration by drawing the zero line
    if (!isSpeedGraph) {
        const zeroLineY = canvas.height - padding - (graphHeight / 2);
        ctx.beginPath();
        ctx.moveTo(padding, zeroLineY);
        ctx.lineTo(canvas.width - padding, zeroLineY);
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Draw X-axis
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Time (s)', canvas.width / 2, canvas.height - 10);

    // Draw graph line
    ctx.beginPath();
    const xScale = graphWidth / (data.length - 1);
    const yScale = graphHeight / maxValue;
    ctx.moveTo(padding, canvas.height - padding - data[0].value * yScale);
    data.forEach((point, index) => {
        const x = padding + index * xScale;
        const y = canvas.height - padding - Math.min(maxValue, Math.max(-maxValue, point.value)) * yScale;
        ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw smoothed curve (optional)
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding - data[0].value * yScale);
    for (let i = 1; i < data.length; i++) {
        const x = padding + i * xScale;
        const y = canvas.height - padding - Math.min(maxValue, Math.max(-maxValue, data[i].value)) * yScale;
        const cx = (padding + (i - 1) * xScale + x) / 2;
        const cy = (canvas.height - padding - Math.min(maxValue, Math.max(-maxValue, data[i - 1].value)) * yScale + y) / 2;
        ctx.quadraticCurveTo(cx, cy, x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Add labels
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, canvas.width / 2, 20);
}

increaseSpeedButton.addEventListener('click', () => {
    changeSpeed(5); // Increase speed by 10 km/h
});

decreaseSpeedButton.addEventListener('click', () => {
    changeSpeed(-5); // Decrease speed by 10 km/h
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') {
        changeSpeed(10); // Increase speed by 10 km/h
    } else if (event.key === 'ArrowDown') {
        changeSpeed(-10); // Decrease speed by 10 km/h
    } else if (event.key === ' ') { // Spacebar for horn
        playHornSound();
    }
});

function updateNeedle() {
    const maxRotation = 180; // Maximum rotation for the needle (in degrees)
    const speedFraction = speed / maxSpeed;
    const needleRotation = speedFraction * maxRotation;
    
    // Update needle rotation
    needle.style.transform = `rotate(${needleRotation}deg)`;

    // Update speed display in the speedometer
    speedometerSpeed.textContent = speed.toFixed(0);
}

// Call updateNeedle whenever the speed changes
function changeSpeed(amount) {
    const previousSpeed = speed;
    speed = Math.max(0, Math.min(maxSpeed, speed + amount));
    acceleration = (speed - previousSpeed) / (graphInterval / 1000);

    if (amount > 0) {
        playIncreaseSound();
    } else if (amount < 0) {
        playDecreaseSound();
    }

    updatePosition();
    updateNeedle(); // Update the needle position based on new speed
}

// Set an interval to continuously update the needle
interval = setInterval(() => {
    time += 0.1;
    updatePosition();
    updateNeedle();
}, 100);