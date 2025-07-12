'use client';
import { useState, useEffect } from 'react';
import AddButton from "./AddButton";
import FilterButton from "./Filter/FilterButton";
import SearchBar from "./SearchBar";

const Navbar = ({ Title = "", 
                    Add = false,
                    AddText = "",
                    AddLink = "",
                    Filter = false,
                    Search = false,
                    Input = [],
                    update = null,
                    SubmitButton = null,
                    Submit = false,
                    DeleteButton = null,
                    Delete = false,
                    MiddleText = null,
                    Middle = false }) => {
    
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
    const isLarge = isClient ? windowWidth >= 1200 : true; // Default to large on server
    const isMedium = isClient ? (windowWidth >= 768 && windowWidth < 1200) : false;
    const isSmall = isClient ? windowWidth < 768 : false;

    return (
        <div id="navbar" style={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 1000, 
            background: 'var(--bg)', 
            borderBottom: '1px solid var(--primary)', 
            padding: isSmall ? '0.5rem' : '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: isLarge ? '1.5rem' : isMedium ? '1rem' : '0.75rem'
        }}>
            {/* Left section - Title */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                minWidth: 'fit-content',
                flexShrink: 0
            }}>
                <h1 
                    style={{ 
                        color: 'var(--primary)', 
                        fontSize: isSmall ? '1rem' : isMedium ? '1.5rem' : '1.75rem',
                        margin: 0,
                        whiteSpace: 'nowrap'
                    }}
                >
                    {Title}
                </h1>
            </div>

            {/* Center section - Filter and Search */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                flex: '1',
                justifyContent: 'center',
                gap: isLarge ? '1rem' : isMedium ? '0.75rem' : '0.5rem',
                maxWidth: isLarge ? '75%' : isMedium ? '65%' : '45%',
                minWidth: 0 // Allow shrinking
            }}>
                {/* Filter Button - Always to the left of search */}
                {Filter && (
                    <div style={{ flexShrink: 0 }}>
                        <FilterButton 
                            data={Input} 
                            buttonText={Title} 
                            onFilteredDataChange={update}
                        />
                    </div>
                )}

                {/* Search Bar - Wider and scales down more gradually */}
                {Search && (
                    <div style={{ 
                        width: isLarge ? '600px' : isMedium ? '450px' : '200px',
                        maxWidth: '100%',
                        flex: '1',
                        minWidth: isSmall ? '150px' : '200px'
                    }}>
                        <SearchBar data={Input} onSearchResults={update} />
                    </div>
                )}
            </div>

            {/* Right section - Delete and Add buttons */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: isLarge ? '1rem' : isMedium ? '0.75rem' : '0.5rem',
                minWidth: 'fit-content',
                flexShrink: 0
            }}>
                {/* Delete Button - Always to the left of Add button */}
                {Delete && DeleteButton && (
                    <div>
                        {DeleteButton()}
                    </div>
                )}

                {/* Add Button */}
                {Add && (
                    <AddButton text={AddText} link={AddLink}/>
                )}

                {/* Submit Button */}
                {Submit && SubmitButton && (
                    <div>
                        {SubmitButton()}
                    </div>
                )}
            </div>

            {/* Middle content (if any) */}
            {Middle && MiddleText && !isSmall && (
                <div style={{ 
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: -1
                }}>
                    {MiddleText()}
                </div>
            )}
        </div>
    );
};

export default Navbar;