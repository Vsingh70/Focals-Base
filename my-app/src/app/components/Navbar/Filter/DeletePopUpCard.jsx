'use client';
const DeletePopUpCard = ({ trigger, setTrigger, onConfirm }) => {
    return trigger ? (
        <div className="popup-card" style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="popup-content" style={{
                background: 'var(--bg)',
                color: 'var(--text)',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                minWidth: '300px',
                textAlign: 'center'
            }}>
                <p>Are you sure you want to delete the selected items?</p>
                <button
                    style={{
                        marginTop: '1rem',
                        marginRight: '1rem',
                        padding: '0.5rem 1.5rem',
                        background: 'red',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        transition: 'background 0.2s',
                        cursor: 'pointer'
                    }}
                    onClick={() => {
                        onConfirm();
                        setTrigger(false);
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#e42800';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'red';
                    }}
                >
                    Yes, Delete
                </button>
                <button
                    style={{
                        padding: '0.5rem 1.5rem',
                        background: 'var(--unselected)',
                        color: 'black',
                        border: 'none',
                        borderRadius: '6px',
                        transition: 'background 0.2s',
                        cursor: 'pointer'
                    }}
                    onClick={() => setTrigger(false)}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--unselected-hover)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--unselected)';
                    }}
                >
                    No
                </button>
            </div>
        </div>
    ) : null;
};

export default DeletePopUpCard;