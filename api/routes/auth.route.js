//api/routes/auth.route.js
import express from 'express'
import {
  signup,
  signupSimple,
  signin,
  google,
  signOut,
  forgotPassword,
  resetPassword,
  createSetupIntent,
  testStripe,
} from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/setup-intent', createSetupIntent)
router.get('/test-stripe', testStripe)
router.post('/signup', signup)
router.post('/signup-simple', signupSimple)
router.post('/signin', signin)
router.post('/google', google)
router.get('/signout', signOut)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)

export default router
