export type ImportTaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface ImportTask {
  id: string;
  sourcePath: string;
  status: ImportTaskStatus;
  totalFiles: number;
  processedFiles: number;
  successCount: number;
  failedCount: number;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportTaskCreateInput {
  sourcePath: string;
}

export interface ImportError {
  filePath: string;
  error: string;
}

