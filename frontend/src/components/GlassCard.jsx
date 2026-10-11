import React from 'react';

/**
 * Plain Rounded Card Component
 * Replaces glassmorphism with calm editorial forest green border & rounded card styling.
 * Preserves default export and all accepted props.
 */
export default function GlassCard({ children, className = '', style = {}, ...props }) {
  return (
    <div
      className={`glass-card-container ${className}`}
      style={style}
      {...props}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  );
}
