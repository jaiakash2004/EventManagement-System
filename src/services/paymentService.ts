import axios from 'axios';

const BANK_API_URL = 'http://localhost:8081';

export interface BankPaymentRequest {
  fromAccountNumber: string;
  toAccountNumber: number;
  amount: number;
  remarks: string;
}

export const paymentService = {
  processBankPayment: async (paymentData: BankPaymentRequest): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axios.post<string>(
        `${BANK_API_URL}/transaction/transferByAccount`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          responseType: 'text',
        }
      );

      if (response.data === 'Transaction Successful') {
        return {
          success: true,
          message: response.data || 'Bank payment processed successfully',
        };
      } else {
        return {
          success: false,
          message: response.data || 'Bank payment failed',
        };
      }
    } catch (error: any) {
      console.error('External Bank API error:', error);
      return {
        success: false,
        message:
          error?.response?.data?.message ||
          'Bank payment processing failed. Please try again.',
      };
    }
  },
};

