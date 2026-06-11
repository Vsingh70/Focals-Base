'use client';

import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { LT } from './tokens';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type WaitlistProps = {
  /** Fine print under the form. */
  note?: string;
  /** Which page converted — sent to the API ("web-landing" / "ios-landing"). */
  source?: string;
};

/**
 * Waitlist capture. POSTs { email, source, ts, hp } same-origin to
 * /api/waitlist. 409 (already subscribed) is treated as success; other
 * non-2xx shows the server's `error` or a generic message. `hp` is a
 * honeypot the server silently drops when non-empty.
 */
export function Waitlist({ note, source = 'landing' }: WaitlistProps) {
  const [email, setEmail] = useState('');
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const ok = EMAIL_RE.test(email.trim());

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ok || status === 'submitting') return;
    setStatus('submitting');
    setErrMsg('');

    const payload = {
      email: email.trim().toLowerCase(),
      source,
      ts: new Date().toISOString(),
      hp,
    };

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 409) {
        // 409 = already on the list → treat as success
        setStatus('success');
        return;
      }
      let m = 'Something went wrong. Please try again.';
      try {
        const j: unknown = await res.json();
        if (j && typeof j === 'object' && 'error' in j && typeof j.error === 'string') {
          m = j.error;
        }
      } catch {
        // non-JSON body — keep the generic message
      }
      setErrMsg(m);
      setStatus('error');
    } catch {
      setErrMsg('Network error — check your connection and try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div style={{ maxWidth: 460, width: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            background: LT.bg2,
            border: `0.5px solid ${LT.successA44}`,
            borderRadius: 12,
            padding: '16px 18px',
            textAlign: 'left',
          }}
        >
          <span style={{ color: LT.success, display: 'inline-flex' }}>
            <Check size={20} />
          </span>
          <div style={{ fontFamily: LT.ui }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: LT.text }}>
              You&rsquo;re on the list.
            </div>
            <div style={{ fontSize: 13, color: LT.text2 }}>
              We&rsquo;ll email {email.trim().toLowerCase()} when your invite is ready.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const busy = status === 'submitting';
  return (
    <div style={{ maxWidth: 460, width: '100%' }}>
      <form onSubmit={submit} style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
        {/* Honeypot — hidden from real users; bots that fill it are dropped. */}
        <input
          type="text"
          name="hp"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          className="lp-hp"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <input
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          type="email"
          placeholder="you@studio.com"
          disabled={busy}
          autoComplete="email"
          aria-label="Email address"
          className={`lp-input${status === 'error' ? ' lp-input-error' : ''}`}
          style={{
            flex: '1 1 220px',
            minWidth: 0,
            height: 50,
            padding: '0 16px',
            borderRadius: 11,
            background: LT.bg2,
            color: LT.text,
            fontFamily: LT.ui,
            fontSize: 15,
            outline: 'none',
            opacity: busy ? 0.6 : 1,
          }}
        />
        <button
          type="submit"
          disabled={!ok || busy}
          style={{
            height: 50,
            padding: '0 22px',
            borderRadius: 11,
            border: 'none',
            cursor: ok && !busy ? 'pointer' : 'default',
            background: ok && !busy ? LT.accent : LT.bg3,
            color: ok && !busy ? '#0a0a0a' : LT.text3,
            fontFamily: LT.ui,
            fontSize: 15,
            fontWeight: 600,
            transition: 'background .2s, color .2s',
            whiteSpace: 'nowrap',
          }}
        >
          {busy ? 'Joining…' : 'Request invite'}
        </button>
      </form>
      {status === 'error' && (
        <div style={{ fontFamily: LT.ui, fontSize: 12.5, color: LT.danger, marginTop: 11 }}>
          {errMsg}
        </div>
      )}
      {note && status !== 'error' && (
        <div style={{ fontFamily: LT.ui, fontSize: 12.5, color: LT.text3, marginTop: 11 }}>
          {note}
        </div>
      )}
    </div>
  );
}
