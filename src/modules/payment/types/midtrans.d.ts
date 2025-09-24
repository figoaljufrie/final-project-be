declare module 'midtrans-node' {
    export interface SnapConfig {
      isProduction: boolean;
      serverKey: string;
      clientKey: string;
    }
  
    export interface CoreApiConfig {
      isProduction: boolean;
      serverKey: string;
    }
  
    export interface TransactionDetails {
      order_id: string;
      gross_amount: number;
    }
  
    export interface CustomerDetails {
      email: string;
      first_name: string;
    }
  
    export interface ItemDetails {
      id: string;
      price: number;
      quantity: number;
      name: string;
    }
  
    export interface Callbacks {
      finish: string;
      pending: string;
      error: string;
    }
  
    export interface PaymentParameter {
      transaction_details: TransactionDetails;
      customer_details: CustomerDetails;
      item_details: ItemDetails[];
      callbacks: Callbacks;
    }
  
    export interface TransactionResponse {
      token: string;
      redirect_url: string;
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
  
    export class Snap {
      constructor(config: SnapConfig);
      createTransaction(parameter: PaymentParameter): Promise<TransactionResponse>;
    }
  
    export class CoreApi {
      constructor(config: CoreApiConfig);
      transaction: {
        status(orderId: string): Promise<PaymentStatusResponse>;
      };
    }
  
    const midtransClient: {
      Snap: typeof Snap;
      CoreApi: typeof CoreApi;
    };
  
    export default midtransClient;
  }
