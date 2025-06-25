//api/controllers/auth.controller.js

import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

export const signup = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    if (!password || password.length < 8) {
      return next(errorHandler(400, "Password must be at least 8 characters long"));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(errorHandler(409, "User already exists"));
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const newUser = new User({
      email,
      password: hashedPassword,
      username: username || "anonymous",
      avatar: "https://www.gravatar.com/avatar/?d=mp&f=y"
    });

    await newUser.save();

    res.status(201).json({ message: "User created successfully" });

  } catch (error) {
    console.error(" error:", error);
    next(errorHandler(500, "error from the function"));
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(404, "User not found"));

    const validPassword = bcrypt.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, "Invalid password"));

    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = validUser._doc;

    res
      .cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json({
        success: true,
        token,
        user: rest,
      });

  } catch (error) {
    next(error);
  }
};

export const google = async (req, res, next) => {
  try {
    console.log("Incoming Google data:", req.body);

    const { email, name, photoURL } = req.body;

    if (!email) {
      return next(errorHandler(400, "Email is required"));
    }

    const existingUser = await User.findOne({ email });

    // ✅ OM användaren redan finns, generera token och skicka till frontend
    if (existingUser) {
      const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET);
      const { password: pass, ...rest } = existingUser._doc;

      return res
        .cookie("access_token", token, { httpOnly: true })
        .status(200)
        .json({
          success: true,
          token,       // ✅ viktigt att frontend får denna
          user: rest,  // ✅ viktigt att frontend får denna
        });
    }

    // OM användaren är ny – skapa ny användare
    const usernameFromName = name
      ? name.split(" ").join("").toLowerCase()
      : "user" + Math.random().toString(36).slice(-4);

    const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(generatedPassword, 8);

    const newUser = new User({
      username: usernameFromName + Math.random().toString(36).slice(-4),
      email,
      password: hashedPassword,
      avatar: photoURL || "https://www.gravatar.com/avatar/?d=mp&f=y",
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = newUser._doc;

    //  RETURNERA TOKEN & USER till frontend även för nya användare!
    return res
      .cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json({
        success: true,
        token,       // ✅ frontend behöver detta för Redux
        user: rest,  // ✅ frontend behöver detta för Redux
      });

  } catch (error) {
    console.error("Google auth error:", error);
    next(errorHandler(500, error.message || "Unknown error in Google auth"));
  }
};


export const signOut = async (req, res) => {
  try {
    res.clearCookie("access_token", { path: "/" });
    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error logging out" });
  }
};

//create forgot password funtion

export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if(!user) return next(errorHandler(404, "User not found"));

    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, { expiresIn: '30m' });
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Here you would send the reset link via email
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });
    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    next(errorHandler(500, "Error processing password reset request"));
  }

    
}; 

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password || password.length < 8) {
      return next(errorHandler(400, "Invalid request"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) return next(errorHandler(404, "User not found"));

    user.password = await bcrypt.hash(Password, 8);
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    next(errorHandler(500, "Error resetting password"));
  }
};