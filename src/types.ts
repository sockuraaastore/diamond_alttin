export interface UserSession {
  username: string;
  role: 'user' | 'admin';
  isLoggedIn: boolean;
}

export interface Category {
  id: string;
  name: string;
  createdAt: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  price: number;
  stock: number;
  imageUrl: string;
  createdAt: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  username: string;
  phone: string;
  address: string;
  postalCode: string;
  receiptUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  deliveryInfo?: string;
  rejectReason?: string;
  items: OrderItem[];
  createdAt: number;
}

export interface Ticket {
  id: string;
  userId: string;
  username: string;
  subject: string;
  message: string;
  reply?: string;
  status: 'pending' | 'replied';
  createdAt: number;
}

export interface Banner {
  id: string;
  imageUrl: string;
  createdAt: number;
}

export interface Comment {
  id: string;
  productId: string;
  username: string;
  text: string;
  createdAt: number;
}
