'use client';

import { useState, useEffect } from 'react';

const Toast = ({ Message = "", close = null, duration = 2000 }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsVisible(false);
        if (close) {
            close();
        }
    };

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '5.5rem',
            right: '1rem',
            backgroundColor: 'var(--primary)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            maxWidth: '500px',
            zIndex: 1000,
            animation: 'slideIn 0.3s ease-out',
        }}>
            <p style={{
                margin: 0,
                fontSize: '14px',
                lineHeight: '1.4',
                flex: 1
            }}>
                {Message}
            </p>
            <button 
                onClick={handleClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    fontSize: '18px',
                    lineHeight: 1,
                    opacity: 0.7,
                    transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0.7'}
            >
                ×
            </button>
            <style jsx>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default Toast;