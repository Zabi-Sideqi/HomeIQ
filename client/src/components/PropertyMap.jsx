
// client/src/components/PropertyMap.jsx
// client/src/components/PropertyMap.jsx
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useEffect, useState, useRef } from 'react';

const containerStyle = {
  width: '100%',
  height: '500px'
};

const types = {
  school: 'Schools',
  day_care: 'Daycare',
  train_station: 'Train Stations',
  restaurant: 'Restaurants',
};

const PropertyMap = ({ address }) => {
  const [center, setCenter] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeType, setActiveType] = useState('school');
  const mapRef = useRef(null);

  // 🧭 Geocode address to get coordinates
  useEffect(() => {
    const geocode = async () => {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (data.results[0]) {
        const loc = data.results[0].geometry.location;
        setCenter(loc);
      }
    };
    geocode();
  }, [address]);

  // 📍 Fetch nearby places every time center or category changes
  useEffect(() => {
    if (!mapRef.current || !center) return;

    const service = new window.google.maps.places.PlacesService(mapRef.current);

    const request = {
      location: center,
      radius: 1500,
      type: activeType,
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setPlaces(results);
        setSelected(null);
      }
    });
  }, [activeType, center]);

  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold mb-2">Nearby {types[activeType]}</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(types).map(([key, label]) => (
          <button
            key={key}
            className={`px-3 py-1 rounded border ${
              activeType === key ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'
            }`}
            onClick={() => setActiveType(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {center && (
        <LoadScript
          googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
          libraries={['places']}
        >
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={15}
            onLoad={(map) => {
              mapRef.current = map;
            }}
          >
            {/* 🏠 Main property marker */}
            <Marker position={center} title="Property Location" />

            {/* 📌 Nearby markers */}
            {places.map((place, index) => (
              <Marker
                key={index}
                position={place.geometry.location}
                onClick={() => setSelected(place)}
                title={place.name}
              />
            ))}

            {/* 🪧 Info window for selected place */}
            {selected && (
              <InfoWindow
                position={selected.geometry.location}
                onCloseClick={() => setSelected(null)}
              >
                <div>
                  <strong>{selected.name}</strong>
                  <p>{selected.vicinity}</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      )}
    </div>
  );
};

export default PropertyMap;


