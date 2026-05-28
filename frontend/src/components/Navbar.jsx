import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <nav className="navbar slide-down">
      <div className="navbar-inner">
        {/* Logo */}
        <div className="navbar-logo">
          <span className="navbar-logo-icon">💸</span>
          <span className="navbar-logo-text text-gradient">ExpenseTracker</span>
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {/* User info */}
          <div
            className="navbar-user"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="navbar-avatar">
              {avatarLetter}
            </div>
            <div className="navbar-user-info">
              <span className="navbar-user-name">{user?.name || 'User'}</span>
              <span className="navbar-user-email">{user?.email || ''}</span>
            </div>
            <span className="navbar-chevron" style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              ▾
            </span>
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="navbar-dropdown scale-in">
              <div className="navbar-dropdown-header">
                <div className="navbar-avatar navbar-avatar-lg">{avatarLetter}</div>
                <div>
                  <div className="navbar-user-name">{user?.name}</div>
                  <div className="navbar-user-email">{user?.email}</div>
                </div>
              </div>
              <div className="navbar-dropdown-divider" />
              <button
                className="navbar-dropdown-item navbar-dropdown-item--danger"
                onClick={() => {
                  setShowDropdown(false);
                  logout();
                }}
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close dropdown */}
      {showDropdown && (
        <div
          className="navbar-overlay"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </nav>
  );
}

export default Navbar;
