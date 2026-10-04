import { getApiInstance } from './axiosClient';

export interface HotelStaffMember {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
  phoneNumber?: string | null;
  imageUrl?: string | null;
  userStatus: string;
}

export interface HotelTaskRoom {
  id: string;
  roomNumber?: string | null;
  roomStatus?: string | null;
}

export interface HotelTaskRow {
  id: string;
  hotelId: string;
  hotelRoomId?: string | null;
  assigneeUserId: string;
  status: 'OPEN' | 'DONE';
  note?: string | null;
  hotelRoom?: HotelTaskRoom | null;
  assignee?: HotelStaffMember | null;
}

export function staffDisplayName(person?: {
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
} | null): string {
  const name = [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim();
  return name || person?.userName || 'Staff';
}

export async function getHotelStaff(hotelId: string): Promise<HotelStaffMember[]> {
  const api = getApiInstance();
  const res = await api.get(`/api/hotels/${hotelId}/staff`);
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function getHotelTasks(hotelId: string, status?: 'OPEN' | 'DONE'): Promise<HotelTaskRow[]> {
  const api = getApiInstance();
  const res = await api.get('/api/hotel-tasks', {
    params: { hotelId, status, limit: 50 },
  });
  const results = res.data?.data?.results;
  return Array.isArray(results) ? results : [];
}

export async function createHotelTask(data: {
  hotelId: string;
  assigneeUserId: string;
  hotelRoomId?: string | null;
  note?: string | null;
}): Promise<HotelTaskRow> {
  const api = getApiInstance();
  const res = await api.post('/api/hotel-tasks', data);
  return res.data?.data;
}

export async function completeHotelTask(taskId: string): Promise<HotelTaskRow> {
  const api = getApiInstance();
  const res = await api.patch(`/api/hotel-tasks/${taskId}/complete`);
  return res.data?.data;
}

export async function updateHotelDesk(
  bookingId: string,
  data: { assignedEmployeeId?: string | null; staffNote?: string | null }
): Promise<any> {
  const api = getApiInstance();
  const res = await api.patch(`/api/bookings/hotel-rooms/${bookingId}/desk`, data);
  return res.data?.data ?? null;
}
