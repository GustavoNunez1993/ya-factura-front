export interface UserLocation {
  lat: number;
  lng: number;
}

export interface UserProfile {
  email: string;
  address: string;
  phone: string;
  location?: UserLocation;
}
