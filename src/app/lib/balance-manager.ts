interface BalanceData {
  lovelace: string;
  assets?: Record<string, number>;
}

interface CachedBalance {
  balance: BalanceData;
  timestamp: number;
}

export class BalanceManager {
  private static instance: BalanceManager;
  private balanceCache = new Map<string, CachedBalance>();
  private pendingRequests = new Map<string, Promise<BalanceData>>();
  private readonly CACHE_TTL = 30000;

  static getInstance(): BalanceManager {
    if (!BalanceManager.instance) {
      BalanceManager.instance = new BalanceManager();
    }
    return BalanceManager.instance;
  }

  async getBalance(address: string, forceRefresh = false): Promise<BalanceData> {
    const cached = this.balanceCache.get(address);
    const now = Date.now();

    if (!forceRefresh && cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.balance;
    }

    if (this.pendingRequests.has(address)) {
      return this.pendingRequests.get(address)!;
    }

    const balancePromise = this.fetchBalance(address);
    this.pendingRequests.set(address, balancePromise);

    try {
      const balance = await balancePromise;
      this.balanceCache.set(address, { balance, timestamp: now });
      return balance;
    } finally {
      this.pendingRequests.delete(address);
    }
  }

  private async fetchBalance(address: string): Promise<BalanceData> {
    const response = await fetch(`/api/wallet/balance?address=${address}&_t=${Date.now()}`, {
      cache: 'no-store',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (response.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }

    if (!response.ok) {
      throw new Error(`Balance fetch failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  }

  clearCache(address?: string): void {
    if (address) {
      this.balanceCache.delete(address);
      this.pendingRequests.delete(address);
    } else {
      this.balanceCache.clear();
      this.pendingRequests.clear();
    }
  }

  isPending(address: string): boolean {
    return this.pendingRequests.has(address);
  }
}