// src/components/Header.tsx
import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-800 p-4 rounded-lg shadow-lg mb-6 text-white">
      <h1 className="text-2xl font-bold mb-2">Carton Optimization System</h1>
      <p className="opacity-90">Three-step analysis for optimal carton sizing, supply chain & container cost optimization</p>
    </div>
  );
};

export default Header;