import { Link, useNavigate } from 'react-router-dom'
import { Guitar, LogOut, Home } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

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

          {/* User Info & Actions */}
          <div className="flex items-center gap-4">
            {user && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
