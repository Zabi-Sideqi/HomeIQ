//api/routes/listing.route.js
// api/routes/listing.route.js

import express from 'express'
import {
  createListing,
  deleteListing,
  updateListing,
  getListing,
  getListings,
  getListingsByIds,
  geocodeAddress,
  getListingsNearby,
  deleteListingImages,
  getAreaBoundaries,
} from '../controllers/listing.controller.js'
import { verifyToken } from '../utils/verifyUser.js'

const router = express.Router()

// Skyddade rutter (kräver inloggning/token)
router.post('/create', verifyToken, createListing)
router.delete('/delete/:id', verifyToken, deleteListing)
router.put('/update/:id', verifyToken, updateListing)
router.put('/delete-images/:id', verifyToken, deleteListingImages)
router.put('/favorites', verifyToken, getListingsByIds)

// Öppna rutter
router.get('/get/:id', getListing)
router.get('/get', getListings)
router.get('/geocodeAddress', geocodeAddress)
router.get('/nearby', getListingsNearby)
router.get('/area-boundaries', getAreaBoundaries)

// ✅ Ny öppen route: Returnerar property types till frontend
router.get('/property-types', (req, res) => {
  res.json([
    'Detached',
    'Semi-detached',
    'Terraced',
    'Flat',
    'Bungalow',
    'Park Home',
    'Land',
    'Student Halls',
  ])
})

export default router
