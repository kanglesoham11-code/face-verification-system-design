// Demo mode: In-memory stub for ad wallet service

export class AdWalletService {
  async getWallet(userId: string) { return { userId, balance: 0, currency: 'USD', transactions: [] }; }
  async topUp(userId: string, amount: number) { return { userId, balance: amount, currency: 'USD' }; }
  async deduct(userId: string, amount: number) { return { userId, balance: 0, currency: 'USD' }; }
  async getTransactions(userId: string) { return []; }
}

export const adWalletService = new AdWalletService();
