# Subscription Management - Upgrade & Downgrade Flow

## Overview

This document describes the complete subscription management system, including the upgrade and downgrade flow implemented for Life OS.

## Architecture

### Components

1. **UI Layer**
   - `app/(back-office)/my/settings/subscription/page.tsx` - Subscription settings page
   - `components/big/pricing/pricing_card.tsx` - Displays plan details and action buttons
   - `components/big/pricing/subscription_action_button.tsx` - Handles plan changes

2. **API Layer**
   - `/api/stripe/create-checkout-session` - Creates new subscriptions for users without active plans
   - `/api/stripe/change-subscription` - Handles plan upgrades and downgrades
   - `/api/stripe/cancel-subscription` - Cancels subscriptions (downgrade to free)
   - `/api/stripe/webhook` - Processes Stripe webhook events

3. **Database Layer**
   - `lib/db/queries/user/subscription.ts` - Database queries for subscriptions
   - `lib/db/schema/user/subscription.ts` - Subscription table schema

## User Flows

### 1. New Subscription (No Active Plan)

```
User visits subscription page
    → Sees "Get Started" button on paid plans
    → Clicks button
    → Server action calls createCheckoutSession
    → Redirects to Stripe Checkout
    → User completes payment
    → Stripe redirects back with session_id
    → Webhook receives checkout.session.completed
    → Creates subscription record in database
```

### 2. Upgrade to Higher Plan

```
User with Basic plan visits subscription page
    → Sees "Change to Pro" button
    → Clicks button
    → Client calls /api/stripe/change-subscription
    → Server validates authentication
    → Server updates subscription in Stripe
    → Stripe applies proration (charges difference)
    → Server updates database
    → Webhook receives customer.subscription.updated
    → User sees success message
    → Page refreshes to show new plan
```

### 3. Downgrade to Lower Paid Plan

```
User with Pro plan visits subscription page
    → Sees "Change to Basic" button
    → Clicks button
    → Client calls /api/stripe/change-subscription
    → Server validates authentication
    → Server updates subscription in Stripe
    → Stripe applies proration (refunds difference)
    → Server updates database
    → Webhook receives customer.subscription.updated
    → User sees success message
    → Page refreshes to show new plan
```

### 4. Downgrade to Free Plan

```
User with paid plan visits subscription page
    → Sees "Cancel Subscription" button on Free plan
    → Clicks button
    → Client calls /api/stripe/cancel-subscription
    → Server marks subscription for cancellation at period end
    → Server updates database with cancel_at_period_end = true
    → User keeps access until end of billing period
    → At period end, webhook receives customer.subscription.deleted
    → Server marks subscription as canceled
```

## API Endpoints

### POST /api/stripe/change-subscription

**Purpose:** Handle subscription plan changes (upgrades and downgrades)

**Request:**
```json
{
    "priceId": "price_xxx"
}
```

**Headers:**
```
Authorization: Bearer {user_api_key}
Content-Type: application/json
```

**Response Success (200):**
```json
{
    "message": "Subscription updated successfully",
    "subscription": { /* Stripe subscription object */ }
}
```

**Response Error (400):**
```json
{
    "error": "You are already subscribed to this plan"
}
```

**Response Error (404):**
```json
{
    "error": "No active subscription found"
}
```

### POST /api/stripe/cancel-subscription

**Purpose:** Cancel subscription at period end (downgrade to free)

**Headers:**
```
Authorization: Bearer {user_api_key}
```

**Response Success (200):**
```json
{
    "message": "Subscription will be cancelled at the end of the current period"
}
```

## Database Schema

```sql
CREATE TABLE user_subscription (
    id SERIAL PRIMARY KEY,
    user_id CHAR(8) REFERENCES user(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) NOT NULL,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_product_id VARCHAR(255) NOT NULL,
    stripe_price_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    canceled_at TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Stripe Webhook Events

The system handles the following Stripe webhook events:

1. **checkout.session.completed**
   - Creates new subscription record
   - Updates user's stripe_customer_id

2. **customer.subscription.updated**
   - Updates subscription status, product, and price
   - Syncs cancel_at_period_end flag

3. **customer.subscription.deleted**
   - Marks subscription as canceled
   - Sets canceled_at timestamp

4. **invoice.payment_succeeded**
   - Confirms subscription renewal
   - Updates subscription record

## Plan Configuration

Plans are defined in `app/(back-office)/my/settings/subscription/plans.ts`:

- **Free**: No payment required, basic features
- **Basic**: Paid plan with additional features
- **Pro**: Premium features (coming soon)

Each plan includes:
- Display name and description
- Stripe product ID
- Monthly and yearly price IDs
- List of enabled features

## Proration

When changing plans, Stripe automatically handles proration:

- **Upgrade:** User is charged the difference immediately
- **Downgrade:** User receives a credit applied to next invoice
- Configured with `proration_behavior: 'create_prorations'`

## Security

- All API endpoints require authentication via API key
- API keys are passed in Authorization header
- Webhook endpoints validate Stripe signature
- User can only modify their own subscription

## Error Handling

The system includes comprehensive error handling:

1. **Client-side:**
   - Loading states during API calls
   - Success/error toast notifications
   - Automatic page refresh on success

2. **Server-side:**
   - Input validation
   - Authentication checks
   - Stripe API error handling
   - Database error handling

## Testing Checklist

To test the subscription flow:

- [ ] New user can subscribe to Basic plan
- [ ] User with Basic plan can upgrade to Pro
- [ ] User with Pro plan can downgrade to Basic
- [ ] User with paid plan can cancel (downgrade to Free)
- [ ] Canceled subscription maintains access until period end
- [ ] Proration works correctly for upgrades and downgrades
- [ ] Webhook events update database correctly
- [ ] User cannot change to their current plan
- [ ] Error messages display correctly

## Future Improvements

1. Add confirmation dialog for plan changes
2. Show proration preview before confirming change
3. Display subscription history
4. Add ability to reactivate canceled subscriptions
5. Support for promotional codes
6. Annual subscription discounts
7. Add tests for subscription flow
