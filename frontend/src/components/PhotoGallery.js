import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PhotoGallery.css';

const gatewayUrl = 'https://gateway.pinata.cloud/ipfs/';

function PhotoGallery() {
  const [photos, setPhotos] = useState([]);
  const [buyerWallet, setBuyerWallet] = useState('');

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await axios.get('http://localhost:3000/photos');
        if (res.data.metadata) {
          setPhotos(res.data.metadata);
        } else {
          console.error('No metadata found in response');
        }
      } catch (error) {
        console.error('Failed to fetch photos', error);
      }
    };
    fetchPhotos();
  }, []);

  const handleBuy = async (url) => {
    try {
      const res = await axios.post('http://localhost:3000/buy', {
        image_url: url,
        buyer_wallet: buyerWallet
      });
      if (res.data.message === 'Purchase successful') {
        setPhotos(photos.filter(photo => photo.url !== url));
      }
    } catch (error) {
      console.error('Failed to buy photo', error);
    }
  };

  return (
    <div className="photo-gallery">
      <input
        type="text"
        placeholder="Enter your wallet address"
        value={buyerWallet}
        onChange={(e) => setBuyerWallet(e.target.value)}
      />
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
          <button className="buy-button" onClick={() => handleBuy(photo.url)}>Buy</button>
        </div>
      ))}
    </div>
  );
}

export default PhotoGallery;
