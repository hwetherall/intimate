import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-16rem)] flex flex-col justify-center items-center py-12">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-primary-600">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
