// Twilio credentials
const TWILIO_CONFIG = {
    accountSid: 'AC289cfaa339fe395a855da697104a2905',
    authToken: '43a4996d43cfa7b706de8f717d24c4fc',
    twilioPhone: '+12317588795',
    recipientPhone: '+917391867113'
};

// Shake detection configuration
const SHAKE_THRESHOLD = 3999; // Adjust this value to change sensitivity
let lastUpdate = 5;
let lastX = 5;
let lastY = 5;
let lastZ = 5;
let shakeTimeout;

// Emergency state tracking
let emergencyInProgress = false;

// DOM elements
const statusElement = document.getElementById('status');
const shakeIndicator = document.getElementById('shake-indicator');
const testCallButton = document.getElementById('test-call');
const confirmationDialog = document.getElementById('confirmation-dialog');
const timerElement = document.getElementById('timer');
const imOkayButton = document.getElementById('im-okay-btn');
const overlay = document.getElementById('overlay');

let emergencyTimer;
let secondsLeft = 10;

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
    // Don't process motion events if emergency is already in progress
    if (emergencyInProgress) return;
    
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
    // Set emergency in progress to prevent multiple triggers
    emergencyInProgress = true;
    
    shakeIndicator.classList.add('active');
    statusElement.textContent = 'Emergency detected! Please confirm if you\'re okay.';
    overlay.classList.remove('hidden');
    confirmationDialog.classList.remove('hidden');
    startEmergencyTimer();
}

// Make emergency call using Twilio
async function makeEmergencyCall() {
    // Prevent multiple calls
    if (!emergencyInProgress) return;
    
    try {
        const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + TWILIO_CONFIG.accountSid + '/Calls.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(TWILIO_CONFIG.accountSid + ':' + TWILIO_CONFIG.authToken)
            },
            body: new URLSearchParams({
                'To': TWILIO_CONFIG.recipientPhone,
                'From': TWILIO_CONFIG.twilioPhone,
                'Url': 'http://demo.twilio.com/docs/voice.xml'
            })
        });
        
        if (response.ok) {
            statusElement.textContent = 'Emergency call initiated successfully!';
        } else {
            throw new Error('Failed to initiate call');
        }
    } catch (error) {
        console.error('Error making emergency call:', error);
        statusElement.textContent = 'Failed to initiate emergency call. Please try again.';
        // Reset emergency state if call fails
        setTimeout(() => {
            emergencyInProgress = false;
        }, 5000);
    }
}

// Start emergency timer
function startEmergencyTimer() {
    // Clear any existing timer to prevent multiple timers
    if (emergencyTimer) {
        clearInterval(emergencyTimer);
    }
    
    secondsLeft = 10;
    timerElement.textContent = secondsLeft;
    
    emergencyTimer = setInterval(() => {
        secondsLeft--;
        timerElement.textContent = secondsLeft;
        
        if (secondsLeft <= 0) {
            clearInterval(emergencyTimer);
            confirmationDialog.classList.add('hidden');
            overlay.classList.add('hidden');
            statusElement.textContent = 'Emergency detected! Making emergency call...';
            makeEmergencyCall();
            
            // Reset emergency state after call is made and a cooldown period
            setTimeout(() => {
                emergencyInProgress = false;
                statusElement.textContent = 'Detection active - trigger emergency call';
            }, 10000); // 10 second cooldown after call
        }
    }, 1000);
}

// Handle 'I'm Okay' button click
imOkayButton.addEventListener('click', () => {
    clearInterval(emergencyTimer);
    confirmationDialog.classList.add('hidden');
    overlay.classList.add('hidden');
    statusElement.textContent = 'Detection active - trigger emergency call';
    shakeIndicator.classList.remove('active');
    
    // Reset emergency state after a short delay to prevent immediate re-triggering
    setTimeout(() => {
        emergencyInProgress = false;
    }, 2000);
});

// Trigger emergency call with debounce
function triggerEmergencyCall() {
    clearTimeout(shakeTimeout);
    showShakeFeedback();
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