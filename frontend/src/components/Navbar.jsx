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
      borderBottom: '1px solid #1E293B',
      background: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0.9rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand */}
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #ED4D8B, #F8BF80)',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <BrainCircuit size={22} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '-0.02em', color: '#F3F4F6' }}>
              Astra Retain <span style={{ color: '#ED4D8B', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #ED4D8B', padding: '1px 6px', borderRadius: '4px', marginLeft: '4px' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
              Student Dropout Prediction & Intervention Platform
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
          color: '#34D399',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          fontWeight: '600'
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
          <span>FastAPI + XGBoost Live</span>
        </div>
      </div>
    </header>
  );
}
