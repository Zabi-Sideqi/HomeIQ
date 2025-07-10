//client/src/pages/CreateListing.jsx

import React, { useState } from 'react'
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
  const { currentUser } = useSelector((state) => state.user)
  const [files, setFiles] = useState([])
  const [formData, setFormData] = useState({
    imageUrls: [],
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

  const geocodeAddress = async () => {
    try {
      const fullAddress =
        `${formData.address}, ${formData.location.city}, ${formData.location.postcode}`.trim()
      const response = await fetch(
        apiUrl(`/api/listing/geocode?address=${encodeURIComponent(fullAddress)}`),
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
      <h1 className='text-3xl text-center font-semibold mt-4 my-7'>
        Create Listing
      </h1>
      <form onSubmit={handleSubmit} className='flex flex-col sm:flex-row gap-6'>
        {/* Right Side */}
        <div className='flex flex-col flex-1 gap-4'>
          <p className='text-center font-semibold'>
            Images:
            <span className='font-normal text-gray-500 ml-2'>(Max 6 images)</span>
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
              className='p-3 text-green-700 border border-green-700 rounded-lg uppercase hover:shadow-lg disabled:opacity-80'
            >
              Upload
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
                          imageUrls: prev.imageUrls.filter((_, i) => i !== index),
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
            type='submit'
            className='p-3 text-white bg-slate-700 rounded-lg uppercase hover:shadow-lg'
          >
            Create Listing
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

