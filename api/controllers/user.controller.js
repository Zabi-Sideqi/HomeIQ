

// api/controllers/user.controller.js

import bcrypt from "bcryptjs";  
import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";
import Listing from "../models/listing.model.js";

// Test route
export const test = (req, res) => {
    res.send('User test route is working!');
}

// Perfectly secure and optimized updateUser
export const updateUser = async (req, res, next) => {
  try {
    // 1. check if the user is trying to update their own account
    if (req.user.id !== req.params.id) {
      return next(errorHandler(403, "You can only update your own account!"));
    }

    // 2. Manage passwords separately if sent
    if (req.body.password) {
      req.body.password = bcrypt.hashSync(req.body.password, 10);
    }

    // 3. Limit which fields can be updated (security!)
    const allowedFields = ['username', 'email', 'password', 'avatar'];
    const fieldsToUpdate = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        fieldsToUpdate[field] = req.body[field];
      }
    });

    // 4. Update the user in the database
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: fieldsToUpdate },
      { new: true }
    );

    if (!updatedUser) {
      return next(errorHandler(404, "User not found"));
    }

    // 5. Send back user data without password
    const { password, ...rest } = updatedUser._doc;
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: rest,
    });

  } catch (error) {
    next(error);
  }
}


//delete user
 export const deleteUser = async (req, res, next) => {
    if (req.user.id !== req.params.id) return next(errorHandler(401, "You can only delete your account!"));
    
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json("User has been deleted.");
    } catch (error) {
         next(error)
    }
} 

    // delete user by ID directly (no token check)
/* export const deleteUser = async (req, res, next) => {
  try {
      const deletedUser = await User.findByIdAndDelete(req.params.id);
      if (!deletedUser) {
          return next(errorHandler(404, "User not found!"));
      }
      res.status(200).json("User has been deleted.");
  } catch (error) {
      next(error);
  }
} */

export const getUserListing = async (req, res, next) => {
  if (req.user.id.toString() === req.params.id.toString())
 {
    try {
      const listings = await Listing.find({ userRef: req.params.id });
      res.status(200).json(listings)
      
    } catch (error) {
      next(error);
    }
  } else{

    return next(errorHandler(403, "You can only view your own listings!"));
  }
  
} 

 /*  export const getUserListing = async (req, res, next) => {
    try {
      const listings = await Listing.find({ userRef: req.params.id });
      res.status(200).json(listings);
    } catch (error) {
      next(error);
    }
  }; */
  // Must work on token and user ID check for security

export const getUser = async (req, res, next) => {
  try {
       
    // Check if the user is trying to access their own account
    if (req.user.id !== req.params.id && !req.user.role !== 'Admin') {
      return next(errorHandler(403, "You can only access your own account!"));
    }

    const user = await User.findById(req.params.id)
    if (!user) return next(errorHandler(404, 'User not found!'));

    const { password: pass, ...rest } = user._doc;

    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};


// create favoriteToggle function

export const favoriteToggle = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const listingId = req.params.listingId;
    if (!user) return res.status(404).json({ message: "Användare hittades inte" });


    const index = user.favorites.indexOf(listingId);

    if (index === -1) {
      user.favorites.push(listingId);
    } else {
      user.favorites.splice(index, 1);
    }

    await user.save();
    res.status(200).json({ favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ error: error.message})
  }
};



