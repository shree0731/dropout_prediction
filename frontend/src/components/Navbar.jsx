import React from 'react';
import { NavLink } from 'react-router-dom';
import { BrainCircuit, BarChart3, Sparkles, MessageSquare, Terminal } from 'lucide-react';

export default function Navbar() {
  const navStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.9rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: isActive ? '#ED4D8B' : '#94A3B8',
    background: isActive ? 'rgba(237, 77, 139, 0.1)' : 'transparent',
    border: isActive ? '1px solid rgba(237, 77, 139, 0.3)' : '1px solid transparent',
    transition: 'all 0.2s ease'
  });

  return (
    <header style={{
      borderBottom: '1px solid rgba(23, 83, 31, 0.2)',
      background: 'linear-gradient(180deg, var(--bg-accent) 0%, rgba(243, 235, 221, 0.85) 85%, transparent 100%)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand */}
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--surface)',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink-on-dark)'
          }}>
            <BrainCircuit size={22} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Astra Retain <span style={{ color: 'var(--ink)', fontSize: '0.72rem', fontWeight: '700', border: '1px solid var(--ink)', padding: '1px 6px', borderRadius: '9999px', marginLeft: '4px' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink)', opacity: 0.75, fontWeight: '600' }}>
              Student Dropout Prediction &amp; Intervention Platform
            </div>
          </div>
        </NavLink>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <NavLink to="/" style={navStyle} end>
            <Terminal size={16} />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/metrics" style={navStyle}>
            <BarChart3 size={16} />
            <span>Model Dashboard</span>
          </NavLink>
          <NavLink to="/predict" style={navStyle}>
            <Sparkles size={16} />
            <span>Try a Prediction</span>
          </NavLink>
          <NavLink to="/chat" style={navStyle}>
            <MessageSquare size={16} />
            <span>Intervention Bot</span>
          </NavLink>
        </nav>

        {/* Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--ink)',
          background: 'transparent',
          border: '1px solid var(--ink)',
          padding: '0.35rem 0.85rem',
          borderRadius: '9999px',
          fontWeight: '700'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--ink)', display: 'inline-block' }} />
          <span>FastAPI + XGBoost Live</span>
        </div>
      </div>
    </header>
  );
}
