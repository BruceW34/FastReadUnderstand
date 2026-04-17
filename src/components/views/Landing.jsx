import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Landing({ onLogin, onDemoStart, addToast }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  
  // Auth states
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const curRef = useRef(null);
  const curRRef = useRef(null);

  const getAuthErrorMessage = (code) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Geçersiz e-posta adresi formatı. Lütfen kontrol edin.';
      case 'auth/user-disabled':
        return 'Bu hesap devre dışı bırakılmış.';
      case 'auth/user-not-found':
        return 'Kullanıcı bulunamadı.';
      case 'auth/wrong-password':
        return 'Hatalı şifre.';
      case 'auth/email-already-in-use':
        return 'Bu e-posta adresi zaten kullanımda. Lütfen başka bir adres deneyin.';
      case 'auth/operation-not-allowed':
        return 'Giriş işlemine izin verilmiyor.';
      case 'auth/weak-password':
        return 'Şifre çok zayıf. En az 6 karakter olmalı.';
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
        return 'Hatalı giriş bilgileri. Lütfen e-posta ve şifrenizi kontrol edin.';
      case 'auth/network-request-failed':
        return 'İnternet bağlantısı hatası.';
      case 'auth/too-many-requests':
        return 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.';
      default:
        return `Bir hata oluştu: ${code || 'Bilinmeyen hata'}`;
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Reveal logic
    const revealElems = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      let delay = 0;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('vis'), delay);
          delay += 70;
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealElems.forEach(el => observer.observe(el));

    // Cursor logic
    const handleMouseMove = (e) => {
      if (curRef.current && curRRef.current) {
        curRef.current.style.left = curRRef.current.style.left = e.clientX + 'px';
        curRef.current.style.top = curRRef.current.style.top = e.clientY + 'px';
      }
    };
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const openModal = (tab = 'login') => {
    setAuthTab(tab);
    setModalOpen(true);
    setErr('');
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = '';
  };

  const handleLogin = async () => {
    if (!email || !pass) return setErr('Lütfen tüm alanları doldurun.');
    setLoading(true); setErr('');
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      if (addToast) addToast({ msg: 'Giriş başarılı! Hoş geldin.', color: '#10b981', icon: '👋' });
      // Modal'ı kapat ve form'u sıfırla
      setTimeout(() => {
        closeModal();
        setEmail('');
        setPass('');
        setName('');
      }, 500);
    } catch (e) {
      console.error('Login error:', e);
      setErr(getAuthErrorMessage(e.code));
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!email || !pass || !name) return setErr('Lütfen tüm alanları doldurun.');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setErr('Geçersiz e-posta formatı (örn: ad@örnek.com)');
    if (pass.length < 6) return setErr('Şifre en az 6 karakter olmalıdır.');
    setLoading(true); setErr('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      const userData = {
        id: cred.user.uid,
        name: name,
        email: email,
        xp: 0,
        tecrube: 0,
        level: 1,
        createdAt: new Date().toISOString(),
        sessions: [],
        avatar: '🚀'
      };
      await setDoc(doc(db, 'users', cred.user.uid), userData);
      if (addToast) addToast({ msg: 'Hesabın başarıyla oluşturuldu!', color: '#10b981', icon: '🎉' });
      // Modal'ı kapat ve form'u sıfırla
      setTimeout(() => {
        closeModal();
        setEmail('');
        setPass('');
        setName('');
      }, 500);
      if (onLogin) onLogin(userData);
    } catch (e) {
      console.error('Registration error:', e);
      setErr(getAuthErrorMessage(e.code));
    } finally { setLoading(false); }
  };

  return (
    <div className="landing-root">
      {/* Inline Global Styles for Landing Only */}
      <style>{`
        .landing-root {
          --bg:#04040A;--surface:#09090F;--card:#0C0C16;--border:rgba(255,255,255,0.06);
          --white:#F2F0EB;--gold:#DDB94A;--gold2:#F0A830;--glow:rgba(221,185,74,0.15);
          --blue:#1A3CFF;--red:#FF3131;--grey:#666680;--grey2:#3A3A52;
          background: var(--bg); color: var(--white); font-family: 'DM Sans', sans-serif;
          min-height: 100vh; position: relative; overflow-x: hidden;
        }
        .landing-root * { box-sizing: border-box; }
        .cur,.cur-r{position:fixed;top:0;left:0;pointer-events:none;z-index:9999;transform:translate(-50%,-50%)}
        .cur{width:8px;height:8px;background:var(--gold);border-radius:50%;mix-blend-mode:difference;transition:transform .12s}
        .cur-r{width:32px;height:32px;border:1.5px solid rgba(221,185,74,.5);border-radius:50%;transition:left .07s,top .07s;z-index:9998}
        
        header{position:fixed;inset:0 0 auto;z-index:800;display:flex;align-items:center;justify-content:space-between;padding:22px 64px;background:rgba(4,4,10,.82);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:1px solid var(--border);transition:padding .3s,background .3s}
        header.scrolled{padding:14px 64px;background:rgba(4,4,10,.95)}
        .logo{font-family:'Bebas Neue',sans-serif;font-size:1.9rem;letter-spacing:5px;color:var(--white)}
        .logo b{color:var(--gold)}
        
        nav{display:flex;gap:32px}
        nav a{font-family:'Syne',sans-serif;font-size:.72rem;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--grey);transition:color .2s}
        nav a:hover{color:var(--gold)}
        
        .hd-btns{display:flex;gap:10px;align-items:center}
        
        .hamburger{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:4px}
        .hamburger span{display:block;width:22px;height:1.5px;background:var(--white);transition:all .3s;border-radius:1px}
        .hamburger.open span:nth-child(1){transform:translateY(6.5px) rotate(45deg)}
        .hamburger.open span:nth-child(2){opacity:0}
        .hamburger.open span:nth-child(3){transform:translateY(-6.5px) rotate(-45deg)}
        
        .mobile-nav{display:none;position:fixed;inset:0;z-index:700;background:rgba(4,4,10,.97);backdrop-filter:blur(24px);flex-direction:column;align-items:center;justify-content:center;gap:32px;padding:100px 40px 60px}
        .mobile-nav.open{display:flex}
        .mobile-nav a.mn-link{font-family:'Bebas Neue',sans-serif;font-size:2.8rem;letter-spacing:3px;color:var(--white);transition:color .2s}
        
        .btn-ghost, .btn-cta, .btn-hero, .btn-outline {
          display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:'Syne',sans-serif;font-weight:700;letter-spacing:2px;text-transform:uppercase;border-radius:3px;transition:all .22s;border:none; cursor: pointer;
        }
        .btn-ghost{font-size:.72rem;padding:9px 20px;background:transparent;border:1px solid rgba(255,255,255,.18);color:var(--white)}
        .btn-ghost:hover{border-color:var(--gold);color:var(--gold)}
        .btn-cta{font-size:.72rem;padding:9px 20px;background:var(--gold);color:#000}
        .btn-cta:hover{background:var(--gold2);transform:translateY(-1px)}
        .btn-hero{font-size:.82rem;padding:17px 38px;background:var(--gold);color:#000;position:relative;overflow:hidden}
        .btn-hero span{position:relative;z-index:1}
        .btn-hero::after{content:'';position:absolute;inset:0;background:var(--gold2);transform:translateX(-101%);transition:transform .3s ease}
        .btn-hero:hover::after{transform:translateX(0)}
        .btn-outline{font-size:.82rem;padding:17px 38px;border:1px solid rgba(255,255,255,.2);color:var(--white);background:transparent}
        .btn-outline:hover{border-color:var(--gold);color:var(--gold)}

        .hero{min-height:100svh;display:flex;flex-direction:column;justify-content:center;padding:140px 64px 100px;position:relative;overflow:hidden}
        .hero-glow{position:absolute;inset:0;background:radial-gradient(ellipse 70% 55% at 65% 35%,rgba(26,60,255,.13) 0%,transparent 65%),radial-gradient(ellipse 45% 45% at 88% 75%,rgba(221,185,74,.1) 0%,transparent 55%),radial-gradient(ellipse 30% 30% at 10% 80%,rgba(221,185,74,.05) 0%,transparent 50%);pointer-events:none}
        .hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:72px 72px;pointer-events:none}
        .hero-h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(4.5rem,13vw,14rem);line-height:.88;letter-spacing:3px}
        .stroke{-webkit-text-stroke:1.5px rgba(255,255,255,.22);color:transparent}
        .gold{color:var(--gold)}
        
        .hero-aside{position:absolute;right:64px;bottom:100px;display:flex;flex-direction:column;gap:28px;align-items:flex-end}
        .h-stat-n{font-family:'Bebas Neue',sans-serif;font-size:2.8rem;line-height:1;color:var(--gold)}
        .h-stat-l{font-family:'Syne',sans-serif;font-size:.62rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--grey)}

        .ticker{overflow:hidden;border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:16px 0;background:rgba(221,185,74,.03)}
        .ticker-track{display:flex;gap:56px;width:max-content;animation:ticker 22s linear infinite}
        
        .section{padding:120px 64px;position:relative}
        .s-label{display:flex;align-items:center;gap:12px;font-family:'Syne',sans-serif;font-size:.65rem;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:18px}
        .s-label::after{content:'';width:36px;height:1px;background:var(--gold);opacity:.5}
        .s-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(3rem,7vw,7rem);line-height:.92;letter-spacing:2px;margin-bottom:64px}

        .stats-strip{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
        .stat-cell{padding:52px 40px;border-right:1px solid var(--border);text-align:center}
        .stat-cell:last-child{border-right:none}
        .stat-n{font-family:'Bebas Neue',sans-serif;font-size:4rem;line-height:1;color:var(--gold);letter-spacing:1px}
        .stat-l{font-family:'Syne',sans-serif;font-size:.65rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-top:8px}

        .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border)}
        .feat-card{background:var(--card);padding:52px 44px;position:relative;overflow:hidden;border:1px solid transparent;transition:background .3s,border-color .3s}
        .feat-card:hover{background:#111122;border-color:rgba(221,185,74,.12)}
        .feat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent);transform:scaleX(0);transform-origin:left;transition:transform .5s ease}
        .feat-card:hover::before{transform:scaleX(1)}
        .feat-n{font-family:'Bebas Neue',sans-serif;font-size:5rem;line-height:1;color:rgba(255,255,255,.03);position:absolute;top:16px;right:24px;pointer-events:none}
        .feat-icon{font-size:1.8rem;margin-bottom:22px;display:block}
        .feat-t{font-family:'Syne',sans-serif;font-size:1.05rem;font-weight:700;margin-bottom:12px}
        .feat-d{font-size:.88rem;line-height:1.75;color:rgba(242,240,235,.5)}

        .showcase{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;padding:120px 64px;background:linear-gradient(135deg,rgba(26,60,255,.04) 0%,transparent 60%);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
        .sc-text .s-title{margin-bottom:28px}
        .sc-text p{color:rgba(242,240,235,.55);font-size:.95rem;line-height:1.8;max-width:420px;margin-bottom:40px}
        .sc-btns{display:flex;gap:12px;flex-wrap:wrap}
        .phone-wrap{display:flex;justify-content:center;align-items:center;position:relative}
        .phone-wrap::before{content:'';position:absolute;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(26,60,255,.18),transparent 70%);filter:blur(40px);pointer-events:none}
        .phone{width:248px;background:#070710;border-radius:44px;border:2px solid rgba(255,255,255,.1);padding:18px;box-shadow:0 60px 140px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.04),inset 0 1px 0 rgba(255,255,255,.06);animation:float 5s ease-in-out infinite;position:relative;z-index:1}
        .phone::before{content:'';position:absolute;top:-2px;left:50%;transform:translateX(-50%);width:72px;height:22px;background:#070710;border-radius:0 0 14px 14px;border:2px solid rgba(255,255,255,.1);border-top:none}
        .phone-screen{background:linear-gradient(155deg,#0a0a1a,#131328);border-radius:32px;padding:22px 18px;min-height:460px}
        .ph-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
        .ph-logo{font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:3px;color:var(--gold)}
        .ph-av{width:28px;height:28px;background:linear-gradient(135deg,var(--blue),#0a1aaa);border-radius:50%}
        .ph-league{background:linear-gradient(135deg,rgba(26,60,255,.25),rgba(10,26,170,.15));border:1px solid rgba(26,60,255,.35);border-radius:14px;padding:16px;text-align:center;margin-bottom:14px}
        .ph-lt{font-family:'Syne',sans-serif;font-size:.58rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:4px}
        .ph-ln{font-family:'Bebas Neue',sans-serif;font-size:1.6rem;letter-spacing:2px;color:var(--gold)}
        .ph-speed{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px;margin-bottom:10px}
        .ph-sl{font-family:'Syne',sans-serif;font-size:.58rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-bottom:6px}
        .ph-sn{font-family:'Bebas Neue',sans-serif;font-size:1.9rem;color:var(--white);line-height:1}
        .ph-su{font-size:.6rem;color:var(--grey);letter-spacing:1px}
        .ph-bar-w{height:5px;background:rgba(255,255,255,.07);border-radius:3px;margin-top:8px;overflow:hidden}
        .ph-bar{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--blue),var(--gold));width:78%;animation:grow 2.5s ease both}
        .ph-mini{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .ph-mc{background:rgba(221,185,74,.06);border:1px solid rgba(221,185,74,.1);border-radius:10px;padding:10px;text-align:center}
        .ph-mn{font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:var(--gold);line-height:1}
        .ph-ml{font-family:'Syne',sans-serif;font-size:.56rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--grey);margin-top:3px}

        .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);margin-top:64px}
        .pc{background:var(--card);padding:52px 44px;border:1px solid transparent;position:relative;transition:background .3s}
        .pc:hover{background:#111122}
        .pc.feat{background:var(--gold);border-color:var(--gold);transform:scaleY(1.02);transform-origin:center}
        .pc.feat:hover{background:#e8c240}
        .pc-badge{position:absolute;top:-13px;left:40px;background:var(--red);color:#fff;font-family:'Syne',sans-serif;font-size:.6rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:4px 14px;border-radius:2px}
        .pc-plan{font-family:'Syne',sans-serif;font-size:.68rem;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--grey);margin-bottom:20px}
        .pc.feat .pc-plan{color:rgba(0,0,0,.55)}
        .pc-price{font-family:'Bebas Neue',sans-serif;font-size:5rem;line-height:1;letter-spacing:-1px}
        .pc-price small{font-family:'Syne',sans-serif;font-size:1.2rem;font-weight:300;vertical-align:middle}
        .pc-period{font-size:.8rem;color:var(--grey);margin-bottom:36px;margin-top:4px}
        .pc.feat .pc-period{color:rgba(0,0,0,.45)}
        .pc-feats{list-style:none;display:flex;flex-direction:column;gap:11px;margin-bottom:40px;padding:0}
        .pc-feats li{font-size:.88rem;line-height:1.5;display:flex;align-items:flex-start;gap:10px;color:rgba(242,240,235,.8);text-align:left}
        .pc.feat .pc-feats li{color:rgba(0,0,0,.8)}
        .pc-feats li::before{content:'✓';font-family:'Syne',sans-serif;font-weight:700;color:var(--gold);flex-shrink:0}
        .pc.feat .pc-feats li::before{color:#000}
        
        .val-banner{margin-top:48px;background:rgba(221,185,74,.05);border:1px solid rgba(221,185,74,.15);border-radius:4px;padding:44px;display:grid;grid-template-columns:1fr auto;gap:40px;align-items:center}
        .val-banner h3{font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:1px;color:var(--gold);margin-bottom:10px}
        .val-banner p{font-size:.88rem;line-height:1.7;color:rgba(242,240,235,.55);text-align:left}
        .val-nums{display:flex;gap:44px}
        .vn{text-align:center}
        .vn-n{font-family:'Bebas Neue',sans-serif;font-size:2.8rem;color:var(--gold);line-height:1}
        .vn-l{font-family:'Syne',sans-serif;font-size:.62rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--grey);margin-top:4px}

        .cta-sec{padding:140px 64px;text-align:center;background:linear-gradient(180deg,rgba(26,60,255,.06) 0%,rgba(221,185,74,.04) 100%);border-top:1px solid var(--border);position:relative;overflow:hidden}
        .cta-pill{display:inline-flex;align-items:center;gap:8px;background:rgba(255,49,49,.1);border:1px solid rgba(255,49,49,.3);color:#FF6B6B;font-family:'Syne',sans-serif;font-size:.65rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:6px 16px;border-radius:2px;margin-bottom:36px}
        .cta-dot{width:6px;height:6px;border-radius:50%;background:#FF6B6B;animation:blink 1.4s infinite}
        .cta-h{font-family:'Bebas Neue',sans-serif;font-size:clamp(3.5rem,9vw,9rem);line-height:.9;letter-spacing:3px;margin-bottom:28px}
        .cta-h span{color:var(--gold)}
        .cta-p{max-width:540px;margin:0 auto 52px;font-size:1rem;line-height:1.8;color:rgba(242,240,235,.58)}
        .cta-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:22px}
        .cta-inp{flex:1;min-width:240px;max-width:320px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:var(--white);font-family:'DM Sans',sans-serif;font-size:.9rem;padding:15px 20px;border-radius:3px;outline:none;transition:border-color .2s}
        .cta-inp:focus{border-color:var(--gold)}
        .cta-note{font-size:.76rem;color:var(--grey);margin-top:4px}

        .ac-wrap{display:grid;grid-template-columns:1fr 1px 1fr;gap:80px;padding:100px 64px;border-top:1px solid var(--border)}
        .ac-div{background:var(--border)}
        .ac-h{font-family:'Bebas Neue',sans-serif;font-size:2.8rem;letter-spacing:1px;margin-bottom:20px}
        .ac-p{font-size:.9rem;line-height:1.8;color:rgba(242,240,235,.55);margin-bottom:14px;text-align:left}
        .ac-p.hi{color:var(--gold);font-weight:500}
        .c-links{display:flex;flex-direction:column;margin-top:20px}
        .c-link{display:flex;align-items:center;gap:14px;color:rgba(242,240,235,.55);padding:16px 0;border-bottom:1px solid var(--border);transition:color .2s;font-size:.88rem;text-align:left}
        .c-link:hover{color:var(--gold)}
        .c-icon{width:38px;height:38px;background:rgba(255,255,255,.05);border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0;transition:background .2s}
        .c-link:hover .c-icon{background:rgba(221,185,74,.1)}
        .c-lbl{color:var(--white);font-weight:500;font-size:.88rem;margin-bottom:2px}

        footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px;padding:44px 64px;border-top:1px solid var(--border)}
        .f-logo{font-family:'Bebas Neue',sans-serif;font-size:1.5rem;letter-spacing:5px}
        .f-logo b{color:var(--gold)}
        .f-copy{font-size:.75rem;color:var(--grey);letter-spacing:1px}
        .f-links{display:flex;gap:24px;flex-wrap:wrap}
        .f-links a{font-family:'Syne',sans-serif;font-size:.68rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--grey);transition:color .2s}
        .f-links a:hover{color:var(--gold)}

        .reveal{opacity:0;transform:translateY(22px);transition:opacity .65s ease,transform .65s ease}
        .reveal.vis{opacity:1;transform:none}

        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes float{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-14px) rotate(1.5deg)}}
        @keyframes grow{from{width:0}to{width:78%}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
        
        @media(max-width:1100px){
            header, header.scrolled{padding:18px 32px}
            nav{display:none}
            .hamburger{display:flex}
            .hd-btns .btn-ghost{display:none}
            .hero{padding:110px 32px 80px}
            .hero-aside{right:32px;bottom:80px;gap:20px}
            .h-stat-n{font-size:2.2rem}
            .section{padding:90px 32px}
            .feat-grid{grid-template-columns:repeat(2,1fr)}
            .showcase{padding:90px 32px;gap:50px}
            .pricing-grid{grid-template-columns:repeat(2,1fr)}
            .pricing-grid .pc.feat{transform:none}
            .pricing-grid .pc:last-child{grid-column:span 2}
            .val-banner{grid-template-columns:1fr}
            .val-nums{justify-content:flex-start}
            .stat-cell:nth-child(2){border-right:none}
            .stat-cell:nth-child(3),.stat-cell:nth-child(4){border-top:1px solid var(--border)}
            .stat-cell:nth-child(4){border-right:none}
            .stats-strip{grid-template-columns:repeat(2,1fr)}
            .ac-wrap{padding:80px 32px;gap:48px}
            .cta-sec{padding:100px 32px}
        }
        @media(max-width:768px){
            header{padding:15px 20px}
            .hd-btns{display:flex !important} 
            .hd-btns .btn-ghost{display:inline-flex} 
            .feat-grid{grid-template-columns:1fr; background: none;}
            .showcase{grid-template-columns:1fr;gap:48px;padding:72px 20px}
            .phone-wrap{order:-1}
            .phone{width:218px}
            .pricing-grid{grid-template-columns:1fr;background:none;gap:1px;background:var(--border)}
            .pricing-grid .pc:last-child{grid-column:span 1}
            .pc{padding:40px 24px}
            .pc.feat{transform:none}
            .val-banner{padding:28px 20px}
            .val-nums{gap:24px}
            .hero-h1{font-size:clamp(3.8rem,18vw,7rem)}
            .hero-aside{display:none}
            .section{padding:72px 20px}
            .stat-cell{padding:36px 20px}
            .stat-n{font-size:3rem}
            .ac-wrap{grid-template-columns:1fr;gap:44px;padding:72px 20px}
            .ac-div{display:none}
            .ac-h{font-size:2.2rem}
            .cta-sec{padding:88px 20px}
            .cta-h{font-size:clamp(3rem,13vw,5rem)}
            footer{flex-direction:column;align-items:center;text-align:center;padding:32px 20px;gap:14px}
            .f-links{justify-content:center;gap:14px}
        }
        @media(max-width:480px){
            .hero-h1{font-size:clamp(3.4rem,20vw,5rem)}
            .btn-hero,.btn-outline{width:100%;padding:15px 20px}
            .val-nums{flex-direction:column;gap:16px;align-items:flex-start}
            .cta-row{flex-direction:column;align-items:stretch;width:100%}
            .cta-inp{max-width:100%;width:100%}
        }

        .modal-ov { position: fixed; inset: 0; background: rgba(0,0,0,.9); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); opacity:0; pointer-events:none; transition: opacity .3s; }
        .modal-ov.open { opacity:1; pointer-events:all; }
        .modal { background: #0c0c16; padding: 40px; borderRadius: 8px; width: 100%; maxWidth: 400px; border: 1px solid rgba(255,255,255,.1); transform: translateY(20px); transition: transform .3s; }
        .modal-ov.open .modal { transform: translateY(0); }
        .fi:focus { border-color: var(--gold) !important; outline: none; }
      `}</style>

      <div className="cur" ref={curRef}></div>
      <div className="cur-r" ref={curRRef}></div>

      {/* HEADER */}
      <header className={scrolled ? 'scrolled' : ''}>
        <a href="#" className="logo">FAST<b>READ</b></a>
        <nav>
          <a href="#features">Özellikler</a>
          <a href="#pricing">Fiyatlar</a>
          <a href="#about">Hakkımızda</a>
          <a href="#contact">İletişim</a>
        </nav>
        <div className="hd-btns">
          <button className="btn-ghost" onClick={() => openModal('login')}>Giriş Yap</button>
          <button className="btn-cta" onClick={() => openModal('register')}>Kayıt Ol</button>
        </div>
        <button className={`hamburger ${mobileMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
          <span></span><span></span><span></span>
        </button>
      </header>

      {/* MOBILE NAV */}
      <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="#features" className="mn-link" onClick={toggleMenu}>Özellikler</a>
        <a href="#pricing" className="mn-link" onClick={toggleMenu}>Fiyatlar</a>
        <a href="#about" className="mn-link" onClick={toggleMenu}>Hakkımızda</a>
        <a href="#contact" className="mn-link" onClick={toggleMenu}>İletişim</a>
        <div className="mn-btns" style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300, marginTop: 16 }}>
          <button className="btn-cta" onClick={() => { toggleMenu(); openModal('register'); }} style={{ width: '100%', justifyContent: 'center' }}>ÜCRETSİZ BAŞLA</button>
          <button className="btn-ghost" onClick={() => { toggleMenu(); openModal('login'); }} style={{ width: '100%', justifyContent: 'center' }}>GİRİŞ YAP</button>
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow"></div>
        <div className="hero-grid"></div>
        <div className="reveal">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'Syne', fontSize: '.68rem', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 28 }}>
            TÜRKİYE'NİN #1 OKUMA HIZLANMA PLATFORMU
          </div>
          <h1 className="hero-h1">
            <span style={{ display: 'block' }}>OKU.</span>
            <span className="stroke" style={{ display: 'block' }}>HIZLAN. <span className="gold">KAZAN.</span></span>
          </h1>
          <p style={{ maxWidth: 460, fontSize: '1rem', lineHeight: 1.75, color: 'rgba(242,240,235,.58)', marginTop: 30, marginBottom: 44 }}>
            Lig sistemi, AI eğitim modeli ve kişisel antrenman planıyla okuma hızını 90 günde 3 katına çıkar. Android ve web — her yerde, her an seninle.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button className="btn-hero" onClick={() => onDemoStart()}><span>ÜCRETSİZ DENE</span></button>
            <button className="btn-outline" onClick={() => openModal('register')}>KAYIT OL</button>
          </div>
        </div>
        <div className="hero-aside reveal">
          <div><div className="h-stat-n">3×</div><div className="h-stat-l">Hız Artışı</div></div>
          <div><div className="h-stat-n">12K+</div><div className="h-stat-l">Aktif Kullanıcı</div></div>
          <div><div className="h-stat-n">4.9★</div><div className="h-stat-l">Play Store</div></div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker">
        <div className="ticker-track">
          {['LİG SİSTEMİ', 'EĞİTİM MODÜLÜ', 'ANTRENMAN MODU', 'ANDROID & WEB', 'OKUMA HIZI', 'ANLAMA SKORU', 'GÜNLÜK STREAK', 'ÖĞRENCİ FİYATI'].map((t, i) => (
            <React.Fragment key={i}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '1rem', letterSpacing: 4, color: 'var(--grey2)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 56 }}>
                {t} <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
              </div>
            </React.Fragment>
          ))}
          {['LİG SİSTEMİ', 'EĞİTİM MODÜLÜ', 'ANTRENMAN MODU', 'ANDROID & WEB', 'OKUMA HIZI', 'ANLAMA SKORU', 'GÜNLÜK STREAK', 'ÖĞRENCİ FİYATI'].map((t, i) => (
            <React.Fragment key={i + 10}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '1rem', letterSpacing: 4, color: 'var(--grey2)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 56 }}>
                {t} <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="stats-strip">
        <div className="stat-cell reveal"><div className="stat-n">3×</div><div className="stat-l">Ortalama Hız Artışı</div></div>
        <div className="stat-cell reveal"><div className="stat-n">12K+</div><div className="stat-l">Aktif Kullanıcı</div></div>
        <div className="stat-cell reveal"><div className="stat-n">90</div><div className="stat-l">Günde Sonuç</div></div>
        <div className="stat-cell reveal"><div className="stat-n">4.9★</div><div className="stat-l">Play Store Puanı</div></div>
      </div>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="s-label">NE SUNUYORUZ</div>
        <h2 className="s-title reveal">FARK YARATAN<br />ÖZELLİKLER</h2>
        <div className="feat-grid">
          {[
            { n: '01', i: '🏆', t: 'Rekabetçi Lig Sistemi', d: "Bronz'dan Elmas'a uzanan 6 lig seviyesiyle arkadaşlarınla yarış. Her hafta lig atlamak seni motive etmeye devam eder." },
            { n: '02', i: '🧠', t: 'Yapay Zeka Eğitim Modeli', d: "Okuma seviyene özel egzersizler. Algoritma zayıf noktalarını tespit eder ve kişiselleştirilmiş plan oluşturur." },
            { n: '03', i: '⚡', t: 'Antrenman Modu', d: "RSVP tekniği, göz yayı egzersizleri ve çevre görüşü genişletme ile günde 10 dakikada ciddi ilerleme." },
            { n: '04', i: '📊', t: 'Anlık Gelişim Takibi', d: "Her antrenmandan sonra hız ve anlama istatistikleri. Grafiklerle ilerleni gör, rekorlarını kır." },
            { n: '05', i: '📱', t: 'Android & Web Senkron', d: "Tek hesapla tüm cihazlarında eşzamanlı senkron. Bir yerden bıraktığın yerden devam et." },
            { n: '06', i: '🔥', t: 'Streak & Rozet Sistemi', d: "Günlük alışkanlık oluşturan streak sistemi. Kilometre taşlarında özel rozetler kazan." }
          ].map((f, i) => (
            <div key={i} className="feat-card reveal">
              <span className="feat-n">{f.n}</span><span className="feat-icon">{f.i}</span>
              <div className="feat-t">{f.t}</div>
              <p className="feat-d">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SHOWCASE */}
      <div className="showcase">
        <div className="sc-text reveal">
          <div className="s-label">Uygulama</div>
          <h2 className="s-title" style={{ fontSize: 'clamp(2.8rem,5.5vw,5rem)', marginBottom: 28 }}>CEBİNDE,<br />HER ZAMAN<br /><span className="gold">HAZIR.</span></h2>
          <p>Android uygulaması ve web platformuyla tek hesaptan tüm cihazlarında sorunsuz deneyim. Yükleme yok, bekleme yok — anında başla.</p>
          <div className="sc-btns">
            <button className="btn-hero" onClick={() => openModal('register')}><span>🤖 Android İndir</span></button>
            <button className="btn-outline" onClick={() => openModal('register')}>🌐 Web'de Aç</button>
          </div>
        </div>
        <div className="phone-wrap reveal">
          <div className="phone">
            <div className="phone-screen">
              <div className="ph-head"><div className="ph-logo">FAST<span>R</span></div><div className="ph-av"></div></div>
              <div className="ph-league"><div className="ph-lt">Mevcut Lig</div><div className="ph-ln">🥇 ELMAS LİG</div></div>
              <div className="ph-speed">
                <div className="ph-sl">Okuma Hızı</div>
                <div className="ph-sn">487 <span className="ph-su">KPM</span></div>
                <div className="ph-bar-w"><div className="ph-bar"></div></div>
              </div>
              <div className="ph-mini">
                <div className="ph-mc"><div className="ph-mn">94%</div><div className="ph-ml">Anlama</div></div>
                <div className="ph-mc"><div className="ph-mn">🔥21</div><div className="ph-ml">Streak</div></div>
                <div className="ph-mc"><div className="ph-mn">#12</div><div className="ph-ml">Sıralama</div></div>
                <div className="ph-mc"><div className="ph-mn">142</div><div className="ph-ml">Antrenman</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRICING */}
      <section className="section" id="pricing">
        <div className="s-label">FİYATLANDIRMA</div>
        <h2 className="s-title reveal">RAKİPSİZ<br />FİYATLAR</h2>
        <div className="pricing-grid">
          <div className="pc reveal">
            <div className="pc-plan">ÜCRETSİZ</div>
            <div className="pc-price">₺<small>0</small></div>
            <div className="pc-period">Sonsuza dek ücretsiz</div>
            <ul className="pc-feats">
              <li>Günlük 3 antrenman hakkı</li>
              <li>Temel hız testleri</li>
              <li>Lig sistemine katılım</li>
              <li>Gelişim grafiği (7 gün)</li>
            </ul>
            <button className="btn-outline" style={{width:'100%'}} onClick={() => openModal('register')}>ÜCRETSİZ BAŞLA</button>
          </div>
          <div className="pc feat reveal">
            <div className="pc-badge">EN POPÜLER</div>
            <div className="pc-plan">ÖĞRENCİ PREMIUM</div>
            <div className="pc-price">₺<small>49</small></div>
            <div className="pc-period">/ ay — Öğrenciye özel fiyat</div>
            <ul className="pc-feats">
              <li>Sınırsız antrenman</li>
              <li>Tam AI eğitim modeli</li>
              <li>Kişiselleştirilmiş plan</li>
              <li>Tüm lig seviyeleri</li>
              <li>Android + Web erişim</li>
              <li>Öncelikli destek</li>
              <li>Aylık 1-1 danışmanlık</li>
            </ul>
            <button className="btn-hero" style={{width:'100%', background:'#000', color: 'var(--gold)'}} onClick={() => openModal('register')}>KAYIT OL & ABONE OL</button>
          </div>
          <div className="pc reveal">
            <div className="pc-plan">PRO YILLIK</div>
            <div className="pc-price">₺<small>299</small></div>
            <div className="pc-period">/ yıl — Ayda sadece ₺25!</div>
            <ul className="pc-feats">
              <li>Premium'un tüm özellikleri</li>
              <li>%49 daha ucuz</li>
              <li>Gelişmiş analitik</li>
              <li>Grup & aile paylaşımı</li>
              <li>Özel antrenman paketleri</li>
              <li>7/24 öncelikli destek</li>
            </ul>
            <button className="btn-outline" style={{width:'100%'}} onClick={() => openModal('register')}>YILLIK AL & KAZAN</button>
          </div>
        </div>
        <div className="val-banner reveal">
          <div>
            <h3>🏆 PİYASANIN EN UCUZ OKUMA PLATFORMU</h3>
            <p>Rakiplerimiz aynı özellikler için ₺149–₺299/ay talep ediyor. Biz öğrenci olduğumuz için reklam yok, aracı yok. Tasarrufu sana yansıtıyoruz — fiyata da kaliteye de rakipsiziz.</p>
          </div>
          <div className="val-nums">
            <div className="vn"><div className="vn-n">₺49</div><div className="vn-l">Bizim Fiyat</div></div>
            <div className="vn"><div className="vn-n" style={{color:'var(--grey)'}}>vs</div><div className="vn-l" style={{color:'var(--red)'}}>Rakipler</div></div>
            <div className="vn"><div className="vn-n" style={{color:'var(--grey)'}}>₺299</div><div className="vn-l">Rakip Fiyatı</div></div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec" id="cta">
        <div className="cta-pill"><span className="cta-dot"></span> SINIRLI SÜRE — ERKEN KAYIT FİYATI</div>
        <h2 className="cta-h reveal">BİZİ DESTEKLE,<br />SEN DE <span>KAZAN.</span></h2>
        <p className="cta-p reveal">Henüz öğrenciyiz ve bu uygulamayı sevgimizle inşa ettik. İlk kullanıcılarımız hem en düşük fiyatı alacak hem de ürünü birlikte şekillendirecek. Erken kayıt ol, fiyatın asla artmasın.</p>
        <div className="cta-row reveal">
          <input type="email" className="cta-inp" placeholder="E-posta adresin..." />
          <button className="btn-hero cta-btn" onClick={() => openModal('register')}><span>KAYIT OL →</span></button>
        </div>
        <p className="cta-note reveal">✅ Kart gerekmez &nbsp;·&nbsp; ✅ İstediğin zaman iptal &nbsp;·&nbsp; ✅ 7 gün ücretsiz deneme</p>
      </section>

      {/* ABOUT & CONTACT */}
      <div className="ac-wrap" id="about">
        <div className="reveal">
          <div className="s-label">KİM BİZ</div>
          <h2 className="ac-h">HAKKIMIZDA</h2>
          <p className="ac-p">FastRead, okuma hızını artırmak isteyen herkes için bilimsel yöntemler ve oyunlaştırma unsurlarını bir araya getiren bir platformdur.</p>
          <p className="ac-p">Biz bir grup üniversite öğrencisiyiz. Kendi okuma problemlerimize çözüm ararken FastRead'i hayata geçirdik. Akademik araştırmalar, deneme-yanılma ve yüzlerce kullanıcı testinin ürünü olan bu platform binlerce kişiye yardım ediyor.</p>
          <p className="ac-p hi">Erken destekçilerimiz hem en iyi fiyatı hem de topluluğun kurucu üyesi olma onurunu taşıyor.</p>
        </div>
        <div className="ac-div"></div>
        <div className="reveal" id="contact">
          <div className="s-label">ULAŞ BİZE</div>
          <h2 className="ac-h">İLETİŞİM</h2>
          <p className="ac-p">Sorularınız, önerileriniz veya işbirliği için bize ulaşın. Her mesaja bizzat yanıt veriyoruz.</p>
          <div className="c-links">
            <a href="mailto:destek@fastread.app" className="c-link"><div className="c-icon">✉️</div><div><div className="c-lbl">E-posta</div>destek@fastread.app</div></a>
            <a href="#" className="c-link"><div className="c-icon">📱</div><div><div className="c-lbl">Instagram</div>@fastreadapp</div></a>
            <a href="#" className="c-link"><div className="c-icon">💬</div><div><div className="c-lbl">Discord</div>discord.gg/fastread</div></a>
            <a href="#" className="c-link"><div className="c-icon">𝕏</div><div><div className="c-lbl">Twitter / X</div>@fastreadapp</div></a>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <a href="#" className="f-logo">FAST<b>READ</b></a>
        <p className="f-copy">© 2025 FastRead. Tüm hakları saklıdır.</p>
        <div className="f-links">
          <a href="#">GİZLİLİK</a>
          <a href="#">KOŞULLAR</a>
          <a href="#contact">İLETİŞİM</a>
          <a href="#" onClick={(e) => { e.preventDefault(); openModal('register'); }}>KAYIT OL</a>
        </div>
      </footer>

      {/* MODAL */}
      <div className={`modal-ov ${modalOpen ? 'open' : ''}`} onClick={(e) => e.target.className.includes('modal-ov') && closeModal()}>
        <div className="modal">
          <div style={{ textAlign: 'right' }}><button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--grey)', fontSize: 24, cursor: 'pointer' }}>✕</button></div>
          <div className="logo" style={{ fontSize: '2.2rem', marginBottom: 6 }}>FAST<b>READ</b></div>
          <p style={{ fontSize: '.85rem', color: 'var(--grey)', marginBottom: 32 }}>Hızını keşfet, ligde yüksel.</p>
          
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
            <button className={`btn-ghost ${authTab === 'login' ? 'gold' : ''}`} onClick={() => { setAuthTab('login'); setErr(''); }} style={{ border: 'none', borderBottom: authTab === 'login' ? '2px solid var(--gold)' : 'none', borderRadius: 0, padding: '12px 22px', fontSize: '.72rem', color: authTab === 'login' ? 'var(--gold)' : 'var(--grey)' }}>Giriş Yap</button>
            <button className={`btn-ghost ${authTab === 'register' ? 'gold' : ''}`} onClick={() => { setAuthTab('register'); setErr(''); }} style={{ border: 'none', borderBottom: authTab === 'register' ? '2px solid var(--gold)' : 'none', borderRadius: 0, padding: '12px 22px', fontSize: '.72rem', color: authTab === 'register' ? 'var(--gold)' : 'var(--grey)' }}>Kayıt Ol</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {authTab === 'register' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: 'Syne', fontSize: '.65rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--grey)' }}>AD SOYAD</label>
                <input className="fi" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', padding: 13, borderRadius: 3 }} placeholder="Adın ve soyadın" value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontFamily: 'Syne', fontSize: '.65rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--grey)' }}>E-POSTA</label>
              <input className="fi" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', padding: 13, borderRadius: 3 }} placeholder="ad@email.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontFamily: 'Syne', fontSize: '.65rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--grey)' }}>ŞİFRE</label>
              <input className="fi" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', padding: 13, borderRadius: 3 }} placeholder="••••••••" type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && (authTab === 'login' ? handleLogin() : handleRegister())} />
            </div>
            
            {err && <div style={{ color: '#ff3131', fontSize: 12, textAlign: 'center' }}>{err}</div>}
            
            <button className="btn-hero" onClick={authTab === 'login' ? handleLogin : handleRegister} disabled={loading} style={{ width: '100%', marginTop: 10, padding: 16 }}>
              <span>{loading ? 'YÜKLENİYOR...' : (authTab === 'login' ? 'GİRİŞ YAP' : 'HESAP OLUŞTUR')}</span>
            </button>
            <p style={{ textAlign: 'center', fontSize: '.76rem', color: 'var(--grey)', marginTop: 10 }}>
              {authTab === 'login' ? 'Hesabın yok mu?' : 'Hesabın var mı?'} <a href="#" onClick={(e) => { e.preventDefault(); setAuthTab(authTab === 'login' ? 'register' : 'login'); }} style={{ color: 'var(--gold)' }}>{authTab === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
