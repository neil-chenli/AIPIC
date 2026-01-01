import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  // 数据库路径：优先使用环境变量，否则使用项目根目录下的data文件夹
  const dbPath = process.env.DB_PATH || join(process.cwd(), '..', '..', 'data', 'aipic.db');
  
  // 确保data目录存在
  const { mkdirSync } = require('fs');
  const dataDir = join(process.cwd(), '..', '..', 'data');
  try {
    mkdirSync(dataDir, { recursive: true });
  } catch (err) {
    // 目录可能已存在，忽略错误
  }

  db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
  });

  // 配置SQLite性能参数
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000'); // 64MB cache
  db.pragma('temp_store = MEMORY');

  initializeSchema(db);

  return db;
}

function initializeSchema(database: Database.Database) {
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  
  database.exec(schema);
  
  console.log('✅ Database schema initialized successfully');
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// 优雅关闭
process.on('exit', closeDatabase);
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});

