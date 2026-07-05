// Demo mode: In-memory stub for referral service

export class ReferralService {
  async createReferral(referrerId: string, refereeId: string, code: string) { return { _id: `ref_${Date.now()}`, status: 'pending' }; }
  async getReferralByCode(code: string) { return null; }
  async getUserReferrals(userId: string) { return []; }
  async getReferralStats(userId: string) { return { totalReferrals: 0, successfulReferrals: 0, earnings: 0 }; }
  async getLeaderboard(type?: string, period?: string) { return []; }
  async processReferralReward(referralId: string) { return; }
}

export const referralService = new ReferralService();
