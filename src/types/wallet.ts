/**
 * Wallet types — FE global.d.ts (additive).
 */

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  walletStatus: string;
  pin?: string;
  lastActivityAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  transactionType: string;
  amount: number;
  currency: string;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: Date | string;
  processedAt?: Date | string;
}

export interface WalletRefund {
  id: string;
  walletId: string;
  walletTransactionId: string;
  amount: number;
  currency: string;
  reason: string;
  refundStatus: string;
  adminNotes?: string;
  requestedAt: Date | string;
  processedAt?: Date | string;
  completedAt?: Date | string;
}

export interface WalletLog {
  id: string;
  walletId: string;
  walletTransactionId?: string;
  event: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date | string;
}

export interface WalletRechargeOption {
  id: string;
  title: string;
  description: string;
  rechargeAmount: number;
  rechargeCost: number;
  bonusAmount: number;
}
