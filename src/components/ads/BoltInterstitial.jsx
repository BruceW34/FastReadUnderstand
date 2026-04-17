import React, { useEffect, useState } from 'react';

/**
 * BoltInterstitial Component 🤖⚡
 * A large, animated overlay for Bolt to give advice or celebrate.
 */
export default function BoltInterstitial({ message, onDismiss, type = 'advice' }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2000,
      background: 'rgba(10, 10, 15, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30,
      opacity: show ? 1 : 0,
      transition: 'opacity 0.3s ease-out',
      textAlign: 'center'
    }}>
      <div style={{
        transform: show ? 'scale(1)' : 'scale(0.8)',
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 30,
        maxWidth: 500
      }}>
        <div style={{ position: 'relative' }}>
          <img 
            src="assets/bolt.png" 
            alt="Bolt" 
            style={{ 
              width: 220, 
              height: 220, 
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 30px var(--ac)44)'
            }} 
          />
          <div style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            background: 'var(--ac)',
            color: 'white',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
          }}>⚡</div>
        </div>

        <div style={{
          background: 'var(--b2)',
          padding: '24px 30px',
          borderRadius: 24,
          position: 'relative',
          border: '2px solid var(--b3)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          {/* Bubble Tail */}
          <div style={{
            position: 'absolute',
            top: -15,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '15px solid transparent',
            borderRight: '15px solid transparent',
            borderBottom: '15px solid var(--b3)'
          }} />
          
          <div style={{ 
            fontSize: 18, 
            lineHeight: 1.6, 
            fontWeight: 800, 
            color: 'var(--tx)',
            fontFamily: 'Inter, sans-serif'
          }}>
            {message}
          </div>
        </div>

        <button 
          className="btn bp" 
          onClick={handleClose}
          style={{ 
            padding: '14px 40px', 
            fontSize: 16, 
            fontWeight: 900,
            borderRadius: 30,
            marginTop: 10
          }}
        >
          ANLAŞILDI! 🚀
        </button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .bolt-overlay img {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
