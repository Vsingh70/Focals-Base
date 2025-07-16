'use client';
import Image from "next/image";
import { loginWithGoogle } from "../login/actions";

const GoogleLogin = () => {
    return (
      <form action={loginWithGoogle}>
        <button 
          type="submit"
          style={{
            background: 'var(--bg)',
            borderRadius: '10px',
            border: '2px solid var(--primary)',
            padding: '1rem 1.5rem',
            fontSize: '1.125rem',
            color:'var(--text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-bg-hover)';
            e.currentTarget.style.transition = 'background 0.2s';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-bg)';
          }}
        >
          <Image
            src={"/google.svg"}
            alt="Google Icon"
            width={28}
            height={28}
          /> 
          Login with Google
        </button>
      </form>
    );
}

export default GoogleLogin;