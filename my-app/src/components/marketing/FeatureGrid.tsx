import { Calendar, DollarSign, FileText, FolderPlus, Tag, User } from 'lucide-react';
import type { ComponentType } from 'react';
import { Reveal } from './Reveal';
import { LT } from './tokens';

type Feature = {
  Icon: ComponentType<{ size?: number | string }>;
  name: string;
  desc: string;
};

export const FEATURES: Feature[] = [
  {
    Icon: FolderPlus,
    name: 'Projects',
    desc: 'Every shoot in one pipeline — from inquiry to delivered, grouped by status at a glance.',
  },
  {
    Icon: User,
    name: 'Clients',
    desc: 'A living address book that links each contact to their shoots, invoices, and contracts.',
  },
  {
    Icon: DollarSign,
    name: 'Finances',
    desc: 'Track package prices, deposits, and balances. Know what’s owed without a spreadsheet.',
  },
  {
    Icon: FileText,
    name: 'Contracts',
    desc: 'Send, sign, and store agreements. Every PDF stamped and filed against the project.',
  },
  {
    Icon: Calendar,
    name: 'Calendar',
    desc: 'Shoots sync straight to iOS Calendar with travel time, locations, and reminders.',
  },
  {
    Icon: Tag,
    name: 'Gear',
    desc: 'Log bodies, lenses, and kit. See what shot what, and what’s due for service.',
  },
];

export function FeatureGrid() {
  return (
    <div
      className="lp-fgrid"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}
    >
      {FEATURES.map((f, i) => (
        <Reveal key={f.name} delay={(i % 3) * 70}>
          <div
            className="lp-card"
            style={{
              background: LT.bg2,
              border: `0.5px solid ${LT.border}`,
              borderRadius: 16,
              padding: '22px 22px 24px',
              height: '100%',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: LT.accentA14,
                border: `0.5px solid ${LT.accentA33}`,
                color: LT.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <f.Icon size={20} />
            </div>
            <div
              style={{
                fontFamily: LT.ui,
                fontSize: 17,
                fontWeight: 600,
                color: LT.text,
                marginBottom: 6,
                letterSpacing: '-0.01em',
              }}
            >
              {f.name}
            </div>
            <div style={{ fontFamily: LT.ui, fontSize: 14, lineHeight: 1.55, color: LT.text2 }}>
              {f.desc}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
