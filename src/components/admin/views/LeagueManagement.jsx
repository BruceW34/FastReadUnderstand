import React, { useState, useEffect } from 'react';
import { db } from '@/services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const LeagueManagement = ({ addToast }) => {
    const [saving, setSaving] = useState(false);
    const [quests, setQuests] = useState([]);

    useEffect(() => {
        const load = async () => {
            const qRef = doc(db, 'admin', 'quests');
            const qSnap = await getDoc(qRef);
            if (qSnap.exists()) {
                setQuests(qSnap.data().list || []);
            }
        };
        load();
    }, []);

    const saveQuests = async (newList) => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'admin', 'quests'), { list: newList });
            setQuests(newList);
            addToast?.({ msg: 'Görevler kaydedildi.', color: '#10b981' });
        } catch (e) {
            addToast?.({ msg: 'Hata oluştu.', color: '#ef4444' });
        } finally {
            setSaving(false);
        }
    };

    const addQuest = () => {
        const newQuest = {
            id: 'q_' + Date.now(),
            title: 'Yeni Görev',
            desc: 'Açıklama',
            total: 10,
            reward: 50,
            type: 'weekly',
            icon: '🎯',
            targetField: 'xp'
        };
        setQuests([...quests, newQuest]);
    };

    const updateQuest = (id, field, value) => {
        setQuests(quests.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const deleteQuest = (id) => {
        if (window.confirm('Silmek istediğine emin misin?')) {
            setQuests(quests.filter(q => q.id !== id));
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '18px' }}>Lig & Global Görevler</div>
                        <div style={{ fontSize: '13px', color: 'var(--mu)', marginTop: '4px' }}>Social Hub üzerindeki haftalık/aylık hedefleri yönetin.</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn bg bs" onClick={addQuest}>➕ Yeni Ekle</button>
                        <button className="btn bp" onClick={() => saveQuests(quests)} disabled={saving}>
                            {saving ? 'Kaydediliyor...' : 'Tümünü Kaydet'}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {quests.map((q) => (
                        <div key={q.id} className="card" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 50px', gap: '16px', alignItems: 'start' }}>
                                <div>
                                    <label style={{ fontSize: '10px', color: 'var(--mu)', fontWeight: 800 }}>İKON</label>
                                    <input className="ai" value={q.icon} onChange={e => updateQuest(q.id, 'icon', e.target.value)} />
                                </div>
                                <div style={{ flex: 2 }}>
                                    <label style={{ fontSize: '10px', color: 'var(--mu)', fontWeight: 800 }}>BAŞLIK</label>
                                    <input className="ai" value={q.title} onChange={e => updateQuest(q.id, 'title', e.target.value)} />
                                </div>
                                <div style={{ flex: 3 }}>
                                    <label style={{ fontSize: '10px', color: 'var(--mu)', fontWeight: 800 }}>AÇIKLAMA</label>
                                    <textarea className="ai" style={{ minHeight: '40px' }} value={q.desc} onChange={e => updateQuest(q.id, 'desc', e.target.value)} />
                                </div>
                                <button className="btn bd bs" style={{ marginTop: '20px' }} onClick={() => deleteQuest(q.id)}>🗑️</button>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                <div>
                                    <label style={{ fontSize: '10px', color: 'var(--mu)', fontWeight: 800 }}>HEDEF SAYI</label>
                                    <input className="ai" type="number" value={q.total} onChange={e => updateQuest(q.id, 'total', parseInt(e.target.value) || 0)} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '10px', color: 'var(--mu)', fontWeight: 800 }}>ÖDÜL (XP)</label>
                                    <input className="ai" type="number" value={q.reward} onChange={e => updateQuest(q.id, 'reward', parseInt(e.target.value) || 0)} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '10px', color: 'var(--mu)', fontWeight: 800 }}>PERİYOT</label>
                                    <select className="ai" value={q.type} onChange={e => updateQuest(q.id, 'type', e.target.value)}>
                                        <option value="weekly">Haftalık</option>
                                        <option value="monthly">Aylık</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '10px', color: 'var(--mu)', fontWeight: 800 }}>TAKİP ALANI</label>
                                    <select className="ai" value={q.targetField || 'xp'} onChange={e => updateQuest(q.id, 'targetField', e.target.value)}>
                                        <option value="xp">Global XP</option>
                                        <option value="tecrube">Eğitim TP</option>
                                        <option value="diamonds">Elmaslar</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
