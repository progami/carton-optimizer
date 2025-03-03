// src/components/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Navigation from './Navigation';
import CandidateConfigurations from './Part1';
import CostAnalysis from './Part2A';
import CostOptimization from './Part2B';
import Footer from './Footer';
import { CartonProvider } from '../contexts/CartonContext';

// Define the section type to match Navigation and Footer components
type SectionType = 'input' | 'part2a' | 'part2b';

// This component handles navigation and renders the appropriate content
const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<SectionType>('input');

  // Update active section based on route
  useEffect(() => {
    if (location.pathname === '/input') {
      setActiveSection('input');
    } else if (location.pathname === '/part2a') {
      setActiveSection('part2a');
    } else if (location.pathname === '/part2b') {
      setActiveSection('part2b');
    }
  }, [location.pathname]);

  // Handle navigation section change
  const handleSectionChange = (section: SectionType) => {
    setActiveSection(section);
    // Navigate to the corresponding route
    if (section === 'input') {
      navigate('/input');
    } else if (section === 'part2a') {
      navigate('/part2a');
    } else if (section === 'part2b') {
      navigate('/part2b');
    }
  };

  return (
    <div className="p-4 w-full bg-gray-50">
      <Header />
      <Navigation activeSection={activeSection} setActiveSection={handleSectionChange} />
      <Routes>
        <Route path="/" element={<Navigate to="/input" replace />} />
        <Route path="/input" element={<CandidateConfigurations />} />
        <Route path="/part2a" element={<CostAnalysis />} />
        <Route path="/part2b" element={<CostOptimization />} />
      </Routes>
      <Footer activeSection={activeSection} setActiveSection={handleSectionChange} />
    </div>
  );
};

const App = () => {
  return (
    <CartonProvider>
      <Router>
        <AppContent />
      </Router>
    </CartonProvider>
  );
};

export default App;