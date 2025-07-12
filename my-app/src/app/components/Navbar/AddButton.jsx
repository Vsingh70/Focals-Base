'use client';
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const AddButton = ({ text = "", link = "/" }) => {
    const router = useRouter();
    const path = usePathname(); // Get the current pathname
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

    const handleClick = () => {
        router.push(`${path}/${link}`); // Navigate to the add page
    };

    // Responsive breakpoints - use server-safe defaults until client hydrates
    const isSmall = isClient ? windowWidth < 768 : false; // Default to large on server
    const isMedium = isClient ? (windowWidth >= 768 && windowWidth < 1200) : false;

    const buttonStyle = {
        padding: isSmall ? '6px 12px' : isMedium ? '8px 16px' : '10px 24px',
        background: 'var(--button-bg)',
        color: 'var(--primary)',
        border: '2px solid var(--border)',
        borderRadius: '8px',
        fontWeight: 'semi-bold',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'background 0.2s',
        fontSize: isSmall ? '0.8rem' : isMedium ? '0.9rem' : '1rem',
        whiteSpace: 'nowrap'
    };

    // Shortened text for small screens
    const displayText = isSmall ? text.replace('+ Add ', '+') : text;

    return (
        <button
            onClick={handleClick}
            style={buttonStyle}
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--button-bg)';
            }}
        >
            {displayText}
        </button>
    );
};

export default AddButton;