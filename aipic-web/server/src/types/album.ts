export interface Album {
  id: string;
  name: string;
  description: string | null;
  coverPhotoId: string | null;
  parentId: string | null;
  isSmartAlbum: boolean;
  smartRules: string | null;
  sortOrder: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlbumWithStats extends Album {
  photoCount: number;
  children?: AlbumWithStats[];
}

export interface AlbumCreateInput {
  name: string;
  description?: string;
  parentId?: string;
  isSmartAlbum?: boolean;
  smartRules?: string;
}

export interface AlbumPhoto {
  id: string;
  albumId: string;
  photoId: string;
  addedAt: Date;
}

