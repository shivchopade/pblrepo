const express = require('express');
const twilio = require('twilio');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Twilio client setup
const accountSid = "AC289cfaa339fe395a855da697104a2905";
const authToken = "43a4996d43cfa7b706de8f717d24c4fc";
const client = require("twilio")(accountSid, authToken);

// Endpoint to make emergency calls
app.post('/make-call', async (req, res) => {
    try {
        const call = await client.calls.create({
            url: 'http://demo.twilio.com/docs/voice.xml',
            to: "+917391867113", // Default to the provided number if not specified
            from: '+12317588795'
        });
        
        res.json({ success: true, callSid: call.sid });
    } catch (error) {
        console.error('Error making call:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 