
export type AppSource = 'gmail' | 'gdrive' | 'dropbox';

export interface FileItem {
  id: string;
  name: string;
  size: string;
  type: string;
  source: AppSource;
  contentSnippet: string;
  // New fields for real file handling
  base64Data?: string;
  mimeType?: string;
  // Backend identifier for search
  serverFilename?: string;
}

export interface AppConnection {
  id: AppSource;
  name: string;
  connected: boolean;
  loading: boolean;
}

export interface AnalysisResult {
  markdown: string;
}

export interface SearchResult {
  general_definition: string;
  document_matches: {
    quote: string;
    context: string;
  }[];
  summary_verdict: string;
}
