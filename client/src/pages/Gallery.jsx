import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPhotos } from '../api/client.js';
import PhotoUniverse from '../components/PhotoUniverse.jsx';
import '../styles/gallery.css';

export default function Gallery() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    getPhotos().then(setPhotos).catch(() => setPhotos([]));
  }, []);

  return (
    <div className="gallery">
      <div className="gallery-overlay-top">
        <Link to="/wiki" className="gallery-back">← back to your page</Link>
        <h1>A Universe of You</h1>
        <p>drag to look around · scroll to fly · tap a photo to hold it close</p>
      </div>
      <PhotoUniverse photos={photos} />
    </div>
  );
}
