import { NavLink } from 'react-router-dom'
import './Navbar.css'
import { isAdmin } from '../shared/auth'

const links = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 9.5V19a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1V9.5" />
      </svg>
    ),
  },
  {
    to: '/products',
    label: 'Products',
    adminOnly: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 7.5 12 3.5l8.5 4-8.5 4-8.5-4Z" />
        <path d="M3.5 7.5V16l8.5 4 8.5-4V7.5" />
        <path d="M12 11.5V20" />
      </svg>
    ),
  },
  {
    to: '/design',
    label: 'Design',
    adminOnly: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
  },
]

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="navbar__logo">M</span>
      </div>

      <nav className="navbar__nav">
        {links.filter((link) => !link.adminOnly || isAdmin).map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? 'navbar__link navbar__link--active' : 'navbar__link'
            }
          >
            <span className="navbar__link-icon">{link.icon}</span>
            <span className="navbar__link-label">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="navbar__footer">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive ? 'navbar__icon-btn navbar__icon-btn--active' : 'navbar__icon-btn'
          }
          aria-label="Settings"
          title="Settings"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </NavLink>
      </div>
    </header>
  )
}

export default Navbar
