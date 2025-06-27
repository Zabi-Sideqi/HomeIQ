//api/routes/listing.route.js
import express from 'express'
import {
  createListing,
  deleteListing,
  updateListing,
  getListing,
  getListings,
  getListingsByIds,
  getFavoritesListings,
} from '../controllers/listing.controller.js'
import { deleteListingImages } from '../controllers/listing.controller.js'
import { verifyToken } from '../utils/verifyUser.js'

const router = express.Router()

router.post('/create', verifyToken, createListing)
router.delete('/delete/:id', verifyToken, deleteListing)
router.put('/update/:id', verifyToken, updateListing)
router.get('/get/:id', getListing)
router.get('/get', getListings)
router.put('/delete-images/:id', deleteListingImages)
router.post('/favorites', verifyToken, getListingsByIds)
router.get('/favorites', verifyToken, getFavoritesListings) // Add GET route for favorites

export default router
