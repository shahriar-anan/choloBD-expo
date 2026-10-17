import { useEffect, useMemo, useRef, useState } from 'react';
import { quotePersonalTourPlan } from '../services/api/tripPlanner';
import { PlanQuote } from '../types/trips';
import {
  categoryTotals,
  groupStopCostsByDay,
  pricingFingerprint,
  stopTotal,
} from '../utils/tripBudget';
import { WizardStop } from '../utils/tripPlanItinerary';

export interface PlanQuoteTotals {
  plannedTotal: number;
  budget: number;
  remaining: number;
  isOverBudget: boolean;
  byCategory: { stays: number; activities: number };
  byDay: Array<{ dayNumber: number; total: number; stays: number; activities: number; stopCount: number }>;
  source: 'quote' | 'estimate';
  isUpdating: boolean;
}

function estimateFromStops(stops: WizardStop[], budget: number): PlanQuoteTotals {
  const plannedTotal = stops.reduce((sum, stop) => sum + stopTotal(stop), 0);
  return {
    plannedTotal,
    budget,
    remaining: budget - plannedTotal,
    isOverBudget: budget > 0 && plannedTotal > budget,
    byCategory: categoryTotals(stops),
    byDay: groupStopCostsByDay(stops),
    source: 'estimate',
    isUpdating: false,
  };
}

export function usePlanQuote(stops: WizardStop[], budget: number, enabled: boolean) {
  const [quote, setQuote] = useState<PlanQuote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const fingerprint = useMemo(() => pricingFingerprint(stops, budget), [stops, budget]);
  const lastFingerprint = useRef('');
  const requestId = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    if (stops.length === 0) {
      setQuote(null);
      setIsQuoting(false);
      setError(null);
      lastFingerprint.current = fingerprint;
      return;
    }
    if (fingerprint === lastFingerprint.current && quote) return;

    const timer = setTimeout(() => {
      const id = requestId.current + 1;
      requestId.current = id;
      setIsQuoting(true);
      setError(null);
      quotePersonalTourPlan(stops, budget)
        .then((result) => {
          if (requestId.current !== id) return;
          setQuote(result);
          lastFingerprint.current = fingerprint;
        })
        .catch((err: { message?: string }) => {
          if (requestId.current !== id) return;
          setError(err?.message || 'Could not update prices');
        })
        .finally(() => {
          if (requestId.current !== id) return;
          setIsQuoting(false);
        });
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [enabled, fingerprint, stops, budget, quote, retryNonce]);

  const retry = () => {
    lastFingerprint.current = '';
    setRetryNonce((current) => current + 1);
  };

  const estimate = useMemo(() => estimateFromStops(stops, budget), [stops, budget]);

  const totals: PlanQuoteTotals = useMemo(() => {
    if (quote && lastFingerprint.current === fingerprint) {
      return {
        plannedTotal: quote.plannedTotal,
        budget: quote.budget || budget,
        remaining: quote.remaining,
        isOverBudget: quote.isOverBudget,
        byCategory: quote.byCategory,
        byDay: quote.byDay,
        source: 'quote',
        isUpdating: false,
      };
    }
    return {
      ...estimate,
      isUpdating: isQuoting,
    };
  }, [quote, fingerprint, budget, estimate, isQuoting]);

  const quoteIsFresh = Boolean(quote) && lastFingerprint.current === fingerprint;

  return {
    quote: quoteIsFresh ? quote : null,
    isQuoting,
    error,
    totals,
    retry,
  };
}
