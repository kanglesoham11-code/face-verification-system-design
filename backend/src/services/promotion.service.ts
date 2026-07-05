// Demo mode: In-memory stub for promotion service

export class PromotionService {
  async createPromotion(input: any) { return { _id: `promo_${Date.now()}`, ...input, status: 'draft', createdAt: new Date() }; }
  async getPromotion(id: string) { return null; }
  async updatePromotion(id: string, data: any) { return null; }
  async deletePromotion(id: string) { return; }
  async getUserPromotions(userId: string) { return []; }
  async activatePromotion(id: string) { return null; }
  async pausePromotion(id: string) { return null; }
  async getPromotionStats(id: string) { return { impressions: 0, clicks: 0, ctr: 0 }; }
  async getSponsoredContent(targeting: any, limit: number) { return []; }
  async recordImpression(id: string) { return; }
  async recordClick(id: string) { return; }
}

export const promotionService = new PromotionService();
