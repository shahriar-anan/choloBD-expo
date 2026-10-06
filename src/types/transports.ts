export type OnPlatformTransportType = 'BUS' | 'CAR_RENTAL';

export type CatalogTransportType =
  | OnPlatformTransportType
  | 'FLIGHT'
  | 'TRAIN'
  | 'FERRY'
  | 'SELF_MANAGED';

export type TransportBookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'NO_SHOW';

export type TransportPaymentStatus = 'UNPAID' | 'PAID';

export interface TransportLocationRef {
  id: string;
  name: string;
  locationType?: string;
  country?: string;
  state?: string;
  city?: string;
  district?: string;
}

export interface TransportImage {
  id?: string;
  url: string;
  order?: number;
}

export interface TransportOperator {
  id: string;
  name: string;
  description?: string;
  transportType: CatalogTransportType;
  contactEmail?: string;
  phoneNumber?: string;
  locationId?: string | null;
  location?: TransportLocationRef | null;
  amenities?: string[];
  policies?: string[];
  rating?: number;
  isActive?: boolean;
  images?: TransportImage[];
  _count?: {
    trips?: number;
    vehicles?: number;
    reviews?: number;
  };
}

export interface PaginatedTransports {
  results: TransportOperator[];
  total: number;
  page: number;
  limit: number;
}

export interface TransportListFilters {
  locationId?: string;
  divisionId?: string;
  transportType?: OnPlatformTransportType;
  name?: string;
  page?: number;
  limit?: number;
}

export interface TransportSearchParams {
  q: string;
  locationId?: string;
  transportType?: OnPlatformTransportType;
  page?: number;
  limit?: number;
}

export interface TransportClassRef {
  id: string;
  name: string;
  basePrice: number;
  busServiceType?: string | null;
  vehicleRentalCategory?: string | null;
}

export interface TransportRouteStop {
  id: string;
  name: string;
  stopOrder: number;
  locationId?: string | null;
  location?: { id: string; name?: string } | null;
  arrivalOffsetMinutes?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface TransportRouteRef {
  id: string;
  name?: string | null;
  originLocation?: TransportLocationRef;
  destinationLocation?: TransportLocationRef;
  stops?: TransportRouteStop[];
}

export interface TransportTrip {
  id: string;
  transportId: string;
  transportRouteId: string;
  layoutId: string;
  departureDateTime: string;
  arrivalDateTime: string;
  coachLabel?: string | null;
  isActive?: boolean;
  availableSeatCount?: number;
  totalSeatCount?: number;
  lowestFare?: number | null;
  busServiceTypes?: string[];
  transportImageUrl?: string | null;
  route?: TransportRouteRef;
  layout?: {
    id?: string;
    name?: string | null;
  };
  transport?: {
    id: string;
    name: string;
    transportType: CatalogTransportType;
    images?: { url: string }[];
  };
}

export interface TransportTripFilters {
  transportId?: string;
  originLocationId?: string;
  destinationLocationId?: string;
  departureDate?: string;
}

export interface TransportSeat {
  id: string;
  compartmentId: string;
  transportClassId: string;
  seatLabel: string;
  rowLabel?: string | null;
  columnLabel?: string | null;
  isActive: boolean;
  isAvailable: boolean;
  compartmentName?: string;
  transportClass?: TransportClassRef;
}

export interface TransportTripSeatMap {
  tripId: string;
  layoutId: string;
  seats: TransportSeat[];
}

export interface TransportVehicle {
  id: string;
  transportId: string;
  transportClassId: string;
  name?: string | null;
  licensePlate?: string | null;
  vehicleStatus?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  transportClass?: TransportClassRef;
}

export interface TransportVehicleFilters {
  transportId: string;
  transportClassId?: string;
  checkInDate?: string;
  checkOutDate?: string;
}

export type TransportPassengerGender = 'MALE' | 'FEMALE';

export interface BusSeatPassenger {
  seatId: string;
  passengerName?: string;
  passengerFirstName?: string;
  passengerLastName?: string;
  passengerGender?: TransportPassengerGender;
  passengerAge?: number;
  passengerDocument?: string;
}

export interface BusReturnLegBookingData {
  transportTripId: string;
  seatIds?: string[];
  passengers?: BusSeatPassenger[];
}

export interface CreateBusTransportBookingData {
  transportId: string;
  transportTripId: string;
  seatIds?: string[];
  passengers?: BusSeatPassenger[];
  boardingStopId?: string;
  droppingStopId?: string;
  contactPhone?: string;
  contactEmail?: string;
  returnLeg?: BusReturnLegBookingData;
  paymentMethod?: string;
  specialRequests?: string;
}

export interface TransportSeatHoldResult {
  tripId: string;
  seatIds: string[];
  expiresAt: string;
}

export interface TransportRoundTripBookingResult {
  roundTripGroupId: string;
  bookings: TransportBooking[];
}

export interface CreateRentalTransportBookingData {
  transportId: string;
  transportVehicleId: string;
  departureDateTime: string;
  arrivalDateTime: string;
  paymentMethod?: string;
  specialRequests?: string;
}

export type CreateTransportBookingData =
  | CreateBusTransportBookingData
  | CreateRentalTransportBookingData;

export interface TransportBookingItem {
  id: string;
  transportTripId?: string | null;
  transportSeatId?: string | null;
  transportVehicleId?: string | null;
  serviceClassLabel?: string | null;
  unitPrice: number;
  subtotal: number;
  quantity: number;
  passengerName?: string | null;
  passengerFirstName?: string | null;
  passengerLastName?: string | null;
  passengerGender?: TransportPassengerGender | null;
  assignedSeatLabel?: string | null;
  transportSeat?: { id: string; seatLabel: string } | null;
  transportVehicle?: TransportVehicle | null;
  transportClass?: TransportClassRef | null;
  transportTrip?: TransportTrip | null;
}

export interface TransportBooking {
  id: string;
  userId: string;
  transportId?: string | null;
  transportType: CatalogTransportType;
  departureLocation: string;
  arrivalLocation: string;
  departureDateTime: string;
  arrivalDateTime: string;
  seatNumber?: string | null;
  passengerCount: number;
  serviceClass?: string | null;
  price: number;
  totalPrice: number;
  confirmationCode: string;
  status: TransportBookingStatus;
  paymentStatus: TransportPaymentStatus;
  paymentMethod?: string | null;
  specialRequests?: string | null;
  bookedAt: string;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  roundTripGroupId?: string | null;
  linkedLegBookingId?: string | null;
  boardingStop?: TransportRouteStop | null;
  droppingStop?: TransportRouteStop | null;
  items?: TransportBookingItem[];
  transport?: {
    id: string;
    name: string;
    transportType: CatalogTransportType;
    contactEmail?: string;
    phoneNumber?: string;
    images?: { url: string }[];
  } | null;
}

export interface TransportBookingListPage {
  results: TransportBooking[];
  total: number;
  page: number;
  limit: number;
}

export interface TransportBookingListFilters {
  userId?: string;
  transportId?: string;
  status?: string;
  paymentStatus?: string;
  confirmationCode?: string;
  page?: number;
  limit?: number;
}

export const ON_PLATFORM_TRANSPORT_TYPES: OnPlatformTransportType[] = ['BUS', 'CAR_RENTAL'];

export function isOnPlatformTransportType(
  transportType: string | undefined
): transportType is OnPlatformTransportType {
  return transportType === 'BUS' || transportType === 'CAR_RENTAL';
}

export function cannotBookOnPlatformMessage(transportType?: string): string {
  if (transportType === 'FLIGHT' || transportType === 'TRAIN') {
    return 'This transport type cannot be booked on-platform';
  }
  return 'This transport type cannot be booked on-platform';
}
