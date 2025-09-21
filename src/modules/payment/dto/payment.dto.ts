export interface MidtransPaymentRequest {
  bookingId: number;
  bookingNo: string;
  totalAmount: number;
  userEmail: string;
  userName: string;
}

export interface MidtransPaymentResponse {
  token: string;
  redirectUrl: string;
  orderId: string;
}

export interface PaymentStatusResponse {
  transaction_status: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  settlement_time?: string;
  fraud_status: string;
}

export interface MidtransWebhookData {
  order_id: string;
  transaction_status: string;
  payment_type: string;
  transaction_time: string;
  settlement_time?: string;
  gross_amount: string;
  fraud_status: string;
  status_code: string;
  status_message: string;
}
