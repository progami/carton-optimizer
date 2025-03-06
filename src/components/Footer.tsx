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
  // Use a direct navigation function to ensure events are captured
  const navigateTo = (section: SectionType) => (e: React.MouseEvent) => {
    // Prevent default and stop propagation to ensure the event is fully handled
    e.preventDefault();
    e.stopPropagation();
    
    // Call the setActiveSection function passed from parent
    setActiveSection(section);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg mt-6 relative z-20">
      <div className="flex flex-wrap justify-between items-center">
        <div className="text-sm text-gray-500 mb-3 md:mb-0">
          Carton Optimization System - Three-Part Supply Chain Analysis
        </div>
        <div className="flex flex-wrap space-x-2">
          <button
            onClick={navigateTo('input')}
            className={`px-3 py-1 rounded ${activeSection === 'input' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Part 1: Input
          </button>
          <button
            onClick={navigateTo('part2a')}
            className={`px-3 py-1 rounded ${activeSection === 'part2a' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Part 2A: Analysis
          </button>
          <button
            onClick={navigateTo('part2b')}
            className={`px-3 py-1 rounded ${activeSection === 'part2b' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Part 2B: Optimization
          </button>
          <button
            onClick={navigateTo('part3')}
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