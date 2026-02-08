import React, { useState } from "react";
import { startRecording, stopRecording } from "../services/api";
import "./RecordingControls.css";

interface RecordingControlsProps {
  roomName: string;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({ roomName }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [egressId, setEgressId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleStartRecording = async (): Promise<void> => {
    try {
      setStatus("Starting recording...");
      setError("");

      const data = await startRecording(roomName);
      setEgressId(data.egressId);
      setIsRecording(true);
      setStatus("🔴 Recording in progress");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start recording";
      console.error("Failed to start recording:", err);
      setError(errorMessage);
      setStatus("");
    }
  };

  const handleStopRecording = async (): Promise<void> => {
    if (!egressId) {
      setError("No active recording found");
      return;
    }

    try {
      setStatus("Stopping recording...");
      setError("");

      await stopRecording(egressId);
      setIsRecording(false);
      setStatus("✅ Recording stopped. Uploading to S3...");
      setEgressId(null);

      // Очистить статус через 5 секунд
      setTimeout(() => setStatus(""), 5000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to stop recording";
      console.error("Failed to stop recording:", err);
      setError(errorMessage);
      setStatus("");
    }
  };

  return (
    <div className="recording-controls">
      <div className="controls-content">
        {status && <div className="status-message">{status}</div>}
        {error && <div className="error-message">⚠️ {error}</div>}

        <div className="button-group">
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="btn-record"
              disabled={!!status}
            >
              <span className="icon">⏺</span>
              Start Recording
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="btn-stop"
              disabled={!!status && status.includes("Stopping")}
            >
              <span className="icon">⏹</span>
              Stop Recording
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordingControls;
