import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import {
  addComplaintComment,
  getComplaintById,
  getComplaintComments,
  getComplaintInbox,
  updateComplaintStatus,
} from '../services/api/complaints';
import { Complaint, ComplaintComment } from '../types/complaints';
import { ComplaintStatus } from '../types/enums';

export function useComplaintInboxLogic() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('');
  const [actionLoading, setActionLoading] = useState(false);

  const [selected, setSelected] = useState<Complaint | null>(null);
  const [comments, setComments] = useState<ComplaintComment[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchInbox = useCallback(async (status?: ComplaintStatus | '') => {
    try {
      setError(null);
      setLoading(true);
      const filter = status !== undefined ? status : statusFilter;
      const result = await getComplaintInbox({
        status: filter || undefined,
        page: 1,
        limit: 50,
      });
      setComplaints(result.results);
      setTotal(result.total);
    } catch (err: any) {
      const message = err?.message || 'Failed to load complaints';
      setError(message);
      setComplaints([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInbox();
  }, [fetchInbox]);

  const changeStatusFilter = useCallback(
    async (next: ComplaintStatus | '') => {
      setStatusFilter(next);
      await fetchInbox(next);
    },
    [fetchInbox]
  );

  const loadDetail = useCallback(async (complaintId: string) => {
    try {
      setDetailLoading(true);
      setError(null);
      const [complaint, commentList] = await Promise.all([
        getComplaintById(complaintId),
        getComplaintComments(complaintId),
      ]);
      setSelected(complaint);
      setComments(commentList);
      return complaint;
    } catch (err: any) {
      const message = err?.message || 'Failed to load complaint';
      setError(message);
      Alert.alert('Error', message);
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleUpdateStatus = useCallback(
    async (complaintId: string, status: ComplaintStatus, adminResponse?: string) => {
      try {
        setActionLoading(true);
        const updated = await updateComplaintStatus(complaintId, {
          status,
          adminResponse,
        });
        setSelected(updated);
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaintId ? { ...c, ...updated } : c))
        );
        Alert.alert('Success', `Complaint marked as ${status}`);
        return updated;
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to update status');
        return null;
      } finally {
        setActionLoading(false);
      }
    },
    []
  );

  const handleAddComment = useCallback(async (complaintId: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Comment cannot be empty');
      return null;
    }
    try {
      setActionLoading(true);
      const comment = await addComplaintComment(complaintId, trimmed);
      setComments((prev) => [...prev, comment]);
      return comment;
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add comment');
      return null;
    } finally {
      setActionLoading(false);
    }
  }, []);

  return {
    complaints,
    total,
    loading,
    refreshing,
    error,
    statusFilter,
    actionLoading,
    selected,
    comments,
    detailLoading,
    fetchInbox,
    onRefresh,
    changeStatusFilter,
    loadDetail,
    handleUpdateStatus,
    handleAddComment,
  };
}
