'use client';

export default function AuthCodeError() {
  return (
    <div style={{
      background: 'var(--bg)',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: '10px',
        padding: '40px 32px',
        border: '2px solid var(--border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        maxWidth: '400px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 400,
          color: 'var(--primary)',
          letterSpacing: '1px',
          marginBottom: '16px',
          marginTop: '0',
        }}>
          Authentication Error
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--text)',
          marginBottom: '24px',
          lineHeight: '1.5',
        }}>
          Sorry, we couldn't complete your authentication. Please try again or contact support if the problem persists.
        </p>
        <button
          onClick={() => window.location.href = '/login'}
          style={{
            background: 'var(--button-bg)',
            borderRadius: '8px',
            border: '2px solid var(--border)',
            padding: '10px 24px',
            fontSize: '1rem',
            color: 'var(--primary)',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-bg)';
          }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
