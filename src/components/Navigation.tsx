// src/components/Navigation.tsx
import { FC } from 'react';

// Define the section types
type SectionType = 'input' | 'part2a' | 'part2b';

// Define the props interface
interface NavigationProps {
  activeSection: SectionType;
  setActiveSection: (section: SectionType) => void;
}

const Navigation: FC<NavigationProps> = ({ activeSection, setActiveSection }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
      <div className="flex justify-between items-center">
        <div className="text-lg font-semibold">
          Carton Optimization System
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveSection('input')}
            className={`px-4 py-2 rounded-md ${activeSection === 'input' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Input
          </button>
          <button
            onClick={() => setActiveSection('part2a')}
            className={`px-4 py-2 rounded-md ${activeSection === 'part2a' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Analysis
          </button>
          <button
            onClick={() => setActiveSection('part2b')}
            className={`px-4 py-2 rounded-md ${activeSection === 'part2b' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Optimization
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navigation;