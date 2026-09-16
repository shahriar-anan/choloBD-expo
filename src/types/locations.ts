export interface Location {
  id: string;
  name: string;
  locationType?: 'DIVISION' | 'DISTRICT' | 'AREA' | 'CITY' | string;
  state?: string; // Parent division
  country?: string;
  parentLocationId?: string;
  // --- FE global.d.ts fields (additive) ---
  description?: string;
  division?: string;
  district?: string;
  city?: string;
  island?: string;
  countryside?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  createdAt?: Date | string;
  parentLocation?: Location;
  childLocations?: Location[];
  _count?: {
    tourPackages?: number;
    tourSpots?: number;
    activitySpots?: number;
    hotels?: number;
  };
}
