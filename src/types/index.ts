export interface FoodCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  foodItems?: FoodItem[];
}

export interface Vendor {
  id: string;
  businessName: string;
  description?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  isOpen: boolean;
  avgPrepTimeMins: number;
  deliveryZone?: DeliveryZone | null;
}

export interface DeliveryZone {
  id: string;
  name: string;
  isFreeDelivery: boolean;
  deliveryFee: number;
  minOrderValue: number;
}

export interface FoodVariation {
  id: string;
  name: string;
  priceDelta: number;
  isRequired: boolean;
  groupName: string;
}

export interface FoodItem {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: number;
  isAvailable: boolean;
  isTodaysMenu: boolean;
  prepTimeMins: number;
  vendor?: { id: string; businessName: string; logoUrl?: string | null; isOpen?: boolean };
  category?: { id: string; name: string; slug: string };
  variations: FoodVariation[];
}

export interface CartItemVariation {
  foodVariation: FoodVariation;
}

export interface CartItem {
  id: string;
  quantity: number;
  notes?: string | null;
  foodItem: FoodItem;
  variations: CartItemVariation[];
}

export interface Cart {
  id: string;
  items: CartItem[];
}

export interface Address {
  id: string;
  label: string;
  building?: string | null;
  street?: string | null;
  area?: string | null;
  city: string;
  landmark?: string | null;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PLACED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "ASSIGNED"
  | "PICKED_UP"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED"
  | "EXPIRED";

export interface OrderItem {
  id: string;
  nameSnapshot: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  discountTotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  vendor: { businessName: string; logoUrl?: string | null };
  items: OrderItem[];
  address?: Address | null;
  delivery?: { status: string; rider?: { user: { fullName: string; phone: string } } | null } | null;
}

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  role: "CUSTOMER" | "VENDOR" | "RIDER" | "ADMIN";
}
