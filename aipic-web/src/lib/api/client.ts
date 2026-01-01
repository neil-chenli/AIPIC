const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // 从localStorage恢复token
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string) {
    const result = await this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(result.token);
    return result;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async initOwner(username: string, password: string, email?: string) {
    const result = await this.request<{ user: any; token: string }>('/auth/init', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    });
    this.setToken(result.token);
    return result;
  }

  // Photos
  async getPhotos(params?: {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
    album_id?: string;
    tag_ids?: string[];
    has_gps?: boolean;
    person_id?: string;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => query.append(key, v));
          } else {
            query.append(key, String(value));
          }
        }
      });
    }
    return this.request(`/photos?${query.toString()}`);
  }

  async getPhoto(id: string) {
    return this.request(`/photos/${id}`);
  }

  async getPhotoFile(id: string) {
    return `${API_BASE_URL}/photos/${id}/file`;
  }

  async deletePhoto(id: string) {
    return this.request(`/photos/${id}`, { method: 'DELETE' });
  }

  async restorePhoto(id: string) {
    return this.request(`/photos/${id}/restore`, { method: 'POST' });
  }

  // Albums
  async getAlbumsTree() {
    return this.request('/albums/tree');
  }

  async getAlbums() {
    return this.request('/albums');
  }

  async getAlbum(id: string) {
    return this.request(`/albums/${id}`);
  }

  async createAlbum(data: { name: string; description?: string; parentId?: string }) {
    return this.request('/albums', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAlbum(id: string, data: { name?: string; description?: string; parentId?: string | null }) {
    return this.request(`/albums/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAlbum(id: string) {
    return this.request(`/albums/${id}`, { method: 'DELETE' });
  }

  async addPhotosToAlbum(albumId: string, photoIds: string[]) {
    return this.request(`/albums/${albumId}/photos`, {
      method: 'POST',
      body: JSON.stringify({ photoIds }),
    });
  }

  async removePhotosFromAlbum(albumId: string, photoIds: string[]) {
    return this.request(`/albums/${albumId}/photos`, {
      method: 'DELETE',
      body: JSON.stringify({ photoIds }),
    });
  }

  // Tags
  async getTagsTree() {
    return this.request('/tags/tree');
  }

  async getTags() {
    return this.request('/tags');
  }

  async createTag(data: { name: string; color?: string; parentId?: string }) {
    return this.request('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTag(id: string, data: { name?: string; color?: string; parentId?: string | null }) {
    return this.request(`/tags/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTag(id: string) {
    return this.request(`/tags/${id}`, { method: 'DELETE' });
  }

  async addTagsToPhoto(photoId: string, tagIds: string[]) {
    return this.request(`/tags/photos/${photoId}`, {
      method: 'POST',
      body: JSON.stringify({ tagIds }),
    });
  }

  async removeTagsFromPhoto(photoId: string, tagIds: string[]) {
    return this.request(`/tags/photos/${photoId}`, {
      method: 'DELETE',
      body: JSON.stringify({ tagIds }),
    });
  }

  async getPhotoTags(photoId: string) {
    return this.request(`/tags/photos/${photoId}`);
  }

  // Map
  async getMapHeat(params?: {
    bbox?: string;
    start_date?: string;
    end_date?: string;
    album_id?: string;
    tag_ids?: string[];
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => query.append(key, v));
          } else {
            query.append(key, String(value));
          }
        }
      });
    }
    return this.request(`/map/heat?${query.toString()}`);
  }

  async getMapPhotos(params?: {
    bbox?: string;
    start_date?: string;
    end_date?: string;
    album_id?: string;
    tag_ids?: string[];
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => query.append(key, v));
          } else {
            query.append(key, String(value));
          }
        }
      });
    }
    return this.request(`/map/photos?${query.toString()}`);
  }

  // Thumbnails
  getThumbnailUrl(photoId: string, size: 'small' | 'medium' = 'small') {
    return `${API_BASE_URL}/thumbnails/${photoId}/${size}`;
  }

  // Imports
  async createImport(sourcePath: string) {
    return this.request('/imports', {
      method: 'POST',
      body: JSON.stringify({ sourcePath }),
    });
  }

  async getImports(limit?: number, offset?: number) {
    const query = new URLSearchParams();
    if (limit) query.append('limit', String(limit));
    if (offset) query.append('offset', String(offset));
    return this.request(`/imports?${query.toString()}`);
  }

  async getImport(id: string) {
    return this.request(`/imports/${id}`);
  }

  async cancelImport(id: string) {
    return this.request(`/imports/${id}`, { method: 'DELETE' });
  }

  // Persons
  async getPersons() {
    return this.request('/persons');
  }

  async getPerson(id: string) {
    return this.request(`/persons/${id}`);
  }

  async getPersonPhotos(id: string) {
    return this.request(`/persons/${id}/photos`);
  }

  async createPerson(data: { name?: string }) {
    return this.request('/persons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePerson(id: string, data: { name?: string }) {
    return this.request(`/persons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePerson(id: string) {
    return this.request(`/persons/${id}`, { method: 'DELETE' });
  }

  async mergePersons(targetPersonId: string, sourcePersonId: string) {
    return this.request('/persons/merge', {
      method: 'POST',
      body: JSON.stringify({ targetPersonId, sourcePersonId }),
    });
  }

  async getCooccurrenceGraph() {
    return this.request('/persons/graph/cooccurrence');
  }

  // Settings
  async getSettings() {
    return this.request('/settings');
  }

  async updateSettings(data: {
    libraryPath?: string;
    mapTileProvider?: string;
    privacyMode?: boolean;
  }) {
    return this.request('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

