import mongoose from 'mongoose'

const MONGO_URI =
  'mongodb+srv://zabisideqi:Homeiq@cluster0.cixia2x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

const updateLondon = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')

    const db = mongoose.connection.db
    const result = await db.collection('listings').updateOne(
      { address: '10 Downing Street City:' },
      {
        $set: {
          'location.coordinates.lat': 51.5074,
          'location.coordinates.lng': -0.1278,
        },
      }
    )

    console.log('London listing updated:', result.modifiedCount)
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

updateLondon()
