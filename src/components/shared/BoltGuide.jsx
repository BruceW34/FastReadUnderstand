import React, { useState, useEffect } from 'react';

/**
 * BoltGuide Component ⚡
 * Duolingo-style AI coach mascot
 */
export function BoltGuide({ message, type = 'tip', style = {} }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!visible) return null;

  const boltImg = 'assets/bolt.png';

  return (
    <div className="bolt-wrap" style={style}>
      <div className="bolt-bubble">
        <span>{message}</span>
      </div>
      <img
        src={boltImg}
        className="bolt-img"
        alt="Bolt Mascot"
        style={{
          width: 160,
          height: 160,
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 24px rgba(249, 115, 22, 0.6))',
          animation: 'boltFloat 3s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes boltFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(-5px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}

export function BoltPopup({ message, onDismiss }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 100,
      right: 20,
      zIndex: 1000,
      maxWidth: 300,
      animation: 'boltSlideIn 0.3s ease-out',
    }}>
      <BoltGuide message={message} />
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute',
          top: -10, right: -10,
          width: 20, height: 20,
          borderRadius: '50%',
          background: 'var(--b2)',
          border: 'none',
          color: 'var(--mu)',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >✕</button>
      <style>{`
        @keyframes boltSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}