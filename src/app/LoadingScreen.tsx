import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--b0)',
        gap: 30,
      }}
    >
      <div style={{ position: 'relative' }}>
        <img
          src="assets/bolt.png"
          alt="Loading..."
          style={{
            width: 150,
            height: 150,
            objectFit: 'contain',
            animation: 'boltBounce 2s ease-in-out infinite',
            filter: 'drop-shadow(0 0 20px var(--ac)44)',
          }}
        />
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 900,
          color: 'var(--mu)',
          textTransform: 'uppercase',
          letterSpacing: 2,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      >
        YÜKLENİYOR...
      </div>
      <style>{`
        @keyframes boltBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

