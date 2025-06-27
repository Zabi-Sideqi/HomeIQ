//cilent/src/redux/user/userSlice.js

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentUser: null,
  isLoggedIn: false,
  token: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    signInStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    signInSuccess: (state, action) => {
      state.loading = false;
      state.currentUser = action.payload.user;
      state.token = action.payload.token;
      state.isLoggedIn = true;
    },
    signInFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.currentUser = null;
      state.isLoggedIn = false;
      state.token = null;
    },
    updateUserStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    updateUserSuccess: (state, action) => {
      state.loading = false;
      state.currentUser = action.payload.user;
    },
    updateUserFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteUserStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    deleteUserSuccess: (state) => {
      state.loading = false;
      state.currentUser = null;
      state.isLoggedIn = false;
      state.token = null;
    },
    deleteUserFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    signOutUserStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    signOutUserSuccess: (state) => {
      state.loading = false;
      state.currentUser = null;
      state.isLoggedIn = false;
      state.token = null;
    },
    signOutUserFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setUser: (state, action) => {
      state.currentUser = action.payload;
      state.token = action.payload.token;
      state.isLoggedIn = true;
    },

    // ✅ NY reducer för att toggle-favorit lokalt
    updateUserFavorites: (state, action) => {
      const listingId = action.payload;
      const favorites = state.currentUser?.favorites || [];

      if (favorites.includes(listingId)) {
        state.currentUser.favorites = favorites.filter(id => id !== listingId);
      } else {
        state.currentUser.favorites = [...favorites, listingId];
      }
    },
  },
});

export const {
  signInStart,
  signInSuccess,
  signInFailure,
  logout,
  updateUserFailure,
  updateUserStart,
  updateUserSuccess,
  deleteUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  signOutUserStart,
  signOutUserSuccess,
  signOutUserFailure,
  setUser,
  updateUserFavorites, // ⬅️ exportera denna också!
} = userSlice.actions;

export default userSlice.reducer;
