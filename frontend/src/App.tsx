// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import SlideViewer from "./SlideViewer";
import LandingPage from "./LandingPage";

const App: React.FC = () => {
  return (
    <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/viewer/:presentationId" element={<SlideViewer />} />
    </Routes>
  );
};

export default App;
