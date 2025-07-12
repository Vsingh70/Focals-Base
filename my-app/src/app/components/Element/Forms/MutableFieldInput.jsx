'use client';
import { useState } from 'react';

const MutableFieldInput = ({ 
    fieldName, 
    fieldType, 
    isVisible, 
    onVisibilityChange, 
    onFieldNameChange, 
    onTypeChange }) => {

    const [currentInputValue, setCurrentInputValue] = useState(fieldName);

    const cardStyle = {
        width: '100%',
        background: 'var(--button-bg)',
        color: 'var(--primary)',
        border: '2px solid var(--border)',
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        padding: '1.25rem 2rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        fontSize: '1rem',
    };

    const getDisplayType = (type) => {
        if (type === 'boolean') return 'checkbox';
        return type;
    };

    const handleTypeChange = (newDisplayType) => {
        const actualType = newDisplayType === 'checkbox' ? 'boolean' : newDisplayType;
        onTypeChange(fieldName, actualType);
    };

    // Determine colors based on conditions
    const visibleLabelColor = isVisible ? 'var(--text)' : 'var(--unselected)';

    return (
        <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '2rem' }}>
                <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => onVisibilityChange(fieldName, e.target.checked)}
                    style={{
                        width: '1.1rem',
                        height: '1.1rem',
                        accentColor: '#2563eb',
                        marginRight: '0.5rem',
                        cursor: 'pointer',
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        accentColor: 'var(--primary)'
                    }}
                />
                <label style={{ fontSize: '1rem', color: visibleLabelColor, transition: '0.2s' }}>Visible</label>
            </div>
            <div style={{ flex: 1, marginRight: '2rem' }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 4, color: 'var(--text)' }}>Field Name</label>
                <input
                    type="text"
                    value={currentInputValue}
                    onChange={(e) => setCurrentInputValue(e.target.value)}
                    onBlur={(e) => {
                        if (e.target.value !== fieldName && e.target.value.trim() !== '') {
                            onFieldNameChange(fieldName, e.target.value.trim());
                        }
                    }}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value !== fieldName && e.target.value.trim() !== '') {
                            onFieldNameChange(fieldName, e.target.value.trim());
                        }
                    }}
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        background: 'var(--button-bg)',
                        color: 'var(--text)',
                        cursor: 'text',
                        transition: 'all 0.2s ease'
                    }}
                />
            </div>
            <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 4, color: 'var(--text)' }}>Field Type</label>
                <select
                    value={getDisplayType(fieldType)}
                    onChange={(e) => {
                        handleTypeChange(e.target.value);
                        e.currentTarget.style.color = e.target.value !== fieldType ? 'var(--text)' : 'var(--unselected)';
                    }}
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        background: 'var(--button-bg)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                    }}
                >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="checkbox">Checkbox</option>
                </select>
            </div>
        </div>
    );
}

export default MutableFieldInput;