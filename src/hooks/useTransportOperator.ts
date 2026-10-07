import { useCallback, useEffect, useState } from 'react';
import { getMyTransport } from '../services/api/transports';
import { OnPlatformTransportType, TransportOperator } from '../types/transports';

function pickOperatorTransport(rows: TransportOperator[]): TransportOperator | null {
  const onPlatform = rows.filter(
    (row) => row.transportType === 'BUS' || row.transportType === 'CAR_RENTAL'
  );
  return onPlatform[0] ?? rows[0] ?? null;
}

export function useTransportOperator(enabled = true) {
  const [transport, setTransport] = useState<TransportOperator | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setTransport(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await getMyTransport();
      setTransport(pickOperatorTransport(rows));
      setError(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load transport company';
      setTransport(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const transportType = transport?.transportType;
  const onPlatformType: OnPlatformTransportType | null =
    transportType === 'BUS' || transportType === 'CAR_RENTAL' ? transportType : null;

  return {
    transport,
    transportId: transport?.id ?? null,
    transportType: onPlatformType,
    loading,
    error,
    reload,
  };
}
