'use client';
import { useState, useEffect } from "react";
import Icon from "./SidebarIconButton";

const Sidebar = () => {
    const [navbarHeight, setNavbarHeight] = useState(64); // Default fallback
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    useEffect(() => {
        const updateDimensions = () => {
            const navbar = document.getElementById("navbar");
            if (navbar) {
                // Get the height of the Navbar element
                const { height } = navbar.getBoundingClientRect();
                setNavbarHeight(height);
            }
            setWindowWidth(window.innerWidth);
        };

        // Update on mount
        updateDimensions();

        // Update on resize and when navbar might change
        window.addEventListener('resize', updateDimensions);
        
        // Use a MutationObserver to watch for navbar changes
        const navbar = document.getElementById("navbar");
        if (navbar) {
            const observer = new MutationObserver(updateDimensions);
            observer.observe(navbar, { 
                attributes: true, 
                childList: true, 
                subtree: true 
            });
            
            return () => {
                window.removeEventListener('resize', updateDimensions);
                observer.disconnect();
            };
        }

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Responsive breakpoints
    const isSmall = windowWidth < 768;
    const sidebarWidth = isSmall ? '3rem' : '3.8rem';

    return (
        <span style={{
            position: 'fixed',
            top: `${navbarHeight}px`,
            left: '0',
            width: sidebarWidth,
            height: `calc(100vh - ${navbarHeight}px)`,
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--border)',
            padding: isSmall ? '0.25rem' : '0.5rem',
            zIndex: 999
        }}>
            <Icon icon="/dashboard.svg" link="/"/>
            <Icon icon="/tasks.svg" link="/projects"/>
            <Icon icon="/cart.svg" link="/finances"/>
            <Icon icon="/link.svg" link="/links"/>
            <Icon icon="/account.svg" link="/account"/>
        </span>
    );
};

export default Sidebar;