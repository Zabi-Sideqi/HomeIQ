//client/src/components/ListingItem.jsx
// client/src/components/ListingItem.jsx

import { Link } from 'react-router-dom';
import { MdLocationOn } from 'react-icons/md';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserSuccess } from '../redux/user/userSlice';

export default function ListingItem({ listing, onFavoriteChange }) {
  const dispatch = useDispatch();
  const { currentUser, token } = useSelector((state) => state.user);

  const isFavorite = currentUser?.favorites?.includes(listing._id);

  const handleFavorite = async () => {
    if (!currentUser || !currentUser._id) {
      console.warn("No user logged in – cannot toggle favorite");
      return;
    }

    try {
      const res = await axios.put(`/api/user/favorites/${listing._id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch(updateUserSuccess({ user: { ...currentUser, favorites: res.data.favorites } }));
      if (onFavoriteChange) onFavoriteChange();
    } catch (err) {
      console.error("Could not update favorite status:", err);
    }
  };

  const openDirections = () => {
    if (!listing?.address) {
      alert("No address provided for this listing.");
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const origin = `${position.coords.latitude},${position.coords.longitude}`;
          const destination = encodeURIComponent(listing.address);
          const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&destination_place_id=${listing.name}`;
          window.open(url, '_blank');
        },
        () => {
          alert("Could not retrieve your location.");
        }
      );
    } else {
      alert("Your browser does not support location services.");
    }
  };

  return (
    <div className="bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden rounded-lg w-full sm:w-[330px]">
      <div className="relative">
        <Link to={`/listing/${listing._id}`}>
          <img
            src={listing.imageUrls[0]}
            alt="listing cover"
            className="h-[320px] sm:h-[220px] w-full object-cover hover:scale-105 duration-300"
          />
        </Link>

        {token && (
          <button
            onClick={handleFavorite}
            className="absolute top-2 right-2 text-2xl"
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? "💖" : "🤍"}
          </button>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 w-full">
        <p className="text-lg font-semibold text-slate-700 truncate">{listing.name}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MdLocationOn className="h-5 w-5 text-green-500" />
            <span className="text-sm text-slate-500 truncate">{listing.address}</span>
          </div>
          <button
            onClick={openDirections}
            className="text-blue-600 text-xs hover:underline"
          >
            Directions
          </button>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">{listing.description}</p>

        <p className="text-lg font-semibold text-slate-500 mt-2">
          {listing.offer ? listing.discountPrice : listing.regularPrice}
          {listing.type === 'rent' && '/month'} $
        </p>

        <div className="text-slate-700 flex gap-4">
          <div className="font-bold text-xs">
            {listing.bedrooms > 1 ? `${listing.bedrooms} beds` : '1 bed'}
          </div>
          <div className="font-bold text-xs">
            {listing.bathrooms > 1 ? `${listing.bathrooms} baths` : '1 bath'}
          </div>
        </div>
      </div>
    </div>
  );
}

