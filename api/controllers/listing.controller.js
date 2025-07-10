//api/controllers/listing.controller.js

import Listing from '../models/listing.model.js'
import { errorHandler } from '../utils/error.js'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

export const createListing = async (req, res, next) => {
  try {
    const existingListing = await Listing.findOne({ address: req.body.address })
    if (existingListing) {
      return res.status(400).json({
        success: false,
        message: 'A listing with this address already exists.',
      })
    }

    const listing = await Listing.create(req.body)
    return res.status(201).json(listing)
  } catch (error) {
    next(error)
  }
}

export const deleteListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id)
  if (!listing) {
    return next(errorHandler(404, 'Listing not found'))
  }

  if (listing.userId !== listing.userRef) {
    return next(errorHandler(401, 'You can only delete your own listings'))
  }

  try {
    await Listing.findByIdAndDelete(req.params.id)
    return res.status(200).json('Listing has been deleted!')
  } catch (error) {
    next(error)
  }
}

export const deleteListingImages = async (req, res, next) => {
  const { id } = req.params
  const { imageUrls } = req.body

  try {
    const listing = await Listing.findById(id)
    if (!listing) {
      return next(errorHandler(404, 'Listing not found'))
    }

    listing.imageUrls = listing.imageUrls.filter(
      (url) => !imageUrls.includes(url)
    )

    await listing.save()
    return res.status(200).json({
      success: true,
      message: 'Images deleted successfully',
      listing,
    })
  } catch (error) {
    next(error)
  }
}

export const updateListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id)
  if (!listing) {
    return next(errorHandler(404, 'Listing not found'))
  }

  if (listing.userId !== listing.userRef) {
    return next(errorHandler(401, 'You can only update your own listings'))
  }

  try {
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    return res.status(200).json(updatedListing)
  } catch (error) {
    next(error)
  }
}

export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) {
      return next(errorHandler(404, 'Listing not found'))
    }
    return res.status(200).json(listing)
  } catch (error) {
    next(error)
  }
}

export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const startIndex = parseInt(req.query.startIndex) || 0

    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice) : 0
    const maxPrice = req.query.maxPrice
      ? parseInt(req.query.maxPrice)
      : Number.MAX_SAFE_INTEGER

    let offer = req.query.offer
    if (offer === undefined || offer === 'false') {
      offer = { $in: [false, true] }
    }

    let furnished = req.query.furnished
    if (furnished === undefined || furnished === 'false') {
      furnished = { $in: [false, true] }
    }

    let parking = req.query.parking
    if (parking === undefined || parking === 'false') {
      parking = { $in: [false, true] }
    }

    let type = req.query.type
    if (type === undefined || type === 'all') {
      type = { $in: ['sale', 'rent'] }
    }

    let propertyType = req.query.propertyType
    if (propertyType === undefined || propertyType === 'all') {
      propertyType = {
        $in: [
          'Detached',
          'Semi-detached',
          'Terraced',
          'Flat',
          'Bungalow',
          'Park Home',
          'Land',
          'Student Halls',
        ],
      }
    }

    const searchTerm = req.query.searchTerm || ''
    const sort = req.query.sort || 'createdAt'
    const order = req.query.order || 'desc'

    const query = {
      $and: [
        {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { address: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { 'location.postcode': { $regex: searchTerm, $options: 'i' } },
            { 'location.city': { $regex: searchTerm, $options: 'i' } },
          ],
        },
        { offer },
        { furnished },
        { parking },
        { type },
        { propertyType },
        { regularPrice: { $gte: minPrice, $lte: maxPrice } },
      ],
    }

    const listings = await Listing.find(query)
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex)

    return res.status(200).json(listings)
  } catch (error) {
    next(error)
  }
}

export const getListingsByIds = async (req, res, next) => {
  try {
    const { ids } = req.body
    const listings = await Listing.find({ _id: { $in: ids } })
    res.status(200).json(listings)
  } catch (error) {
    next(error)
  }
}

export const geocodeAddress = async (req, res, next) => {
  try {
    const { address } = req.query
    console.log('📍 Geocoding request received for address:', address)

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address parameter is required',
      })
    }

    // Use the correct environment variable name for backend
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    console.log('🔑 API Key status:', apiKey ? 'Present' : 'Missing')

    if (!apiKey) {
      console.error('Google Maps API key not found in environment variables')
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured',
      })
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`

    console.log('🌐 Making request to Google Maps API...')

    const response = await fetch(url)
    const data = await response.json()

    console.log('📊 Google Maps API Response:', {
      status: data.status,
      results_count: data.results ? data.results.length : 0,
      error_message: data.error_message,
    })

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No results found for address',
        status: data.status,
        error_message: data.error_message,
      })
    }

    const result = data.results[0]

    const coordinates = {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted_address: result.formatted_address,
    }

    console.log('✅ Geocoding successful:', coordinates)

    return res.status(200).json({
      success: true,
      coordinates: coordinates,
      address: address,
    })
  } catch (error) {
    console.error('❌ Geocoding error:', error)
    next(error)
  }
}

export const getListingsNearby = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10 } = req.query

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: 'Latitude and longitude are required' })
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    const radiusInDegrees = parseFloat(radius) / 111

    const listings = await Listing.find({
      'location.coordinates.lat': {
        $gte: latitude - radiusInDegrees,
        $lte: latitude + radiusInDegrees,
      },
      'location.coordinates.lng': {
        $gte: longitude - radiusInDegrees,
        $lte: longitude + radiusInDegrees,
      },
    })

    res.status(200).json(listings)
  } catch (error) {
    next(error)
  }
}
