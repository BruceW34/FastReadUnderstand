import React, { useState, useEffect } from 'react';
import { db } from '@/services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const OffersManagement = ({ addToast }) => {
    const [saving, setSaving] = useState(false);
    const [adConfig, setAdConfig] = useState({ adFrequency: 3 });

    useEffect(() => {
        const load = async () => {
            const adRef = doc(db, 'admin', 'ads');
            const adSnap = await getDoc(adRef);
            if (adSnap.exists()) {
                setAdConfig(adSnap.data());
            }
        };
        load();
    }, []);

    const saveAdConfig = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'admin', 'ads'), adConfig, { merge: true });
            addToast?.({ msg: 'Reklam ayarları kaydedildi.', color: '#10b981' });
        } catch (e) {
            addToast?.({ msg: 'Hata oluştu.', color: '#ef4444' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ padding: '24px' }}>
                <div style={{ fontWeight: 800, fontSize: '18px', marginBottom: '20px' }}>Premium & Reklam Ayarları</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ background: 'rgba(255,165,0,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,165,0,0.1)' }}>
                        <div style={{ fontWeight: 700, marginBottom: '12px', color: '#f59e0b' }}>Reklam Sıklığı</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <input
                                className="ai"
                                type="number"
                                min="1"
                                style={{ width: '80px', textAlign: 'center', fontSize: '18px', fontWeight: 800 }}
                                value={adConfig.adFrequency}
                                onChange={(e) => setAdConfig({ ...adConfig, adFrequency: parseInt(e.target.value) || 3 })}
                            />
                            <div style={{ fontSize: '14px', color: 'var(--mu)', lineHeight: '1.4' }}>
                                uygulama açılışında <strong>1 reklam</strong> gösterilir. <br/>
                                <span style={{ fontSize: '12px' }}>(Düşük değer = Daha çok reklam)</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(16,185,129,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.1)' }}>
                        <div style={{ fontWeight: 700, marginBottom: '12px', color: '#10b981' }}>Bolt Premium Teklifleri</div>
                        <div style={{ color: 'var(--mu)', fontSize: '13px' }}>
                            Capacitor/Google Play Billing entegrasyonu üzerinden dinamik fiyatlandırma yakında aktif edilecek.
                        </div>
                    </div>
                </div>

                <button className="btn bp" style={{ marginTop: '32px', width: '100%', height: '50px' }} onClick={saveAdConfig} disabled={saving}>
                    {saving ? 'Kaydediliyor...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                </button>
            </div>
        </div>
    );
};
