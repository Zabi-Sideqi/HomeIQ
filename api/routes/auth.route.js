
//api/routes/auth.route.js
import express from 'express';
import { signup, signin, google, signOut, requestPasswordReset, resetPassword } from '../controllers/auth.controller.js';

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/google", google);
router.get("/signout", signOut);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;




