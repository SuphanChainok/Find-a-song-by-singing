export interface SongResult {
  song_name: string;
  artist: string;
  score: number; // 0–100 matching confidence score
  matched_lyric_snippet: string;
  
  // Optional fields for future use or UI compatibility
  id?: string;
  album?: string;
  albumArt?: string;
  previewUrl?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  appleMusicUrl?: string;
  duration?: number; // seconds
  releaseYear?: number;
  genre?: string[];
}

export interface IdentifyResponse {
  success: boolean;
  transcribed_text?: string;
  results: SongResult[];
  message?: string;
  processingTime?: number;
  error?: string;
}

export type RecordingState = "idle" | "requesting" | "recording" | "processing" | "error";

export interface SongMatch {
  song_name: string;
  artist: string;
  matched_snippet: string;
  score: number;
  youtube_url?: string;
}

export interface SongSearchResponse {
  success: boolean;
  transcribed_text?: string;
  results?: SongMatch[];
}
