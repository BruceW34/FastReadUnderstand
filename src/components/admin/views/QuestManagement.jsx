import React, { useState, useEffect } from 'react';
import { db } from '@/services/firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';

export const QuestManagement = ({ addToast }) => {
    const [quests, setQuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingQuest, setEditingQuest] = useState(null);
    const [formData, setFormData] = useState({
        id: '',
        title: '',
        desc: '',
        icon: '🎯',
        reward: 100,
        total: 100,
        type: 'weekly', // 'weekly' or 'monthly'
        targetField: 'xp'
    });

    // Load quests from Firestore
    useEffect(() => {
        const initializeAndLoad = async () => {
            try {
                const questRef = doc(db, 'admin', 'quests');
                
                // Try to load quests
                const unsub = onSnapshot(questRef, async (snap) => {
                    if (snap.exists()) {
                        setQuests(snap.data().list || []);
                    } else {
                        // Initialize with empty list if document doesn't exist
                        const defaultQuests = [
                            {
                                id: 'w1',
                                title: '📖 Haftalık Okuyucu',
                                desc: 'Bu hafta 5000 XP kazan',
                                icon: '📖',
                                reward: 200,
                                total: 5000,
                                type: 'weekly',
                                targetField: 'xp'
                            },
                            {
                                id: 'm1',
                                title: '🔥 Ay Şampiyonu',
                                desc: 'Bu ay 30 oturum tamamla',
                                icon: '🔥',
                                reward: 500,
                                total: 30,
                                type: 'monthly',
                                targetField: 'sessions'
                            },
                            {
                                id: 'w2',
                                title: '📚 Kitap Kurdu',
                                desc: '10 metin oku',
                                icon: '📚',
                                reward: 150,
                                total: 10,
                                type: 'weekly',
                                targetField: 'readTexts'
                            }
                        ];
                        await setDoc(questRef, { list: defaultQuests }, { merge: true });
                        setQuests(defaultQuests);
                        addToast?.({ msg: 'Varsayılan görevler oluşturuldu', color: '#10b981' });
                    }
                    setLoading(false);
                }, (error) => {
                    console.error('Error loading quests:', error);
                    addToast?.({ msg: 'Görevler yüklenemedi', color: '#ef4444' });
                    setLoading(false);
                });
                return () => unsub();
            } catch (error) {
                console.error('Error initializing quests:', error);
                setLoading(false);
            }
        };
        
        initializeAndLoad();
    }, []);

    const resetForm = () => {
        setFormData({
            id: '',
            title: '',
            desc: '',
            icon: '🎯',
            reward: 100,
            total: 100,
            type: 'weekly',
            targetField: 'xp'
        });
        setEditingQuest(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (quest) => {
        setFormData(quest);
        setEditingQuest(quest.id);
        setShowModal(true);
    };

    const saveQuest = async () => {
        if (!formData.id || !formData.title) {
            addToast?.({ msg: 'Lütfen ID ve başlık doldurun', color: '#ef4444' });
            return;
        }

        setSaving(true);
        try {
            let updatedQuests;
            if (editingQuest) {
                updatedQuests = quests.map(q => q.id === editingQuest ? formData : q);
            } else {
                updatedQuests = [...quests, formData];
            }

            await updateDoc(doc(db, 'admin', 'quests'), { list: updatedQuests });
            addToast?.({ msg: editingQuest ? 'Görev güncellendi' : 'Yeni görev eklendi', color: '#10b981' });
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error('Error saving quest:', error);
            addToast?.({ msg: 'Görev kaydedilemedi', color: '#ef4444' });
        } finally {
            setSaving(false);
        }
    };

    const deleteQuest = async (questId) => {
        if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;

        setSaving(true);
        try {
            const updatedQuests = quests.filter(q => q.id !== questId);
            await updateDoc(doc(db, 'admin', 'quests'), { list: updatedQuests });
            addToast?.({ msg: 'Görev silindi', color: '#10b981' });
        } catch (error) {
            console.error('Error deleting quest:', error);
            addToast?.({ msg: 'Görev silinemedi', color: '#ef4444' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--mu)' }}>Yükleniyor...</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header with Add Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Görevler ({quests.length})</h2>
                    <p style={{ color: 'var(--mu)', fontSize: '14px' }}>Kullanıcıların çözebileceği görevleri yönetin</p>
                </div>
                <button
                    className="btn bp"
                    onClick={openAddModal}
                    style={{ padding: '10px 20px', height: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    + YENİ GÖREV EKLE
                </button>
            </div>

            {/* Quests List */}
            <div style={{ display: 'grid', gap: '16px' }}>
                {quests.length === 0 ? (
                    <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--mu)' }}>
                        Henüz görev eklenmedi. Yeni bir görev eklemek için "YENİ GÖREV EKLE" düğmesine tıklayın.
                    </div>
                ) : (
                    quests.map(quest => (
                        <div key={quest.id} className="card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                                    <div style={{ fontSize: '28px' }}>{quest.icon}</div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '4px' }}>
                                            {quest.title}
                                        </div>
                                        <div style={{ color: 'var(--mu)', fontSize: '13px', marginBottom: '8px' }}>
                                            {quest.desc}
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--mu)' }}>
                                            <span>🎁 +{quest.reward} XP</span>
                                            <span>📊 {quest.total} adım</span>
                                            <span>{quest.type === 'weekly' ? '📅 Haftalık' : '📅 Aylık'}</span>
                                            <span>📍 {quest.targetField}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => openEditModal(quest)}
                                        style={{
                                            padding: '6px 12px',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            color: '#3b82f6',
                                            border: '1px solid #3b82f633',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '12px'
                                        }}
                                    >
                                        ✏️ Düzenle
                                    </button>
                                    <button
                                        onClick={() => deleteQuest(quest.id)}
                                        style={{
                                            padding: '6px 12px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: '1px solid #ef444433',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '12px'
                                        }}
                                    >
                                        🗑️ Sil
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal for Add/Edit Quest */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="card" style={{
                        width: '90%',
                        maxWidth: '500px',
                        padding: '32px',
                        borderRadius: '20px',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>
                            {editingQuest ? 'Görevi Düzenle' : 'Yeni Görev Ekle'}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Quest ID */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--mu)' }}>
                                    Görev ID {editingQuest && '(Değiştirilemez)'}
                                </label>
                                <input
                                    className="ai"
                                    type="text"
                                    placeholder="örn: w1, m1, w2"
                                    value={formData.id}
                                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                    disabled={!!editingQuest}
                                    style={{ width: '100%' }}
                                />
                                <div style={{ fontSize: '11px', color: 'var(--mu)', marginTop: '4px' }}>
                                    Boşluksuz, benzersiz bir kimlik (örn: weekly1, monthly2)
                                </div>
                            </div>

                            {/* Quest Title */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--mu)' }}>
                                    Başlık
                                </label>
                                <input
                                    className="ai"
                                    type="text"
                                    placeholder="örn: Haftalık Koşu"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            {/* Quest Description */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--mu)' }}>
                                    Açıklama
                                </label>
                                <textarea
                                    className="ai"
                                    placeholder="Görev açıklaması"
                                    value={formData.desc}
                                    onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                                    style={{ width: '100%', minHeight: '80px', fontFamily: 'inherit' }}
                                />
                            </div>

                            {/* Icon */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--mu)' }}>
                                    İkon (Emoji)
                                </label>
                                <input
                                    className="ai"
                                    type="text"
                                    placeholder="🎯"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    style={{ width: '100%' }}
                                    maxLength="2"
                                />
                            </div>

                            {/* Reward */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--mu)' }}>
                                    Ödül (XP)
                                </label>
                                <input
                                    className="ai"
                                    type="number"
                                    min="0"
                                    value={formData.reward}
                                    onChange={(e) => setFormData({ ...formData, reward: parseInt(e.target.value) || 0 })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            {/* Total Steps */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--mu)' }}>
                                    Hedef (Toplam Adım)
                                </label>
                                <input
                                    className="ai"
                                    type="number"
                                    min="1"
                                    value={formData.total}
                                    onChange={(e) => setFormData({ ...formData, total: parseInt(e.target.value) || 1 })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--mu)' }}>
                                    Tür
                                </label>
                                <select
                                    className="ai"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    style={{ width: '100%' }}
                                >
                                    <option value="weekly">Haftalık</option>
                                    <option value="monthly">Aylık</option>
                                </select>
                            </div>

                            {/* Target Field */}
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--mu)' }}>
                                    Hedef Alan
                                </label>
                                <input
                                    className="ai"
                                    type="text"
                                    placeholder="xp, tecrube, sessions, readTexts vb."
                                    value={formData.targetField}
                                    onChange={(e) => setFormData({ ...formData, targetField: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                                <div style={{ fontSize: '11px', color: 'var(--mu)', marginTop: '4px' }}>
                                    Kullanıcı verilerindeki alan adı (özel sabitler: w1, m1, w2)
                                </div>
                            </div>

                            {/* Buttons */}
                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <button
                                    className="btn bp"
                                    onClick={saveQuest}
                                    disabled={saving}
                                    style={{ flex: 1, height: '44px' }}
                                >
                                    {saving ? 'Kaydediliyor...' : editingQuest ? 'GÜNCELLESTİRME' : 'EKLE'}
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        flex: 1,
                                        height: '44px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--b2)',
                                        background: 'var(--b2)',
                                        color: 'var(--mu)',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        fontSize: '14px'
                                    }}
                                >
                                    İPTAL
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
