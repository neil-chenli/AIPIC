export interface Tag {
  id: string;
  name: string;
  color: string | null;
  parentId: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TagCreateInput {
  name: string;
  color?: string;
  parentId?: string;
}

export interface TagWithStats extends Tag {
  photoCount: number;
  children?: TagWithStats[];
}

