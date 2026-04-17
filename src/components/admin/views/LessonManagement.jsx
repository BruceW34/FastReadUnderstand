import React, { useState } from 'react';
import { WeeklyPlanManager } from './WeeklyPlanManager';
import { AdminGuidance } from './AdminGuidance';
import { AdminSystemFlow } from './AdminSystemFlow';

/**
 * 📚 DERS YÖNETİMİ - SADECE HAFTA PLANLAMASI
 * 
 * ✅ TUTULAN SİSTEMİ:
 * - 📅 Hafta Planı Yönetimi: Başlıca sistem (Hafta/Aşama/Bölüm/Görev)
 * - 📖 Rehber & Sistem: Açıklamalar ve sistem bilgisi
 * 
 * 🗑️ SİLİNEN SİSTEMLER:
 * - Eski 4×5 Sistem (Pathway, Weekly, Stages, StageBlock)
 * - Ders Atama (Assignments)
 * - JSON Config (geliştirici aracı)
 */

export const LessonManagement = ({ addToast }) => {
    const [activeTab, setActiveTab] = useState('weeklyplan');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* TAB KONTROLÜ */}
            <div style={{ 
                display: 'flex', 
                gap: '12px', 
                borderBottom: '2px solid var(--bd)', 
                paddingBottom: '12px', 
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                {/* Ana Tab */}
                <button
                    onClick={() => setActiveTab('weeklyplan')}
                    style={{
                        padding: '10px 18px',
                        background: activeTab === 'weeklyplan' ? 'var(--ac)' : 'transparent',
                        color: activeTab === 'weeklyplan' ? '#fff' : 'var(--fg)',
                        border: activeTab === 'weeklyplan' ? '2px solid var(--ac)' : '1px solid transparent',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        fontSize: '14px',
                    }}
                >
                    📅 Hafta Planı Yönetimi
                </button>

                {/* Rehber Tab */}
                <button
                    onClick={() => setActiveTab('guide')}
                    style={{
                        padding: '10px 18px',
                        background: activeTab === 'guide' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                        color: activeTab === 'guide' ? 'var(--fg)' : 'var(--mu)',
                        border: activeTab === 'guide' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        fontSize: '14px',
                    }}
                >
                    📖 Rehber & Sistem
                </button>

                {/* Divider */}
                <div style={{ flex: 1 }} />

                {/* İstatistik */}
                <div style={{
                    padding: '8px 14px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    fontSize: '12px',
                    color: 'var(--mu)',
                    fontWeight: 600,
                }}>
                    ✨ Hafta tabanlı dinamik sistem
                </div>
            </div>

            {/* TAB İÇERİĞİ */}

            {/* Tab 1: Hafta Planı Yönetimi */}
            {activeTab === 'weeklyplan' && (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <WeeklyPlanManager addToast={addToast} />
                </div>
            )}

            {/* Tab 2: Rehber & Sistem */}
            {activeTab === 'guide' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease-out' }}>
                    <AdminSystemFlow />
                    <div style={{ marginTop: '8px' }}>
                        <AdminGuidance />
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
