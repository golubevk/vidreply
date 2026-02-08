import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

const HomePage: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>("");
  const [participantName, setParticipantName] = useState<string>("");
  const navigate = useNavigate();

  const handleJoin = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (sessionId.trim() && participantName.trim()) {
      navigate(
        `/room/${sessionId}?name=${encodeURIComponent(participantName)}`,
      );
    }
  };

  return (
    <div className="home-page">
      <div className="container">
        <h1>Video Interview Platform</h1>
        <p className="subtitle">Enter session details to join</p>

        <form onSubmit={handleJoin} className="join-form">
          <div className="form-group">
            <label htmlFor="sessionId">Session ID</label>
            <input
              id="sessionId"
              type="text"
              placeholder="e.g., interview-123"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="participantName">Your Name</label>
            <input
              id="participantName"
              type="text"
              placeholder="e.g., John Doe"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <button type="submit" className="btn-join">
            Join Interview
          </button>
        </form>
      </div>
    </div>
  );
};

export default HomePage;
