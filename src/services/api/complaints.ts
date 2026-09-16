// Use 4 spaces for indentation
import { getApiInstance } from './axiosClient';
import { unwrapListData, PaginatedList } from '../../utils/paginatedList';
import { Complaint, ComplaintComment } from '../../types/complaints';
import {
  ComplaintAddressedTo,
  ComplaintStatus,
  ComplaintTargetType,
} from '../../types/enums';

export interface GetComplaintsParams {
  status?: ComplaintStatus | string;
  targetType?: ComplaintTargetType | string;
  addressedTo?: ComplaintAddressedTo | string;
  page?: number;
  limit?: number;
}

export interface UpdateComplaintStatusData {
  status: ComplaintStatus | string;
  adminResponse?: string;
}

export interface CreateComplaintData {
  title: string;
  description: string;
  addressedTo: ComplaintAddressedTo | string;
  targetType?: ComplaintTargetType | string;
  targetEntityId?: string;
}

function mapApiError(error: any): Error {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    'Complaint request failed';
  return new Error(message);
}

/**
 * GET /api/complaints/inbox — operator queue (hotel scoped by JWT)
 */
export async function getComplaintInbox(
  params?: GetComplaintsParams
): Promise<PaginatedList<Complaint>> {
  try {
    const api = getApiInstance();
    const res = await api.get('/api/complaints/inbox', {
      params: {
        status: params?.status,
        targetType: params?.targetType,
        addressedTo: params?.addressedTo,
        page: params?.page ?? 1,
        limit: params?.limit ?? 30,
      },
    });
    return unwrapListData<Complaint>(res.data.data, params?.page ?? 1, params?.limit ?? 30);
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * GET /api/complaints/:complaintId
 */
export async function getComplaintById(complaintId: string): Promise<Complaint> {
  try {
    const api = getApiInstance();
    const res = await api.get(`/api/complaints/${complaintId}`);
    return res.data.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * PATCH /api/complaints/:complaintId/status
 */
export async function updateComplaintStatus(
  complaintId: string,
  data: UpdateComplaintStatusData
): Promise<Complaint> {
  try {
    const api = getApiInstance();
    const res = await api.patch(`/api/complaints/${complaintId}/status`, data);
    return res.data.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * GET /api/complaints/:complaintId/comments
 */
export async function getComplaintComments(
  complaintId: string
): Promise<ComplaintComment[]> {
  try {
    const api = getApiInstance();
    const res = await api.get(`/api/complaints/${complaintId}/comments`);
    const data = res.data.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * POST /api/complaints/:complaintId/comments
 */
export async function addComplaintComment(
  complaintId: string,
  content: string
): Promise<ComplaintComment> {
  try {
    const api = getApiInstance();
    const res = await api.post(`/api/complaints/${complaintId}/comments`, { content });
    return res.data.data;
  } catch (error) {
    throw mapApiError(error);
  }
}

/**
 * POST /api/complaints — traveler submit (kept for future user UI)
 */
export async function createComplaint(data: CreateComplaintData): Promise<Complaint> {
  try {
    const api = getApiInstance();
    const res = await api.post('/api/complaints', data);
    return res.data.data;
  } catch (error) {
    throw mapApiError(error);
  }
}
