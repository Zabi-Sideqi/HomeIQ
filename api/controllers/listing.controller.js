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

  if (listing.userRef !== req.user.id) {
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

    if (listing.userRef !== req.user.id) {
      return next(errorHandler(401, 'You can only modify your own listings'))
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

  if (listing.userRef !== req.user.id) {
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

    // Handle bedroom filtering with min/max range
    let bedroomFilter = {}
    const minBedrooms =
      req.query.minBedrooms !== undefined && req.query.minBedrooms !== ''
        ? parseInt(req.query.minBedrooms)
        : null
    const maxBedrooms =
      req.query.maxBedrooms !== undefined && req.query.maxBedrooms !== ''
        ? parseInt(req.query.maxBedrooms)
        : null

    if (minBedrooms !== null || maxBedrooms !== null) {
      if (minBedrooms !== null && maxBedrooms !== null) {
        // Both min and max specified
        bedroomFilter = { bedrooms: { $gte: minBedrooms, $lte: maxBedrooms } }
      } else if (minBedrooms !== null) {
        // Only min specified
        bedroomFilter = { bedrooms: { $gte: minBedrooms } }
      } else if (maxBedrooms !== null) {
        // Only max specified
        bedroomFilter = { bedrooms: { $lte: maxBedrooms } }
      }
    }

    const searchTerm = req.query.searchTerm || ''
    const sort = req.query.sort || 'createdAt'
    const order = req.query.order || 'desc'

    // Build search conditions for searchTerm only
    const searchConditions = []

    if (searchTerm) {
      searchConditions.push({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { address: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { 'location.postcode': { $regex: searchTerm, $options: 'i' } },
          { 'location.city': { $regex: searchTerm, $options: 'i' } },
        ],
      })
    }

    // If no search terms provided, match all
    if (searchConditions.length === 0) {
      searchConditions.push({}) // Match all documents
    }

    const query = {
      $and: [
        ...searchConditions,
        { offer },
        { furnished },
        { parking },
        { type },
        { propertyType },
        { regularPrice: { $gte: minPrice, $lte: maxPrice } },
        ...(Object.keys(bedroomFilter).length > 0 ? [bedroomFilter] : []),
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
    const { lat, lng, radius = 10, minBedrooms, maxBedrooms } = req.query

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: 'Latitude and longitude are required' })
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    const radiusInDegrees = parseFloat(radius) / 111

    console.log(
      `Searching for listings near lat: ${latitude}, lng: ${longitude}, radius: ${radius}km`
    )

    // Build the query object
    const query = {
      'location.coordinates.lat': {
        $gte: latitude - radiusInDegrees,
        $lte: latitude + radiusInDegrees,
      },
      'location.coordinates.lng': {
        $gte: longitude - radiusInDegrees,
        $lte: longitude + radiusInDegrees,
      },
    }

    // Add bedroom filtering if specified
    const minBed =
      minBedrooms !== undefined && minBedrooms !== ''
        ? parseInt(minBedrooms)
        : null
    const maxBed =
      maxBedrooms !== undefined && maxBedrooms !== ''
        ? parseInt(maxBedrooms)
        : null

    if (minBed !== null || maxBed !== null) {
      if (minBed !== null && maxBed !== null) {
        // Both min and max specified
        query.bedrooms = { $gte: minBed, $lte: maxBed }
      } else if (minBed !== null) {
        // Only min specified
        query.bedrooms = { $gte: minBed }
      } else if (maxBed !== null) {
        // Only max specified
        query.bedrooms = { $lte: maxBed }
      }
    }

    const listings = await Listing.find(query)

    console.log(`Found ${listings.length} listings nearby`)

    // Transform the data structure for frontend compatibility
    const transformedListings = listings.map((listing) => {
      const listingObj = listing.toObject()

      // Add coordinates field at the root level for frontend compatibility
      if (listingObj.location && listingObj.location.coordinates) {
        listingObj.coordinates = {
          lat: listingObj.location.coordinates.lat,
          lng: listingObj.location.coordinates.lng,
        }
      }

      return listingObj
    })

    console.log(
      'Sample transformed listing:',
      transformedListings[0]?.coordinates
    )

    res.status(200).json(transformedListings)
  } catch (error) {
    console.error('Error in getListingsNearby:', error)
    next(error)
  }
}

// Fix London listing coordinates
export const fixLondonListingCoordinates = async (req, res, next) => {
  try {
    // Find the London listing with null coordinates
    const londonListing = await Listing.findOne({
      'location.city': 'London',
      'location.coordinates.lat': null,
      'location.coordinates.lng': null,
    })

    if (londonListing) {
      // Update with proper London coordinates (around Westminster area)
      londonListing.location.coordinates = {
        lat: 51.5074,
        lng: -0.1278,
      }
      await londonListing.save()
      console.log('Fixed London listing coordinates')
    }

    res.status(200).json({ message: 'London listing coordinates fixed' })
  } catch (error) {
    console.error('Error fixing London listing:', error)
    next(error)
  }
}

// Dynamic Area Boundaries API - Gets real administrative boundaries for any location worldwide
export const getAreaBoundaries = async (req, res, next) => {
  try {
    const { searchTerm } = req.query

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'searchTerm is required',
      })
    }

    console.log(`Fetching boundaries for: ${searchTerm}`)

    // Step 1: Get location details from Nominatim (OpenStreetMap)
    let nominatimData = null

    // Try the original search term first
    let nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchTerm
      )}&limit=1&polygon_geojson=1&addressdetails=1`
    )

    nominatimData = await nominatimResponse.json()

    // If no results, try with additional terms for common areas DYNAMICALLY
    if (!nominatimData || nominatimData.length === 0) {
      console.log(
        `No initial results for "${searchTerm}", trying alternative searches...`
      )

      // Generate dynamic alternative search terms based on the input
      const alternativeSearchTerms = []

      // Add country-specific variations if not already specified
      if (
        !searchTerm.toLowerCase().includes('london') &&
        !searchTerm.toLowerCase().includes('uk') &&
        !searchTerm.toLowerCase().includes('england')
      ) {
        alternativeSearchTerms.push(`${searchTerm} London`)
        alternativeSearchTerms.push(`London Borough of ${searchTerm}`)
        alternativeSearchTerms.push(`Royal Borough of ${searchTerm}`)
      }

      // Add generic administrative variations
      alternativeSearchTerms.push(`${searchTerm} Borough`)
      alternativeSearchTerms.push(`${searchTerm} District`)
      alternativeSearchTerms.push(`${searchTerm} Municipality`)
      alternativeSearchTerms.push(`${searchTerm} City`)
      alternativeSearchTerms.push(`${searchTerm} County`)
      alternativeSearchTerms.push(`${searchTerm} Area`)

      // Add country variations if not already specified
      if (
        !searchTerm.toLowerCase().includes('uk') &&
        !searchTerm.toLowerCase().includes('england') &&
        !searchTerm.toLowerCase().includes('sweden') &&
        !searchTerm.toLowerCase().includes('usa')
      ) {
        alternativeSearchTerms.push(`${searchTerm} UK`)
        alternativeSearchTerms.push(`${searchTerm} England`)
        alternativeSearchTerms.push(`${searchTerm} Sweden`)
        alternativeSearchTerms.push(`${searchTerm} USA`)
        alternativeSearchTerms.push(`${searchTerm} Canada`)
        alternativeSearchTerms.push(`${searchTerm} Australia`)
      }

      for (const altTerm of alternativeSearchTerms) {
        console.log(`Trying alternative search: ${altTerm}`)
        nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            altTerm
          )}&limit=1&polygon_geojson=1&addressdetails=1`
        )

        const altData = await nominatimResponse.json()
        if (altData && altData.length > 0) {
          nominatimData = altData
          console.log(`Found location with alternative term: ${altTerm}`)
          break
        }
      }
    }

    // If still no results, try prioritizing boundary searches DYNAMICALLY
    if (
      !nominatimData ||
      nominatimData.length === 0 ||
      !nominatimData[0].geojson
    ) {
      console.log(`Trying boundary-specific searches for "${searchTerm}"...`)

      // Generate dynamic boundary search terms
      const boundarySearchTerms = []

      // Detect if it might be a London area
      const isLikelyLondonArea =
        searchTerm.toLowerCase().includes('green') ||
        searchTerm.toLowerCase().includes('ham') ||
        searchTerm.toLowerCase().includes('ton') ||
        searchTerm.toLowerCase().includes('wich') ||
        searchTerm.toLowerCase().includes('ford')

      if (isLikelyLondonArea) {
        boundarySearchTerms.push(`London Borough of ${searchTerm}`)
        boundarySearchTerms.push(`Royal Borough of ${searchTerm}`)
      }

      // Add generic administrative boundary terms
      boundarySearchTerms.push(`${searchTerm} Borough`)
      boundarySearchTerms.push(`${searchTerm} District`)
      boundarySearchTerms.push(`${searchTerm} Municipality`)
      boundarySearchTerms.push(`${searchTerm} Administrative Area`)
      boundarySearchTerms.push(`${searchTerm} Local Authority`)

      for (const boundaryTerm of boundarySearchTerms) {
        console.log(`Trying boundary-specific search: ${boundaryTerm}`)
        nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            boundaryTerm
          )}&limit=1&polygon_geojson=1&addressdetails=1`
        )

        const boundaryData = await nominatimResponse.json()
        if (
          boundaryData &&
          boundaryData.length > 0 &&
          boundaryData[0].geojson &&
          boundaryData[0].geojson.type !== 'Point'
        ) {
          nominatimData = boundaryData
          console.log(`Found boundary with term: ${boundaryTerm}`)
          break
        }
      }
    }

    if (!nominatimData || nominatimData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Location not found',
      })
    }

    const location = nominatimData[0]
    const center = {
      lat: parseFloat(location.lat),
      lng: parseFloat(location.lon),
    }

    // Step 2: Check if we have polygon data from Nominatim
    if (
      location.geojson &&
      location.geojson.coordinates &&
      location.geojson.type !== 'Point'
    ) {
      console.log(
        `Found polygon boundary for ${searchTerm} - Type: ${location.geojson.type}`
      )

      // Convert GeoJSON to Leaflet-compatible format
      let boundary = null

      if (location.geojson.type === 'Polygon') {
        // Simple polygon
        boundary = location.geojson.coordinates[0].map((coord) => [
          coord[1],
          coord[0],
        ]) // [lat, lng]
      } else if (location.geojson.type === 'MultiPolygon') {
        // Multiple polygons - use the largest one
        let largestPolygon = []
        let maxLength = 0

        location.geojson.coordinates.forEach((polygon) => {
          const coords = polygon[0]
          if (coords.length > maxLength) {
            maxLength = coords.length
            largestPolygon = coords
          }
        })

        boundary = largestPolygon.map((coord) => [coord[1], coord[0]]) // [lat, lng]
      }

      if (boundary && boundary.length > 0) {
        return res.json({
          success: true,
          center,
          boundary,
          displayName: location.display_name,
          useCircle: false,
          searchRadius: 10, // km for property search
        })
      }
    } else {
      console.log(
        `No polygon boundary found for ${searchTerm} - Type: ${
          location.geojson?.type || 'none'
        }`
      )
    }

    // Step 3: Try Overpass API for administrative boundaries DYNAMICALLY
    console.log(`Trying Overpass API for ${searchTerm}`)

    try {
      // Generate dynamic search patterns based on the input
      const searchPatterns = [searchTerm]

      // Add context-aware patterns based on the search term
      const searchLower = searchTerm.toLowerCase()

      // Detect potential country/region context
      if (
        !searchLower.includes('sweden') &&
        !searchLower.includes('usa') &&
        !searchLower.includes('canada')
      ) {
        // If no country specified, try common ones
        searchPatterns.push(`${searchTerm} Sweden`)
        searchPatterns.push(`${searchTerm} UK`)
        searchPatterns.push(`${searchTerm} USA`)
        searchPatterns.push(`${searchTerm} Canada`)
        searchPatterns.push(`${searchTerm} Australia`)
      }

      // Add administrative variations
      searchPatterns.push(`${searchTerm} Municipality`)
      searchPatterns.push(`${searchTerm} Borough`)
      searchPatterns.push(`${searchTerm} District`)
      searchPatterns.push(`${searchTerm} County`)
      searchPatterns.push(`${searchTerm} City`)

      // Add specific patterns for likely UK areas (dynamic detection)
      if (
        searchLower.includes('green') ||
        searchLower.includes('ham') ||
        searchLower.includes('ton') ||
        searchLower.includes('wich') ||
        searchLower.includes('ford') ||
        searchLower.includes('bury')
      ) {
        searchPatterns.push(`London Borough of ${searchTerm}`)
        searchPatterns.push(`Royal Borough of ${searchTerm}`)
        searchPatterns.push(`${searchTerm} London`)
      }

      // Add patterns for likely Swedish areas
      if (
        searchLower.includes('berg') ||
        searchLower.includes('holm') ||
        searchLower.includes('stad') ||
        searchLower.includes('by')
      ) {
        searchPatterns.push(`${searchTerm} Municipality`)
        searchPatterns.push(`${searchTerm} Sweden`)
      }

      let bestBoundary = null
      let bestElement = null

      for (const pattern of searchPatterns) {
        console.log(`Trying Overpass pattern: ${pattern}`)

        const overpassQuery = `
          [out:json][timeout:25];
          (
            relation["name"~"${pattern.replace(
              /[.*+?^${}()|[\]\\]/g,
              '\\$&'
            )}"i]["admin_level"];
            relation["name"~"${pattern.replace(
              /[.*+?^${}()|[\]\\]/g,
              '\\$&'
            )}"i]["boundary"];
            way["name"~"${pattern.replace(
              /[.*+?^${}()|[\]\\]/g,
              '\\$&'
            )}"i]["admin_level"];
            way["name"~"${pattern.replace(
              /[.*+?^${}()|[\]\\]/g,
              '\\$&'
            )}"i]["boundary"];
          );
          out geom;
        `

        const overpassResponse = await fetch(
          `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
            overpassQuery
          )}`
        )

        if (overpassResponse.ok) {
          const overpassData = await overpassResponse.json()

          if (overpassData.elements && overpassData.elements.length > 0) {
            // Find the most relevant boundary
            overpassData.elements.forEach((element) => {
              if (element.geometry && element.geometry.length > 0) {
                const name = element.tags?.name?.toLowerCase() || ''
                const searchLower = pattern.toLowerCase()

                if (name.includes(searchLower) || searchLower.includes(name)) {
                  if (
                    !bestElement ||
                    element.geometry.length > bestElement.geometry.length
                  ) {
                    bestElement = element
                    bestBoundary = element.geometry.map((coord) => [
                      coord.lat,
                      coord.lon,
                    ])
                  }
                }
              }
            })

            if (bestBoundary && bestBoundary.length > 0) {
              console.log(`Found Overpass boundary for ${pattern}`)
              return res.json({
                success: true,
                center,
                boundary: bestBoundary,
                displayName: bestElement.tags?.name || location.display_name,
                useCircle: false,
                searchRadius: 15, // km for property search
              })
            }
          }
        }
      }
    } catch (overpassError) {
      console.warn('Overpass API failed:', overpassError.message)
    }

    // Step 4: Fallback to circle with appropriate radius based on place type
    console.log(`Using circle fallback for ${searchTerm}`)

    const placeType = location.type || location.class || 'unknown'
    let radius = 5000 // Default 5km

    // Adjust radius based on place type
    if (placeType.includes('city') || placeType.includes('town')) {
      radius = 8000 // 8km for cities
    } else if (placeType.includes('village') || placeType.includes('hamlet')) {
      radius = 3000 // 3km for villages
    } else if (
      placeType.includes('suburb') ||
      placeType.includes('neighbourhood')
    ) {
      radius = 2000 // 2km for neighborhoods
    } else if (placeType.includes('county') || placeType.includes('state')) {
      radius = 25000 // 25km for large areas
    }

    return res.json({
      success: true,
      center,
      boundary: null,
      displayName: location.display_name,
      useCircle: true,
      radius,
      searchRadius: radius / 1000, // Convert to km for property search
    })
  } catch (error) {
    console.error('Error in getAreaBoundaries:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch area boundaries',
    })
  }
}
