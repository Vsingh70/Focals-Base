import Link from 'next/link';

const linkStyle = {
    display: "block",
    color: "#0070f3",
    background: "#fff",
    fontWeight: "bold",
    fontSize: "1.1rem",
    padding: "12px 24px",
    borderRadius: "30px",
    textDecoration: "none",
    margin: "0 16px",
    transition: "background 0.08s, color 0.08s",
    textAlign: "center",
};

const hoverStyle = {
    background: "#005bb5",
    color: "#fff",
};

const Sidebar = () => {
    // Custom handler for hover effect
    const handleMouseOver = e => {
        Object.assign(e.currentTarget.style, hoverStyle);
    };
    const handleMouseOut = e => {
        Object.assign(e.currentTarget.style, linkStyle);
    };

    return (
        <div className="sidebar" style={{
            width: "150px",
            height: "100vh",
            background: "#fff",
            boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
            padding: "26px 0",
            position: "fixed",
            top: 80,
            left: 0,
            zIndex: 5,
        }}>
            <nav>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    <li style={{ margin: "10px 0" }}>
                        <Link href="/" style={linkStyle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>Home</Link>
                    </li>
                    <li style={{ margin: "10px 0" }}>
                        <Link href="/account" style={linkStyle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>Account</Link>
                    </li>
                    <li style={{ margin: "10px 0" }}>
                        <Link href="/shoots" style={linkStyle} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>Shoots</Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;