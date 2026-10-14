import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <nav className="preview-nav">
      <NavLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <b className="d" style={{ letterSpacing: '0.02em', fontSize: '26px' }}>Baymate</b>
      </NavLink>
      <div className="links">
        {isLanding ? (
          <>
            <a href="#how">How it works</a>
            <a href="#tools">Tools</a>
            <a href="#why">Why</a>
            <a href="#model">Model</a>
          </>
        ) : (
          <>
            <NavLink to="/">Overview</NavLink>
            <NavLink to="/predict">Prediction</NavLink>
            <NavLink to="/metrics">Model</NavLink>
            <NavLink to="/chat">Copilot</NavLink>
          </>
        )}
      </div>
      <button
        type="button"
        className="btn f"
        onClick={() => {
          window.location.href = `${import.meta.env.VITE_ERP_URL || 'http://localhost:5173'}/login?role=mentor`;
        }}
      >
        See demo
      </button>
    </nav>
  );
}
