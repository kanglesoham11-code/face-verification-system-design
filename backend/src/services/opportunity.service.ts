// Demo mode: In-memory stub for opportunity service

export class OpportunityService {
  async createOpportunity(input: any) { return { _id: `opp_${Date.now()}`, ...input, status: 'active', createdAt: new Date() }; }
  async getOpportunity(id: string) { return null; }
  async updateOpportunity(id: string, data: any) { return null; }
  async deleteOpportunity(id: string) { return; }
  async getOpportunities(params: any) { return []; }
  async expressInterest(opportunityId: string, userId: string, data: any) { return { status: 'interested' }; }
  async getInterests(opportunityId: string) { return []; }
  async updateInterestStatus(interestId: string, status: string) { return null; }
  async getUserOpportunities(userId: string) { return []; }
}

export const opportunityService = new OpportunityService();
