import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Wallet, LineChart, LayoutDashboard, LogOut } from 'lucide-react';

function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <LineChart className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">BidBrain</span>
            </Link>
            {user && (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  to="/market"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <div className="flex items-center space-x-1">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Market</span>
                  </div>
                </Link>
                <Link
                  to="/portfolio"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <div className="flex items-center space-x-1">
                    <Wallet className="h-4 w-4" />
                    <span>Portfolio</span>
                  </div>
                </Link>
                <Link
                  to="/transfers"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <div className="flex items-center space-x-1">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Transfert</span>
                  </div>
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-600">
                  Welcome, {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;