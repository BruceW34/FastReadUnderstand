import React from 'react';
import type { NavItem } from './navConfig';
import type { User } from '@/shared/types';

interface MobileBottomNavProps {
  user: User | null;
  tab: NavItem['id'];
  onChangeTab: (id: NavItem['id']) => void;
  navItems: NavItem[];
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  user,
  tab,
  onChangeTab,
  navItems,
}) => {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg2)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '12px 10px',
        zIndex: 1000,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      {navItems
        .filter((n) => {
          const defaultAllowed = ['pathway', 'training', 'social', 'friends', 'profile'].includes(n.id);
          const adminAllowed = user?.isAdmin ? ['admin'].includes(n.id) : false;
          return defaultAllowed || adminAllowed;
        })
        .map((n) => (
          <div
            key={n.id}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              color: tab === n.id ? 'var(--blue)' : 'var(--mu)',
              transition: 'all 0.2s',
              transform: tab === n.id ? 'scale(1.1)' : 'scale(1)',
            }}
            onClick={() => onChangeTab(n.id)}
          >
            <span
              style={{
                fontSize: 24,
                filter:
                  tab === n.id
                    ? 'drop-shadow(0 0 5px rgba(0,180,240,0.4))'
                    : 'none',
              }}
            >
              {n.icon}
            </span>
          </div>
        ))}
    </nav>
  );
};

