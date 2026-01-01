export interface Face {
  id: string;
  photoId: string;
  boundingBox: string;
  descriptor: string;
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

export interface FaceCluster {
  personId: string;
  faces: Face[];
  avgConfidence: number;
}

export interface PersonCreateInput {
  name?: string;
}
