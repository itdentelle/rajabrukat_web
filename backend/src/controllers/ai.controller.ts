import { Request, Response } from 'express';
import { handleAIChat, handleAISmartSearch, handleAIVisualSearch } from '../services/ai.service';

export const aiChat = async (req: Request, res: Response) => {
  try {
    const { message, history = [], image } = req.body;
    if (!message && !image) {
      return res.status(400).json({ error: 'Message or image is required' });
    }

    const result = await handleAIChat(message, history, image);
    res.json(result);
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Gagal memproses permintaan AI Chat' });
  }
};

export const aiSmartSearch = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const result = await handleAISmartSearch(query);
    res.json(result);
  } catch (error) {
    console.error('AI Smart Search Error:', error);
    res.status(500).json({ error: 'Failed to perform AI smart search' });
  }
};

export const aiVisualSearch = async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Image is required' });

    const result = await handleAIVisualSearch(image);
    res.json(result);
  } catch (error) {
    console.error('AI Visual Search Error:', error);
    res.status(500).json({ error: 'Failed to perform AI visual search' });
  }
};
