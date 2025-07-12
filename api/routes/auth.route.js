//api/routes/auth.route.js
import express from 'express'
import {
  signup,
  signin,
  google,
  signOut,
  forgotPassword,
  resetPassword,
  createSetupIntent,
} from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/setup-intent', createSetupIntent)
router.post('/signup', signup)
router.post('/signin', signin)
router.post('/google', google)
router.get('/signout', signOut)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)

export default router
