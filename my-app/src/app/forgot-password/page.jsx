"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '@/utils/supabase/client';
import Toast from '../components/toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const checkEmailExists = async (email) => {
    try {
      const { data, error } = await supabase
        .rpc('email_exists', { check_email: email });

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      return !!data; // Returns true if email exists, false otherwise
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setMessage("Please enter a valid email address");
      setShowToast(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // First check if email exists in profiles table
      const emailExists = await checkEmailExists(email);
      console.log("Email exists:", emailExists);
      
      if (!emailExists) {
        setMessage("This email is not registered with us");
        setShowToast(true);
        setIsSubmitting(false);
        return;
      }

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) {
        throw error;
      }

      setMessage("Password reset email sent! Please check your inbox and spam folder.");
      setShowToast(true);
      setEmail(""); // Clear the email field on success

    } catch (error) {
      console.error('Password reset error:', error);
      setMessage(error.message || 'Failed to send password reset email');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const emailInput = () => {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '0' }}>
        <h2 style={{
          fontSize: '1.125rem',
          color: 'var(--text)',
          letterSpacing: '1px',
          marginBottom: '8px',
          marginLeft: '2px'
        }}>
          Email Address
        </h2>
        <input
          type="email"
          required
          placeholder="Enter your email address"
          value={email}
          onChange={handleEmailChange}
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
            border: `2px solid var(--border)`,
            borderRadius: '8px',
            fontSize: '1rem',
            background: 'var(--button-bg)',
            color: 'var(--unselected-text)',
            height: 'auto',
            boxSizing: 'border-box'
          }}
        />
      </div>
    );
  };

  const ResetPasswordButton = () => {
    const isFormValid = validateEmail(email);
    
    return (
      <button 
        type="submit"
        disabled={!isFormValid || isSubmitting}
        style={{
            background: isFormValid && !isSubmitting ? 'var(--bg)' : 'var(--unselected-hover)',
            borderRadius: '10px',
            border: `2px solid ${isFormValid && !isSubmitting ? 'var(--primary)' : 'var(--unselected-hover)'}`,
            padding: '1rem 1.5rem',
            fontSize: '1.125rem',
            color: isFormValid && !isSubmitting ? 'var(--text)' : 'var(--unselected)',
            cursor: isFormValid && !isSubmitting ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap',
            opacity: isFormValid && !isSubmitting ? 1 : 0.6,
          }}
          onMouseOver={(e) => {
            if (isFormValid && !isSubmitting) {
              e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
              e.currentTarget.style.transition = 'background 0.2s';
            }
          }}
          onMouseOut={(e) => {
            if (isFormValid && !isSubmitting) {
              e.currentTarget.style.backgroundColor = 'var(--button-bg)';
            }
          }}
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Email'}
          </button>
    );
  }

  const BackToLogin = () => {
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
          onClick={() => router.push("/login")}
          >
            Back to Login
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
        maxWidth: '600px',
        width: '100%',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 400,
          color: 'var(--primary)',
          letterSpacing: '1px',
          marginBottom: '16px',
          marginTop: '-20px',
        }}>
          Reset Password
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--text)',
          marginBottom: '32px',
          lineHeight: '1.5',
        }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <form onSubmit={handlePasswordReset} style={{ width: '100%' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            width: '100%',
            marginBottom: '32px',
          }}>
            {emailInput()}
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}>
            {BackToLogin()}
            <div style={{
              display: 'flex',
              gap: '12px',
            }}>
              {ResetPasswordButton()}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}