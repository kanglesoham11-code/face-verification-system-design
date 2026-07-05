// Demo mode: In-memory stub for company service

export class CompanyService {
  async createCompany(input: any) { return { _id: `comp_${Date.now()}`, ...input, verificationStatus: 'pending', createdAt: new Date() }; }
  async getCompany(id: string) { return null; }
  async updateCompany(id: string, data: any) { return null; }
  async deleteCompany(id: string) { return; }
  async getCompanies(params: any) { return []; }
  async verifyCompany(id: string) { return null; }
  async getCompanyByDomain(domain: string) { return null; }
  async addReview(companyId: string, userId: string, data: any) { return { _id: `rev_${Date.now()}` }; }
  async getReviews(companyId: string) { return []; }
}

export const companyService = new CompanyService();
