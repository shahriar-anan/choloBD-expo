export type PaymentStatus = 'UNPAID' | 'PAID';

export type ServiceType =
  | 'HOTEL_BOOKING'
  | 'PACKAGE_BOOKING'
  | 'GUIDE_SERVICE'
  | 'WALLET_TOP_UP'
  | 'TRIP_PACKAGE'
  // --- FE ServiceType values (additive) ---
  | 'TRANSPORT_SERVICE'
  | 'ACTIVITY_BOOKING';

export type TransactionStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  // --- FE TransactionStatus values (additive) ---
  | 'PROCESSING'
  | 'REVERSED';

export interface InitializePaymentParams {
  serviceType: ServiceType;
  serviceTypeId: string;
  phone?: string;
  email?: string;
  userName?: string;
  paymentAmount?: number;
}

export interface PaymentInitResponse {
  transactionId: string;
  paymentId: string;
  gatewayPageURL: string;
}

export interface PaymentTransaction {
  id: string;
  transactionId: string;
  status: TransactionStatus | PaymentStatus | string;
  amount: number;
  currency: string;
  serviceType: ServiceType;
  serviceTypeId: string;
  createdAt: string;
  updatedAt: string;
  // --- FE PaymentTransaction fields (additive) ---
  userId?: string;
  val_id?: string;
  bank_tran_id?: string;
  initiatedAt?: Date | string;
  completedAt?: Date | string;
  failureReason?: string;
  sslcommerzData?: Record<string, unknown>;
}

/** FE global.d.ts — additive */
export interface PaymentRefund {
  id: string;
  paymentTransactionId: string;
  amount: number;
  remarks: string;
  status: string;
  refund_ref_id?: string;
  requestedAt: Date | string;
  completedAt?: Date | string;
}

/** FE global.d.ts — additive */
export interface PaymentLog {
  id: string;
  paymentTransactionId: string;
  event: string;
  details?: Record<string, unknown>;
  createdAt: Date | string;
}
