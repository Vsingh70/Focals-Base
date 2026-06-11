import type { Metadata } from 'next';
import { ChevronRight } from 'lucide-react';
import { Wordmark } from '@/components/brand/Wordmark';
import { FeatureGrid } from '@/components/marketing/FeatureGrid';
import { Footer } from '@/components/marketing/Footer';
import { Reveal } from '@/components/marketing/Reveal';
import { RotatingWord } from '@/components/marketing/RotatingWord';
import { HowItWorksWeb } from '@/components/marketing/HowItWorks';
import { TopNav } from '@/components/marketing/TopNav';
import { Waitlist } from '@/components/marketing/Waitlist';
import { BrowserFrame } from '@/components/marketing/DeviceFrames';
import { WebDashboard } from '@/components/marketing/mocks-web';
import { AppStoreBadge, Btn, Eyebrow, Lead, SectionTitle } from '@/components/marketing/primitives';
import { LT } from '@/components/marketing/tokens';

export const metadata: Metadata = {
  title: 'Lenslate for web — run your studio from any browser',
  description:
    'The full Lenslate workspace — projects, clients, contracts, and finances — open in a tab. For photographers, videographers, and media teams.',
};

function Hero() {
  return (
    <header
      className="lp-hero"
      style={{ position: 'relative', paddingTop: 138, paddingBottom: 60, overflow: 'hidden' }}
    >
      <div
        style={{
          position: 'absolute',
          top: -120,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1000,
          height: 560,
          background: `radial-gradient(50% 50% at 50% 50%, ${LT.accentA10}, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        className="lp-section"
        style={{
          position: 'relative',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Reveal>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 13px',
              borderRadius: 999,
              border: `0.5px solid ${LT.border2}`,
              background: LT.bg2,
              marginBottom: 26,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 999, background: LT.accent }} />
            <span style={{ fontFamily: LT.ui, fontSize: 13, fontWeight: 500, color: LT.text2 }}>
              The web app — no install, just a tab
            </span>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <h1
            style={{
              fontFamily: LT.serif,
              fontWeight: 500,
              fontSize: 'clamp(38px, 6.4vw, 76px)',
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
              margin: '0 auto',
              maxWidth: 940,
              textWrap: 'balance',
            }}
          >
            Run your studio from
            <br />
            <RotatingWord words={['any browser', 'any desk', 'anywhere']} />.
          </h1>
        </Reveal>
        <Reveal delay={130}>
          <p
            style={{
              fontFamily: LT.ui,
              fontSize: 'clamp(17px, 2vw, 21px)',
              lineHeight: 1.55,
              color: LT.text2,
              maxWidth: 620,
              margin: '26px auto 0',
              textWrap: 'pretty',
            }}
          >
            The full Lenslate workspace — projects, clients, contracts, and finances — open in a
            tab. For photographers, videographers, and media teams.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div
            className="lp-hero-cta"
            style={{
              display: 'flex',
              gap: 13,
              justifyContent: 'center',
              marginTop: 36,
              alignItems: 'center',
            }}
          >
            <Btn kind="primary" size="lg" href="#waitlist">
              Start free
            </Btn>
            <AppStoreBadge />
          </div>
        </Reveal>
        <Reveal delay={120} style={{ marginTop: 16 }}>
          <div style={{ fontFamily: LT.ui, fontSize: 13, color: LT.text3 }}>
            Free 14-day trial · No card required · Works in any modern browser
          </div>
        </Reveal>
        <Reveal delay={160} y={40} style={{ marginTop: 60, width: '100%', maxWidth: 1060 }}>
          <BrowserFrame designWidth={920} designHeight={440} maxWidth={1060}>
            <WebDashboard />
          </BrowserFrame>
        </Reveal>
      </div>
    </header>
  );
}

function PlatformBand() {
  return (
    <section className="lp-section" style={{ paddingTop: 40, paddingBottom: 100 }}>
      <Reveal>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 24,
            border: `0.5px solid ${LT.border}`,
            background: `linear-gradient(180deg, ${LT.bg2}, ${LT.bg})`,
            padding: 'clamp(36px, 6vw, 64px)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(60% 80% at 50% 0%, ${LT.accentA08}, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative' }}>
            <Eyebrow>web at your desk · iPhone on set</Eyebrow>
            <h2
              style={{
                fontFamily: LT.serif,
                fontWeight: 500,
                fontSize: 'clamp(28px, 4vw, 46px)',
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
                margin: '18px auto 0',
                maxWidth: 640,
                textWrap: 'balance',
              }}
            >
              Built for the browser. Synced to your pocket.
            </h2>
            <p
              style={{
                fontFamily: LT.ui,
                fontSize: 18,
                lineHeight: 1.55,
                color: LT.text2,
                maxWidth: 540,
                margin: '18px auto 0',
              }}
            >
              Edit a gallery at your desk, then check the next shoot from your phone on the way out
              — Lenslate keeps both perfectly in step.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 13,
                justifyContent: 'center',
                marginTop: 30,
                flexWrap: 'wrap',
              }}
            >
              <Btn kind="primary" size="md" href="#waitlist">
                Start free on web
              </Btn>
              <Btn kind="quiet" size="md" href="/landing/ios" icon={<ChevronRight size={16} />}>
                See the iPhone app
              </Btn>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function WebLandingPage() {
  return (
    <main style={{ paddingBottom: 0 }}>
      <TopNav
        platform="Web"
        links={[
          { label: 'Features', href: '#features' },
          { label: 'How it works', href: '#how' },
          { label: 'iPhone app', href: '/landing/ios' },
          { label: 'Sign in', href: '/login' },
        ]}
        cta={
          <Btn kind="primary" size="md" href="#waitlist">
            Start free
          </Btn>
        }
      />

      <Hero />

      {/* trust strip */}
      <div className="lp-section" style={{ paddingTop: 24, paddingBottom: 80 }}>
        <Reveal>
          <div
            className="lp-trust"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(20px,5vw,56px)',
              flexWrap: 'wrap',
              opacity: 0.7,
            }}
          >
            <span
              style={{ fontFamily: LT.ui, fontSize: 12.5, color: LT.text3, letterSpacing: '0.04em' }}
            >
              RUNS THE BUSINESS BEHIND
            </span>
            {['Weddings', 'Editorial', 'Film', 'Brand', 'Agencies'].map((x) => (
              <span
                key={x}
                style={{ fontFamily: LT.serif, fontSize: 20, color: LT.text2, fontStyle: 'italic' }}
              >
                {x}
              </span>
            ))}
          </div>
        </Reveal>
      </div>

      <div id="how" style={{ scrollMarginTop: 80 }} />
      <HowItWorksWeb />

      <section id="features" className="lp-section" style={{ paddingTop: 60, paddingBottom: 40 }}>
        <Reveal>
          <Eyebrow>Everything in one place</Eyebrow>
          <div
            className="lp-feat-head"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
              alignItems: 'end',
              gap: '28px 40px',
              margin: '18px 0 36px',
            }}
          >
            <SectionTitle max={560}>Six tools that used to be six apps.</SectionTitle>
            <Lead max={360}>
              Lenslate replaces the patchwork of notes, spreadsheets, and calendars with one
              considered system — open in your browser.
            </Lead>
          </div>
        </Reveal>
        <FeatureGrid />
      </section>

      <PlatformBand />

      <section id="waitlist" style={{ borderTop: `0.5px solid ${LT.border}`, background: LT.bg2 }}>
        <div
          className="lp-section"
          style={{
            paddingTop: 'clamp(60px, 9vw, 110px)',
            paddingBottom: 'clamp(60px, 9vw, 110px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <Reveal>
            <Wordmark fontSize="30px" />
            <h2
              style={{
                fontFamily: LT.serif,
                fontWeight: 500,
                fontSize: 'clamp(30px, 5vw, 54px)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                margin: '24px 0 0',
                maxWidth: 620,
                textWrap: 'balance',
              }}
            >
              Open Lenslate in your browser today.
            </h2>
            <p
              style={{
                fontFamily: LT.ui,
                fontSize: 18,
                lineHeight: 1.55,
                color: LT.text2,
                maxWidth: 480,
                margin: '18px auto 32px',
              }}
            >
              Start a free trial and bring your whole studio online in minutes. We&rsquo;ll email
              your sign-in link.
            </p>
          </Reveal>
          <Reveal delay={80} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Waitlist
              note="Start free — no card required. We’ll only email about your account."
              source="web-landing"
            />
          </Reveal>
        </div>
      </section>

      <Footer
        other={
          <Btn kind="quiet" size="md" href="/landing/ios" icon={<ChevronRight size={16} />}>
            Get the iPhone app
          </Btn>
        }
      />
    </main>
  );
}
