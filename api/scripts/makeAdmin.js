//api/scripts/makeAdmin.js

import mongoose from 'mongoose'
import User from '../models/user.model.js'
import dotenv from 'dotenv'

dotenv.config()

const makeUserAdmin = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.Mongo)
    console.log('Connected to MongoDB')

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      console.error(`User with email ${email} not found`)
      process.exit(1)
    }

    // Update user role to admin
    user.role = 'admin'
    await user.save()

    console.log(`✅ User ${user.username} (${user.email}) is now an admin!`)
    console.log(`User ID: ${user._id}`)

    // Disconnect from MongoDB
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
    process.exit(0)
  } catch (error) {
    console.error('Error making user admin:', error)
    process.exit(1)
  }
}

// Get email from command line argument
const email = process.argv[2]
if (!email) {
  console.error('Please provide an email address')
  console.log('Usage: node makeAdmin.js <email>')
  process.exit(1)
}

makeUserAdmin(email)
