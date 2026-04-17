import React, { useState } from 'react';
import { db } from '@/services/firebase';
import { doc, query, collection, where, getDocs, updateDoc } from 'firebase/firestore';

export const UserManagement = ({ user, addToast }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [userSearchText, setUserSearchText] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userForm, setUserForm] = useState(null);

    const searchUsers = async () => {
        if (!userSearchText.trim()) return;
        setLoading(true);
        try {
            const qByEmail = query(collection(db, 'users'), where('email', '==', userSearchText.trim()));
            const snap = await getDocs(qByEmail);
            let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            if (results.length === 0) {
                const qByName = query(collection(db, 'users'), where('name', '==', userSearchText.trim()));
                const snap2 = await getDocs(qByName);
                results = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
            }
            
            setSearchResults(results);
            if (results.length === 0) {
                addToast?.({ msg: 'Kullanıcı bulunamadı.', color: '#ef4444' });
            }
        } catch (e) {
            console.error(e);
            addToast?.({ msg: 'Arama hatası.', color: '#ef4444' });
        } finally {
            setLoading(false);
        }
    };

    const startEditingUser = (u) => {
        setSelectedUser(u);
        setUserForm({
            xp: u.xp || 0,
            tecrube: u.tecrube || 0,
            isPro: !!u.isPro,
            isAdmin: !!u.isAdmin,
            hearts: u.hearts || 5,
            diamonds: u.diamonds || 0,
        });
    };

    const saveUserData = async () => {
        if (!selectedUser || !userForm) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', selectedUser.id), userForm);
            addToast?.({ msg: 'Kullanıcı güncellendi.', color: '#10b981' });
            setSelectedUser(null);
            setUserForm(null);
            setSearchResults([]); 
        } catch (e) {
            console.error(e);
            addToast?.({ msg: 'Güncelleme hatası.', color: '#ef4444' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="user-management" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '24px' }}>
                <div style={{ fontWeight: 800, marginBottom: '16px', fontSize: '18px' }}>Kullanıcı Sorgula</div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            className="ai"
                            placeholder="E-posta veya Tam İsim ile ara..."
                            value={userSearchText}
                            onChange={(e) => setUserSearchText(e.target.value)}
                            style={{ paddingLeft: '40px' }}
                        />
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                    </div>
                    <button className="btn bp" onClick={searchUsers} disabled={loading} style={{ padding: '0 24px' }}>
                        {loading ? 'Aranıyor...' : 'ARA'}
                    </button>
                </div>
            </div>

            {searchResults.length > 0 && !selectedUser && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {searchResults.map(u => (
                        <div key={u.id} className="card" style={{ 
                            padding: '16px', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ 
                                    width: '48px', height: '48px', borderRadius: '50%', background: 'var(--ac)', color: '#000',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '20px'
                                }}>
                                    {u.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '16px' }}>{u.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--mu)', marginTop: '2px' }}>{u.email}</div>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '11px' }}>
                                        <span style={{ color: 'var(--ac)' }}>XP: {u.xp || 0}</span>
                                        <span style={{ color: '#10b981' }}>TP: {u.tecrube || 0}</span>
                                        <span style={{ color: '#f59e0b' }}>💎 {u.diamonds || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="btn bg bs" onClick={() => startEditingUser(u)}>DÜZENLE</button>
                        </div>
                    ))}
                </div>
            )}

            {selectedUser && (
                <div className="card" style={{ 
                    padding: '24px', 
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid var(--ac)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ac)', fontWeight: 700 }}>Kullanıcı Düzenle</div>
                            <div style={{ fontWeight: 800, fontSize: '22px' }}>{selectedUser.name}</div>
                        </div>
                        <button className="btn bg bs" style={{ width: '40px', height: '40px', padding: 0 }} onClick={() => setSelectedUser(null)}>✕</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div>
                            <label style={{ fontSize: '12px', color: 'var(--mu)', display: 'block', marginBottom: '8px' }}>Global XP</label>
                            <input className="ai" type="number" value={userForm.xp} onChange={e => setUserForm({ ...userForm, xp: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: 'var(--mu)', display: 'block', marginBottom: '8px' }}>Eğitim Tecrübesi (TP)</label>
                            <input className="ai" type="number" value={userForm.tecrube} onChange={e => setUserForm({ ...userForm, tecrube: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: 'var(--mu)', display: 'block', marginBottom: '8px' }}>Elmas Sayısı (Diamonds)</label>
                            <input className="ai" type="number" value={userForm.diamonds} onChange={e => setUserForm({ ...userForm, diamonds: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: 'var(--mu)', display: 'block', marginBottom: '8px' }}>Can (Boltage/Hearts)</label>
                            <input className="ai" type="number" max="5" min="0" value={userForm.hearts} onChange={e => setUserForm({ ...userForm, hearts: parseInt(e.target.value) || 5 })} />
                        </div>
                    </div>

                    <div style={{ 
                        display: 'flex', 
                        gap: '32px', 
                        marginTop: '24px', 
                        padding: '20px', 
                        background: 'rgba(255,255,255,0.03)', 
                        borderRadius: '16px' 
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600 }}>
                            <input 
                                type="checkbox" 
                                style={{ width: '20px', height: '20px', accentColor: 'var(--ac)' }} 
                                checked={userForm.isPro} 
                                onChange={e => setUserForm({ ...userForm, isPro: e.target.checked })} 
                            /> BOLT PREMİUM
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600 }}>
                            <input 
                                type="checkbox" 
                                style={{ width: '20px', height: '20px', accentColor: '#ef4444' }} 
                                checked={userForm.isAdmin} 
                                onChange={e => setUserForm({ ...userForm, isAdmin: e.target.checked })} 
                            /> SİSTEM ADMİNİ
                        </label>
                    </div>

                    <button className="btn bp" style={{ width: '100%', marginTop: '32px', height: '56px', fontSize: '16px', fontWeight: 800 }} onClick={saveUserData} disabled={saving}>
                        {saving ? 'GÜNCELLENİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                    </button>
                </div>
            )}
        </div>
    );
};
