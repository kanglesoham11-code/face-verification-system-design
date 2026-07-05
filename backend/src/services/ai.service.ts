// Demo mode: In-memory stub for AI service
import { env } from '../config/env.js';

export class AIService {
  async optimizeProfile(profileData: any) { return { suggestions: ['Add more skills', 'Write a better headline'], score: 72 }; }
  async enhanceContent(data: any) { return { enhanced: data.text || '', suggestions: [] }; }
  async getConnectionRecommendations(userId: string, limit?: number) { return []; }
  async getOpportunityMatches(userId: string, limit?: number) { return []; }
  async optimizeCampaign(data: any) { return { recommendations: [] }; }
  async enhanceJobDescription(data: any) { return { enhanced: data.description || '' }; }
  async enhanceEventDescription(data: any) { return { enhanced: data.description || '' }; }
  async suggestPostTopics(userId: string, limit?: number) { return ['AI trends', 'Remote work tips', 'Career growth']; }
  async getStatus() { return { enabled: env.ENABLE_AI_ASSISTANT, model: 'demo-mode', status: 'running' }; }
}

export const aiService = new AIService();