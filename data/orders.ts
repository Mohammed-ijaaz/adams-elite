export interface OrderItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
  gstPercent?: number;
  stockQuantity?: number;
}

export interface Order {
  id: number;
  createdAt: string;
  completedAt: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes: string;
  items: OrderItem[];
  total: number;
  status: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentStatus: string;
  paymentAmount: number;
  trackingToken: string;
  statusHistory: Record<string, string>;
}