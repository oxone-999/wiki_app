import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import WishModal from '../components/WishModal.jsx';
import { Spiders, Bats } from '../components/GothCreatures.jsx';
import { createStormAudio } from '../components/StormAudio.js';
import { useMicBlow } from '../components/useMicBlow.js';
import { mediumUrl } from '../api/client.js';
import '../styles/gothic.css';

// 3rd blow must be stronger ("blow it harder!") to actually win.
// This is "excess loudness over the ambient floor" (0..1). Raise = harder blow
// needed; lower = easier. ~0.2 = a clear deliberate blow.
const STRONG = 0.2;
const NUM_CANDLES = 5;

// Put a file named hero.jpg in server/photos/ for her main portrait.
const HERO = 'hero.jpg';

// A jagged lightning bolt path (static SVG; CSS animates its opacity/flash).
function Bolt({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d="M52 0 L40 38 L58 40 L34 100 L46 52 L28 50 Z" />
    </svg>
  );
}

function Storm() {
  return (
    <div className="storm">
      <div className="storm-flash f1" />
      <div className="storm-flash f2" />
      <div className="storm-flash f3" />
      <Bolt className="lightning-bolt" />
      <Bolt className="lightning-bolt b2" />
      <Bolt className="lightning-bolt b3" />
    </div>
  );
}

export default function BirthdayGate() {
  const navigate = useNavigate();
  const [blown, setBlown] = useState(false);
  const [showWish, setShowWish] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [heroOk, setHeroOk] = useState(true);
  const [sound, setSound] = useState(true);

  // Mic-blow candle ritual
  const [micOn, setMicOn] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [blowPrompt, setBlowPrompt] = useState('Blow out the candles 🎂');
  const blowCountRef = useRef(0);
  const candlesRef = useRef(null);

  const audioRef = useRef(null);
  const timersRef = useRef([]);

  // Live loudness -> tilt the flames (dangle in the wind). Written straight to
  // the DOM via a CSS var so we don't re-render every frame.
  const onFrame = (rms) => {
    if (rms === -1) {
      setMicDenied(true);
      setMicOn(false);
      return;
    }
    const el = candlesRef.current;
    if (!el) return;
    const deg = Math.min(rms * 140, 42); // how far the flames lean
    el.style.setProperty('--wind', `${deg}deg`);
    el.style.setProperty('--flameop', String(Math.max(0.25, 1 - rms * 2.2)));
  };

  // A blow gesture ended. First 2 always fail (for fun); 3rd needs a STRONG blow.
  const onBlow = (peak) => {
    if (blown) return;
    const n = (blowCountRef.current += 1);
    if (n >= 3 && peak >= STRONG) {
      setBlowPrompt('✨ poof — make your wish ✨');
      openRitual();
    } else if (n === 1) {
      setBlowPrompt('Ooo… the flames just laughed at you. Blow again!');
    } else if (n === 2) {
      setBlowPrompt('So close! Now blow it HARDER 🌬️💨');
    } else {
      setBlowPrompt('HARDER! Give it everything 🌪️');
    }
  };

  useMicBlow(micOn && !blown, { onFrame, onBlow });

  // Lazily create the storm-audio controller once.
  useEffect(() => {
    audioRef.current = createStormAudio();
    return () => audioRef.current?.stop();
  }, []);

  // Toggle the synth soundscape + schedule thunder to roughly match the
  // lightning flash loops (7s / 11s / 9.5s with their offsets in gothic.css).
  const toggleSound = () => {
    const a = audioRef.current;
    if (!a) return;
    if (sound) {
      a.stop();
      timersRef.current.forEach(clearInterval);
      timersRef.current = [];
      setSound(false);
    } else {
      a.start();
      const schedule = (period, offset, intensity) => {
        const id = setInterval(() => a.thunder(intensity), period);
        timersRef.current.push(id);
        setTimeout(() => a.thunder(intensity), offset);
      };
      schedule(7000, 200, 1);
      schedule(11000, 2500, 0.8);
      schedule(9500, 5200, 0.9);
      setSound(true);
    }
  };

  const openRitual = () => {
    setBlown(true);
    setTimeout(() => setShowWish(true), 700);
  };

  const enterWiki = () => {
    setShowWish(false);
    setLeaving(true);
    audioRef.current?.stop();
    setTimeout(() => navigate('/wiki'), 1100);
  };

  return (
    <div className="gothic">
      <Storm />
      <div className="goth-corner tl" />
      <div className="goth-corner tr" />
      <div className="goth-corner bl" />
      <div className="goth-corner br" />

      <Bats />
      <Spiders />

      <motion.h1
        className="goth-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        Happy Birthday
      </motion.h1>
      <motion.p
        className="goth-sub"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 1 }}
      >
        A night carved just for her — make a wish, then step into her world.
      </motion.p>

      {/* Candles — flames dangle to the live mic level via the --wind CSS var */}
      <div className="candles" ref={candlesRef}>
        {Array.from({ length: NUM_CANDLES }).map((_, i) => (
          <div className="candle" key={i}>
            <AnimatePresence>
              {!blown && (
                <motion.div
                  className="flame"
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0, y: -10 }}
                  transition={{ delay: i * 0.05 }}
                />
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Portrait */}
      <motion.div
        className="goth-frame"
        onClick={() => !blown && openRitual()}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9, duration: 1 }}
      >
        {heroOk ? (
          <img src={mediumUrl(HERO)} alt="her" onError={() => setHeroOk(false)} />
        ) : (
          <div className="goth-placeholder">
            put <b>&nbsp;hero.jpg&nbsp;</b> in&nbsp;server/photos
          </div>
        )}
      </motion.div>

      {/* Blow prompt + mic control */}
      {micOn && !blown ? (
        <p className="goth-hint blow-prompt">{blowPrompt}</p>
      ) : (
        <p className="goth-hint">{blown ? 'make your wish…' : '✦ tap your photo to begin ✦'}</p>
      )}

      {!blown && !micOn && (
        <button
          className="blow-btn"
          onClick={() => {
            setMicDenied(false);
            blowCountRef.current = 0;
            setBlowPrompt('Blow out the candles 🎂');
            // Silence the storm so its low-freq drone/thunder can't fake a blow.
            if (sound) {
              audioRef.current?.stop();
              timersRef.current.forEach(clearInterval);
              timersRef.current = [];
              setSound(false);
            }
            setMicOn(true);
          }}
        >
          🎤 Blow the candles (use your mic)
        </button>
      )}
      {micDenied && (
        <p className="blow-denied">mic blocked — just tap her photo instead 💗</p>
      )}

      <button className="music-toggle" onClick={toggleSound}>
        {sound ? '🔊 storm on' : '🔈 storm off'}
      </button>

      {showWish && (
        <WishModal onClose={() => setShowWish(false)} onGranted={enterWiki} />
      )}

      {/* Curtain transition */}
      <AnimatePresence>
        {leaving && (
          <div className="curtains">
            <motion.div
              className="curtain"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
            <motion.div
              className="curtain"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
