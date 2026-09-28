import { getApiInstance } from './axiosClient';

export interface OwnWallet {
  id: string;
  balance: number;
  currency: string;
  walletStatus?: string;
}

export interface ChargeWalletCreditsInput {
  serviceType: 'HOTEL_BOOKING' | 'PACKAGE_BOOKING' | 'TRIP_PACKAGE' | 'TRANSPORT_SERVICE' | 'ACTIVITY_BOOKING' | 'GUIDE_SERVICE';
  serviceTypeId: string;
  paymentAmount: number;
}

export async function getOwnWallet(): Promise<OwnWallet> {
  const api = getApiInstance();
  const res = await api.get('/api/wallets/own-wallet');
  return res.data.data as OwnWallet;
}

export async function chargeWalletCredits(input: ChargeWalletCreditsInput): Promise<void> {
  const api = getApiInstance();
  await api.post('/api/wallets/own-wallet/charge-credits', input);
}

export function pointsCostForTotal(totalPrice: number): number {
  return Math.floor(totalPrice * 0.8);
}
