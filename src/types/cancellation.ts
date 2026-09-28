// Use 4 spaces for indentation

export interface CancellationEligibility {
    canCancel: boolean;
    refundAllowed: boolean;
    refundAmount: number;
    refundMethod: 'sslcommerz' | 'wallet' | 'none';
    reason: string;
}

export interface BookingCancelRefundSummary {
    id: string;
    status: string;
    rail: 'sslcommerz' | 'wallet';
}

export interface CancelBookingWithRefundData<TBooking = unknown> {
    booking: TBooking;
    eligibility: CancellationEligibility;
    refund?: BookingCancelRefundSummary | null;
}

export function isCancelWithRefundPayload(
    data: unknown
): data is CancelBookingWithRefundData<unknown> {
    if (!data || typeof data !== 'object') {
        return false;
    }
    return 'booking' in data && 'eligibility' in data;
}

export function unwrapCancelBookingPayload<T>(data: T | CancelBookingWithRefundData<T>): T {
    if (isCancelWithRefundPayload(data)) {
        return data.booking as T;
    }
    return data as T;
}
