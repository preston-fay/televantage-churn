import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/layout/Header';
import ExecutiveDashboard from './tabs/ExecutiveDashboard';
import ScenarioPlanner from './tabs/ScenarioPlanner';
import AIPoweredIntelligence from './tabs/AIPoweredIntelligence';
import ModelingDeepDive from './tabs/ModelingDeepDive';
import SegmentExplorer from './tabs/SegmentExplorer';
import ProdLLMBadge from './components/ProdLLMBadge';
import { ProdDiagnostics } from './routes';

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
              <Route path="/workflow" element={<AIPoweredIntelligence />} />
              <Route path="/analytics" element={<ModelingDeepDive />} />
              <Route path="/segments" element={<SegmentExplorer />} />
              <Route path="/llm-check" element={<ProdDiagnostics />} />
            </Routes>
          </main>
          <ProdLLMBadge />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
