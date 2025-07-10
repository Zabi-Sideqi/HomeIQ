import mongoose from 'mongoose'
import Listing from './models/listing.model.js'
import dotenv from 'dotenv'

dotenv.config()

const updateLondonListing = async () => {
  try {
    await mongoose.connect(process.env.Mongo)
    console.log('Connected to MongoDB')

    // Update the London listing with coordinates
    const result = await Listing.updateOne(
      { address: '10 Downing Street City:' },
      {
        $set: {
          'location.coordinates.lat': 51.5074,
          'location.coordinates.lng': -0.1278,
          'location.city': 'London',
          'location.postcode': 'SW1A 2AA',
        },
      }
    )

    console.log('Update result:', result)

    // Verify the update
    const updatedListing = await Listing.findOne({
      address: '10 Downing Street City:',
    })
    console.log(
      'Updated listing coordinates:',
      updatedListing.location.coordinates
    )

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

updateLondonListing()
