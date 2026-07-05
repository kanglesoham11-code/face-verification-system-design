// Demo mode: In-memory user registry + connection management

interface ConnectionRequest {
  _id: string;
  requesterId: string;
  recipientId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

// Global in-memory stores
const connections: ConnectionRequest[] = [];
const followers: Map<string, Set<string>> = new Map();

// Global user registry — stores ALL signed-up users across sessions
let registeredUsers: any[] = [];

export function registerUser(userData: { id: string; name: string; email: string; role: string; faceImage?: string; verificationStatus?: any }) {
  const existing = registeredUsers.find(u => u.id === userData.id);
  if (existing) {
    Object.assign(existing, userData);
  } else {
    registeredUsers.push({ ...userData, joinedAt: new Date().toISOString() });
  }
}

export function getAllRegisteredUsers(): any[] {
  return registeredUsers;
}

export class ConnectionService {
  async sendRequest(data: { requesterId: string; recipientId: string; message?: string }) {
    // Check if already connected or pending
    const existing = connections.find(c =>
      (c.requesterId === data.requesterId && c.recipientId === data.recipientId) ||
      (c.requesterId === data.recipientId && c.recipientId === data.requesterId)
    );
    if (existing) {
      if (existing.status === 'pending') throw new Error('Request already pending');
      if (existing.status === 'accepted') throw new Error('Already connected');
    }
    const conn: ConnectionRequest = {
      _id: `conn_${Date.now()}`,
      requesterId: data.requesterId,
      recipientId: data.recipientId,
      message: data.message,
      status: 'pending',
      createdAt: new Date(),
    };
    connections.push(conn);
    return conn;
  }

  async respondToRequest(requestId: string, userId: string, action: string) {
    const conn = connections.find(c => c._id === requestId);
    if (!conn) throw new Error('Request not found');
    conn.status = action === 'accept' ? 'accepted' : 'rejected';
    return conn;
  }

  async withdrawRequest(requestId: string, userId: string) {
    const idx = connections.findIndex(c => c._id === requestId && c.requesterId === userId);
    if (idx > -1) connections.splice(idx, 1);
  }

  async getConnections(userId: string, limit: number = 50) {
    return connections
      .filter(c => (c.requesterId === userId || c.recipientId === userId) && c.status === 'accepted')
      .slice(0, limit)
      .map(c => {
        const otherUserId = c.requesterId === userId ? c.recipientId : c.requesterId;
        const otherUser = registeredUsers.find(u => u.id === otherUserId);
        return {
          _id: c._id,
          user: otherUser || { id: otherUserId, name: 'Unknown', email: '' },
          connectedAt: c.createdAt,
        };
      });
  }

  async getPendingRequests(userId: string) {
    return connections
      .filter(c => c.recipientId === userId && c.status === 'pending')
      .map(c => {
        const requester = registeredUsers.find(u => u.id === c.requesterId);
        return {
          _id: c._id,
          requester: requester || { id: c.requesterId, name: 'Unknown', email: '' },
          message: c.message,
          createdAt: c.createdAt,
        };
      });
  }

  async getSentRequests(userId: string) {
    return connections
      .filter(c => c.requesterId === userId && c.status === 'pending')
      .map(c => {
        const recipient = registeredUsers.find(u => u.id === c.recipientId);
        return {
          _id: c._id,
          recipient: recipient || { id: c.recipientId, name: 'Unknown', email: '' },
          message: c.message,
          createdAt: c.createdAt,
        };
      });
  }

  async removeConnection(userId: string, otherUserId: string) {
    const idx = connections.findIndex(c =>
      ((c.requesterId === userId && c.recipientId === otherUserId) ||
       (c.requesterId === otherUserId && c.recipientId === userId)) &&
      c.status === 'accepted'
    );
    if (idx > -1) connections.splice(idx, 1);
  }

  async followUser(userId: string, targetId: string) {
    if (!followers.has(targetId)) followers.set(targetId, new Set());
    followers.get(targetId)!.add(userId);
    return { following: true };
  }

  async unfollowUser(userId: string, targetId: string) {
    followers.get(targetId)?.delete(userId);
    return { following: false };
  }

  async getFollowers(userId: string) { return Array.from(followers.get(userId) || []); }
  async getFollowing(userId: string) {
    const result: string[] = [];
    followers.forEach((set, targetId) => { if (set.has(userId)) result.push(targetId); });
    return result;
  }

  async getSuggestions(userId: string) {
    // Return all users except the current user, not already connected
    const connectedIds = new Set<string>();
    connections.forEach(c => {
      if (c.status === 'accepted' || c.status === 'pending') {
        if (c.requesterId === userId) connectedIds.add(c.recipientId);
        if (c.recipientId === userId) connectedIds.add(c.requesterId);
      }
    });
    return registeredUsers
      .filter(u => u.id !== userId && !connectedIds.has(u.id))
      .map(u => ({ ...u, mutualConnections: 0 }));
  }

  async getConnectionStatus(userId: string, targetId: string) {
    const conn = connections.find(c =>
      (c.requesterId === userId && c.recipientId === targetId) ||
      (c.requesterId === targetId && c.recipientId === userId)
    );
    if (!conn) return { status: 'none' };
    if (conn.status === 'accepted') return { status: 'connected', connectionId: conn._id };
    if (conn.status === 'pending') {
      return {
        status: conn.requesterId === userId ? 'sent' : 'received',
        connectionId: conn._id,
      };
    }
    return { status: 'none' };
  }

  async getMutualConnections(userId1: string, userId2: string) { return []; }
}

export const connectionService = new ConnectionService();
