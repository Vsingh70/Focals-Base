import type { Metadata } from 'next';
import { Import } from 'lucide-react';
import { Wordmark } from '@/components/brand/Wordmark';
import { FeatureGrid } from '@/components/marketing/FeatureGrid';
import { Footer } from '@/components/marketing/Footer';
import { Reveal } from '@/components/marketing/Reveal';
import { RotatingWord } from '@/components/marketing/RotatingWord';
import { Scrolly, type ScrollyChapter } from '@/components/marketing/Scrolly';
import { TopNav } from '@/components/marketing/TopNav';
import { Waitlist } from '@/components/marketing/Waitlist';
import { PhoneFrame } from '@/components/marketing/frames';
import { MockDetail, MockFinances, MockProjects } from '@/components/marketing/mocks-phone';
import { AppStoreBadge, Btn, Eyebrow, Lead, SectionTitle } from '@/components/marketing/primitives';
import { LT } from '@/components/marketing/tokens';

export const metadata: Metadata = {
  title: 'Lenslate for iPhone — the studio in your pocket',
  description:
    'Projects, clients, contracts, and payments — every shoot in one calm, fast home. Now in your pocket.',
};

const SCROLLY: ScrollyChapter[] = [
  {
    eyebrow: 'Projects',
    title: 'Your pipeline, grouped.',
    body: 'Every shoot lands in a status pipeline — Inquiries, Upcoming, In progress, Delivered. No more scrolling one endless list to find what needs you today.',
    points: ['Cards show client, balance, and shoot date at a glance', 'Search and filter by phase in a tap'],
  },
  {
    eyebrow: 'A project, in full',
    title: 'Open one. See everything.',
    body: 'Tap a project and the whole story is right there — a summary of the shoot, the balance owed, and how much is paid, before a single scroll.',
    points: ['Shoot · Balance · Paid, surfaced up top', 'Payment, details, location, and notes below'],
  },
  {
    eyebrow: 'Finances',
    title: 'Know your numbers.',
    body: 'Revenue, outstanding balances, and every transaction — tracked as you book and deliver. The spreadsheet retires for good.',
    points: ['Month-over-month revenue at a glance', 'Outstanding invoices you can chase in one tap'],
  },
];

const SCROLLY_SCREENS = [<MockProjects key="p" />, <MockDetail key="d" />, <MockFinances key="f" />];

function Hero() {
  return (
    <header style={{ position: 'relative', paddingTop: 150, paddingBottom: 40, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: -120,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 900,
          height: 600,
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
              Now on iPhone — built for iOS
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
              maxWidth: 920,
              textWrap: 'balance',
            }}
          >
            The studio OS for
            <br />
            <RotatingWord words={['photographers', 'videographers', 'media teams']} />.
          </h1>
        </Reveal>
        <Reveal delay={130}>
          <p
            style={{
              fontFamily: LT.ui,
              fontSize: 'clamp(17px, 2vw, 21px)',
              lineHeight: 1.55,
              color: LT.text2,
              maxWidth: 600,
              margin: '26px auto 0',
              textWrap: 'pretty',
            }}
          >
            Projects, clients, contracts, and payments — every shoot in one calm, fast home. Now in
            your pocket.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div
            className="lp-hero-cta"
            style={{ display: 'flex', gap: 13, justifyContent: 'center', marginTop: 36 }}
          >
            <AppStoreBadge />
            <Btn kind="ghost" size="lg" href="/login" icon={<Import size={18} />}>
              Start on web
            </Btn>
          </div>
        </Reveal>
        <Reveal delay={120} style={{ marginTop: 16 }}>
          <div style={{ fontFamily: LT.ui, fontSize: 13, color: LT.text3 }}>
            Free 14-day trial · No card required · iOS 17+
          </div>
        </Reveal>
        {/* hero phone */}
        <Reveal delay={160} y={40} style={{ marginTop: 64 }}>
          <PhoneFrame width={356}>
            <MockProjects />
          </PhoneFrame>
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
            <Eyebrow>iPhone today · web anywhere</Eyebrow>
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
              Shoot with your phone. Run the studio from your desk.
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
              Lenslate syncs instantly between iPhone and the web app — start a contract on set,
              finish the invoice at home.
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
              <AppStoreBadge size="md" />
              <Btn kind="quiet" size="md" href="/landing" icon={<Import size={17} />}>
                Explore the web app
              </Btn>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function IosLandingPage() {
  return (
    <main style={{ paddingBottom: 0 }}>
      <TopNav
        platform="iOS"
        links={[
          { label: 'Features', href: '#features' },
          { label: 'How it works', href: '#how' },
          { label: 'Web app', href: '/landing' },
          { label: 'Waitlist', href: '#waitlist' },
        ]}
        cta={
          <Btn kind="primary" size="md" href="#download">
            Download
          </Btn>
        }
      />

      <Hero />

      {/* logo / trust strip */}
      <div className="lp-section" style={{ paddingTop: 24, paddingBottom: 80 }}>
        <Reveal>
          <div
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
              TRUSTED BY STUDIOS SHOOTING
            </span>
            {['Weddings', 'Editorial', 'Brand', 'Portrait', 'Product'].map((x) => (
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
      <Scrolly
        chapters={SCROLLY}
        deviceWidth="300px"
        stickyTop="12vh"
        devices={SCROLLY.map((c, i) => (
          <PhoneFrame key={c.title} width={300} glow={false}>
            {SCROLLY_SCREENS[i]}
          </PhoneFrame>
        ))}
      />

      {/* feature grid */}
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
              considered system.
            </Lead>
          </div>
        </Reveal>
        <FeatureGrid />
      </section>

      <PlatformBand />

      {/* waitlist CTA */}
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
              Get early access to Lenslate for iPhone.
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
              Join the waitlist and we&rsquo;ll send your invite the moment a spot opens in your
              region.
            </p>
          </Reveal>
          <Reveal delay={80} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Waitlist
              note="We email about your invite and launch. No spam, unsubscribe anytime."
              source="ios-landing"
            />
          </Reveal>
        </div>
      </section>

      <Footer other={<AppStoreBadge size="md" />} />
    </main>
  );
}
