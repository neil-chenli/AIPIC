export interface Tag {
  id: string;
  name: string;
  color: string | null;
  parentId: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TagWithCount extends Tag {
  photoCount: number;
  children?: TagWithCount[];
}

export interface PhotoTag {
  id: string;
  photoId: string;
  tagId: string;
  source: 'manual' | 'auto';
  confidence: number | null;
  createdAt: Date;
}

export interface TagCreateInput {
  name: string;
  color?: string;
  parentId?: string;
}
