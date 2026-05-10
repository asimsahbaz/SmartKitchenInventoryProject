import React, { useEffect, useState } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { apiClient } from '../api/client';

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetch = async () => {
    try {
      const { data } = await apiClient.get('/notifications');
      setNotifications(data.data);
    } catch {}
  };

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, []);

  const unread = notifications.filter(n => !n.isRead).length;

  const markAllRead = async () => {
    await apiClient.patch('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markRead = async (id: string) => {
    await apiClient.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ position: 'relative', padding: '4px', color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer' }}
        className="text-gray-400 hover:text-gray-600"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-2px', right: '-2px',
            background: '#ef4444', color: 'white',
            borderRadius: '50%', width: '16px', height: '16px',
            fontSize: '10px', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '32px', width: '300px',
          background: 'white', border: '1px solid #e5e7eb',
          borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          zIndex: 50, overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Notifications</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {unread > 0 && (
                <button onClick={markAllRead} style={{ fontSize: '11px', color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                No notifications
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid #f9fafb',
                    background: n.isRead ? 'white' : '#f0fdf4',
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: '16px', marginTop: '1px' }}>
                    {n.type === 'ITEM_EXPIRED' ? '🔴' : '⚠️'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '3px 0 0' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.isRead && (
                    <button onClick={() => markRead(n.id)} style={{ color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
