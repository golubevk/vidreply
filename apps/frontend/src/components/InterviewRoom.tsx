import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import RecordingControls from './RecordingControls';
import { createRoom } from '../services/api';
import './InterviewRoom.css';

const InterviewRoom: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const participantName = searchParams.get('name');

  const [token, setToken] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!sessionId || !participantName) {
      setError('Missing session ID or participant name');
      setLoading(false);
      return;
    }

    const initRoom = async (): Promise<void> => {
      try {
        const data = await createRoom(sessionId, participantName);
        setToken(data.token);
        setServerUrl(data.serverUrl);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to join room';
        console.error('Failed to create room:', err);
        setError(errorMessage);
        setLoading(false);
      }
    };

    initRoom();
  }, [sessionId, participantName]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Connecting to interview room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => (window.location.href = '/')}>Return to Home</button>
      </div>
    );
  }

  console.log({ token, serverUrl });

  return (
    <div className="interview-room">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        connect={true}
        style={{ height: '100vh' }}
      >
        <RecordingControls roomName={sessionId!} />
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

export default InterviewRoom;
