import './globals.css';
import { ThemeProvider } from './components/Themes/Theme-Context';

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME,
  description: 'Photography business management',
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
