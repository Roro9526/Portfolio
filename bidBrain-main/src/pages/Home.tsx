import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, LineChart } from 'lucide-react';

function Home() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
      <div className="text-center max-w-3xl mx-auto px-4">
        <div className="flex justify-center mb-6">
          <LineChart className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Welcome to Bid Brain
        </h1>
        <p className="text-xl text-gray-600 mb-8">
        </p>
        {user ? (
          <Link
            to="/market"
            className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Market
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        ) : (
          <div className="space-x-4">
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-3 text-lg font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;