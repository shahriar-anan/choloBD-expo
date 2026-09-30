import { getApiInstance } from './axiosClient';

export interface HotelComplaint {
  id: string;
  title: string;
  description: string;
  status: string;
  complainantName?: string;
}

export async function getComplaintInbox(): Promise<HotelComplaint[]> {
  const api = getApiInstance();
  const res = await api.get('/api/complaints/inbox');
  const results = res.data?.data?.results;
  return Array.isArray(results) ? results : [];
}

export async function getComplaintComments(complaintId: string): Promise<any[]> {
  const api = getApiInstance();
  const res = await api.get(`/api/complaints/${complaintId}/comments`);
  const data = res.data?.data;
  return Array.isArray(data) ? data : [];
}

export async function addComplaintComment(complaintId: string, content: string): Promise<any> {
  const api = getApiInstance();
  const res = await api.post(`/api/complaints/${complaintId}/comments`, { content });
  return res.data?.data ?? null;
}

export async function updateComplaintStatus(
  complaintId: string,
  status: 'UNSOLVED' | 'CLOSED'
): Promise<any> {
  const api = getApiInstance();
  const res = await api.patch(`/api/complaints/${complaintId}/status`, { status });
  return res.data?.data ?? null;
}
