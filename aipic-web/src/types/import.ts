export interface ImportTask {
  id: string;
  sourcePath: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
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

export interface ImportProgress {
  taskId: string;
  status: ImportTask['status'];
  progress: number;
  currentFile: string | null;
  processedFiles: number;
  totalFiles: number;
  errors: ImportError[];
}

export interface ImportError {
  filePath: string;
  reason: string;
  timestamp: Date;
}

export interface ImportOptions {
  sourcePath: string;
  copyFiles?: boolean;
  generateThumbnails?: boolean;
  detectFaces?: boolean;
}
