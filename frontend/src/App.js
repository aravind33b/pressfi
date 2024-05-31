import React from 'react';
import UploadForm from './components/UploadForm';
import PhotoGallery from './components/PhotoGallery';

function App() {
  return (
    <div className="App">
      <h1>Upload Image Metadata</h1>
      <UploadForm />
      <h1>Photo Gallery</h1>
      <PhotoGallery />
    </div>
  );
}

export default App;
