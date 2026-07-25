export interface RentalOrder {
  id: number;
  createdAt: string;
  productId: number | null;
  productName: string;
  productImage: string;
  rentDate: string;
  returnDate: string;
  customerName: string;
  customerPhone: string;
  alternatePhone: string;
  idProofType: string;
  idProofImage: string;
  idProofUrl: string;
  rentalAmount: number;
  advanceAmount: number;
  notes: string;
  status: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentStatus: string;
  paymentAmount: number;
  trackingToken: string;
  statusHistory: Record<string, string>;
}