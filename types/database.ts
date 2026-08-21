export type UserRole = 'customer' | 'staff';
export type ComandaStatus = 'aberta' | 'cancelada' | 'finalizada';

export type Profile = {
  id: string;
  name: string;
  role: UserRole;
  restaurant_id: string | null;
  created_at: string;
};

export type Restaurant = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  created_at: string;
};

export type RestaurantWithDistance = Restaurant & {
  distanceKm: number | null;
};

export type Product = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  active: boolean;
};

export type Comanda = {
  id: string;
  restaurant_id: string;
  customer_id: string | null;
  opened_by: string | null;
  table_label: string;
  status: ComandaStatus;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type ComandaItem = {
  id: string;
  comanda_id: string;
  product_id: string | null;
  name: string;
  price: number;
  qty: number;
  notes: string | null;
  created_at: string;
};

export type ComandaWithItems = Comanda & {
  items: ComandaItem[];
  restaurant?: Pick<Restaurant, 'name' | 'address' | 'lat' | 'lng'> | null;
};
