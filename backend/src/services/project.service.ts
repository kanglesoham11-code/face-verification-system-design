// Demo mode: In-memory stub for project service

export class ProjectService {
  async createProject(input: any) { return { _id: `proj_${Date.now()}`, ...input, status: 'open', createdAt: new Date() }; }
  async getProject(id: string) { return null; }
  async updateProject(id: string, data: any) { return null; }
  async deleteProject(id: string) { return; }
  async getProjects(params: any) { return []; }
  async submitProposal(projectId: string, input: any) { return { _id: `prop_${Date.now()}`, status: 'submitted' }; }
  async getProposals(projectId: string) { return []; }
  async updateProposalStatus(proposalId: string, status: string) { return null; }
  async getUserProjects(userId: string) { return []; }
}

export const projectService = new ProjectService();
