//api/routes/admin.route.js

import express from 'express'
import { verifyToken } from '../utils/verifyUser.js'
import { verifyAdmin } from '../utils/verifyAdmin.js'
import {
  getAllListings,
  deleteListing,
  updateListing,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getDashboardStats,
} from '../controllers/admin.controller.js'

const router = express.Router()

// Apply authentication and admin verification to all routes
router.use(verifyToken)
router.use(verifyAdmin)

// Dashboard statistics
router.get('/dashboard/stats', getDashboardStats)

// Listing management routes
router.get('/listings', getAllListings)
router.put('/listings/:id', updateListing)
router.delete('/listings/:id', deleteListing)

// User management routes
router.get('/users', getAllUsers)
router.put('/users/:id/role', updateUserRole)
router.delete('/users/:id', deleteUser)

export default router
