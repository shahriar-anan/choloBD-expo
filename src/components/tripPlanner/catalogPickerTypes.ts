// Use 4 spaces for indentation

export type CatalogPickKind = 'tourSpot' | 'activity' | 'hotel';

export interface CatalogListItem {
    id: string;
    name: string;
    imageUrl?: string;
    locationName?: string;
    rating?: number;
    priceLabel?: string;
    badgeLabel?: string;
    hotelType?: string;
    rawCost?: number;
}

export interface CatalogPickResult {
    id: string;
    name: string;
    imageUrl?: string;
    locationName?: string;
    cost?: number;
    hotelType?: string;
}
