// Use 4 spaces for indentation

import {
    CancellationEligibility,
    CancelBookingWithRefundData,
    isCancelWithRefundPayload,
} from '../types/cancellation';
import type { BookingStatus } from '../types/packageBookings';

const TERMINAL_STATUSES: BookingStatus[] = [
    'CANCELLED',
    'COMPLETED',
    'REFUNDED',
    'NO_SHOW',
];

export function shouldFetchCancellationEligibility(status: string | undefined): boolean {
    if (!status) {
        return false;
    }
    return !TERMINAL_STATUSES.includes(status as BookingStatus);
}

export function formatRefundMethodLine(
    refundMethod: CancellationEligibility['refundMethod']
): string {
    if (refundMethod === 'wallet') {
        return 'Refund to your wallet credits (usually immediate).';
    }
    if (refundMethod === 'sslcommerz') {
        return 'Refund to your card/MFS (1–3 business days after the bank confirms).';
    }
    return 'No refund for this cancellation.';
}

export function getCancelActionLabel(eligibility: CancellationEligibility): string {
    if (!eligibility.canCancel) {
        return 'Cancel booking';
    }
    if (eligibility.refundAllowed && eligibility.refundAmount > 0) {
        return `Cancel & refund ৳${eligibility.refundAmount.toLocaleString()}`;
    }
    return 'Cancel booking';
}

export function buildCancelSuccessMessage(
    fallbackMessage: string,
    data: unknown
): string {
    if (!isCancelWithRefundPayload(data)) {
        return fallbackMessage;
    }
    let message = fallbackMessage;
    if (data.eligibility.refundAllowed && !data.refund) {
        message += ' Cancellation recorded; refund may still be processing.';
    } else if (data.refund) {
        message += ` Refund ${data.refund.status.toLowerCase()} (${data.refund.rail}).`;
    }
    return message;
}

export type { CancelBookingWithRefundData };
