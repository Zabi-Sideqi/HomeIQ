// client/src/pages/Home.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import SwiperCore from 'swiper'
import 'swiper/swiper-bundle.css'
import 'swiper/css/bundle'
import ListingItem from '../components/ListingItem'
import { useTranslation } from 'react-i18next'
import { apiUrl } from '../utils/api'

export default function Home() {
  const [offerListings, setOfferListings] = useState([])
  const [saleListings, setSaleListings] = useState([])
  const [rentListings, setRentListings] = useState([])
  const { t } = useTranslation()

  SwiperCore.use([Navigation])

  useEffect(() => {
    const fetchOfferListings = async () => {
      try {
        const res = await fetch(apiUrl('/api/listing/get?offer=true&limit=6'), {
          credentials: 'include',
        })
        const data = await res.json()
        setOfferListings(data)
        fetchRentListings()
      } catch (error) {
        console.error('❌ Error fetching offer listings:', error)
      }
    }

    const fetchRentListings = async () => {
      try {
        const res = await fetch(apiUrl('/api/listing/get?type=rent&limit=6'), {
          credentials: 'include',
        })
        const data = await res.json()
        setRentListings(data)
        fetchSaleListings()
      } catch (error) {
        console.error('❌ Error fetching rent listings:', error)
      }
    }

    const fetchSaleListings = async () => {
      try {
        const res = await fetch(apiUrl('/api/listing/get?type=sale&limit=6'), {
          credentials: 'include',
        })
        const data = await res.json()
        setSaleListings(data)
      } catch (error) {
        console.error('❌ Error fetching sale listings:', error)
      }
    }

    fetchOfferListings()
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <div className='flex flex-col gap-6 p-28 px-3 max-w-6xl mx-auto'>
        <h1 className='text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-700 leading-tight'>
          {t('homeTitle1')}{' '}
          <span className='text-slate-500'>{t('homeTitle2')}</span>
          <br />
          <span className='text-slate-500'>{t('homeTitle3')}</span>
        </h1>

        <div className='text-gray-500 text-sm sm:text-base leading-relaxed max-w-3xl'>
          {t('homeIntro')}
        </div>

        <Link
          to='/search'
          className='text-sm sm:text-base text-blue-800 font-bold hover:underline'
        >
          {t('homeStart')}
        </Link>
      </div>

      {/* Swiper */}
      <Swiper navigation>
        {offerListings?.length > 0 &&
          offerListings.map((listing) => (
            <SwiperSlide key={listing._id}>
              <div
                style={{
                  background: `url(${listing.imageUrls[0]}) center no-repeat`,
                  backgroundSize: 'cover',
                }}
                className='h-[500px]'
              ></div>
            </SwiperSlide>
          ))}
      </Swiper>

      {/* Listings Sections */}
      <div className='max-w-6xl mx-auto p-3 flex flex-col gap-8 my-10'>
        {/* Offers */}
        {offerListings.length > 0 && (
          <ListingSection
            title='Recent offer'
            link='/search?offer=true'
            linkText='See all offers'
            listings={offerListings}
          />
        )}

        {/* Rent */}
        {rentListings.length > 0 && (
          <ListingSection
            title='Recent places for rent'
            link='/search?type=rent'
            linkText='Show more places for rent'
            listings={rentListings}
          />
        )}

        {/* Sale */}
        {saleListings.length > 0 && (
          <ListingSection
            title='Recent places for sale'
            link='/search?type=sale'
            linkText='Show more places for sale'
            listings={saleListings}
          />
        )}
      </div>
    </div>
  )
}

// 🔄 Reusable listing section
function ListingSection({ title, link, linkText, listings }) {
  return (
    <div>
      <div className='my-4'>
        <h2 className='text-2xl font-semibold text-slate-600'>{title}</h2>
        <Link
          to={link}
          className='text-xs sm:text-sm text-blue-800 font-bold hover:underline'
        >
          {linkText}
        </Link>
      </div>
      <div className='flex flex-wrap gap-4'>
        {listings.map((listing) => (
          <ListingItem listing={listing} key={listing._id} />
        ))}
      </div>
    </div>
  )
}
