// Use 4 spaces for indentation

import React from 'react';
import { View, Text } from 'react-native';
import { TFunction } from 'i18next';
import { CancellationEligibility } from '../../types/cancellation';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';

interface CancellationEligibilityPreviewProps {
  eligibility: CancellationEligibility;
  t: TFunction;
  surfaceColor: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  primaryColor: string;
  plain?: boolean;
}

function refundMethodKey(
  refundMethod: CancellationEligibility['refundMethod']
): string {
  if (refundMethod === 'wallet') {
    return TRANSLATION_KEYS.BOOKING.REFUND_METHOD_WALLET;
  }
  if (refundMethod === 'sslcommerz') {
    return TRANSLATION_KEYS.BOOKING.REFUND_METHOD_SSL;
  }
  return TRANSLATION_KEYS.BOOKING.REFUND_METHOD_NONE;
}

export function CancellationEligibilityPreview({
  eligibility,
  t,
  surfaceColor,
  borderColor,
  textColor,
  mutedColor,
  primaryColor,
  plain = false,
}: CancellationEligibilityPreviewProps) {
  return (
    <View
      className={plain ? '' : 'p-4 mt-4 rounded-xl'}
      style={plain ? undefined : { backgroundColor: surfaceColor, borderWidth: 1, borderColor }}
    >
      <Text className="mb-2 font-semibold text-text dark:text-text-dark">
        {t(TRANSLATION_KEYS.BOOKING.CANCELLATION_POLICY)}
      </Text>
      <Text className="text-sm" style={{ color: textColor }}>
        {eligibility.reason}
      </Text>
      {eligibility.refundAllowed && (
        <View className="mt-3">
          <Text className="text-xs text-muted dark:text-muted-dark">
            {t(TRANSLATION_KEYS.BOOKING.REFUND_AMOUNT)}
          </Text>
          <Text className="text-base font-bold" style={{ color: primaryColor }}>
            ৳{eligibility.refundAmount.toLocaleString()}
          </Text>
          <Text className="mt-1 text-xs" style={{ color: mutedColor }}>
            {t(TRANSLATION_KEYS.BOOKING.REFUND_METHOD)}: {t(refundMethodKey(eligibility.refundMethod))}
          </Text>
        </View>
      )}
    </View>
  );
}
