import React, { useState } from 'react';
import axios from 'axios';

const pinataApiKey = '4ea7341ae9dc78b938f8'; // Replace with your Pinata API key
const pinataSecretApiKey = 'ccf4da5d80e0a7317a862d3abfbddf802cd750740a877e7de00298d8d61f5679'; // Replace with your Pinata Secret API key

async function uploadToPinata(file) {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

  let data = new FormData();
  data.append('file', file);

  const res = await axios.post(url, data, {
    maxContentLength: 'Infinity', 
    headers: {
      'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretApiKey,
    }
  });
  return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
}

function UploadForm() {
  const [formData, setFormData] = useState({
    url: '',
    description: '',
    date: '',
    time: '',
    location: '',
    image: null,
  });
  const [response, setResponse] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'image') {
      setFormData({
        ...formData,
        image: e.target.files[0],
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const imageUrl = await uploadToPinata(formData.image);

      const metadata = {
        url: imageUrl,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
      };

      const res = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: JSON.stringify(metadata),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const text = await res.text();
      try {
        const result = JSON.parse(text);
        setResponse('Success: ' + JSON.stringify(result));
      } catch (error) {
        setResponse('Error parsing JSON: ' + text);
      }
    } catch (error) {
      setResponse('Error: ' + error.toString());
    }
  };

  const handleRetrieve = async (url) => {
    try {
      const res = await fetch('http://localhost:3000/retrieve', {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const result = await res.json();
      setResponse('Retrieved Metadata: ' + JSON.stringify(result.data));
    } catch (error) {
      setResponse('Error: ' + error.toString());
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" id="image" name="image" accept="image/*" onChange={handleChange} required /><br /><br />
        <input type="text" name="description" placeholder="Description" value={formData.description} onChange={handleChange} required /><br /><br />
        <input type="date" name="date" value={formData.date} onChange={handleChange} required /><br /><br />
        <input type="time" name="time" value={formData.time} onChange={handleChange} required /><br /><br />
        <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} required /><br /><br />
        <button type="submit">Upload</button>
      </form>
      <button onClick={() => handleRetrieve(formData.url)}>Retrieve Metadata</button>
      <div id="response">{response}</div>
    </div>
  );
}

export default UploadForm;