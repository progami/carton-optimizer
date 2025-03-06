// src/components/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Navigation from './Navigation';
import CandidateConfigurations from './Part1';
import CostAnalysis from './Part2A';
import CostOptimization from './Part2B';
import ContainerOptimization from './Part3';
import Footer from './Footer';
import { CartonProvider } from '../contexts/CartonContext';

// Define the section type
type SectionType = 'input' | 'part2a' | 'part2b' | 'part3';

// Component that syncs URL with active section
const SectionSynchronizer = ({ setActiveSection }: { setActiveSection: (section: SectionType) => void }) => {
  const location = useLocation();
  
  useEffect(() => {
    const path = location.pathname;
    if (path === '/input' || path === '/') {
      setActiveSection('input');
    } else if (path === '/part2a') {
      setActiveSection('part2a');
    } else if (path === '/part2b') {
      setActiveSection('part2b');
    } else if (path === '/part3') {
      setActiveSection('part3');
    }
  }, [location.pathname, setActiveSection]);
  
  return null;
};

// Main content component
const AppContent = () => {
  const [activeSection, setActiveSection] = useState<SectionType>('input');

  return (
    <div className="p-4 w-full bg-gray-50">
      <Header />
      <SectionSynchronizer setActiveSection={setActiveSection} />
      <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />
      <Routes>
        <Route path="/" element={<Navigate to="/input" replace />} />
        <Route path="/input" element={<CandidateConfigurations />} />
        <Route path="/part2a" element={<CostAnalysis />} />
        <Route path="/part2b" element={<CostOptimization />} />
        <Route path="/part3" element={<ContainerOptimization />} />
        <Route path="*" element={<Navigate to="/input" replace />} />
      </Routes>
      <Footer activeSection={activeSection} setActiveSection={setActiveSection} />
    </div>
  );
};

// App component with providers
const App = () => {
  return (
    <CartonProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </CartonProvider>
  );
};

export default App;