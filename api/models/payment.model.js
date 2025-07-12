//api/models/payment.model.js

import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true, // Amount in cents
    },
    currency: {
      type: String,
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'canceled'],
      default: 'pending',
    },
    paymentType: {
      type: String,
      enum: ['one_time', 'subscription', 'listing_fee'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    platformFee: {
      type: Number,
      default: 0, // Platform fee in cents
    },
    serviceProviderAmount: {
      type: Number,
      default: 0, // Amount going to service provider in cents
    },
    metadata: {
      listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
      },
      subscriptionType: String,
      additionalListings: Number,
    },
  },
  { timestamps: true }
)

const Payment = mongoose.model('Payment', paymentSchema)
export default Payment
