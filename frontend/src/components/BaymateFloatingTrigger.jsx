import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BaymateFloatingTrigger() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/chat') return null;

  return (
    <button
      id="chat"
      type="button"
      onClick={() => navigate('/chat')}
      title="Open Baymate Chat"
      aria-label="Open Baymate Chat"
    >
      <img
        src="/baymate.png"
        alt="Baymate copilot"
      />
      <div>
        <b>Baymate Copilot</b>
        <span>Always ready to help</span>
      </div>
    </button>
  );
}
