/**
 * Address — FE global.d.ts (additive).
 */
export interface Address {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  userId?: string;
}
