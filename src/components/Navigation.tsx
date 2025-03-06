// src/components/Navigation.tsx
import { FC } from 'react';

// Define the section types
type SectionType = 'input' | 'part2a' | 'part2b' | 'part3';

// Define the props interface
interface NavigationProps {
  activeSection: SectionType;
  setActiveSection: (section: SectionType) => void;
}

const Navigation: FC<NavigationProps> = ({ activeSection, setActiveSection }) => {
  // Use a direct navigation function to ensure events are captured
  const navigateTo = (section: SectionType) => (e: React.MouseEvent) => {
    // Prevent default and stop propagation to ensure the event is fully handled
    e.preventDefault();
    e.stopPropagation();
    
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
          <button
            onClick={navigateTo('input')}
            className={`px-3 py-2 rounded-md ${activeSection === 'input' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Input
          </button>
          <button
            onClick={navigateTo('part2a')}
            className={`px-3 py-2 rounded-md ${activeSection === 'part2a' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Analysis
          </button>
          <button
            onClick={navigateTo('part2b')}
            className={`px-3 py-2 rounded-md ${activeSection === 'part2b' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Optimization
          </button>
          <button
            onClick={navigateTo('part3')}
            className={`px-3 py-2 rounded-md ${activeSection === 'part3' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Container
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navigation;