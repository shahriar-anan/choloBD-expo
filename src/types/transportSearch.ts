import { HotelSearchDestination } from './hotelSearch';
import { OnPlatformTransportType } from './transports';

export type TransportPlace = HotelSearchDestination;

export interface TransportSearchParams {
    from: TransportPlace | null;
    to: TransportPlace | null;
    date: string;
    /** Optional return journey date (bus only). */
    returnDate: string | null;
    transportType: OnPlatformTransportType;
}
