// src/components/Navigation.tsx
import React, { FC } from 'react';
import { Link } from 'react-router-dom';

// Define the section types
type SectionType = 'input' | 'part2';

// Define the props interface
interface NavigationProps {
  activeSection: SectionType;
  setActiveSection: (section: SectionType) => void;
}

const Navigation: FC<NavigationProps> = ({ activeSection, setActiveSection }) => {
  // Use a direct navigation function to ensure events are captured
  const navigateTo = (section: SectionType) => (e: React.MouseEvent) => {
    // Call the setActiveSection function passed from parent
    setActiveSection(section);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg mb-4 relative z-20">
      <div className="flex flex-wrap justify-between items-center">
        <div className="text-lg font-semibold">
          Carton Optimization System
        </div>
        <div className="flex flex-wrap space-x-2">
          <Link
            to="/input"
            onClick={navigateTo('input')}
            className={`px-3 py-2 rounded-md ${activeSection === 'input' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Part 1: Input
          </Link>
          <Link
            to="/part2"
            onClick={navigateTo('part2')}
            className={`px-3 py-2 rounded-md ${activeSection === 'part2' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Part 2: Cost Analysis
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Navigation;