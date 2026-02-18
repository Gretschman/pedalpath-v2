import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Guitar, LogOut, Home, Menu, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/signin')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
            <Guitar className="w-6 h-6 text-green-600" />
            <span className="text-xl font-bold text-gray-900">PedalPath</span>
          </Link>

          {/* Desktop: User Info & Actions */}
          {user && (
            <div className="hidden sm:flex items-center gap-4">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Link>

              <div className="h-6 w-px bg-gray-300"></div>

              <span className="text-sm text-gray-600 max-w-[200px] truncate">
                {user.email}
              </span>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}

          {/* Mobile: Hamburger button */}
          {user && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden flex items-center justify-center w-11 h-11 text-gray-600 hover:text-gray-900 transition"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {user && menuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1">
          <p className="text-xs text-gray-400 px-2 py-1 truncate">{user.email}</p>
          <Link
            to="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 px-2 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <button
            onClick={() => { setMenuOpen(false); handleSignOut(); }}
            className="flex items-center gap-3 px-2 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </nav>
  )
}
