// client/src/pages/Profile.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { app } from '../firebase'
import {
  updateUserStart,
  updateUserFailure,
  updateUserSuccess,
  signOutUserFailure,
  signOutUserStart,
  signOutUserSuccess,
} from '../redux/user/userSlice'
import { Link, useNavigate } from 'react-router-dom'
import { apiUrl } from '../utils/api'

const Profile = () => {
  const fileRef = useRef(null)
  const { currentUser, token } = useSelector((state) => state.user)
  const [file, setFile] = useState(undefined)
  const [filePerc, setFilePerc] = useState(0)
  const [fileUploadError, setFileUploadError] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [formData, setFormData] = useState({})
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [showListingError, setShowListingError] = useState(false)
  const [userListing, setUserListing] = useState([])
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleFileUpload = useCallback(
    (file) => {
      const storage = getStorage(app)
      const fileName = new Date().getTime() + file.name
      const storageRef = ref(storage, fileName)
      const uploadTask = uploadBytesResumable(storageRef, file)

      setFilePerc(0)
      setFileUploadError(false)
      setUploadSuccess(false)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setFilePerc(Math.round(progress))
        },
        (error) => {
          console.error('Upload error:', error)
          setFileUploadError(true)
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

          if (
            formData.avatar &&
            !formData.avatar.includes('gravatar.com') &&
            !formData.avatar.includes('googleusercontent.com')
          ) {
            const oldImageRef = ref(storage, formData.avatar)
            try {
              await deleteObject(oldImageRef)
            } catch (error) {
              console.warn('Failed to delete old image:', error)
            }
          }

          setFormData((prev) => ({
            ...prev,
            avatar: downloadURL,
          }))

          try {
            const res = await fetch(
              apiUrl(`/api/user/update/${currentUser._id}`),
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ avatar: downloadURL }),
              }
            )

            const data = await res.json()

            if (data.success) {
              dispatch(updateUserSuccess(data))
            }
          } catch (err) {
            console.error('Error updating avatar:', err.message)
          }

          setUploadSuccess(true)
          setTimeout(() => {
            setUploadSuccess(false)
            setFilePerc(0)
          }, 9000)
        }
      )
    },
    [formData.avatar, currentUser._id, dispatch, token]
  )

  useEffect(() => {
    if (file) {
      handleFileUpload(file)
    }
  }, [file, handleFileUpload])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleDeleteUser = async () => {
    if (window.confirm('Are you sure you want to delete your account?')) {
      try {
        const res = await fetch(apiUrl(`/api/user/delete/${currentUser._id}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success === false) {
          dispatch(signOutUserFailure(data.message))
          return
        }
        setDeleteSuccess(true)
        dispatch(signOutUserSuccess())
        navigate('/sign-in')
      } catch (error) {
        dispatch(signOutUserFailure(error.message))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      dispatch(updateUserStart())
      const res = await fetch(apiUrl(`/api/user/update/${currentUser._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success === false) {
        dispatch(updateUserFailure(data.message))
        return
      }
      dispatch(updateUserSuccess(data))
      setUpdateSuccess(true)
    } catch (error) {
      dispatch(updateUserFailure(error.message))
    }
  }

  const handleSignOut = async () => {
    try {
      dispatch(signOutUserStart())
      const res = await fetch(apiUrl('/api/auth/signout'), {
        method: 'GET',
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success === false) {
        dispatch(signOutUserFailure(data.message))
        return
      }
      dispatch(signOutUserSuccess())
      navigate('/sign-in')
    } catch (error) {
      dispatch(signOutUserFailure(error.message))
    }
  }

  const handleShowListings = async () => {
    if (!token || !currentUser?._id) {
      setShowListingError(true)
      return
    }

    try {
      const res = await fetch(apiUrl(`/api/user/listing/${currentUser._id}`), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()
      if (data.success === false) {
        setShowListingError(true)
        return
      }
      setUserListing(data)
    } catch {
      setShowListingError(true)
    }
  }

  const handleListingDelete = async (listingId) => {
    const listingToDelete = userListing.find(
      (listing) => listing._id === listingId
    )
    const imageUrlsToDelete = listingToDelete?.imageUrls || []

    // Delete images from Firebase storage first
    const storage = getStorage()
    for (const url of imageUrlsToDelete) {
      const path = decodeURIComponent(url.split('/o/')[1].split('?')[0])
      const imageRef = ref(storage, path)
      try {
        await deleteObject(imageRef)
      } catch (err) {
        console.warn('Could not delete from Firebase:', err.message)
      }
    }

    try {
      // Delete the entire listing (no need to call delete-images endpoint)
      const res = await fetch(apiUrl(`/api/listing/delete/${listingId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!data.success && typeof data === 'object') return

      setUserListing((prev) => prev.filter((l) => l._id !== listingId))
    } catch (error) {
      console.error('Error deleting listing:', error.message)
    }
  }

  return (
    <div>
      <h1 className='text-3xl font-semibold text-center my-7'>Profile</h1>
      <form
        onSubmit={handleSubmit}
        className='flex flex-col gap-4 max-w-2xl mx-auto p-4'
      >
        <input
          onChange={(e) => setFile(e.target.files[0])}
          type='file'
          ref={fileRef}
          hidden
          accept='image/*'
        />
        <img
          onClick={() => fileRef.current.click()}
          src={formData.avatar || currentUser?.avatar || '/default-avatar.png'}
          alt='profile'
          className='w-24 h-24 rounded-full mx-auto cursor-pointer self-center mt-2'
        />
        {filePerc > 0 && filePerc < 100 && (
          <p className='text-center text-gray-500'>{filePerc}% uploaded</p>
        )}
        {uploadSuccess && (
          <p className='text-center text-green-600'>Upload successful!</p>
        )}
        {fileUploadError && (
          <div className='text-center text-red-700'>
            <p>Upload failed!</p>
            <p>(Image must be less than 2 MB)</p>
          </div>
        )}
        <input
          type='text'
          placeholder='Username'
          defaultValue={currentUser.username}
          id='username'
          className='p-3 border border-slate-300 rounded-lg'
          onChange={handleChange}
        />
        <input
          type='email'
          placeholder='Email'
          id='email'
          defaultValue={currentUser.email}
          className='p-3 border border-slate-300 rounded-lg'
          onChange={handleChange}
        />
        <input
          type='password'
          placeholder='Password'
          id='password'
          className='p-3 border border-slate-300 rounded-lg'
          onChange={handleChange}
        />
        <button
          type='submit'
          className='bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-85'
        >
          Update
        </button>
        <Link
          className='bg-green-700 text-slate-100 p-3 rounded-lg uppercase text-center hover:opacity-90'
          to={'/create-listing'}
        >
          Create Listing
        </Link>
      </form>

      <div className='flex justify-between gap-4 max-w-2xl mx-auto p-4'>
        <span
          onClick={handleDeleteUser}
          className='text-red-700 cursor-pointer'
        >
          Delete account
        </span>
        <span onClick={handleSignOut} className='text-red-700 cursor-pointer'>
          Sign out
        </span>
      </div>

      {updateSuccess && (
        <p className='text-center text-green-600'>User updated successfully!</p>
      )}
      {deleteSuccess && (
        <p className='text-center text-red-600'>User deleted successfully!</p>
      )}
      <button onClick={handleShowListings} className='text-green-700 w-full'>
        Show Listings
      </button>
      {showListingError && (
        <p className='text-center text-red-600'>Failed to fetch listings!</p>
      )}

      {userListing?.length > 0 && (
        <div className='flex flex-col gap-4 max-w-2xl mx-auto p-4'>
          <h2 className='text-2xl font-semibold text-center mt-7'>
            Your Listings
          </h2>
          {userListing.map((listing) => (
            <div
              key={listing._id}
              className='border border-slate-300 rounded-lg p-3 my-4 flex justify-between items-center gap-4'
            >
              <Link
                to={`/listing/${listing._id}`}
                className='text-blue-700 hover:underline'
              >
                <img
                  src={listing.imageUrls[0]}
                  alt={listing.cover}
                  className='h-16 w-16 object-contain rounded-lg'
                />
              </Link>
              <Link
                className='text-slate-700 font-semibold hover:underline truncate flex-1'
                to={`/listing/${listing._id}`}
              >
                <p>{listing.name}</p>
              </Link>
              <div className='flex flex-col items-center'>
                <button
                  onClick={() => handleListingDelete(listing._id)}
                  className='text-red-700 uppercase'
                >
                  Delete
                </button>
                <Link to={`/update-listing/${listing._id}`}>
                  <button className='text-green-700 uppercase'>Edit</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Profile
