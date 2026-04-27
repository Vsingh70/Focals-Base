import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME,
  description: 'Photography business management',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // Allow zoom for accessibility — many a11y guidelines say maximumScale=1
  // is harmful. Our 1rem inputs already prevent the iOS focus-zoom issue.
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
