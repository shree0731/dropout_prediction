import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import CursorGlow from './components/CursorGlow';
import LandingPage from './pages/LandingPage';
import ModelDashboard from './pages/ModelDashboard';
import PredictPage from './pages/PredictPage';
import ChatbotPage from './pages/ChatbotPage';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Ambient Trailing Cursor Glow mounted once at app root */}
        <CursorGlow />
        <Navbar />
        <main className="content-wrap">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/metrics" element={<ModelDashboard />} />
            <Route path="/predict" element={<PredictPage />} />
            <Route path="/chat" element={<ChatbotPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
