import axios, { AxiosError } from 'axios';
import type {
  CreateRoomRequest,
  CreateRoomResponse,
  StartRecordingRequest,
  StartRecordingResponse,
  StopRecordingRequest,
  StopRecordingResponse,
  ApiError,
} from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createRoom = async (
  sessionId: string,
  participantName: string
): Promise<CreateRoomResponse> => {
  try {
    const response = await apiClient.post<CreateRoomResponse>('/api/sessions/join', {
      sessionId,
      identity: participantName,
    } as CreateRoomRequest);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(axiosError.response?.data?.error || 'Failed to create room');
    }
    throw error;
  }
};

export const startRecording = async (sessionId: string): Promise<StartRecordingResponse> => {
  try {
    const response = await apiClient.post<StartRecordingResponse>('/api/sessions/start', {
      sessionId,
    } as StartRecordingRequest);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(axiosError.response?.data?.error || 'Failed to start recording');
    }
    throw error;
  }
};

export const stopRecording = async (egressId: string): Promise<StopRecordingResponse> => {
  try {
    const response = await apiClient.post<StopRecordingResponse>('/api/sessions/stop', {
      egressId,
    } as StopRecordingRequest);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(axiosError.response?.data?.error || 'Failed to stop recording');
    }
    throw error;
  }
};
