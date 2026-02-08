import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import InterviewRoom from "./components/InterviewRoom";
import "./App.css";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:sessionId" element={<InterviewRoom />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
