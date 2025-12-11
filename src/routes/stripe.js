const logger = require('../lib/logger');
const express = require('express');
const StripeService = require('../services/stripeService');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { Company, User } = require('../models');

const router = express.Router();

const checkStripeConfig = (req, res, next) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ 
      error: 'Stripe not configured',
      message: 'Billing features are currently unavailable' 
    });
  }
  next();
};

router.get('/health', (req, res) => {
  res.json({ 
    status: 'available',
    configured: !!process.env.STRIPE_SECRET_KEY,
    timestamp: new Date().toISOString()
  });
});

router.get('/subscription', authenticateToken, checkStripeConfig, async (req, res) => {
  try {
    const company = await Company.findByPk(req.user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const subscriptionStatus = await StripeService.getSubscriptionStatus(company.id);
    res.json(subscriptionStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

router.post('/create-subscription', authenticateToken, checkStripeConfig, async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    const company = await Company.findByPk(req.user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const result = await StripeService.createSubscription(company.id, planId, req.user.id);

    res.json({
      success: true,
      subscription: result.subscription,
      clientSecret: result.clientSecret,
      message: 'Subscription created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create subscription' });
  }
});

router.post('/cancel-subscription', authenticateToken, checkStripeConfig, async (req, res) => {
  try {
    const company = await Company.findByPk(req.user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const subscription = await StripeService.cancelSubscription(company.id);

    res.json({
      success: true,
      subscription,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
});

router.get('/billing-history', authenticateToken, checkStripeConfig, async (req, res) => {
  try {
    const company = await Company.findByPk(req.user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const history = await StripeService.getBillingHistory(company.id);

    res.json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get billing history' });
  }
});

router.get('/plans', async (req, res) => {
  try {
    const plans = StripeService.getPricingPlans();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pricing plans' });
  }
});

router.post('/create-customer', authenticateToken, checkStripeConfig, async (req, res) => {
  try {
    const company = await Company.findByPk(req.user.companyId);
    const user = await User.findByPk(req.user.id);

    if (!company || !user) {
      return res.status(404).json({ error: 'Company or user not found' });
    }

    if (company.settings?.stripeCustomerId) {
      return res.json({
        success: true,
        customerId: company.settings.stripeCustomerId,
        message: 'Customer already exists'
      });
    }

    const customer = await StripeService.createCustomer(company, user);

    res.json({
      success: true,
      customerId: customer.id,
      message: 'Customer created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create customer' });
  }
});

    const customer = await StripeService.createCustomer(req.company, req.user);
    res.json({
      message: 'Customer created successfully',
      customerId: customer.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.post('/create-subscription', authenticateToken, checkStripeConfig, async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    const result = await StripeService.createSubscription(req.company.id, planId, req.user.id);

    res.json({
      message: 'Subscription created successfully',
      subscriptionId: result.subscription.id,
      clientSecret: result.clientSecret
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

router.get('/subscription-status', authenticateToken, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.json({
        status: 'none',
        plan: null,
        currentPeriodEnd: null,
        message: 'Stripe not configured'
      });
    }

    const status = await StripeService.getSubscriptionStatus(req.company.id);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

router.post('/cancel-subscription', authenticateToken, checkStripeConfig, async (req, res) => {
  try {
    const subscription = await StripeService.cancelSubscription(req.company.id);
    res.json({
      message: 'Subscription cancelled successfully',
      subscription
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

router.get('/billing-history', authenticateToken, checkStripeConfig, async (req, res) => {
  try {
    const invoices = await StripeService.getBillingHistory(req.company.id);
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get billing history' });
  }
});

router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { amount, currency = 'eur', description } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, 
      currency,
      description,
      metadata: {
        companyId: req.company.id,
        userId: req.user.id
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      
      event = JSON.parse(req.body);
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await StripeService.handleWebhook(event);
    res.json({ 
      received: true, 
      eventType: event.type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Webhook handler failed',
      eventType: event.type 
    });
  }
});

router.post('/test-payment', authenticateToken, checkStripeConfig, async (req, res) => {
  try {
    const { amount = 1000, currency = 'eur' } = req.body;

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description: 'SmartAccounting Test Payment',
      metadata: {
        companyId: req.user.companyId,
        userId: req.user.id,
        testPayment: true
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create test payment' });
  }
});

router.post('/test-payment', authenticateToken, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { amount, currency = 'eur', description } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency,
      description: description || 'Test payment',
      metadata: {
        companyId: req.company.id,
        userId: req.user.id,
        test: true
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create test payment' });
  }
});

router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const subscription = await StripeService.cancelSubscription(req.company.id);
    res.json({
      success: true,
      subscription,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/create-customer', authenticateToken, async (req, res) => {
  try {
    const customer = await StripeService.createCustomer(req.company, req.user);
    res.json({
      success: true,
      customerId: customer.id,
      message: 'Customer created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/billing-history', authMiddleware, async (req, res) => {
  try {
    const billingHistory = await StripeService.getBillingHistory(req.user.companyId);
    res.json(billingHistory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get billing history' });
  }
});

router.post('/test-payment', authMiddleware, async (req, res) => {
  try {
    const { amount, currency = 'eur', simulate = 'success' } = req.body;

    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Amount must be at least 50 cents' });
    }

    const result = await StripeService.createTestPayment(amount, currency, simulate);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create test payment' });
  }
});

router.get('/health', async (req, res) => {
  try {
    const healthStatus = await StripeService.getHealthStatus();
    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check Stripe health' });
  }
});

module.exports = router;