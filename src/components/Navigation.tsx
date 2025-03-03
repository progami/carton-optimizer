// src/components/Navigation.tsx
import React from 'react';

const Navigation = ({ activeSection, setActiveSection }) => {
  return (
    <div className="flex mb-6 bg-white rounded-lg shadow p-1">
      <button
        onClick={() => setActiveSection('input')}
        className={`flex-1 py-3 px-4 text-center rounded-lg transition-all ${
          activeSection === 'input' ? 'bg-blue-600 text-white font-medium' : 'hover:bg-gray-100'
        }`}
      >
        <span className="block text-sm md:text-base">Part 1</span>
        <span className="text-xs md:text-sm opacity-80">Candidate Configurations</span>
      </button>
      <button
        onClick={() => setActiveSection('part2a')}
        className={`flex-1 py-3 px-4 text-center rounded-lg transition-all ${
          activeSection === 'part2a' ? 'bg-green-600 text-white font-medium' : 'hover:bg-gray-100'
        }`}
      >
        <span className="block text-sm md:text-base">Part 2A</span>
        <span className="text-xs md:text-sm opacity-80">Cost Analysis</span>
      </button>
      <button
        onClick={() => setActiveSection('part2b')}
        className={`flex-1 py-3 px-4 text-center rounded-lg transition-all ${
          activeSection === 'part2b' ? 'bg-green-600 text-white font-medium' : 'hover:bg-gray-100'
        }`}
      >
        <span className="block text-sm md:text-base">Part 2B</span>
        <span className="text-xs md:text-sm opacity-80">Cost Optimization</span>
      </button>
    </div>
  );
};

export default Navigation;
