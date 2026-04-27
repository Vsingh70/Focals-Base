'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/lib/actions/profile';
import type { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  background: 'var(--color-bg)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-secondary)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.9375rem',
  fontFamily: 'var(--font-sans)',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  marginBottom: '0.375rem',
};

const primaryButton: React.CSSProperties = {
  padding: '0.625rem 1rem',
  background: 'var(--color-accent)',
  color: 'var(--color-bg)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};

export function ProfileSection({ profile, email }: { profile: Profile; email: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await updateProfile({
        full_name: (formData.get('full_name') as string) || null,
        business_name: (formData.get('business_name') as string) || null,
        website: (formData.get('website') as string) || null,
        instagram_handle: (formData.get('instagram_handle') as string) || null,
      });
      if (res.error !== null) {
        setError(res.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  };

  return (
    <form action={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
      <div className="app-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={labelStyle} htmlFor="full_name">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            defaultValue={profile.full_name ?? ''}
            maxLength={200}
            placeholder="Your name"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="business_name">
            Business name
          </label>
          <input
            id="business_name"
            name="business_name"
            defaultValue={profile.business_name ?? ''}
            maxLength={200}
            placeholder="Studio or brand name"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          value={email}
          readOnly
          style={{ ...inputStyle, color: 'var(--color-text-secondary)', cursor: 'not-allowed' }}
        />
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-tertiary)',
            margin: '0.375rem 0 0',
          }}
        >
          Email is managed by your authentication provider.
        </p>
      </div>

      <div className="app-stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={labelStyle} htmlFor="website">
            Website
          </label>
          <input
            id="website"
            name="website"
            type="url"
            defaultValue={profile.website ?? ''}
            placeholder="https://yourdomain.com"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="instagram_handle">
            Instagram handle
          </label>
          <input
            id="instagram_handle"
            name="instagram_handle"
            defaultValue={profile.instagram_handle ?? ''}
            maxLength={60}
            placeholder="@yourhandle"
            style={inputStyle}
          />
        </div>
      </div>

      {error ? (
        <p style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', margin: 0 }}>{error}</p>
      ) : null}
      {success ? (
        <p style={{ color: 'var(--color-success)', fontSize: '0.8125rem', margin: 0 }}>
          Saved.
        </p>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          disabled={isPending}
          style={{ ...primaryButton, opacity: isPending ? 0.6 : 1 }}
        >
          {isPending ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </form>
  );
}
