import React from 'react';

export default function TestPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="bg-gray-50 p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Tailwind Test Page</h1>
        <p className="text-gray-700 mb-4">If you can see this styled with gray backgrounds, Tailwind is working!</p>
        <div className="flex space-x-4">
          <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded">
            Primary Button
          </button>
          <button className="bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded">
            Secondary Button
          </button>
        </div>
      </div>
    </div>
  );
} 