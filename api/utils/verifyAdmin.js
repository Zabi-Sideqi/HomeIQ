//api/utils/verifyAdmin.js

import User from '../models/user.model.js'
import { errorHandler } from './error.js'

export const verifyAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.user || !req.user.id) {
      return next(errorHandler(401, 'Unauthorized - Authentication required'))
    }

    // Get user from database to check role
    const user = await User.findById(req.user.id)
    if (!user) {
      return next(errorHandler(404, 'User not found'))
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return next(errorHandler(403, 'Forbidden - Admin access required'))
    }

    // Add user data to request object for convenience
    req.admin = user
    next()
  } catch (error) {
    console.error('Admin verification error:', error)
    next(errorHandler(500, 'Error verifying admin status'))
  }
}
