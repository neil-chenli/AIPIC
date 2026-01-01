export interface Person {
  id: string;
  name: string | null;
  coverFaceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonWithStats extends Person {
  faceCount: number;
  photoCount: number;
}

export interface PersonCreateInput {
  name?: string;
}

export interface Face {
  id: string;
  photoId: string;
  boundingBox: string; // JSON string of {x, y, width, height}
  descriptor: string; // JSON string of face descriptor array
  quality: number;
  personId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

