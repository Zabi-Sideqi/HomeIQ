//client/src/pages/CreateListing.jsx

import React, { useState, useEffect } from 'react'
/* import { uploadImage } from '../utils/uploadImage' */
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage'
import { app } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSelector } from 'react-redux'
import { apiUrl } from '../utils/api'

export default function CreateListing() {
  const { currentUser, token } = useSelector((state) => state.user)
  const [files, setFiles] = useState([])
  const [userEligibility, setUserEligibility] = useState(null)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [formData, setFormData] = useState({
    imageUrls: [],
    thumbnailUrls: [],
    name: '',
    description: '',
    address: '',
    type: 'rent',
    propertyType: 'Detached',
    parking: false,
    furnished: false,
    offer: false,
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 0,
    discountPrice: 0,
    location: {
      postcode: '',
      city: '',
      coordinates: {
        lat: null,
        lng: null,
      },
    },
  })
  const [imageUploadError, setImageUploadError] = useState(false)
  const [uploading, setUploading] = useState(false)
  const navigate = useNavigate()

  // Check if user is authenticated
  useEffect(() => {
    if (!currentUser || !token) {
      toast.error('Please log in to create a listing.')
      navigate('/sign-in')
    } else {
      checkListingEligibility()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, token, navigate])

  // Check user's listing eligibility
  const checkListingEligibility = async () => {
    try {
      const response = await fetch(apiUrl('/api/payment/check-eligibility'), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        setUserEligibility(data)
        if (!data.canCreate) {
          setShowUpgradePrompt(true)
        }
      }
    } catch (error) {
      console.error('Error checking eligibility:', error)
    }
  }

  const handleChange = (e) => {
    const { id, value } = e.target
    if (id === 'postcode' || id === 'city') {
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [id]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [id]: value,
      }))
    }
  }

  const handleImageSubmit = () => {
    if (files.length > 0 && files.length + formData.imageUrls.length <= 6) {
      const promises = []
      setUploading(true)
      for (let i = 0; i < files.length; i++) {
        promises.push(storeImage(files[i]))
      }
      Promise.all(promises)
        .then((urls) => {
          setFormData((prev) => ({
            ...prev,
            imageUrls: [...prev.imageUrls, ...urls],
          }))
          setImageUploadError(false)
          toast.success('Images uploaded successfully!')
        })
        .catch((error) => {
          console.error('Error uploading images:', error)
          setImageUploadError('Error uploading images. Max 2MB per image.')
          toast.error('Image upload failed!')
        })
        .finally(() => {
          setUploading(false)
        })
    } else if (files.length === 0) {
      setImageUploadError('Please select at least one image to upload.')
      toast.error('No images selected.')
    } else {
      setImageUploadError('You can only upload a maximum of 6 images.')
      toast.error('Too many images.')
    }
  }

  const storeImage = async (file) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage(app)
      const fileName = new Date().getTime() + file.name
      const storageRef = ref(storage, fileName)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log('Upload is ' + progress + '% done')
        },
        (error) => {
          reject(error)
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            console.log('Generated Firebase Storage URL:', downloadURL)
            resolve(downloadURL)
          })
        }
      )
    })
  }

  /*     const storeImage = async (file) => {
  try {
    const { imageUrl, thumbnailUrl } = await uploadImage(file);

    setFormData((prev) => ({
      ...prev,
      thumbnailUrls: prev.thumbnailUrls
        ? [...prev.thumbnailUrls, thumbnailUrl]
        : [thumbnailUrl],
    }));

    return imageUrl;
  } catch (err) {
    console.error("Image upload failed:", err);
    throw err;
  }
};
 */

  const geocodeAddress = async () => {
    try {
      const fullAddress =
        `${formData.address}, ${formData.location.city}, ${formData.location.postcode}`.trim()
      const response = await fetch(
        apiUrl(
          `/api/listing/geocodeAddress?address=${encodeURIComponent(
            fullAddress
          )}`
        ),
        { credentials: 'include' }
      )
      const data = await response.json()

      if (data.success && data.coordinates) {
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: {
              lat: data.coordinates.lat,
              lng: data.coordinates.lng,
            },
          },
        }))
        toast.success('Address geocoded successfully!')
        return true
      } else {
        toast.warning(
          'Could not geocode address. Please check the address details.'
        )
        return false
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      toast.warning(
        'Could not geocode address. Listing will be created without coordinates.'
      )
      return false
    }
  }

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel?')) {
      navigate('/profile')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Check if user is authenticated
    if (!currentUser || !token) {
      setImageUploadError('You must be logged in to create a listing.')
      toast.error('Please log in to create a listing.')
      return
    }

    // Check listing eligibility
    if (userEligibility && !userEligibility.canCreate) {
      toast.error(
        `You have reached your listing limit of ${userEligibility.listingLimit}. Please upgrade your plan to create more listings.`
      )
      setShowUpgradePrompt(true)
      return
    }

    if (
      formData.offer &&
      Number(formData.discountPrice) >= Number(formData.regularPrice)
    ) {
      setImageUploadError('Discount price must be lower than regular price.')
      toast.error('Discount price must be lower than regular price.')
      return
    }

    if (formData.imageUrls.length === 0) {
      setImageUploadError('Please upload at least one image.')
      toast.error('Please upload at least one image.')
      return
    }

    try {
      setUploading(true)
      setImageUploadError(false)

      if (
        !formData.location.coordinates.lat &&
        !formData.location.coordinates.lng
      ) {
        await geocodeAddress()
      }

      const res = await fetch(apiUrl('/api/listing/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          userRef: currentUser._id,
        }),
      })

      const data = await res.json()
      setUploading(false)

      if (data.success === false) {
        setImageUploadError(data.message)
        toast.error(data.message)
      } else {
        toast.success('Listing created successfully!')
        navigate(`/listing/${data._id}`)
      }
    } catch (error) {
      setUploading(false)
      setImageUploadError(error.message)
      toast.error('Something went wrong. Try again.')
    }
  }

  return (
    <main className='p-3 max-w-4xl mx-auto'>
      <ToastContainer />

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md mx-4'>
            <h2 className='text-xl font-bold text-gray-900 mb-4'>
              Listing Limit Reached
            </h2>
            <p className='text-gray-600 mb-4'>
              You've reached your limit of {userEligibility?.listingLimit}{' '}
              listing(s). Upgrade your plan to create more listings.
            </p>
            <div className='flex gap-3'>
              <button
                onClick={() => navigate('/pricing')}
                className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700'
              >
                View Plans
              </button>
              <button
                onClick={() => setShowUpgradePrompt(false)}
                className='flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Status Banner */}
      {userEligibility && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            userEligibility.canCreate
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className='flex items-center justify-between'>
            <div>
              <h3
                className={`font-medium ${
                  userEligibility.canCreate ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {userEligibility.canCreate
                  ? 'Ready to Create'
                  : 'Limit Reached'}
              </h3>
              <p
                className={`text-sm ${
                  userEligibility.canCreate ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {userEligibility.remainingListings} of{' '}
                {userEligibility.listingLimit} listings remaining
              </p>
            </div>
            {!userEligibility.canCreate && (
              <button
                onClick={() => navigate('/pricing')}
                className='bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700'
              >
                Upgrade
              </button>
            )}
          </div>
        </div>
      )}

      <h1 className='text-3xl text-center font-semibold mt-4 my-7'>
        Create Listing
      </h1>
      <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-6'>
        {/* Left Side - Form Fields */}
        <div className='flex flex-col flex-1 gap-4'>
          <input
            type='text'
            id='name'
            placeholder='Property Name/Title'
            value={formData.name}
            onChange={handleChange}
            required
            maxLength='62'
            minLength='10'
            className='border border-slate-300 rounded-lg p-3'
          />

          <textarea
            type='text'
            id='description'
            placeholder='Description'
            value={formData.description}
            onChange={handleChange}
            required
            rows='6'
            className='border border-slate-300 rounded-lg p-3'
          />

          <input
            type='text'
            id='address'
            placeholder='Address'
            value={formData.address}
            onChange={handleChange}
            required
            className='border border-slate-300 rounded-lg p-3'
          />

          <div className='flex gap-4'>
            <input
              type='text'
              id='city'
              placeholder='City'
              value={formData.location.city}
              onChange={handleChange}
              className='border border-slate-300 rounded-lg p-3 flex-1'
            />

            <input
              type='text'
              id='postcode'
              placeholder='Postcode'
              value={formData.location.postcode}
              onChange={handleChange}
              className='border border-slate-300 rounded-lg p-3 flex-1'
            />
          </div>

          <div className='flex gap-6'>
            <div className='flex items-center gap-2'>
              <input
                type='radio'
                id='sale'
                name='type'
                value='sale'
                checked={formData.type === 'sale'}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, type: 'sale' }))
                }
                className='w-5'
              />
              <label htmlFor='sale'>Sell</label>
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='radio'
                id='rent'
                name='type'
                value='rent'
                checked={formData.type === 'rent'}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, type: 'rent' }))
                }
                className='w-5'
              />
              <label htmlFor='rent'>Rent</label>
            </div>
          </div>

          <div className='mb-4'>
            <label
              htmlFor='propertyType'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Property Type
            </label>
            <select
              id='propertyType'
              value={formData.propertyType}
              onChange={handleChange}
              className='border border-slate-300 rounded-lg p-3 w-full'
            >
              <option value='Detached'>Detached</option>
              <option value='Semi-detached'>Semi-detached</option>
              <option value='Terraced'>Terraced</option>
              <option value='Flat'>Flat</option>
              <option value='Bungalow'>Bungalow</option>
              <option value='Park Home'>Park Home</option>
              <option value='Land'>Land</option>
              <option value='Student Halls'>Student Halls</option>
            </select>
          </div>

          <div className='flex gap-6 flex-wrap'>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='parking'
                checked={formData.parking}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    parking: e.target.checked,
                  }))
                }
                className='w-5'
              />
              <label htmlFor='parking'>Parking spot</label>
            </div>

            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='furnished'
                checked={formData.furnished}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    furnished: e.target.checked,
                  }))
                }
                className='w-5'
              />
              <label htmlFor='furnished'>Furnished</label>
            </div>

            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='offer'
                checked={formData.offer}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    offer: e.target.checked,
                  }))
                }
                className='w-5'
              />
              <label htmlFor='offer'>Offer</label>
            </div>
          </div>

          <div className='flex gap-6'>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                id='bedrooms'
                min='1'
                max='10'
                value={formData.bedrooms}
                onChange={handleChange}
                required
                className='border border-slate-300 rounded-lg p-3 w-20'
              />
              <label htmlFor='bedrooms'>Beds</label>
            </div>

            <div className='flex items-center gap-2'>
              <input
                type='number'
                id='bathrooms'
                min='1'
                max='10'
                value={formData.bathrooms}
                onChange={handleChange}
                required
                className='border border-slate-300 rounded-lg p-3 w-20'
              />
              <label htmlFor='bathrooms'>Baths</label>
            </div>
          </div>

          <div className='flex gap-6'>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                id='regularPrice'
                min='50'
                max='10000000'
                value={formData.regularPrice}
                onChange={handleChange}
                required
                className='border border-slate-300 rounded-lg p-3'
              />
              <div className='flex flex-col items-center'>
                <p>Regular price</p>
                {formData.type === 'rent' && (
                  <span className='text-xs'>($ / month)</span>
                )}
              </div>
            </div>

            {formData.offer && (
              <div className='flex items-center gap-2'>
                <input
                  type='number'
                  id='discountPrice'
                  min='0'
                  max='10000000'
                  value={formData.discountPrice}
                  onChange={handleChange}
                  required
                  className='border border-slate-300 rounded-lg p-3'
                />
                <div className='flex flex-col items-center'>
                  <p>Discounted price</p>
                  {formData.type === 'rent' && (
                    <span className='text-xs'>($ / month)</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type='button'
            onClick={geocodeAddress}
            className='p-3 text-blue-700 border border-blue-700 rounded-lg uppercase hover:shadow-lg disabled:opacity-80'
          >
            Geocode Address
          </button>
        </div>

        {/* Right Side - Images */}
        <div className='flex flex-col flex-1 gap-4'>
          <p className='text-center font-semibold'>
            Images:
            <span className='font-normal text-gray-500 ml-2'>
              (Max 6 images)
            </span>
          </p>

          <div className='flex gap-4'>
            <input
              onChange={(e) => setFiles(e.target.files)}
              type='file'
              id='images'
              accept='image/*'
              multiple
              className='border border-slate-300 rounded-lg p-3'
            />
            <button
              type='button'
              onClick={handleImageSubmit}
              disabled={uploading}
              className='p-3 text-green-700 border border-green-700 rounded-lg uppercase hover:shadow-lg disabled:opacity-80'
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {uploading && (
            <p className='text-center text-blue-600'>Uploading images...</p>
          )}
          {imageUploadError && (
            <p className='text-center text-red-600'>{imageUploadError}</p>
          )}

          {formData.imageUrls.length > 0 && (
            <div className='flex flex-col gap-2'>
              {formData.imageUrls.map((url, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between border p-2 rounded-lg gap-4'
                >
                  <div className='w-32 h-20'>
                    <img
                      src={url}
                      alt='Uploaded'
                      className='w-full h-full object-cover rounded-lg'
                    />
                  </div>
                  <button
                    type='button'
                    onClick={() => {
                      if (window.confirm('Delete this image?')) {
                        setFormData((prev) => ({
                          ...prev,
                          imageUrls: prev.imageUrls.filter(
                            (_, i) => i !== index
                          ),
                          thumbnailUrls: prev.thumbnailUrls
                            ? prev.thumbnailUrls.filter((_, i) => i !== index)
                            : [],
                        }))
                        toast.info('Image deleted.')
                      }
                    }}
                    className='p-2 text-red-700 border border-red-700 rounded-lg uppercase hover:shadow-lg hover:opacity-85'
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            disabled={uploading}
            type='submit'
            className='p-3 text-white bg-slate-700 rounded-lg uppercase hover:shadow-lg disabled:opacity-80'
          >
            {uploading ? 'Creating...' : 'Create Listing'}
          </button>

          <button
            type='button'
            onClick={handleCancel}
            className='p-3 text-white bg-red-700 rounded-lg uppercase hover:shadow-lg'
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  )
}
