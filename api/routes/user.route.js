//api/routes/user.route.js
import express from 'express';
import { deleteUser, test, updateUser,  getUserListing, getUser} from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
import { favoriteToggle } from '../controllers/user.controller.js';


const router = express.Router();

router.get('/test', test);
router.put('/update/:id', verifyToken, updateUser)
router.delete('/delete/:id', verifyToken, deleteUser)
router.get('/listing/:id', verifyToken, getUserListing)
router.put('/favorites/:listingId', verifyToken, favoriteToggle);
router.get('/:id', verifyToken, getUser)
export default router;

