import type { ReactNode } from 'react';
import './marketing.css';
import '@/components/marketing/scrollytelling.css';
import './landing-responsive.css'; // breakpoints — must come after the two above

/**
 * Marketing chrome — deliberately minimal. The landing pages render no
 * authenticated app shell / sidebar; .lp-root locks the dark marketing
 * palette regardless of the signed-in theme preference (see marketing.css).
 * The #top id is the scroll target for the wordmark in the TopNav.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div id="top" className="lp-root">
      {children}
    </div>
  );
}
