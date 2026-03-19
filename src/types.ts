export type UserRole = 'client' | 'motoboy' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: any;
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
  clientId: string;
  clientName: string;
  motoboyId?: string;
  motoboyName?: string;
  address: string;
  problem: string;
  status: OrderStatus;
  createdAt: any;
  updatedAt?: any;
}
