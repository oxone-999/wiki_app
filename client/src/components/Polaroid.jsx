import { mediumUrl } from '../api/client.js';
import '../styles/polaroid.css';

/**
 * Simple upright pink-tinted polaroid.
 * @param filename - image file in server/photos/ (optional -> placeholder)
 * @param caption  - handwritten caption under the photo
 * @param width    - px width
 */
export default function Polaroid({ filename, caption = '', width = 200 }) {
  return (
    <figure className="polaroid" style={{ '--pol-w': `${width}px`, margin: 0 }}>
      {filename ? (
        <img className="polaroid-img" src={mediumUrl(filename)} alt={caption || 'photo'} />
      ) : (
        <div className="polaroid-placeholder">drop a photo here</div>
      )}
      <figcaption className="polaroid-caption">{caption || ' '}</figcaption>
    </figure>
  );
}
