export interface Photo {
  id: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  thumbnailPath: string | null;
  fileSize: number;
  fileHash: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  captureTime: Date | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  cameraMake: string | null;
  cameraModel: string | null;
  iso: number | null;
  focalLength: number | null;
  aperture: number | null;
  shutterSpeed: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhotoCreateInput {
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  fileHash: string;
  mimeType: string;
  width?: number;
  height?: number;
  captureTime?: Date;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  cameraMake?: string;
  cameraModel?: string;
  iso?: number;
  focalLength?: number;
  aperture?: number;
  shutterSpeed?: string;
}

export interface PhotoFilter {
  startDate?: Date;
  endDate?: Date;
  albumId?: string;
  tagIds?: string[];
  hasLocation?: boolean;
  personId?: string;
  searchText?: string;
}

