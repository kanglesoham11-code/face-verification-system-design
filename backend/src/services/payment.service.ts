import { env } from '../config/env.js';

export interface PaymentResult {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
  data?: any;
}

export class PaymentService {
  /**
   * Check if payments are enabled
   */
  private checkPaymentsEnabled(): PaymentResult {
    if (!env.ENABLE_PAYMENTS) {
      return {
        success: false,
        error: {
          code: 'PAYMENTS_DISABLED',
          message: 'Payment functionality is currently disabled. This is a free-tier deployment.',
        },
      };
    }
    return { success: true };
  }

  /**
   * Create payment intent (disabled)
   */
  async createPaymentIntent(amount: number, currency: string = 'INR'): Promise<PaymentResult> {
    const enabledCheck = this.checkPaymentsEnabled();
    if (!enabledCheck.success) {
      return enabledCheck;
    }

    // In a real implementation, this would integrate with Stripe/Razorpay
    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Payment integration not implemented in free tier',
      },
    };
  }

  /**
   * Process refund (disabled)
   */
  async processRefund(paymentId: string, amount?: number): Promise<PaymentResult> {
    const enabledCheck = this.checkPaymentsEnabled();
    if (!enabledCheck.success) {
      return enabledCheck;
    }

    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Refund processing not implemented in free tier',
      },
    };
  }

  /**
   * Verify payment (disabled)
   */
  async verifyPayment(paymentId: string): Promise<PaymentResult> {
    const enabledCheck = this.checkPaymentsEnabled();
    if (!enabledCheck.success) {
      return enabledCheck;
    }

    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Payment verification not implemented in free tier',
      },
    };
  }

  /**
   * Create subscription (disabled)
   */
  async createSubscription(customerId: string, priceId: string): Promise<PaymentResult> {
    const enabledCheck = this.checkPaymentsEnabled();
    if (!enabledCheck.success) {
      return enabledCheck;
    }

    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Subscription management not implemented in free tier',
      },
    };
  }

  /**
   * Cancel subscription (disabled)
   */
  async cancelSubscription(subscriptionId: string): Promise<PaymentResult> {
    const enabledCheck = this.checkPaymentsEnabled();
    if (!enabledCheck.success) {
      return enabledCheck;
    }

    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Subscription management not implemented in free tier',
      },
    };
  }

  /**
   * Get payment status
   */
  getPaymentStatus(): {
    enabled: boolean;
    provider: string;
    message: string;
  } {
    return {
      enabled: env.ENABLE_PAYMENTS,
      provider: env.ENABLE_PAYMENTS ? 'Stripe/Razorpay' : 'None',
      message: env.ENABLE_PAYMENTS 
        ? 'Payment processing is enabled' 
        : 'Payment processing is disabled for free tier deployment',
    };
  }

  /**
   * Mock payment for testing (when payments are disabled)
   */
  async mockPayment(amount: number, currency: string = 'INR'): Promise<PaymentResult> {
    // Always allow mock payments for testing
    return {
      success: true,
      data: {
        paymentId: `mock_${Date.now()}`,
        amount,
        currency,
        status: 'succeeded',
        created: new Date().toISOString(),
      },
    };
  }
}

export const paymentService = new PaymentService();