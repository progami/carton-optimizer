// src/components/Footer.tsx
import React, { FC } from 'react';
import { Link } from 'react-router-dom';

// Define the section types
type SectionType = 'input' | 'part2';

// Define the props interface
interface FooterProps {
  activeSection: SectionType;
  setActiveSection: (section: SectionType) => void;
}

const Footer: FC<FooterProps> = ({ activeSection, setActiveSection }) => {
  // Use a direct navigation function to ensure events are captured
  const navigateTo = (section: SectionType) => (e: React.MouseEvent) => {
    // Call the setActiveSection function passed from parent
    setActiveSection(section);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg mt-6 relative z-20">
      <div className="flex flex-wrap justify-between items-center">
        <div className="text-sm text-gray-500 mb-3 md:mb-0">
          Carton Optimization System - Supply Chain Cost Analysis
        </div>
        <div className="flex flex-wrap space-x-2">
          <Link
            to="/input"
            onClick={navigateTo('input')}
            className={`px-3 py-1 rounded ${activeSection === 'input' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Part 1: Input
          </Link>
          <Link
            to="/part2"
            onClick={navigateTo('part2')}
            className={`px-3 py-1 rounded ${activeSection === 'part2' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Part 2: Cost Analysis
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Footer;