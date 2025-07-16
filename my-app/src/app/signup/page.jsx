"use client";
import { signup } from '../login/actions';
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GoogleLogin from '../components/GoogleLogin';
import Toast from '../components/toast';
import Image from 'next/image';

export default function SignupPage() {
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  // Check for error parameters in URL
  const error = searchParams.get("error");
  const success = searchParams.get("success");

  // Handle error messages
  useEffect(() => {
    if (error === "email-taken") {
      setMessage("This email is already registered. Please use a different email or try logging in.");
      setShowToast(true);
    } else if (error === "weak-password") {
      setMessage("Password is too weak. Please use a stronger password.");
      setShowToast(true);
    } else if (error === "invalid-email") {
      setMessage("Please enter a valid email address.");
      setShowToast(true);
    } else if (error) {
      setMessage("Signup failed: " + decodeURIComponent(error));
      setShowToast(true);
    } else if (success === "1") {
      setMessage("Signup successful! Please check your email to confirm your account.");
      setShowToast(true);
    }
  }, [error, success]);


  const textInputs = ({placeholder, type, name}) => {
    return (
      <input
        type={type}
        name={name}
        required
        placeholder={placeholder}
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
          border: '2px solid var(--border)',
          borderRadius: '8px',
          fontSize: '1rem',
          background: 'var(--button-bg)',
          color: 'var(--unselected-text)',
          height: 'auto', // Let padding control height
          boxSizing: 'border-box'
        }}
      />
    );
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

  const passwordInput = () => {
    return (
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          required
          placeholder="Enter your password"
          value={password}
          onChange={handlePasswordChange}
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
      </div>
    );
  };

  const CreateAccount = () => {
    const isPasswordValid = Object.values(passwordValidation).every(Boolean) && password;
    
    return (
      <button 
        type="submit"
        form="signup-form"
        disabled={!isPasswordValid}
        style={{
            background: isPasswordValid ? 'var(--bg)' : 'var(--unselected-hover)',
            borderRadius: '10px',
            border: `2px solid ${isPasswordValid ? 'var(--primary)' : 'var(--unselected-hover)'}`,
            padding: '1rem 1.5rem',
            fontSize: '1.125rem',
            color: isPasswordValid ? 'var(--text)' : 'var(--unselected)',
            cursor: isPasswordValid ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap',
            opacity: isPasswordValid ? 1 : 0.6,
          }}
           onMouseOver={(e) => {
            if (isPasswordValid) {
              e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
              e.currentTarget.style.transition = 'background 0.2s';
            }
          }}
          onMouseOut={(e) => {
            if (isPasswordValid) {
              e.currentTarget.style.backgroundColor = 'var(--button-bg)';
            }
          }}
          >
            Create Account
          </button>
    );
  }

  const Login = () => {
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
          onClick={() =>router.push("/login")}
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
              duration={4000} // Optional: custom duration
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
        maxWidth: '1100px', // Optional: limit max width of the card
        width: '100%',     // Card fills available space
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 400,
          color: 'var(--primary)',
          letterSpacing: '1px',
          marginBottom: '32px',
          marginTop: '-20px',
        }}>
          Sign Up
        </h1>
        <form id="signup-form" action={signup} style={{ width: '100%' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '32px',
            width: '100%',
          }}>
            <div style={{ flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          width: '100%', // Column fills half the row
                          minWidth: '0', // Prevents overflow in flexbox
                        }}>
              <h2 style={{
                fontSize: '1.125rem',
                color: 'var(--text)',
                letterSpacing: '1px',
                marginBottom: '8px',
                marginLeft: '2px'
              }}>
                Email
              </h2>
              {textInputs({ placeholder: "Enter your email", name: "email", type: "email" })}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '0' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: '8px',
              }}>
                <h2 style={{
                  fontSize: '1.125rem',
                  color: 'var(--text)',
                  letterSpacing: '1px',
                  marginLeft: '2px',
                  marginBottom: 0,
                }}>
                  Password
                </h2>
                <button
                  type="button"
                  style={{
                    color: 'var(--primary)',
                    background: 'transparent',
                    fontSize: '0.875rem',
                    transition: '0.2s',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'right',
                    padding: 0,
                  }}
                  onClick={() => router.push("/forgot-password")}
                  onMouseOver={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                    e.currentTarget.style.color = 'var(--secondary)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                    e.currentTarget.style.color = 'var(--primary)';
                  }}
                >
                  Forgot Password
                </button>
              </div>
              {passwordInput()}
              {passwordRequirements()}
            </div>
          </div>
        </form>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginTop: '2rem',
        }}>
          {Login()}
          <div style={{
            display: 'flex',
            gap: '12px',
          }}>
            {GoogleLogin()}
            {CreateAccount()}
          </div>
        </div>
      </div>
    </div>
  );
}