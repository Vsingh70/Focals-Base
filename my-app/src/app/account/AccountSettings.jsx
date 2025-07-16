'use client';
import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { redirect, useRouter } from "next/navigation";
import { useTheme } from '../components/Themes/Theme-Context';
import NextImage from 'next/image';
import DesktopBar from '../components/DesktopBar'
import Select from 'react-select';
import Toast from '../components/toast';
import DeleteUserPopUpCard from './DeleteUserPopUpCard';

export default function AccountSettings({ user }) {
    const supabase = createClient()
    const router = useRouter();
    const { theme: contextTheme, setTheme: setContextTheme } = useTheme();
    const [loading, setLoading] = useState(true)
    const [FullName, setFullName] = useState(null);
    const [AvatarUrl, setAvatarUrl] = useState(null);
    const [Email, setEmail] = useState(null);
    const [Message, setMessage] = useState("");
    const [ShowToast, setShowToast] = useState(false);
    const [showDeletePopup, setShowDeletePopup] = useState(false);

    const getProfile = useCallback(async () => {
        try {
          setLoading(true)
          const { data, error, status } = await supabase
            .from('profiles')
            .select(`id, name, theme, avatar_url, email`)
            .eq('id', user?.id)
            .single()
          if (error && status !== 406) throw error
          if (data) {
            setFullName(data.name)
            setAvatarUrl(data.avatar_url)
            setEmail(data.email)
            // Set the context theme from database if it exists
            if (data.theme) {
              setContextTheme(data.theme)
            }
          }
        } catch (error) {
          alert('Error loading user data!')
          redirect('/login')
        } finally {
          setLoading(false)
        }
      }, [user, supabase, setContextTheme])

    useEffect(() => {
        getProfile()
    }, [user, getProfile])

    async function updateProfile({ fullname, avatar_url, theme }) {
        try {
            setLoading(true);
            const { error } = await supabase.from('profiles').upsert({
                id: user?.id,
                name: fullname,
                email: Email,
                theme: theme,
                avatar_url: avatar_url || AvatarUrl,
                updated_at: new Date().toISOString(),
            })
            if (error) {
                console.log('Error updating profile:', error);
                throw error;
            }
            setMessage("Profile updated successfully!");
            setShowToast(true);
        } catch (error) {
            setMessage("Error updating the data!");
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    }

    const SubmitButton = () => (
        <button
            disabled={loading || !FullName || !contextTheme}
            onClick={(e) => {
                e.preventDefault();
                updateProfile({ 
                    fullname: FullName, 
                    avatar_url: AvatarUrl, 
                    theme: contextTheme 
                });
            }}
            style={{
                padding: '10px 24px',
                fontSize: '1rem',
                background: 'var(--button-bg)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                borderRadius: '8px',
                color: 'var(--primary)',
                border: '2px solid var(--border)',
                cursor: 'pointer',
                transition: 'background 0.2s'
            }}
            onMouseOver={e => {
                e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
            }}
            onMouseOut={e => {
                e.currentTarget.style.backgroundColor = 'var(--button-bg)';
            }}
        >
            Update Profile
        </button>
    );

    const smallInput = {
        padding: '0.5rem',
        height: '1rem',
        background: 'var(--button-bg)',
        color: 'var(--text)',
        border: '2px solid var(--border)',
        borderRadius: '8px',
        fontWeight: 'semi-bold',
        fontSize: '1rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'background 0.2s',
    };

    const Avatar = () => {
        const fileInputRef = useRef(null);
        const [uploading, setUploading] = useState(false);

        const handleButtonClick = () => {
            if (!uploading) {
                fileInputRef.current?.click();
            }
        };

        const uploadToSupabase = async (file) => {
            try {
                setUploading(true);
                
                // Delete old avatar if it exists and is from our bucket
                if (AvatarUrl && AvatarUrl.includes('supabase')) {
                    const oldPath = AvatarUrl.split('/').slice(-2).join('/'); // Extract path from URL
                    await supabase.storage
                        .from('avatars')
                        .remove([oldPath]);
                }
                
                // Create unique filename
                const fileExt = file.name.split('.').pop();
                const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                // Upload file to Supabase Storage
                const { data, error } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) {
                    console.error('Storage upload error:', error);
                    throw error;
                }

                // Get the public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                return publicUrl;
            } catch (error) {
                console.error('Error uploading file:', error);
                setMessage("Error uploading image!");
                setShowToast(true);
                throw error;
            } finally {
                setUploading(false);
            }
        };

        const processImageForCircle = (file) => {
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = () => {
                    const size = 400;
                    canvas.width = size;
                    canvas.height = size;
                    
                    const scale = Math.max(size / img.width, size / img.height);
                    const scaledWidth = img.width * scale;
                    const scaledHeight = img.height * scale;
                    
                    const x = (size - scaledWidth) / 2;
                    const y = (size - scaledHeight) / 2;
                    
                    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                    
                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', 0.9);
                };
                
                img.src = URL.createObjectURL(file);
            });
        };

        const handleFileChange = async (event) => {
            const file = event.target.files[0];
            if (file) {
                try {
                    const tempUrl = URL.createObjectURL(file);
                    setAvatarUrl(tempUrl);
                    
                    const processedBlob = await processImageForCircle(file);
                    
                    const processedFile = new File([processedBlob], `avatar-${Date.now()}.jpg`, {
                        type: 'image/jpeg'
                    });
                    
                    const permanentUrl = await uploadToSupabase(processedFile);
                    
                    URL.revokeObjectURL(tempUrl);
                    setAvatarUrl(permanentUrl);
                    
                } catch (error) {
                    console.error('Error handling file upload:', error);
                    if (AvatarUrl && AvatarUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(AvatarUrl);
                    }
                    getProfile();
                }
            }
        };
        
        return (
            <span>
                <button
                    type="button"
                    onClick={handleButtonClick}
                    disabled={uploading}
                    style={{ 
                        border: 'none', 
                        background: 'none', 
                        padding: 0, 
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        opacity: uploading ? 0.7 : 1
                    }}
                >
                    <div style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <NextImage
                            src={AvatarUrl || '/account.svg'}
                            alt="Avatar"
                            width={150}
                            height={150}
                            style={{ objectFit: 'cover' }}
                            unoptimized
                        />
                        {uploading && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}>
                                Uploading...
                            </div>
                        )}
                    </div>
                </button>
                <p
                    style={{
                        color: 'var(--unselected)',
                        fontSize: '0.875rem',
                        margin: '0.5rem 0 0 0',
                        textAlign: 'center'
                    }}
                >
                    {uploading ? 'Uploading...' : 'Click to change'}
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    disabled={uploading}
                />
            </span>
        );
    };

    const nameInput = () => {
        return (
            <div style={{ flex: 1 }}>
                <input
                    type="text"
                    value={FullName || ''}
                    onChange={(e) => setFullName(e.target.value)}
                    id='NameInput'
                    placeholder="Enter your full name"
                    style={{
                        padding: '12px 16px',
                        color: 'var(--text)',
                        background: 'transparent',
                        textDecoration: 'underline',
                        textDecorationColor: FullName ? 'var(--text)' : 'var(--unselected)',
                        fontSize: '2.05rem',
                        outline: 'none',
                        transition: 'color 0.2s, text-decoration-color 0.2s',
                        cursor: 'text',
                        width: '100%',
                        border: 'none'
                    }}
                    onMouseOver={e => {
                        e.currentTarget.style.color = 'var(--text-hover)';
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.color = 'var(--text)';
                    }}
                />
                <p style={{
                    fontSize: '1rem',
                    color: 'var(--unselected)',
                    margin: '0',
                    padding: '0 16px'
                }}>
                    {Email}
                </p>
            </div>
        );
    }

    const SelectTheme = () => {
        const [mounted, setMounted] = useState(false);
        
        useEffect(() => {
            setMounted(true);
        }, []);

        const options = [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System Default' }
        ];

        // Don't render the Select component until after hydration
        if (!mounted) {
            return (
                <div style={{ 
                    maxWidth: '50rem', 
                    width: '100%',
                    height: '2.5rem',
                    background: 'var(--button-bg)',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 0.5rem',
                    color: 'var(--text)',
                    fontSize: '1rem'
                }}>
                    Loading theme options...
                </div>
            );
        }

        return (
            <div style={{ maxWidth: '50rem', width: '100%' }}>
                <Select
                    options={options}
                    value={options.find(option => option.value === contextTheme)}
                    onChange={(selectedOption) => {
                        setContextTheme(selectedOption.value);
                    }}
                    placeholder="Select theme"
                    styles={{
                        container: base => ({ ...base, width: '100%' }),
                        control: (base) => ({
                            ...base,
                            background: 'var(--button-bg)',
                            color: 'var(--text)',
                            border: '2px solid var(--border)',
                            borderRadius: smallInput.borderRadius,
                            fontWeight: smallInput.fontWeight,
                            fontSize: smallInput.fontSize,
                            boxShadow: smallInput.boxShadow,
                            transition: smallInput.transition,
                            minHeight: 'unset',
                            padding: smallInput.padding,
                            borderColor: smallInput.border,
                                ':hover': {
                                transition: 'background 0.2s',
                                backgroundColor: 'var(--button-bg-hover)',
                                color: 'var(--primary)',
                                border: '2px solid var(--border)',
                                borderRadius: '8px',
                            },
                        }),
                        singleValue: (base) => ({
                            ...base,
                            color: 'var(--text)',
                        }),
                        menu: base => ({
                            ...base,
                            zIndex: 9999,
                            background: 'var(--button-bg)',
                            border: '2px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--text)',
                            fontSize: '1rem',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                        }),
                        option: (base) => ({
                            ...base,
                            background: 'var(--button-bg)',
                            color: 'var(--text)',
                            cursor: 'pointer',
                            fontWeight: 'normal',
                            ':hover': {
                                backgroundColor: 'var(--button-bg-hover)',
                                transition: 'background 0.2s',
                            },
                        }),
                    }}
                />
            </div>
        );
    }

    const EditFormButton = () => {
        return (
            <button
            onClick={() => router.push('/account/edit-form')}
            style={{
                    padding: '10px 24px',
                    height: '3.36rem',
                    fontSize: '1.25rem',
                    background: 'var(--button-bg)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    borderRadius: '8px',
                    color: 'var(--primary)',
                    border: '2px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    maxWidth: '50rem',
                    width: '100%'
                }}
                onMouseOver={e => {
                    e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                }}
                onMouseOut={e => {
                    e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                }}
            >
                Edit Form
            </button>
        )
    }

    const ChangePasswordButton = () => {
        return (
            <button
            onClick={async () => { 
                const { error } = await supabase.auth.resetPasswordForEmail(Email, {
                    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/account/change-password`
                })
                if (error) {
                    console.error('Error sending password reset email:', error);
                    setMessage("Error sending password reset email!");
                    setShowToast(true);
                } else {
                    setMessage("Password reset email sent successfully!");
                    setShowToast(true);
                } 
            }}
            style={{
                    padding: '10px 24px',
                    height: '3.36rem',
                    fontSize: '1.25rem',
                    background: 'var(--button-bg)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    borderRadius: '8px',
                    color: 'var(--primary)',
                    border: '2px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    maxWidth: '50rem',
                    width: '100%'
                }}
                onMouseOver={e => {
                    e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                }}
                onMouseOut={e => {
                    e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                }}
            >
                Change Password
            </button>
        )
    }

    const DeleteAccountButton = () => {
        return (
            <button
            onClick={() => setShowDeletePopup(true)}
            style={{
                    padding: '10px 24px',
                    height: '3.36rem',
                    fontSize: '1.25rem',
                    background: 'var(--button-bg)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    borderRadius: '8px',
                    color: 'var(--primary)',
                    border: '2px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    maxWidth: '50rem',
                    width: '100%'
                }}
                onMouseOver={e => {
                    e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                }}
                onMouseOut={e => {
                    e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                }}
            >
                Delete Account
            </button>
        )
    }

    const LogOutButton = () => {
        return (
            <button
            onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
            }}
            style={{
                    padding: '10px 24px',
                    fontSize: '1rem',
                    background: 'var(--button-bg)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    borderRadius: '8px',
                    color: 'var(--primary)',
                    border: '2px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                }}
                onMouseOver={e => {
                    e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                }}
                onMouseOut={e => {
                    e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                }}
            >
                Log Out
            </button>
        )
    }

    return (
        <div>
            <DesktopBar Title='Account Settings' Submit={true} SubmitButton={SubmitButton}/>
            {ShowToast && (
                <Toast 
                    Message={Message} 
                    close={() => setShowToast(false)}
                    duration={4000}
                />
            )}
            <div className='main-content' style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem'
            }}>
                {/* Top Section: Avatar, Name, Email, and Logout Button */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1.5rem'
                }}>
                    {Avatar()}
                    <div style={{
                        display: 'flex',
                        flex: 1,
                        alignItems: 'flex-start',
                        gap: '1rem'
                    }}>
                        {nameInput()}
                        <LogOutButton />
                    </div>
                </div>

                {/* Middle Section: Settings Options */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '3rem',
                    marginTop: '2rem'
                }}>
                    {/* Left Column */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        minWidth: '300px'
                    }}>
                        <div>
                            <h3 style={{
                                fontSize: '1.125rem',
                                color: 'var(--text)',
                                marginBottom: '0.5rem'
                            }}>
                                Theme
                            </h3>
                            <SelectTheme />
                        </div>
                        <div>
                            <h3 style={{
                                fontSize: '1.125rem',
                                color: 'var(--text)',
                                marginBottom: '0.5rem'
                            }}>
                                Form Settings
                            </h3>
                            <EditFormButton />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        minWidth: '300px'
                    }}>
                        <div>
                            <h3 style={{
                                fontSize: '1.125rem',
                                color: 'var(--text)',
                                marginBottom: '0.5rem'
                            }}>
                                Security
                            </h3>
                            <ChangePasswordButton />
                        </div>
                        <div>
                            <h3 style={{
                                fontSize: '1.125rem',
                                color: 'var(--text)',
                                marginBottom: '0.5rem'
                            }}>
                                Account Management
                            </h3>
                            <DeleteAccountButton />
                        </div>
                    </div>
                </div>
            </div>
            
            <DeleteUserPopUpCard 
                trigger={showDeletePopup}
                setTrigger={setShowDeletePopup}
                onConfirm={() => {
                    // Additional cleanup can be done here if needed
                    console.log('Account deletion confirmed');
                }}
            />
        </div>
    );

}