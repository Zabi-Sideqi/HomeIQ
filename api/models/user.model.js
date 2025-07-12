//api/models/user.model.js
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
      },
    ],
    avatar: {
      type: String,
      default:
        'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    // Premium subscription fields
    subscription: {
      type: String,
      enum: ['free', 'premium', 'pro'],
      default: 'free',
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeConnectAccountId: {
      type: String,
      default: null, // For service providers who receive payments
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'inactive', 'canceled', 'past_due'],
      default: 'inactive',
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    subscriptionEndDate: {
      type: Date,
      default: null,
    },
    paymentMethodId: {
      type: String,
      default: null,
    },
    listingLimit: {
      type: Number,
      default: 1, // Free users get 1 listing
    },
    listingsCreated: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

const User = mongoose.model('User', userSchema)
export default User
