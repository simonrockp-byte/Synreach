import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const resend = new Resend(process.env.RESEND_API_KEY);

// Mock storage for outreach status
const STATUS_FILE = path.join(__dirname, 'outreach_status.json');

const getStatus = () => {
    if (!fs.existsSync(STATUS_FILE)) return {};
    return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
};

const updateStatus = (leadId, update) => {
    const status = getStatus();
    status[leadId] = { ...status[leadId], ...update, lastUpdated: new Date().toISOString() };
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
};

// --- Outreach API ---

app.post('/api/send', async (req, res) => {
    const { leadId, method, recipient, subject, content } = req.body;

    if (!leadId || !method || !recipient || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        if (method === 'email') {
            const { data, error } = await resend.emails.send({
                from: 'Synreach Outreach <outreach@resend.dev>', // Should be a verified domain in production
                to: recipient,
                subject: subject || 'Synergizing for Growth',
                html: content,
            });

            if (error) throw error;
            updateStatus(leadId, { emailStatus: 'sent', messageId: data.id });
            return res.json({ success: true, messageId: data.id });
        } 
        
        else if (method === 'whatsapp') {
            // Wati API Example
            const watiApiUrl = process.env.WATI_API_URL;
            const watiToken = process.env.WATI_TOKEN;

            if (!watiApiUrl || !watiToken) {
                // Mock success for development if keys aren't set
                console.log('WATI keys missing, mocking WhatsApp success...');
                updateStatus(leadId, { whatsappStatus: 'sent', provider: 'wati-mock' });
                return res.json({ success: true, mock: true });
            }

            const response = await axios.post(`${watiApiUrl}/api/v1/sendSessionMessage/${recipient}`, {
                messageText: content
            }, {
                headers: { 'Authorization': `Bearer ${watiToken}` }
            });

            updateStatus(leadId, { whatsappStatus: 'sent', watiId: response.data.id });
            return res.json({ success: true, data: response.data });
        }

        res.status(400).json({ error: 'Invalid outreach method' });
    } catch (err) {
        console.error('Outreach error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- Webhook Handlers ---

app.post('/api/webhooks/resend', (req, res) => {
    const event = req.body;
    console.log('Resend Webhook received:', event.type);
    
    // In a real app, match messageId to leadId
    // For now, just log and return 200
    res.json({ received: true });
});

app.post('/api/webhooks/whatsapp', (req, res) => {
    const event = req.body;
    console.log('WhatsApp Webhook received:', event);
    
    // Logic to handle 'read', 'delivered', or 'replied'
    res.json({ received: true });
});

app.get('/api/status/:leadId', (req, res) => {
    const status = getStatus();
    res.json(status[req.params.leadId] || { status: 'none' });
});

app.listen(PORT, () => {
    console.log(`Outreach worker running on http://localhost:${PORT}`);
});
