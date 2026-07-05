// Demo mode: In-memory stub for service (marketplace) service

export class ServiceService {
  async createService(input: any) { return { _id: `svc_${Date.now()}`, ...input, status: 'active', createdAt: new Date() }; }
  async getService(id: string) { return null; }
  async updateService(id: string, data: any) { return null; }
  async deleteService(id: string) { return; }
  async getServices(params: any) { return []; }
  async getUserServices(userId: string) { return []; }
}

export const serviceService = new ServiceService();
