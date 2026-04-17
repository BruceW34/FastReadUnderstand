import React from 'react';

// ─── BOLT COACH (Mascot Tip Component) ──────────────────────────────────────
export function BoltCoach({ message, style = {} }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '12px 18px',
      background: 'rgba(124,58,237,0.08)',
      border: '1px solid rgba(124,58,237,0.2)',
      borderRadius: 16,
      marginBottom: 4,
      ...style
    }}>
      <style>{`
        @keyframes boltBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      `}</style>
      <img
        src="assets/bolt.png"
        alt="Bolt"
        onError={(e) => { e.target.src = '/assets/bolt.png'; }}
        style={{
          width: 60, height: 60,
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 8px rgba(124,58,237,0.5))',
          animation: 'boltBounce 2s ease-in-out infinite',
          flexShrink: 0,
        }}
      />
      <div style={{ fontSize: 13, fontWeight: 700, fontStyle: 'italic', color: 'var(--tx, #fff)', lineHeight: 1.5 }}>
        "{message}"
      </div>
    </div>
  );
}