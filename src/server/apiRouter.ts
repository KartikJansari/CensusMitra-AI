import { Request, Response } from 'express';
import { processCensusChat, transcribeAudio, generateSpeechAudio } from './geminiService';
import { ALL_STATES_SCHEDULES, MYTH_BUSTER_DATABASE, DEMOGRAPHIC_STATS_2027 } from '../data/censusData';
import { sanitizeInput } from '../utils/securityAndValidation';

export async function handleChatApi(req: Request, res: Response) {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message string is required' });
      return;
    }

    const cleanMessage = sanitizeInput(message).slice(0, 1000);
    const cleanHistory = Array.isArray(history) 
      ? history.slice(-10).map((h: any) => ({
          role: h.role === 'assistant' || h.role === 'model' ? 'assistant' : 'user',
          text: sanitizeInput(String(h.text || '')).slice(0, 1000)
        }))
      : [];

    const response = await processCensusChat(cleanMessage, cleanHistory);
    res.json(response);
  } catch (error: any) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'Failed to process census query', details: error.message });
  }
}

export function handleSchedulesApi(req: Request, res: Response) {
  try {
    const { state, region, type } = req.query;
    let results = ALL_STATES_SCHEDULES;

    if (state && typeof state === 'string') {
      const q = sanitizeInput(state).toLowerCase();
      results = results.filter(s => 
        s.stateName.toLowerCase().includes(q) || 
        s.stateNameHi.toLowerCase().includes(q) ||
        s.id.toLowerCase() === q
      );
    }
    if (region && typeof region === 'string') {
      const r = sanitizeInput(region).toLowerCase();
      results = results.filter(s => s.region.toLowerCase() === r);
    }
    if (type && typeof type === 'string') {
      const t = sanitizeInput(type).toLowerCase();
      results = results.filter(s => s.type.toLowerCase() === t);
    }

    res.json({ count: results.length, schedules: results });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve schedules' });
  }
}

export function handleMythCheckApi(req: Request, res: Response) {
  try {
    const { query } = req.body;
    if (!query) {
      res.json({ myths: MYTH_BUSTER_DATABASE });
      return;
    }

    const q = sanitizeInput(String(query)).toLowerCase();
    const matches = MYTH_BUSTER_DATABASE.filter(m => 
      m.rumor.toLowerCase().includes(q) || 
      m.fact.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );

    res.json({
      query: q,
      count: matches.length,
      myths: matches.length > 0 ? matches : MYTH_BUSTER_DATABASE
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to process myth check' });
  }
}

export function handleStatsApi(req: Request, res: Response) {
  try {
    res.json(DEMOGRAPHIC_STATS_2027);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve demographic stats' });
  }
}

export async function handleTranscribeApi(req: Request, res: Response) {
  try {
    const { audioData, mimeType } = req.body;
    if (!audioData || typeof audioData !== 'string') {
      res.status(400).json({ error: 'Base64 audioData is required for transcription' });
      return;
    }

    const result = await transcribeAudio(audioData, mimeType || 'audio/webm');
    res.json(result);
  } catch (error: any) {
    console.error('Transcription API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to transcribe audio' });
  }
}

export async function handleTtsApi(req: Request, res: Response) {
  try {
    const { text, voiceName } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for TTS' });
      return;
    }

    const result = await generateSpeechAudio(text, voiceName || 'Kore');
    if (result && result.audioBase64) {
      res.json(result);
    } else {
      res.status(503).json({ error: 'TTS service not available' });
    }
  } catch (error: any) {
    console.error('TTS API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate speech' });
  }
}

