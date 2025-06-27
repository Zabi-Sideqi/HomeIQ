# HomeIQ Deployment Guide

## Deploying to Render.com

### Prerequisites

1. GitHub repository with your code
2. Render.com account
3. MongoDB Atlas database

### Backend Deployment (API)

1. **Create Web Service on Render:**

   - Connect your GitHub repository
   - Root Directory: `api`
   - Runtime: `Node.js`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Set Environment Variables in Render Dashboard:**
   ```
   NODE_ENV=production
   Mongo=mongodb+srv://zabisideqi:Homeiq@cluster0.cixia2x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=hemligt123hhhrklKK
   EMAIL_USER=homeiq.costumer@gmail.com
   EMAIL_PASS=uflbnnjnpwnhspks
   FRONTEND_URL=https://your-frontend-url.onrender.com
   PORT=3000
   ```

### Frontend Deployment (Client)

1. **Create Static Site on Render:**

   - Connect your GitHub repository
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

2. **Set Environment Variables in Render Dashboard:**
   ```
   VITE_API_BASE_URL=https://your-backend-url.onrender.com
   VITE_FIREBASE_API_KEY=AIzaSyAzg7yn7FYCmQLgpsqx7w2mr6AbL_9L7MU
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyD0DPt8zDxvdDpSw3pHi2BzkkeAJm4Unug
   ```

### Important Notes

1. **CORS Configuration:** Already set up in `api/index.js` to allow both localhost and Render URLs
2. **Environment Detection:** The `api.js` utility automatically detects development vs production
3. **Database:** Using MongoDB Atlas (cloud) so it works from anywhere
4. **Email Service:** Gmail SMTP configured for password reset emails

### URL Structure

- Backend: `https://homeiq-backend.onrender.com`
- Frontend: `https://homeiq-client.onrender.com`

### Testing Deployment

1. Deploy backend first
2. Update frontend environment variables with actual backend URL
3. Deploy frontend
4. Test all functionality (auth, listings, favorites, password reset)

### Common Issues

- **CORS errors:** Check that frontend URL is in CORS allowedOrigins
- **API calls failing:** Verify VITE_API_BASE_URL points to correct backend URL
- **Database connection:** Ensure MongoDB Atlas allows connections from 0.0.0.0/0
- **Environment variables:** Double-check all env vars are set in Render dashboard
