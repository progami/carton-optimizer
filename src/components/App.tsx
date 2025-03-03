// src/components/App.tsx
import React, { useState } from 'react';
import Header from './Header';
import Navigation from './Navigation';
import CandidateConfigurations from './Part1';
import CostAnalysis from './Part2A';
import CostOptimization from './Part2B';
import Footer from './Footer';
import { CartonProvider } from '../contexts/CartonContext';

const App = () => {
  const [activeSection, setActiveSection] = useState('input');

  return (
    <CartonProvider>
      <div className="p-4 w-full bg-gray-50">
        <Header />
        <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />

        {activeSection === 'input' && <CandidateConfigurations />}
        {activeSection === 'part2a' && <CostAnalysis />}
        {activeSection === 'part2b' && <CostOptimization />}

        <Footer activeSection={activeSection} setActiveSection={setActiveSection} />
      </div>
    </CartonProvider>
  );
};

export default App;
