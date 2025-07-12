'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/shoots', label: 'Shoots', icon: '📸' },
  { href: '/gear', label: 'Gear', icon: '🎥' },
  { href: '/account', label: 'Account', icon: '👤' },
];

const BottomBar = () => {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`bottom-nav-link ${pathname === link.href ? 'active' : ''}`}
          >
            <span className="bottom-nav-icon">{link.icon}</span>
            <span className="bottom-nav-label">{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomBar;