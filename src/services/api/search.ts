import { getApiInstance } from './axiosClient';
import { HotelSearchDestination } from '../../types/hotelSearch';

interface SearchLocation {
    id?: string;
    name?: string;
    city?: string | null;
    country?: string | null;
}

interface NamedSearchRow {
    id: string;
    name: string;
    locationId?: string;
    location?: SearchLocation;
}

interface LocationRow {
    id: string;
    name: string;
    locationType?: string;
    country?: string;
    state?: string | null;
    parentLocation?: {
        id: string;
        name: string;
        locationType?: string;
    } | null;
}

const PLACE_TYPES = new Set(['DIVISION', 'DISTRICT']);

function locationSubtitle(location?: SearchLocation): string {
    const place = location?.city || location?.name || '';
    const country = location?.country || '';
    return [place, country].filter(Boolean).join(', ');
}

function nameRank(name: string, query: string): number {
    const value = name.toLowerCase();
    const needle = query.toLowerCase();
    if (value === needle) {
        return 0;
    }
    if (value.startsWith(needle)) {
        return 1;
    }
    return 2;
}

function locationLabel(row: LocationRow): string {
    const type = row.locationType ? row.locationType.toLowerCase().replace('_', ' ') : 'location';
    return [type, row.state, row.country].filter(Boolean).join(', ');
}

function placeTypeRank(locationType?: string): number {
    if (locationType === 'DIVISION') {
        return 0;
    }
    if (locationType === 'DISTRICT') {
        return 1;
    }
    return 2;
}

async function fetchLocationsByName(query: string): Promise<LocationRow[]> {
    const api = getApiInstance();
    const res = await api.get('/api/locations/search', { params: { name: query } });
    return (res.data?.data || []) as LocationRow[];
}

export async function searchHotelDestinations(name: string): Promise<HotelSearchDestination[]> {
    const query = name.trim();
    const api = getApiInstance();
    const [locationResult, hotelResult, tourResult, activityResult] = await Promise.allSettled([
        fetchLocationsByName(query),
        api.get('/api/search/type', { params: { hotel: 'true', name: query } }),
        api.get('/api/search/type', { params: { tourSpot: 'true', name: query } }),
        api.get('/api/search/type', { params: { activitySpot: 'true', name: query } }),
    ]);

    const locations = locationResult.status === 'fulfilled' ? locationResult.value : [];
    const locationRows: HotelSearchDestination[] = locations
        .filter((row) => PLACE_TYPES.has(row.locationType || ''))
        .sort((left, right) => (
            nameRank(left.name, query) - nameRank(right.name, query)
            || placeTypeRank(left.locationType) - placeTypeRank(right.locationType)
            || left.name.localeCompare(right.name)
        ))
        .slice(0, 4)
        .map((row) => ({
            kind: 'place',
            id: row.id,
            name: row.name,
            subtitle: locationLabel(row),
            locationId: row.id,
            locationType: row.locationType,
            source: 'location',
        }));

    const rowsOf = (result: PromiseSettledResult<{ data?: { data?: { results?: NamedSearchRow[] } } }>): NamedSearchRow[] => (
        result.status === 'fulfilled' ? result.value.data?.data?.results || [] : []
    );
    const toPlace = (row: NamedSearchRow, source: HotelSearchDestination['source'], fallback: string): HotelSearchDestination | null => {
        const locationId = row.locationId || row.location?.id || '';
        if (!locationId) {
            return null;
        }
        return {
            kind: 'place',
            id: row.id,
            name: row.name,
            subtitle: locationSubtitle(row.location) || fallback,
            locationId,
            source,
        };
    };

    const hotels = rowsOf(hotelResult)
        .map((row) => toPlace(row, 'hotel', 'Hotel'))
        .filter((row): row is HotelSearchDestination => row !== null)
        .slice(0, 3);
    const tourSpots = rowsOf(tourResult)
        .map((row) => toPlace(row, 'tourSpot', 'Spot'))
        .filter((row): row is HotelSearchDestination => row !== null)
        .slice(0, 2);
    const activitySpots = rowsOf(activityResult)
        .map((row) => toPlace(row, 'activitySpot', 'Spot'))
        .filter((row): row is HotelSearchDestination => row !== null)
        .slice(0, 2);

    if (
        locationResult.status === 'rejected'
        && hotelResult.status === 'rejected'
        && tourResult.status === 'rejected'
        && activityResult.status === 'rejected'
    ) {
        throw hotelResult.reason;
    }

    return [...locationRows, ...hotels, ...tourSpots, ...activitySpots];
}

function districtDivisionName(row: LocationRow): string {
    return row.parentLocation?.name || row.state || '';
}

function districtMatchRank(row: LocationRow, query: string): number {
    const name = (row.name || '').toLowerCase();
    const needle = query.toLowerCase();
    if (name === needle) return 0;
    if (name.startsWith(needle)) return 1;
    if (name.includes(needle)) return 2;
    return 3;
}

export async function searchTransportPlaces(name: string): Promise<HotelSearchDestination[]> {
    const query = name.trim();
    if (!query) {
        return [];
    }
    const api = getApiInstance();
    const districtResult = await api.get('/api/locations', { params: { locationType: 'DISTRICT' } });
    const districts = (Array.isArray(districtResult.data?.data) ? districtResult.data.data : []) as LocationRow[];
    const needle = query.toLowerCase();

    return districts
        .filter((row) => row.locationType === 'DISTRICT')
        .filter((row) => {
            const nameMatch = (row.name || '').toLowerCase().includes(needle);
            const divisionMatch = districtDivisionName(row).toLowerCase().includes(needle);
            return nameMatch || divisionMatch;
        })
        .sort((left, right) => (
            districtMatchRank(left, query) - districtMatchRank(right, query)
            || left.name.localeCompare(right.name)
        ))
        .map((row) => ({
            kind: 'place' as const,
            id: row.id,
            name: row.name,
            subtitle: locationLabel({
                ...row,
                state: districtDivisionName(row) || row.state,
            }),
            locationId: row.id,
            locationType: 'DISTRICT',
            source: 'location' as const,
        }));
}

export function hotelListQueryForDestination(destination: HotelSearchDestination): { locationId?: string; divisionId?: string; name?: string } {
    if (destination.source === 'hotel') {
        return { locationId: destination.locationId, name: destination.name };
    }
    if (destination.source === 'location' && (destination.locationType === 'DIVISION' || destination.locationType === 'DISTRICT' || destination.locationType === 'STATE')) {
        return { divisionId: destination.locationId };
    }
    return { locationId: destination.locationId };
}
