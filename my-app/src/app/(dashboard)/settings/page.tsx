import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCalendarFeed } from '@/lib/actions/calendar';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { InquirySourcesSection } from '@/components/settings/InquirySourcesSection';
import { AiIntegrationSection } from '@/components/settings/AiIntegrationSection';
import { getIntegrationStatus } from '@/lib/actions/integrations';
import { AppearanceSection } from '@/components/settings/AppearanceSection';
import { AccountSection } from '@/components/settings/AccountSection';
import { CalendarSync } from '@/components/calendar/CalendarSync';
import { TourGate } from '@/components/tour/TourGate';
import { settingsTour } from '@/components/tour/tours';

export const metadata = {
  title: `Settings · ${process.env.NEXT_PUBLIC_APP_NAME ?? ''}`,
};

const sectionStyle: React.CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.125rem',
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  margin: 0,
  letterSpacing: '-0.01em',
};

const sectionDescStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  margin: '0.25rem 0 0',
};

const navLinkStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  textDecoration: 'none',
  padding: '0.375rem 0.625rem',
  borderRadius: 'var(--radius-sm)',
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profileRes, sourcesRes, feedRes, aiStatusRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('inquiry_sources')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    getCalendarFeed(),
    getIntegrationStatus(),
  ]);

  if (profileRes.error || !profileRes.data) {
    return (
      <div className="app-page" style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <PageHeader title="Settings" />
        <p style={{ color: 'var(--color-danger)' }}>
          Error loading profile: {profileRes.error?.message ?? 'unknown'}
        </p>
      </div>
    );
  }

  const profile = profileRes.data;
  const sources = sourcesRes.data ?? [];
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    ''
  );

  return (
    <div className="app-page" style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <PageHeader
        title="Settings"
        subtitle="Profile, integrations, appearance, and account."
      />

      {/* Anchor nav */}
      <nav
        style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '0.5rem',
        }}
      >
        <a href="#profile" style={navLinkStyle}>
          Profile
        </a>
        <a href="#integrations" style={navLinkStyle}>
          Integrations
        </a>
        <a href="#appearance" style={navLinkStyle}>
          Appearance
        </a>
        <a href="#account" style={navLinkStyle}>
          Account
        </a>
      </nav>

      <div style={{ display: 'grid', gap: '3rem' }}>
        {/* Profile */}
        <section id="profile" style={sectionStyle}>
          <header>
            <h2 style={sectionTitleStyle}>Profile</h2>
            <p style={sectionDescStyle}>How you appear in contracts, exports, and your inbox.</p>
          </header>
          <Card>
            <ProfileSection profile={profile} email={user.email ?? ''} />
          </Card>
        </section>

        {/* Integrations */}
        <section id="integrations" data-tour="settings-integrations" style={sectionStyle}>
          <header>
            <h2 style={sectionTitleStyle}>Integrations</h2>
            <p style={sectionDescStyle}>
              External services connected to your account.
            </p>
          </header>

          <Card>
            <CardHeader>
              <CardTitle>Inquiry sources</CardTitle>
            </CardHeader>
            <InquirySourcesSection sources={sources} siteUrl={siteUrl} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calendar sync</CardTitle>
            </CardHeader>
            {feedRes.data ? (
              <CalendarSync feed={feedRes.data} />
            ) : (
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', margin: 0 }}>
                Calendar feed unavailable.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI file import</CardTitle>
            </CardHeader>
            <AiIntegrationSection
              initial={
                aiStatusRes.data ?? {
                  provider: 'anthropic',
                  connected: false,
                  keyHint: null,
                  lastUsedAt: null,
                }
              }
            />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Future integrations</CardTitle>
            </CardHeader>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: '0.5rem',
              }}
            >
              {[
                { name: 'Instagram DM intake', desc: 'Auto-import DMs as inquiries.' },
                { name: 'Stripe payments', desc: 'Send invoices and track payments.' },
                { name: 'HoneyBook sync', desc: 'Two-way sync of clients and projects.' },
              ].map((it) => (
                <li
                  key={it.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    padding: '0.75rem 1rem',
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 500,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {it.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                        marginTop: '0.125rem',
                      }}
                    >
                      {it.desc}
                    </div>
                  </div>
                  <Badge tone="neutral">Coming soon</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Appearance */}
        <section id="appearance" style={sectionStyle}>
          <header>
            <h2 style={sectionTitleStyle}>Appearance</h2>
            <p style={sectionDescStyle}>Theme and accent color. Saved to this browser.</p>
          </header>
          <Card>
            <AppearanceSection />
          </Card>
        </section>

        {/* Account */}
        <section id="account" style={sectionStyle}>
          <header>
            <h2 style={sectionTitleStyle}>Account</h2>
            <p style={sectionDescStyle}>Sign out or permanently delete your data.</p>
          </header>
          <Card>
            <AccountSection />
          </Card>
        </section>
      </div>

      <TourGate tourId="settings" steps={settingsTour.steps} helpHref="/help/settings" />
    </div>
  );
}
