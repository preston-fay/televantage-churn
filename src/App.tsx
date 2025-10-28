import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/layout/Header';
import ExecutiveDashboard from './tabs/ExecutiveDashboard';
import ScenarioPlanner from './tabs/ScenarioPlanner';
import AgenticWorkflow from './tabs/AgenticWorkflow';
import ModelingDeepDive from './tabs/ModelingDeepDive';
import SegmentExplorer from './tabs/SegmentExplorer';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-bg-primary">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<ExecutiveDashboard />} />
              <Route path="/scenarios" element={<ScenarioPlanner />} />
              <Route path="/workflow" element={<AgenticWorkflow />} />
              <Route path="/analytics" element={<ModelingDeepDive />} />
              <Route path="/segments" element={<SegmentExplorer />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
