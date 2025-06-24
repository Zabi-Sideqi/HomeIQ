//client/src/pages/Favorites.jsx


import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import axios from 'axios';
import ListingItem from '../components/ListingItem';
import { apiUrl } from '../utils/api';

export default function Favorites() {
  const { token } = useSelector((state) => state.user);
  const [favoriteListings, setFavoriteListings] = useState([]);

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(apiUrl('/api/listing/favorites'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true, // För att skicka cookies
      });
      setFavoriteListings(res.data);
    } catch (error) {
      console.error('Kunde inte hämta favoriter:', error);
    }
  };

  useEffect(() => {
    const fetchFavoritesEffect = async () => {
      if (token) {
        await fetchFavorites();
      }
    };
    fetchFavoritesEffect();
    // eslint-disable-next-line
  }, [token]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Favorites</h1>
      <div className="flex flex-wrap gap-4">
        {favoriteListings.length === 0 ? (
          <p>You have no favorites yet.</p>
        ) : (
          favoriteListings.map((listing) => (
            <ListingItem
              key={listing._id}
              listing={listing}
              isFavorite={true}
              onFavoriteChange={fetchFavorites} // 👈 refetch efter uppdatering
            />
          ))
        )}
      </div>
    </div>
  );
}
