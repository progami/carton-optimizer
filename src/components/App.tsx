// src/components/App.tsx
// One small but critical change to fix the rendering issue
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Navigation from './Navigation';
import CandidateConfigurations from './Part1';
import CostAnalysis from './Part2A';
import CostOptimization from './Part2B';
import ContainerOptimization from './Part3';
import Footer from './Footer';
import { CartonProvider } from '../contexts/CartonContext';

// Define the section type to match Navigation and Footer components
type SectionType = 'input' | 'part2a' | 'part2b' | 'part3';

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
    } else if (location.pathname === '/part3') {
      setActiveSection('part3');
    }
  }, [location.pathname]);

  // Handle navigation section change
  const handleSectionChange = (section: SectionType) => {
    setActiveSection(section);
    // Navigate to the corresponding route
    if (section === 'input') {
      navigate('/input', { replace: true }); // Use replace: true to force re-render
    } else if (section === 'part2a') {
      navigate('/part2a', { replace: true }); // Use replace: true to force re-render
    } else if (section === 'part2b') {
      navigate('/part2b', { replace: true }); // Use replace: true to force re-render
    } else if (section === 'part3') {
      navigate('/part3', { replace: true }); // Use replace: true to force re-render
    }
  };

  // This forces the components to re-render when the path changes
  const [, forceUpdate] = useState({});
  useEffect(() => {
    // Force re-render when location changes
    forceUpdate({});
  }, [location.pathname]);

  return (
    <div className="p-4 w-full bg-gray-50">
      <Header />
      <Navigation activeSection={activeSection} setActiveSection={handleSectionChange} />
      <Routes>
        <Route path="/" element={<Navigate to="/input" replace />} />
        <Route path="/input" element={<CandidateConfigurations key="input" />} />
        <Route path="/part2a" element={<CostAnalysis key="part2a" />} />
        <Route path="/part2b" element={<CostOptimization key="part2b" />} />
        <Route path="/part3" element={<ContainerOptimization key="part3" />} />
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