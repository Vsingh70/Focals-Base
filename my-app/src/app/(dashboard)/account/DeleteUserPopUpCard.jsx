'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DeleteUserPopUpCard = ({ trigger, setTrigger, onConfirm }) => {
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    
    const requiredText = "Delete My Account";
    const isConfirmTextValid = confirmText === requiredText;

    const handleDeleteAccount = async () => {
        if (!isConfirmTextValid) {
            setError('Please type the exact confirmation text');
            return;
        }

        setIsDeleting(true);
        setError('');

        try {
            // Call the API route to delete the user
            const response = await fetch('/api/auth/delete-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete account');
            }

            // Call the onConfirm callback if provided
            if (onConfirm) {
                onConfirm();
            }

            // Redirect to home page (user will be automatically signed out)
            router.push('/');
            
        } catch (err) {
            setError(err.message || 'Failed to delete account');
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        if (!isDeleting) {
            setTrigger(false);
            setConfirmText('');
            setError('');
        }
    };

    return trigger ? (
        <div className="popup-card" style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="popup-content" style={{
                background: 'var(--bg)',
                color: 'var(--text)',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                minWidth: '400px',
                maxWidth: '500px',
                textAlign: 'center'
            }}>
                <h3 style={{ 
                    marginBottom: '1rem', 
                    color: 'var(--text)',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                }}>
                    Delete Account
                </h3>
                
                <p style={{ 
                    marginBottom: '1.5rem', 
                    color: 'var(--text)',
                    lineHeight: '1.5'
                }}>
                    This action cannot be undone. This will permanently delete your account and all associated data.
                </p>

                <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem',
                        color: 'var(--text)',
                        fontWeight: '500'
                    }}>
                        Type "<strong>{requiredText}</strong>" to confirm:
                    </label>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        disabled={isDeleting}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: `2px solid ${isConfirmTextValid ? 'green' : 'var(--border)'}`,
                            borderRadius: '6px',
                            fontSize: '1rem',
                            background: 'var(--input-bg)',
                            color: 'var(--text)',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        placeholder={requiredText}
                    />
                </div>

                {error && (
                    <div style={{ 
                        marginBottom: '1rem',
                        padding: '0.5rem',
                        background: '#fee',
                        color: '#c33',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        onClick={handleDeleteAccount}
                        disabled={!isConfirmTextValid || isDeleting}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: isConfirmTextValid && !isDeleting ? '#dc2626' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isConfirmTextValid && !isDeleting ? 'pointer' : 'not-allowed',
                            fontSize: '1rem',
                            fontWeight: '500',
                            transition: 'background 0.2s',
                            opacity: isDeleting ? 0.7 : 1
                        }}
                        onMouseOver={(e) => {
                            if (isConfirmTextValid && !isDeleting) {
                                e.currentTarget.style.backgroundColor = '#b91c1c';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (isConfirmTextValid && !isDeleting) {
                                e.currentTarget.style.backgroundColor = '#dc2626';
                            }
                        }}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </button>
                    
                    <button
                        onClick={handleClose}
                        disabled={isDeleting}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--unselected)',
                            color: 'var(--text)',
                            border: '2px solid var(--border)',
                            borderRadius: '6px',
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            fontWeight: '500',
                            transition: 'background 0.2s',
                            opacity: isDeleting ? 0.7 : 1
                        }}
                        onMouseOver={(e) => {
                            if (!isDeleting) {
                                e.currentTarget.style.backgroundColor = 'var(--unselected-hover)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!isDeleting) {
                                e.currentTarget.style.backgroundColor = 'var(--unselected)';
                            }
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    ) : null;
};

export default DeleteUserPopUpCard;