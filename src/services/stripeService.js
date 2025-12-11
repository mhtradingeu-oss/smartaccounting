const { User, Company } = require('../models');

// Initialize Stripe only if secret key is available
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const logger = require('../lib/logger');

// Pricing plans configuration
const PRICING_PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic Plan',
    price: 19,
    currency: 'eur',
    interval: 'month',
    features: [
      'Up to 100 invoices/month',
      'Basic tax reports',
      'Email support',
      '1 user account'
    ],
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic_monthly'
  },
  pro: {
    id: 'pro',
    name: 'Professional Plan',
    price: 49,
    currency: 'eur',
    interval: 'month',
    features: [
      'Up to 1000 invoices/month',
      'Advanced tax reports',
      'ELSTER integration',
      'OCR processing',
      'Up to 5 users',
      'Priority support'
    ],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 99,
    currency: 'eur',
    interval: 'month',
    features: [
      'Unlimited invoices',
      'Custom tax reports',
      'API access',
      'White-label options',
      'Unlimited users',
      'Dedicated support'
    ],
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly'
  }
};

class StripeService {
  // Validate Stripe is configured
  static validateStripeConfig() {
    if (!stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
  }

  // Create Stripe customer for new company
  static async createCustomer(company, adminUser) {
    this.validateStripeConfig();
    try {
      const customer = await stripe.customers.create({
        email: adminUser.email,
        name: `${adminUser.firstName} ${adminUser.lastName}`,
        description: `Customer for ${company.name}`,
        metadata: {
          companyId: company.id,
          userId: adminUser.id,
          companyName: company.name,
          taxNumber: company.taxNumber
        },
        address: {
          line1: company.address.street + ' ' + company.address.houseNumber,
          city: company.address.city,
          postal_code: company.address.zipCode,
          country: 'DE'
        }
      });

      // Update company with Stripe customer ID
      await company.update({
        settings: {
          ...company.settings,
          stripeCustomerId: customer.id
        }
      });

      return customer;
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  // Create subscription
  static async createSubscription(companyId, planId, userId) {
    this.validateStripeConfig();
    try {
      const company = await Company.findByPk(companyId);
      const user = await User.findByPk(userId);

      if (!company || !user) {
        throw new Error('Company or user not found');
      }

      const plan = PRICING_PLANS[planId];
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      let customerId = company.settings?.stripeCustomerId;

      // Create customer if doesn't exist
      if (!customerId) {
        const customer = await this.createCustomer(company, user);
        customerId = customer.id;
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan.stripePriceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          companyId: company.id,
          planId: planId,
          userId: userId
        }
      });

      // Update company with subscription info
      await company.update({
        settings: {
          ...company.settings,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          subscriptionPlan: planId,
          subscriptionStatus: subscription.status
        }
      });

      return {
        subscription,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
      };
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  // Get subscription status
  static async getSubscriptionStatus(companyId) {
    this.validateStripeConfig();
    try {
      const company = await Company.findByPk(companyId);

      if (!company?.settings?.stripeSubscriptionId) {
        return {
          status: 'none',
          plan: null,
          currentPeriodEnd: null
        };
      }

      const subscription = await stripe.subscriptions.retrieve(company.settings.stripeSubscriptionId);

      return {
        status: subscription.status,
        plan: company.settings.subscriptionPlan,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        subscription
      };
    } catch (error) {
      logger.error('Error getting subscription status:', error);
      throw new Error('Failed to get subscription status');
    }
  }

  // Cancel subscription
  static async cancelSubscription(companyId) {
    this.validateStripeConfig();
    try {
      const company = await Company.findByPk(companyId);

      if (!company?.settings?.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      const subscription = await stripe.subscriptions.update(
        company.settings.stripeSubscriptionId,
        { cancel_at_period_end: true }
      );

      await company.update({
        settings: {
          ...company.settings,
          subscriptionStatus: subscription.status
        }
      });

      return subscription;
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  // Get billing history
  static async getBillingHistory(companyId) {
    this.validateStripeConfig();
    try {
      const company = await Company.findByPk(companyId);

      if (!company?.settings?.stripeCustomerId) {
        return [];
      }

      const invoices = await stripe.invoices.list({
        customer: company.settings.stripeCustomerId,
        limit: 50,
        expand: ['data.payment_intent']
      });

      return invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        status: invoice.status,
        created: new Date(invoice.created * 1000),
        paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
        invoiceUrl: invoice.hosted_invoice_url,
        pdfUrl: invoice.invoice_pdf
      }));
    } catch (error) {
      logger.error('Error getting billing history:', error);
      throw new Error('Failed to get billing history');
    }
  }

  // Handle webhook events
  static async handleWebhook(event) {
    try {
      logger.info(`Processing Stripe webhook: ${event.type}`);

      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'customer.created':
          await this.handleCustomerCreated(event.data.object);
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      logger.error(`Error handling webhook ${event.type}:`, error);
      throw error;
    }
  }

  static async handleSubscriptionCreated(subscription) {
    const companyId = subscription.metadata.companyId;
    if (!companyId) {
      logger.warn('No company ID in subscription metadata');
      return;
    }

    const company = await Company.findByPk(companyId);
    if (!company) {
      logger.warn(`Company ${companyId} not found for subscription creation`);
      return;
    }

    await company.update({
      settings: {
        ...company.settings,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionPlan: subscription.metadata.planId,
        subscriptionStartDate: new Date(subscription.created * 1000)
      }
    });

    logger.info(`Subscription ${subscription.id} created for company ${companyId}`);
  }

  static async handleSubscriptionUpdate(subscription) {
    const companyId = subscription.metadata.companyId;
    if (!companyId) {
      logger.warn('No company ID in subscription metadata');
      return;
    }

    const company = await Company.findByPk(companyId);
    if (!company) {
      logger.warn(`Company ${companyId} not found for subscription update`);
      return;
    }

    await company.update({
      settings: {
        ...company.settings,
        subscriptionStatus: subscription.status,
        subscriptionPlan: subscription.metadata.planId,
        subscriptionUpdatedDate: new Date()
      }
    });

    logger.info(`Subscription ${subscription.id} updated for company ${companyId}: ${subscription.status}`);
  }

  static async handleSubscriptionDeleted(subscription) {
    const companyId = subscription.metadata.companyId;
    if (!companyId) {
      logger.warn('No company ID in subscription metadata');
      return;
    }

    const company = await Company.findByPk(companyId);
    if (!company) {
      logger.warn(`Company ${companyId} not found for subscription deletion`);
      return;
    }

    await company.update({
      settings: {
        ...company.settings,
        subscriptionStatus: 'cancelled',
        subscriptionCancelledDate: new Date()
      }
    });

    logger.info(`Subscription ${subscription.id} deleted for company ${companyId}`);
  }

  static async handlePaymentSucceeded(invoice) {
    const companyId = invoice.subscription?.metadata?.companyId || 
                    invoice.metadata?.companyId;

    if (!companyId) {
      logger.warn('No company ID in invoice metadata');
      return;
    }

    const company = await Company.findByPk(companyId);
    if (!company) {
      logger.warn(`Company ${companyId} not found for payment success`);
      return;
    }

    // Update last payment date
    await company.update({
      settings: {
        ...company.settings,
        lastPaymentDate: new Date(invoice.status_transitions.paid_at * 1000),
        lastPaymentAmount: invoice.amount_paid / 100
      }
    });

    logger.info(`Payment succeeded for company ${companyId}: €${invoice.amount_paid / 100}`);
  }

  static async handlePaymentFailed(invoice) {
    const companyId = invoice.subscription?.metadata?.companyId || 
                    invoice.metadata?.companyId;

    if (!companyId) {
      logger.warn('No company ID in invoice metadata');
      return;
    }

    const company = await Company.findByPk(companyId);
    if (!company) {
      logger.warn(`Company ${companyId} not found for payment failure`);
      return;
    }

    // Update failed payment info
    await company.update({
      settings: {
        ...company.settings,
        lastFailedPaymentDate: new Date(),
        paymentFailureCount: (company.settings.paymentFailureCount || 0) + 1
      }
    });

    logger.info(`Payment failed for company ${companyId}`);
  }

  static async handleCustomerCreated(customer) {
    const companyId = customer.metadata.companyId;
    if (!companyId) {
      logger.warn('No company ID in customer metadata');
      return;
    }

    const company = await Company.findByPk(companyId);
    if (!company) {
      logger.warn(`Company ${companyId} not found for customer creation`);
      return;
    }

    logger.info(`Customer ${customer.id} created for company ${companyId}`);
  }

  static async handlePaymentIntentSucceeded(paymentIntent) {
    const companyId = paymentIntent.metadata.companyId;
    if (!companyId) {
      logger.warn('No company ID in payment intent metadata');
      return;
    }

    logger.info(`Payment intent ${paymentIntent.id} succeeded for company ${companyId}`);
  }

  static async handlePaymentIntentFailed(paymentIntent) {
    const companyId = paymentIntent.metadata.companyId;
    if (!companyId) {
      logger.warn('No company ID in payment intent metadata');
      return;
    }

    logger.info(`Payment intent ${paymentIntent.id} failed for company ${companyId}`);
  }

  // Test payment intent for validation
  static async createTestPayment(amount, currency = 'eur', simulate = 'success') {
    this.validateStripeConfig();
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        metadata: {
          test: true,
          simulate: simulate
        }
      });

      if (simulate === 'failure') {
        // Simulate failure by using a test card that will fail
        throw new Error('Simulated payment failure');
      }

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: currency,
        clientSecret: paymentIntent.client_secret
      };
    } catch (error) {
      if (simulate === 'failure') {
        return {
          success: false,
          error: 'Simulated payment failure',
          code: 'card_declined'
        };
      }
      throw error;
    }
  }

  // Check Stripe configuration
  static isConfigured() {
    return !!process.env.STRIPE_SECRET_KEY;
  }

  // Get health status
  static async getHealthStatus() {
    try {
      this.validateStripeConfig();
      return {
        configured: true,
        connected: true,
        mode: process.env.NODE_ENV === 'production' ? 'live' : 'test'
      };
    } catch (error) {
      return {
        configured: false,
        connected: false,
        error: error.message
      };
    }
  }

  // Get all pricing plans
  static getPricingPlans() {
    return PRICING_PLANS;
  }
}

module.exports = StripeService;