/**
 * PageWrapper.jsx
 * Tüm ders sayfalarını saran, kitap çevirme / slide animasyonu ekleyen wrapper.
 * Kullanım: <PageWrapper><FlashRead ... /></PageWrapper>
 */
import { useEffect, useRef } from 'react';

// ─── Global animasyon stilleri (bir kez inject et) ───────────────────────────
let styleInjected = false;
function injectStyles() {
  if (styleInjected || typeof document === 'undefined') return;
  styleInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    /* ── Sayfa Giriş Animasyonları ── */
    @keyframes pageFlipIn {
      0%   { opacity: 0; transform: perspective(900px) rotateY(-18deg) translateX(-30px); }
      60%  { opacity: 1; transform: perspective(900px) rotateY(3deg) translateX(4px); }
      100% { opacity: 1; transform: perspective(900px) rotateY(0deg) translateX(0); }
    }
    @keyframes pageSlideUp {
      from { opacity: 0; transform: translateY(22px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pageFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes cardReveal {
      from { opacity: 0; transform: translateY(14px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes shimmerSlide {
      from { background-position: -200% 0; }
      to   { background-position: 200% 0; }
    }
    @keyframes pulseGlow {
      0%,100% { box-shadow: 0 0 0 0 transparent; }
      50%      { box-shadow: 0 0 16px 4px var(--glow-color, rgba(124,58,237,.4)); }
    }
    @keyframes countUp {
      from { transform: translateY(8px); opacity: 0; }
      to   { transform: translateY(0);  opacity: 1; }
    }
    @keyframes successPop {
      0%   { transform: scale(0.8); opacity: 0; }
      60%  { transform: scale(1.1); }
      100% { transform: scale(1);   opacity: 1; }
    }
    @keyframes wrongShake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-6px); }
      40%     { transform: translateX(6px); }
      60%     { transform: translateX(-4px); }
      80%     { transform: translateX(4px); }
    }
    @keyframes boltBounce {
      0%,100% { transform: translateY(0); }
      50%     { transform: translateY(-6px); }
    }
    @keyframes pulseBorder {
      0%,100% { opacity: .6; transform: scale(1); }
      50%     { opacity: 1;  transform: scale(1.02); }
    }
    @keyframes tipSlide {
      from { opacity: 0; transform: translateX(-10px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* ── Stagger yardımcı sınıflar ── */
    .stagger-1 { animation-delay: .05s !important; }
    .stagger-2 { animation-delay: .10s !important; }
    .stagger-3 { animation-delay: .15s !important; }
    .stagger-4 { animation-delay: .20s !important; }
    .stagger-5 { animation-delay: .25s !important; }

    /* ── Kart hover efekti ── */
    .page-card-hov {
      transition: transform .2s ease, box-shadow .2s ease !important;
    }
    .page-card-hov:hover {
      transform: translateY(-3px) !important;
      box-shadow: 0 8px 24px rgba(0,0,0,.3) !important;
    }

    /* ── Buton hover ── */
    .btn-hov {
      transition: transform .15s ease, filter .15s ease !important;
    }
    .btn-hov:hover {
      transform: scale(1.04) !important;
      filter: brightness(1.1) !important;
    }
    .btn-hov:active {
      transform: scale(0.97) !important;
    }
  `;
  document.head.appendChild(s);
}

// ─── PageWrapper ─────────────────────────────────────────────────────────────
export function PageWrapper({ children, animationType = 'flip' }) {
  const ref = useRef(null);

  useEffect(() => {
    injectStyles();
  }, []);

  const animations = {
    flip:  'pageFlipIn .45s cubic-bezier(0.4, 0, 0.2, 1) both',
    slide: 'pageSlideUp .35s cubic-bezier(0.4, 0, 0.2, 1) both',
    fade:  'pageFadeIn .3s ease both',
  };

  return (
    <div
      ref={ref}
      style={{
        animation: animations[animationType] || animations.flip,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
}

// ─── AnimCard: stagger animasyonlu kart ──────────────────────────────────────
export function AnimCard({ children, delay = 0, style = {}, className = '', ...rest }) {
  useEffect(() => { injectStyles(); }, []);
  return (
    <div
      className={`page-card-hov ${className}`}
      style={{
        animation: `cardReveal .4s cubic-bezier(0.4,0,0.2,1) ${delay}s both`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

// ─── StatBadge: sayı animasyonlu rozet ───────────────────────────────────────
export function StatBadge({ icon, value, label, color, delay = 0 }) {
  useEffect(() => { injectStyles(); }, []);
  return (
    <div style={{
      textAlign: 'center',
      flex: '1 1 80px',
      padding: '12px 8px',
      borderRadius: 14,
      background: 'rgba(255,255,255,.03)',
      border: '1px solid rgba(255,255,255,.07)',
      animation: `cardReveal .4s ${delay}s both`,
    }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{
        fontSize: 22,
        fontWeight: 900,
        fontFamily: 'var(--mo, monospace)',
        color,
        animation: `countUp .35s ${delay + .1}s both`,
      }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--mu,#888)', textTransform: 'uppercase', letterSpacing: .6, marginTop: 3 }}>{label}</div>
    </div>
  );
}

// ─── TipBox: bilim ipucu kutusu ───────────────────────────────────────────────
export function TipBox({ children }) {
  useEffect(() => { injectStyles(); }, []);
  return (
    <div
      className="tip-box"
      style={{ animation: 'tipSlide .4s .1s both' }}
    >
      {children}
    </div>
  );
}

// ─── HeaderSection ────────────────────────────────────────────────────────────
export function HeaderSection({ icon, title, subtitle }) {
  useEffect(() => { injectStyles(); }, []);
  return (
    <div style={{ animation: 'pageSlideUp .3s both' }}>
      <div className="st">{icon} {title}</div>
      <div className="ss">{subtitle}</div>
    </div>
  );
}
