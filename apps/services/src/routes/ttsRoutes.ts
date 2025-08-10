import express from 'express';
import { synthesizeSpeechOpenAI } from '../openai/tts.js';
import { mapVoiceIdToOpenAIVoice } from '../openai/voiceMap.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// POST /api/tts
// Body: { text: string, isUser?: boolean, voice?: string, format?: 'mp3'|'wav'|'flac'|'aac'|'opus' }
router.post('/', async (req, res) => {
  try {
    const { text, isUser, voice, voiceId, format } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Bad request', message: 'text is required' });
    }

    const resolvedVoice = voice || mapVoiceIdToOpenAIVoice(voiceId, isUser ? 'male' : 'female');

    const { audioBase64, format: usedFormat } = await synthesizeSpeechOpenAI(text, {
      voice: resolvedVoice,
      format,
      genderHint: isUser ? 'male' : 'female',
    });

    // Return data URL to keep client simple
    const dataUrl = `data:audio/${usedFormat};base64,${audioBase64}`;
    res.json({ success: true, audioUrl: dataUrl });
  } catch (error: any) {
    logger.error('TTS route error', { error: error?.message || String(error) });
    res.status(500).json({ success: false, error: 'TTS synthesis failed' });
  }
});

export default router;


