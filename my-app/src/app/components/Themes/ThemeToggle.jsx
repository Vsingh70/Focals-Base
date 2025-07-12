'use client'
import { useTheme } from './Theme-Context';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const buttonStyle = (btnTheme) => ({
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        background: theme === btnTheme ? '#0070f3' : 'transparent',
        color: theme === btnTheme ? '#fff' : '#0070f3',
    });

    return (
        <div style={{ display: 'flex', gap: '8px' }}>
            <button style={buttonStyle('light')} onClick={() => setTheme('light')}>
                Light
            </button>
            <button style={buttonStyle('dark')} onClick={() => setTheme('dark')}>
                Dark
            </button>
            <button style={buttonStyle('system')} onClick={() => setTheme('system')}>
                System
            </button>
        </div>
    );
}