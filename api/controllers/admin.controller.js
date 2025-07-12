//api/controllers/admin.controller.js

import Listing from '../models/listing.model.js'
import User from '../models/user.model.js'
import { errorHandler } from '../utils/error.js'

// Get all listings for admin (without ownership restriction)
export const getAllListings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const sort = req.query.sort || 'createdAt'
    const order = req.query.order === 'asc' ? 1 : -1

    const searchTerm = req.query.search || ''
    const status = req.query.status || 'all' // all, active, inactive

    // Build search query
    let query = {}

    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { address: { $regex: searchTerm, $options: 'i' } },
        { 'location.city': { $regex: searchTerm, $options: 'i' } },
        { 'location.postcode': { $regex: searchTerm, $options: 'i' } },
      ]
    }

    const listings = await Listing.find(query)
      .populate('userRef', 'username email')
      .sort({ [sort]: order })
      .skip(skip)
      .limit(limit)

    const total = await Listing.countDocuments(query)

    res.status(200).json({
      success: true,
      listings,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Delete any listing (admin privilege)
export const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) {
      return next(errorHandler(404, 'Listing not found'))
    }

    await Listing.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Listing deleted successfully by admin',
    })
  } catch (error) {
    next(error)
  }
}

// Update any listing (admin privilege)
export const updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) {
      return next(errorHandler(404, 'Listing not found'))
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('userRef', 'username email')

    res.status(200).json({
      success: true,
      listing: updatedListing,
      message: 'Listing updated successfully by admin',
    })
  } catch (error) {
    next(error)
  }
}

// Get all users for admin
export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const searchTerm = req.query.search || ''
    const role = req.query.role || 'all' // all, user, admin

    // Build search query
    let query = {}

    if (searchTerm) {
      query.$or = [
        { username: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
      ]
    }

    if (role !== 'all') {
      query.role = role
    }

    const users = await User.find(query, '-password -resetPasswordToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await User.countDocuments(query)

    res.status(200).json({
      success: true,
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Update user role (admin privilege)
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body

    if (!['user', 'admin'].includes(role)) {
      return next(errorHandler(400, 'Invalid role. Must be "user" or "admin"'))
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      return next(errorHandler(404, 'User not found'))
    }

    // Prevent demoting the last admin
    if (user.role === 'admin' && role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin' })
      if (adminCount <= 1) {
        return next(errorHandler(400, 'Cannot demote the last admin user'))
      }
    }

    user.role = role
    await user.save()

    const { password, resetPasswordToken, ...userResponse } = user._doc

    res.status(200).json({
      success: true,
      user: userResponse,
      message: `User role updated to ${role} successfully`,
    })
  } catch (error) {
    next(error)
  }
}

// Delete user (admin privilege)
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return next(errorHandler(404, 'User not found'))
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' })
      if (adminCount <= 1) {
        return next(errorHandler(400, 'Cannot delete the last admin user'))
      }
    }

    // Delete all listings belonging to this user
    await Listing.deleteMany({ userRef: user._id })

    // Delete the user
    await User.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'User and their listings deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

// Get dashboard statistics
export const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments()
    const totalAdmins = await User.countDocuments({ role: 'admin' })
    const totalListings = await Listing.countDocuments()
    const totalSaleListings = await Listing.countDocuments({ type: 'sale' })
    const totalRentListings = await Listing.countDocuments({ type: 'rent' })

    // Recent listings (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentListings = await Listing.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    })

    // Recent users (last 30 days)
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    })

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          admins: totalAdmins,
          regular: totalUsers - totalAdmins,
          recent: recentUsers,
        },
        listings: {
          total: totalListings,
          sale: totalSaleListings,
          rent: totalRentListings,
          recent: recentListings,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}
