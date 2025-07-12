'use client';
import { useState, useEffect } from "react";

const DeleteSelectedButton = ({selected = [], setShowDeletePopup}) => {
    const [windowWidth, setWindowWidth] = useState(1200); // Remove typeof window check
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // Mark as client-side and set initial window width
        setIsClient(true);
        setWindowWidth(window.innerWidth);

        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Responsive breakpoints - use server-safe defaults until client hydrates
    const isSmall = isClient ? windowWidth < 768 : false; // Default to large on server
    const isMedium = isClient ? (windowWidth >= 768 && windowWidth < 1200) : false;

    // Shortened text for small screens
    const displayText = isSmall ? 'Delete' : 'Delete Selected';

    return (
        <button
            onClick={() => setShowDeletePopup(true)}
            disabled={selected.length === 0}
            style={{
                padding: isSmall ? '6px 12px' : isMedium ? '8px 16px' : '10px 24px',
                fontWeight: 'semi-bold',
                fontSize: isSmall ? '0.8rem' : isMedium ? '0.9rem' : '1rem',
                background: selected.length > 0 ? 'var(--button-bg)' : 'var(--unselected)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                borderRadius: '8px',
                color: selected.length > 0 ? 'var(--primary)' : 'white',
                border: selected.length > 0 ? '2px solid var(--border)' : 'none',
                cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
                whiteSpace: 'nowrap'
            }}
            onMouseOver={e => {
                if (selected.length > 0) e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
            }}
            onMouseOut={e => {
                if (selected.length > 0) e.currentTarget.style.backgroundColor = 'var(--button-bg)';
            }}
        >
            {displayText}
        </button>
    );
};

export default DeleteSelectedButton;