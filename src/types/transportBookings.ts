/**
 * Transport booking — FE global.d.ts (additive).
 * Does not replace inventory types in transports.ts.
 */
export interface TransportBooking {
  id: string;
  userId: string;
  transportId: string | null;
  transportType: string;
  departureLocation: string;
  arrivalLocation: string;
  departureDateTime: Date | string;
  arrivalDateTime: Date | string;
  seatNumber: string | null;
  seatDetails: string | null;
  passengerCount: number;
  passengerDetails: Record<string, unknown> | null;
  serviceClass: string | null;
  price: number;
  totalPrice: number;
  confirmationCode: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  specialRequests: string | null;
  bookedAt: Date | string;
  confirmedAt: Date | string | null;
  cancelledAt: Date | string | null;
  cancellationReason: string | null;
  items?: TransportBookingItem[];
}

export interface TransportBookingItem {
  id: string;
  transportBookingId: string;
  transportTripId: string | null;
  transportSeatId: string | null;
  transportVehicleId: string | null;
  transportClassId: string | null;
  serviceClassLabel: string | null;
  unitPrice: number;
  subtotal: number;
  quantity: number;
  passengerName: string | null;
  passengerAge: number | null;
  passengerDocument: string | null;
  assignedSeatLabel: string | null;
  externalPnr: string | null;
  externalOrderId: string | null;
  externalTicketNo: string | null;
  createdAt: Date | string;
}

export interface TransportBookingFilters {
  userId?: string;
  transportId?: string;
  status?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
}
