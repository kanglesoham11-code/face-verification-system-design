// Demo mode: In-memory stub for job service

export class JobService {
  async createJob(input: any) { return { _id: `job_${Date.now()}`, ...input, status: 'active', createdAt: new Date() }; }
  async getJob(id: string) { return null; }
  async updateJob(id: string, data: any) { return null; }
  async deleteJob(id: string) { return; }
  async getJobs(params: any) { return []; }
  async applyToJob(jobId: string, applicantId: string, data: any) { return { _id: `app_${Date.now()}`, status: 'submitted' }; }
  async getApplications(jobId: string) { return []; }
  async updateApplicationStatus(applicationId: string, status: string) { return null; }
  async getMyApplications(userId: string) { return []; }
  async getUserJobs(userId: string) { return []; }
}

export const jobService = new JobService();
