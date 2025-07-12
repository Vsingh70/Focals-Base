'use client';

const RequiredFieldInput = ({ fieldName, fieldType }) => {
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

    return (
        <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '2rem' }}>
                <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    style={{
                        width: '1.1rem',
                        height: '1.1rem',
                        accentColor: '#2563eb',
                        marginRight: '0.5rem',
                        cursor: 'not-allowed',
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px'
                    }}
                />
                <label style={{ fontSize: '1rem', color: 'var(--text)' }}>Visible</label>
            </div>
            <div style={{ flex: 1, marginRight: '2rem' }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 4, color: 'var(--text)' }}>Field Name</label>
                <input
                    type="text"
                    value={fieldName}
                    disabled={true}
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        background: 'var(--button-bg)',
                        color: 'var(--unselected)',
                        cursor: 'not-allowed'
                    }}
                />
            </div>
            <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 4, color: 'var(--text)' }}>Field Type</label>
                <select
                    value={fieldType}
                    disabled={true}
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        background: 'var(--button-bg)',
                        color: 'var(--unselected)',
                        cursor: 'not-allowed'
                    }}
                >
                    <option value={fieldType}>{fieldType.charAt(0).toUpperCase() + fieldType.slice(1)}</option>
                </select>
            </div>
        </div>
    );
}

export default RequiredFieldInput;