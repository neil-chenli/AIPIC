-- AIPIC Database Schema for SQLite

-- 照片表
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  thumbnail_path TEXT,
  file_size INTEGER NOT NULL,
  file_hash TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  capture_time DATETIME,
  latitude REAL,
  longitude REAL,
  altitude REAL,
  camera_make TEXT,
  camera_model TEXT,
  iso INTEGER,
  focal_length REAL,
  aperture REAL,
  shutter_speed TEXT,
  deleted_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_photos_capture_time ON photos(capture_time);
CREATE INDEX IF NOT EXISTS idx_photos_file_hash ON photos(file_hash);
CREATE INDEX IF NOT EXISTS idx_photos_location ON photos(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_photos_deleted_at ON photos(deleted_at);

-- 相册表
CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_photo_id TEXT,
  parent_id TEXT,
  is_smart_album INTEGER NOT NULL DEFAULT 0,
  smart_rules TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES albums(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_albums_parent_id ON albums(parent_id);
CREATE INDEX IF NOT EXISTS idx_albums_sort_order ON albums(sort_order);

-- 相册-照片关联表
CREATE TABLE IF NOT EXISTS album_photos (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL,
  photo_id TEXT NOT NULL,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  UNIQUE(album_id, photo_id)
);

CREATE INDEX IF NOT EXISTS idx_album_photos_album_id ON album_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_photo_id ON album_photos(photo_id);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  parent_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tags_parent_id ON tags(parent_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- 照片-标签关联表
CREATE TABLE IF NOT EXISTS photo_tags (
  id TEXT PRIMARY KEY,
  photo_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('manual', 'auto')),
  confidence REAL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(photo_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag_id ON photo_tags(tag_id);

-- 人物表
CREATE TABLE IF NOT EXISTS persons (
  id TEXT PRIMARY KEY,
  name TEXT,
  cover_face_id TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 人脸表
CREATE TABLE IF NOT EXISTS faces (
  id TEXT PRIMARY KEY,
  photo_id TEXT NOT NULL,
  bounding_box TEXT NOT NULL,
  descriptor TEXT NOT NULL,
  quality REAL NOT NULL,
  person_id TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_faces_photo_id ON faces(photo_id);
CREATE INDEX IF NOT EXISTS idx_faces_person_id ON faces(person_id);

-- 导入任务表
CREATE TABLE IF NOT EXISTS import_tasks (
  id TEXT PRIMARY KEY,
  source_path TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  total_files INTEGER NOT NULL DEFAULT 0,
  processed_files INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_import_tasks_status ON import_tasks(status);
CREATE INDEX IF NOT EXISTS idx_import_tasks_created_at ON import_tasks(created_at);

-- 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  user_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 全文搜索虚拟表（用于照片文件名搜索）
CREATE VIRTUAL TABLE IF NOT EXISTS photos_fts USING fts5(
  original_file_name,
  camera_make,
  camera_model,
  content=photos,
  content_rowid=rowid
);

-- 触发器：更新 updated_at 时间戳
CREATE TRIGGER IF NOT EXISTS update_photos_timestamp 
  AFTER UPDATE ON photos
BEGIN
  UPDATE photos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_albums_timestamp 
  AFTER UPDATE ON albums
BEGIN
  UPDATE albums SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_tags_timestamp 
  AFTER UPDATE ON tags
BEGIN
  UPDATE tags SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_persons_timestamp 
  AFTER UPDATE ON persons
BEGIN
  UPDATE persons SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_faces_timestamp 
  AFTER UPDATE ON faces
BEGIN
  UPDATE faces SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_import_tasks_timestamp 
  AFTER UPDATE ON import_tasks
BEGIN
  UPDATE import_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
