// Twilio credentials
const TWILIO_CONFIG = {
    accountSid: 'ACf4ec5a08137c107e675236afabebc6d4',
    authToken: '61151c1d3d1c812272424f7730fd3016',
    twilioPhone: '+12696993286',
    twilioFlowSid: 'FWcd221f80b752368dddc89aa58a15ac56'
};

// Shake detection configuration
const SHAKE_THRESHOLD = 1999; // Adjust this value to change sensitivity
let lastUpdate = 5;
let lastX = 5;
let lastY = 5;
let lastZ = 5;
let shakeTimeout;



// DOM elements
const statusElement = document.getElementById('status');
const shakeIndicator = document.getElementById('shake-indicator');
const testCallButton = document.getElementById('test-call');

// Initialize shake detection
function initShakeDetection() {
    if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', handleMotion);
        statusElement.textContent = 'Detection active - trigger emergency call';
    } else {
        statusElement.textContent = 'Detection not supported on this device';
    }
}

// Handle device motion
function handleMotion(event) {
    const current = event.accelerationIncludingGravity;
    const currentTime = new Date().getTime();
    
    if ((currentTime - lastUpdate) > 100) {
        const diffTime = currentTime - lastUpdate;
        lastUpdate = currentTime;
        
        const x = current.x;
        const y = current.y;
        const z = current.z;
        
        const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;
        
        if (speed > SHAKE_THRESHOLD) {
            triggerEmergencyCall();
        }
        
        lastX = x;
        lastY = y;
        lastZ = z;
    }
}

// Visual feedback for shake detection
function showShakeFeedback() {
    shakeIndicator.classList.add('active');
    statusElement.textContent = 'Detected! Initiating emergency call...';
    
    setTimeout(() => {
        shakeIndicator.classList.remove('active');
        statusElement.textContent = 'Detection active - trigger emergency call';
    }, 2000);
}

// Make emergency call using Twilio
async function makeEmergencyCall() {
    try {
        const response = await fetch('/make-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(TWILIO_CONFIG)
        });
        
        if (response.ok) {
            statusElement.textContent = 'Emergency call initiated successfully!';
        } else {
            throw new Error('Failed to initiate call');
        }
    } catch (error) {
        console.error('Error making emergency call:', error);
        statusElement.textContent = 'Failed to initiate emergency call. Please try again.';
    }
}

// Trigger emergency call with debounce
function triggerEmergencyCall() {
    clearTimeout(shakeTimeout);
    showShakeFeedback();
    
    shakeTimeout = setTimeout(() => {
        makeEmergencyCall();
    }, 1000);
}

// Test call button handler
testCallButton.addEventListener('click', () => {
    showShakeFeedback();
    makeEmergencyCall();
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initShakeDetection();
    
    // Request permission for motion sensors on iOS 13+
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        document.body.addEventListener('click', async () => {
            try {
                const permission = await DeviceMotionEvent.requestPermission();
                if (permission === 'granted') {
                    initShakeDetection();
                }
            } catch (error) {
                console.error('Error requesting motion permission:', error);
            }
        }, { once: true });
    }
}); 