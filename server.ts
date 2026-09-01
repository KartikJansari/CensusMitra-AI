import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { 
  handleChatApi, 
  handleSchedulesApi, 
  handleMythCheckApi, 
  handleStatsApi,
  handleTranscribeApi,
  handleTtsApi
} from './src/server/apiRouter';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// API endpoints
app.post('/api/chat', handleChatApi);
app.get('/api/schedules', handleSchedulesApi);
app.post('/api/myth-check', handleMythCheckApi);
app.get('/api/stats', handleStatsApi);
app.post('/api/transcribe', handleTranscribeApi);
app.post('/api/tts', handleTtsApi);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CensusMitra AI Digital Census 2027 Server' });
});

// Serve static frontend assets from dist in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Catch-all route to serve index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CensusMitra AI server running on port ${PORT}`);
});
