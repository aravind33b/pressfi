import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PhotoGallery.css';

const gatewayUrl = 'https://gateway.pinata.cloud/ipfs/';

function PhotoGallery() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const fetchPhotos = async (retryCount = 0) => {
      try {
        const res = await axios.get('http://localhost:3000/photos');
        if (res.data.metadata) {
          setPhotos(res.data.metadata);
        } else {
          console.error('No metadata found in response');
        }
      } catch (error) {
        if (error.response && error.response.status === 429 && retryCount < 3) {
          setTimeout(() => fetchPhotos(retryCount + 1), 1000 * (retryCount + 1));
        } else {
          console.error('Failed to fetch photos', error);
        }
      }
    };
    fetchPhotos();
  }, []);

  return (
    <div className="photo-gallery">
      {photos.map((photo, index) => (
        <div key={index} className="card">
          <img src={`${gatewayUrl}${photo.url}`} alt={`Photo ${index}`} className="card-img" />
          {/* <div className="card-info">
            <p>{photo.description}</p>
            <p>{photo.date}</p>
            <p>{photo.time}</p>
            <p>{photo.location}</p>
            <p>{photo.wallet_address}</p>
            <p>{photo.verification_status ? 'Verified' : 'Not Verified'}</p>
          </div> */}
        </div>
      ))}
    </div>
  );
}

export default PhotoGallery;
