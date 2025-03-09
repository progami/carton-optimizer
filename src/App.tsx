// src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Navigation from './components/Navigation';
import CandidateConfigurations from './components/Part1';
import CostFunctionAnalysis from './components/Part2'; // Using our new unified component
import Footer from './components/Footer';
import { CartonProvider } from './contexts/CartonContext';

// Define the section type
type SectionType = 'input' | 'part2';

// Main App component
const App = () => {
  const [activeSection, setActiveSection] = useState<SectionType>('input');

  return (
    <CartonProvider>
      <BrowserRouter>
        <div className="p-4 w-full bg-gray-50">
          <Header />
          <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />
          <Routes>
            <Route path="/" element={<Navigate to="/input" replace />} />
            <Route path="/input" element={<CandidateConfigurations />} />
            <Route path="/part2" element={<CostFunctionAnalysis />} />
            <Route path="*" element={<Navigate to="/input" replace />} />
          </Routes>
          <Footer activeSection={activeSection} setActiveSection={setActiveSection} />
        </div>
      </BrowserRouter>
    </CartonProvider>
  );
};

export default App;