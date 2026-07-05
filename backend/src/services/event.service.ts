// Demo mode: In-memory stub for event service

export class EventService {
  async createEvent(input: any) { return { _id: `evt_${Date.now()}`, ...input, status: 'active', createdAt: new Date() }; }
  async getEvent(id: string) { return null; }
  async updateEvent(id: string, data: any) { return null; }
  async deleteEvent(id: string) { return; }
  async getEvents(params: any) { return []; }
  async registerForEvent(eventId: string, userId: string, ticketType?: string) { return { _id: `tkt_${Date.now()}`, status: 'confirmed' }; }
  async cancelRegistration(eventId: string, userId: string) { return; }
  async getRegistrations(eventId: string) { return []; }
  async checkIn(eventId: string, qrCode: string) { return { checkedIn: true }; }
  async getMyEvents(userId: string, type?: string) { return []; }
  async getUserEvents(userId: string) { return []; }
}

export const eventService = new EventService();
