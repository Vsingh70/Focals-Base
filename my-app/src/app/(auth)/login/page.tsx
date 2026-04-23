import Image from 'next/image';
import { signInWithGoogle } from '@/lib/actions/auth';

export const metadata = {
  title: `Sign in · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}`,
};

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2.5rem',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.25rem',
            color: 'var(--color-text-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {process.env.NEXT_PUBLIC_APP_NAME}
        </h1>
        <form action={signInWithGoogle} style={{ width: '100%' }}>
          <button
            type="submit"
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1.25rem',
              background: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-secondary)',
              borderRadius: 'var(--radius-md)',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <Image src="/google.svg" alt="" width={20} height={20} />
            Continue with Google
          </button>
        </form>
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-text-tertiary)',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          By signing in you agree to the terms of service.
        </p>
      </div>
    </main>
  );
}
