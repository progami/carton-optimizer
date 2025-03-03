// src/components/Header.tsx
import React from 'react';

const Header = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-800 p-4 rounded-lg shadow-lg mb-6 text-white">
      <h1 className="text-2xl font-bold mb-2">Carton Optimization System</h1>
      <p className="opacity-90">Two-step analysis for optimal carton sizing and supply chain cost</p>
    </div>
  );
};

export default Header;
