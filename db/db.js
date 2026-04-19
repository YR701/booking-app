/* Author: Yongrong Yang */

const fs = require('fs');
const path = require('path');

function requireFromBackend(packageName) {
  try {
    return require(packageName);
  } catch {
    return require(path.join(__dirname, '../be/node_modules', packageName));
  }
}

const dotenv = requireFromBackend('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const DB_DRIVER = String(process.env.DB_DRIVER || 'mysql').trim().toLowerCase();

function normalizeParam(value) {
  if (value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  return value;
}

function normalizeParams(params = []) {
  return params.map(normalizeParam);
}

function stripForUpdate(sql) {
  return sql.replace(/\s+FOR UPDATE\b/gi, '');
}

function isReadQuery(sql) {
  const normalized = sql.trim().replace(/^\(+/, '').toUpperCase();
  return (
    normalized.startsWith('SELECT')
    || normalized.startsWith('PRAGMA')
    || normalized.startsWith('WITH')
    || normalized.startsWith('EXPLAIN')
  );
}

function mapSqliteError(error) {
  if (!error || typeof error !== 'object') {
    return error;
  }

  const nextError = error;
  const message = String(nextError.message || '');

  if (message.includes('UNIQUE constraint failed')) {
    nextError.code = 'ER_DUP_ENTRY';
  }

  return nextError;
}

async function executeSqlite(db, sql, params = []) {
  const statementSql = stripForUpdate(sql);
  const statement = db.prepare(statementSql);
  const values = normalizeParams(params);

  try {
    if (isReadQuery(statementSql)) {
      return [statement.all(...values)];
    }

    const result = statement.run(...values);
    return [{
      insertId: Number(result.lastInsertRowid || 0),
      affectedRows: Number(result.changes || 0),
    }];
  } catch (error) {
    throw mapSqliteError(error);
  }
}

class SqliteConnection {
  constructor(db) {
    this.db = db;
    this.inTransaction = false;
  }

  async beginTransaction() {
    if (!this.inTransaction) {
      this.db.exec('BEGIN IMMEDIATE');
      this.inTransaction = true;
    }
  }

  async commit() {
    if (this.inTransaction) {
      this.db.exec('COMMIT');
      this.inTransaction = false;
    }
  }

  async rollback() {
    if (this.inTransaction) {
      try {
        this.db.exec('ROLLBACK');
      } finally {
        this.inTransaction = false;
      }
    }
  }

  async execute(sql, params = []) {
    return executeSqlite(this.db, sql, params);
  }

  release() {}
}

function createSqlitePool() {
  const { DatabaseSync } = require('node:sqlite');
  const sqlitePath = path.resolve(
    __dirname,
    process.env.DB_SQLITE_PATH || `${process.env.DB_NAME || 'booking_app'}.sqlite`
  );
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });

  const db = new DatabaseSync(sqlitePath);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA journal_mode = WAL');

  const schemaPath = path.join(__dirname, 'schema.sqlite.sql');
  if (fs.existsSync(schemaPath)) {
    db.exec(fs.readFileSync(schemaPath, 'utf8'));
  }

  return {
    driver: 'sqlite',
    sqlitePath,
    async execute(sql, params = []) {
      return executeSqlite(db, sql, params);
    },
    async getConnection() {
      return new SqliteConnection(db);
    },
  };
}

function createMysqlPool() {
  const mysql = requireFromBackend('mysql2/promise');
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  pool.driver = 'mysql';
  return pool;
}

const pool = DB_DRIVER === 'sqlite' ? createSqlitePool() : createMysqlPool();

module.exports = pool;