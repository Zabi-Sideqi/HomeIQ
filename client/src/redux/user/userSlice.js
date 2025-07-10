//cilent/src/redux/user/userSlice.js

import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentUser: null,
  isLoggedIn: false,
  token: null,
  loading: false,
  error: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // 🔐 Sign In
    signInStart: (state) => {
      state.loading = true
      state.error = null
    },
    signInSuccess: (state, action) => {
      state.loading = false
      state.currentUser = {
        ...action.payload.user,
        token: action.payload.token, // 📌 för bakåtkompatibilitet
      }
      state.token = action.payload.token
      state.isLoggedIn = true
    },
    signInFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },

    // 🚪 Sign Out / Logout
    signOutUserStart: (state) => {
      state.loading = true
      state.error = null
    },
    signOutUserSuccess: (state) => {
      state.loading = false
      state.currentUser = null
      state.isLoggedIn = false
      state.token = null
    },
    signOutUserFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    logout: (state) => {
      state.currentUser = null
      state.isLoggedIn = false
      state.token = null
    },

    // ✏️ Update User
    updateUserStart: (state) => {
      state.loading = true
      state.error = null
    },
    updateUserSuccess: (state, action) => {
      state.loading = false
      state.currentUser = action.payload.user
    },
    updateUserFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },

    // ❌ Delete User
    deleteUserStart: (state) => {
      state.loading = true
      state.error = null
    },
    deleteUserSuccess: (state) => {
      state.loading = false
      state.currentUser = null
      state.isLoggedIn = false
      state.token = null
    },
    deleteUserFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },

    // 🆕 Direkt sätt användaren (t.ex. efter att ha ändrat favoriter)
    setUser: (state, action) => {
      state.currentUser = action.payload
    },

    // ⭐ Update User Favorites
    updateUserFavorites: (state, action) => {
      const listingId = action.payload
      if (state.currentUser && state.currentUser.favorites) {
        const favorites = state.currentUser.favorites
        const index = favorites.indexOf(listingId)
        if (index > -1) {
          // Remove from favorites
          favorites.splice(index, 1)
        } else {
          // Add to favorites
          favorites.push(listingId)
        }
      }
    },
  },
})

export const {
  signInStart,
  signInSuccess,
  signInFailure,
  signOutUserStart,
  signOutUserSuccess,
  signOutUserFailure,
  logout,
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
  setUser,
  updateUserFavorites,
} = userSlice.actions

export default userSlice.reducer
