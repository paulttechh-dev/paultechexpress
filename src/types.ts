export type UserRole = 'client' | 'motoboy' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  created_at?: string;
}

export type OrderStatus = 
  | 'waiting' 
  | 'accepted' 
  | 'on_route' 
  | 'collected' 
  | 'in_maintenance' 
  | 'delivered' 
  | 'cancelled';

export interface Order {
  id: string;
  client_id: string;
  client_name: string;
  motoboy_id?: string;
  motoboy_name?: string;
  address: string;
  problem: string;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category?: string;
  stock?: number;
  created_at: string;
}
