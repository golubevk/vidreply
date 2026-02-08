export interface CreateRoomRequest {
  sessionId: string;
  identity: string;
}

export interface CreateRoomResponse {
  token: string;
  serverUrl: string;
}

export interface StartRecordingRequest {
  sessionId: string;
}

export interface StartRecordingResponse {
  egressId: string;
}

export interface StopRecordingRequest {
  egressId: string;
}

export interface StopRecordingResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  error: string;
}
