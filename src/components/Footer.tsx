// src/components/Footer.tsx
import { FC } from 'react';

// Define the section types
type SectionType = 'input' | 'part2a' | 'part2b' | 'part3';

// Define the props interface
interface FooterProps {
  activeSection: SectionType;
  setActiveSection: (section: SectionType) => void;
}

const Footer: FC<FooterProps> = ({ activeSection, setActiveSection }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Carton Optimization System - Three-Part Supply Chain Analysis
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSection('input')}
            className={`px-3 py-1 rounded ${activeSection === 'input' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Part 1: Input
          </button>
          <button
            onClick={() => setActiveSection('part2a')}
            className={`px-3 py-1 rounded ${activeSection === 'part2a' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Part 2A: Analysis
          </button>
          <button
            onClick={() => setActiveSection('part2b')}
            className={`px-3 py-1 rounded ${activeSection === 'part2b' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Part 2B: Optimization
          </button>
          <button
            onClick={() => setActiveSection('part3')}
            className={`px-3 py-1 rounded ${activeSection === 'part3' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Part 3: Container
          </button>
        </div>
      </div>
    </div>
  );
};

export default Footer;