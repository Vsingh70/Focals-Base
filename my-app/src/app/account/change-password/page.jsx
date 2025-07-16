"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '@/utils/supabase/client';
import Toast from '../../components/toast';
import Image from 'next/image';

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Password validation function
  const validatePassword = (pwd) => {
    const validation = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  // Handle confirm password change
  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const ViewPasswordImage = () => {
    return (
      <Image
        src="/eye.svg"
        alt="View Password"
        width={20}
        height={20}
      />
    );
  };

  const HidePasswordImage = () => {
    return (
      <Image
        src="/crossed_eye.svg"
        alt="Hide Password"
        width={20}
        height={20}
      />
    );
  };

  const passwordInput = (label, value, onChange, showPassword, setShowPassword) => {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '0' }}>
        <h2 style={{
          fontSize: '1.125rem',
          color: 'var(--text)',
          letterSpacing: '1px',
          marginBottom: '8px',
          marginLeft: '2px'
        }}>
          {label}
        </h2>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type={showPassword ? "text" : "password"}
            required
            placeholder={`Enter your ${label.toLowerCase()}`}
            value={value}
            onChange={onChange}
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
                e.currentTarget.style.transition = 'background 0.2s';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--button-bg)';
            }}
            style={{
              width: '100%',
              padding: '10px 24px',
              paddingRight: '50px', // Space for eye icon
              border: `2px solid var(--border)`,
              borderRadius: '8px',
              fontSize: '1rem',
              background: 'var(--button-bg)',
              color: 'var(--unselected-text)',
              height: 'auto',
              boxSizing: 'border-box'
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              color: 'var(--text)',
              padding: '4px',
            }}
          >
            {showPassword ? <HidePasswordImage /> : <ViewPasswordImage />}
          </button>
        </div>
      </div>
    );
  };

  const passwordRequirements = () => {
    return (
      <div style={{
        marginTop: '0.5rem',
        marginLeft: '0.3rem',
        fontSize: '0.75rem',
      }}>
        <div style={{
          color: passwordValidation.length ? 'var(--success, #22c55e)' : 'var(--unselected)',
          marginBottom: '2px'
        }}>
          {passwordValidation.length ? '✓' : '○'} At least 8 characters
        </div>
        <div style={{
          color: passwordValidation.uppercase ? 'var(--success, #22c55e)' : 'var(--unselected)',
          marginBottom: '2px'
        }}>
          {passwordValidation.uppercase ? '✓' : '○'} One uppercase letter
        </div>
        <div style={{
          color: passwordValidation.lowercase ? 'var(--success, #22c55e)' : 'var(--unselected)',
          marginBottom: '2px'
        }}>
          {passwordValidation.lowercase ? '✓' : '○'} One lowercase letter
        </div>
        <div style={{
          color: passwordValidation.number ? 'var(--success, #22c55e)' : 'var(--unselected)',
          marginBottom: '2px'
        }}>
          {passwordValidation.number ? '✓' : '○'} One number
        </div>
        <div style={{
          color: passwordValidation.special ? 'var(--success, #22c55e)' : 'var(--unselected)',
          marginBottom: '2px'
        }}>
          {passwordValidation.special ? '✓' : '○'} One special character
        </div>
        {password && confirmPassword && (
          <div style={{
            color: password === confirmPassword ? 'var(--success, #22c55e)' : '#ef4444',
            marginBottom: '2px'
          }}>
            {password === confirmPassword ? '✓' : '○'} Passwords match
          </div>
        )}
      </div>
    );
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (!Object.values(passwordValidation).every(Boolean)) {
      setMessage("Please ensure your password meets all requirements");
      setShowToast(true);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setShowToast(true);
      return;
    }

    setIsUpdating(true);

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setMessage("Password updated successfully! Redirecting...");
      setShowToast(true);

      // Redirect to home after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('Password update error:', error);
      setMessage(error.message || 'Failed to update password');
      setShowToast(true);
      setIsUpdating(false);
    }
  };

  const ConfirmPasswordChangeButton = () => {
    const isFormValid = Object.values(passwordValidation).every(Boolean) && 
                       password && 
                       confirmPassword && 
                       password === confirmPassword;
    
    return (
      <button 
        type="submit"
        disabled={!isFormValid || isUpdating}
        style={{
            background: isFormValid && !isUpdating ? 'var(--bg)' : 'var(--unselected-hover)',
            borderRadius: '10px',
            border: `2px solid ${isFormValid && !isUpdating ? 'var(--primary)' : 'var(--unselected-hover)'}`,
            padding: '1rem 1.5rem',
            fontSize: '1.125rem',
            color: isFormValid && !isUpdating ? 'var(--text)' : 'var(--unselected)',
            cursor: isFormValid && !isUpdating ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap',
            opacity: isFormValid && !isUpdating ? 1 : 0.6,
          }}
          onMouseOver={(e) => {
            if (isFormValid && !isUpdating) {
              e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
              e.currentTarget.style.transition = 'background 0.2s';
            }
          }}
          onMouseOut={(e) => {
            if (isFormValid && !isUpdating) {
              e.currentTarget.style.backgroundColor = 'var(--button-bg)';
            }
          }}
          >
            {isUpdating ? 'Updating...' : 'Confirm Password Change'}
          </button>
    );
  }

  const BackToAccount = () => {
    return (
      <button style={{
            background: 'var(--bg)',
            borderRadius: '10px',
            border: '2px solid var(--primary)',
            padding: '1rem 1.5rem',
            fontSize: '1.125rem',
            color:'var(--text)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
           onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
            e.currentTarget.style.transition = 'background 0.2s';
          }}
          onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--button-bg)';
          }}
          onClick={() => router.push("/account")}
          >
            Back to Account
          </button>
    );
  }

  return (
    <div style={{
      background: 'var(--bg)',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {showToast && (
          <Toast 
              Message={message} 
              close={() => setShowToast(false)}
              duration={4000}
          />
      )}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '10px',
        padding: '40px 32px',
        border: '2px solid var(--border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        minWidth: '420px',
        maxWidth: '1100px',
        width: '100%',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 400,
          color: 'var(--primary)',
          letterSpacing: '1px',
          marginBottom: '32px',
          marginTop: '-20px',
        }}>
          Change Password
        </h1>
        <form onSubmit={handlePasswordUpdate} style={{ width: '100%' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '32px',
            width: '100%',
          }}>
            {passwordInput("New Password", password, handlePasswordChange, showPassword, setShowPassword)}
            {passwordInput("Confirm Password", confirmPassword, handleConfirmPasswordChange, showConfirmPassword, setShowConfirmPassword)}
          </div>
          {passwordRequirements()}
        </form>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginTop: '2rem',
        }}>
          {BackToAccount()}
          <div style={{
            display: 'flex',
            gap: '12px',
          }}>
            {ConfirmPasswordChangeButton()}
          </div>
        </div>
      </div>
    </div>
  );
}