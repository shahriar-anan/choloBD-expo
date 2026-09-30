export type HomePromoId = 'wallet' | 'stays' | 'qr' | 'community';

export interface HomePromo {
  id: HomePromoId;
  route: string;
  imageUri: string;
}

export const HOME_PROMOS: HomePromo[] = [
  {
    id: 'wallet',
    route: '/(tabs)/dashboard',
    imageUri: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&h=500&fit=crop',
  },
  {
    id: 'stays',
    route: '/(tabs)/explore/hotel-search?fromHome=true',
    imageUri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&h=500&fit=crop',
  },
  {
    id: 'qr',
    route: '/(tabs)/dashboard',
    imageUri: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=900&h=500&fit=crop',
  },
  {
    id: 'community',
    route: '/(tabs)/community',
    imageUri: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&h=500&fit=crop',
  },
];

export interface HomeDistrict {
  id: string;
  matchNames: string[];
  nameKey: 'coxsBazar' | 'rangamati' | 'bandarban' | 'sylhet' | 'khulna';
  imageUri: string;
}

export const HOME_DISTRICTS: HomeDistrict[] = [
  {
    id: 'coxs-bazar',
    matchNames: ["cox's bazar", 'coxs bazar', 'cox bazar', 'কক্সবাজার'],
    nameKey: 'coxsBazar',
    imageUri: 'https://images.unsplash.com/photo-1728408988528-889ea70c4400?w=800&h=1000&fit=crop',
  },
  {
    id: 'rangamati',
    matchNames: ['rangamati', 'রাঙ্গামাটি'],
    nameKey: 'rangamati',
    imageUri: 'https://images.unsplash.com/photo-1712047005091-ef7378664ff2?w=800&h=1000&fit=crop',
  },
  {
    id: 'bandarban',
    matchNames: ['bandarban', 'বান্দরবান'],
    nameKey: 'bandarban',
    imageUri: 'https://images.unsplash.com/photo-1624485871361-65454b13edfa?w=800&h=1000&fit=crop',
  },
  {
    id: 'sylhet',
    matchNames: ['sylhet', 'সিলেট'],
    nameKey: 'sylhet',
    imageUri: 'https://images.unsplash.com/photo-1685462648479-304aa2db80ae?w=800&h=1000&fit=crop',
  },
  {
    id: 'khulna',
    matchNames: ['khulna', 'খুলনা', 'bagerhat'],
    nameKey: 'khulna',
    imageUri: 'https://images.unsplash.com/photo-1549300461-11c5b94e8855?w=800&h=1000&fit=crop',
  },
];
