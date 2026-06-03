/**
 * 从 schema.prisma 的 /// 注释生成 MySQL 表/列 COMMENT 迁移 SQL。
 * 用法: node prisma/scripts/generate-column-comments-sql.mjs > prisma/migrations/.../migration.sql
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '../schema.prisma');
const lines = fs.readFileSync(schemaPath, 'utf8').split('\n');

/** @type {Record<string, { table: string, tableComment: string, fields: { col: string, comment: string }[] }>} */
const models = {};
let current = null;
let pendingFieldComment = null;
let pendingModelComment = null;

for (const line of lines) {
  const modelDoc = line.match(/^\/\/\/ (.+)$/);
  if (modelDoc && !line.includes('@')) {
    pendingModelComment = modelDoc[1].trim();
    continue;
  }
  const fieldDoc = line.match(/^\s*\/\/\/ (.+)$/);
  if (fieldDoc) {
    pendingFieldComment = fieldDoc[1].trim();
    continue;
  }
  const modelStart = line.match(/^model (\w+) \{/);
  if (modelStart) {
    current = modelStart[1];
    models[current] = {
      table: '',
      tableComment: pendingModelComment || current,
      fields: [],
    };
    pendingModelComment = null;
    continue;
  }
  if (line.match(/^}/) && current) {
    current = null;
    continue;
  }
  const mapLine = line.match(/^\s*@@map\("([^"]+)"\)/);
  if (mapLine && current) {
    models[current].table = mapLine[1];
    continue;
  }
  if (!current || !pendingFieldComment) continue;
  const field = line.match(/^\s*(\w+)\s+/);
  if (!field || line.includes('@@') || line.trim().startsWith('//')) continue;
  const name = field[1];
  if (['User', 'Order', 'Sku'].includes(name) && line.includes('@relation')) continue;
  const map = line.match(/@map\("([^"]+)"\)/);
  const col = map ? map[1] : name.replace(/([A-Z])/g, (_, c, i) => (i ? '_' : '') + c.toLowerCase()).replace(/^_/, '');
  if (line.match(/^\s*(cartItems|orders|addresses|spus|children|parent|category|brand|skus|user|sku|order|items|statusLogs|payment|reservations)\b/)) {
    pendingFieldComment = null;
    continue;
  }
  if (!line.match(/^\s*\w+\s+(Int|String|Boolean|DateTime|Json)/)) {
    pendingFieldComment = null;
    continue;
  }
  models[current].fields.push({ col, comment: pendingFieldComment.replace(/'/g, "''") });
  pendingFieldComment = null;
}

const typeSql = {
  Int: (f, line) => {
    const def = line.match(/@default\((\d+)\)/);
    const nullable = line.includes('Int?');
    const base = 'INTEGER';
    if (nullable) return `${base} NULL`;
    if (def) return `${base} NOT NULL DEFAULT ${def[1]}`;
    return `${base} NOT NULL`;
  },
  String: (f, line) => {
    const len = line.match(/@db\.VarChar\((\d+)\)/);
    const nullable = line.includes('String?');
    const def = line.match(/@default\("([^"]*)"\)/);
    const t = len ? `VARCHAR(${len[1]})` : 'TEXT';
    if (nullable) return `${t} NULL`;
    if (def) return `${t} NOT NULL DEFAULT '${def[1].replace(/'/g, "''")}'`;
    return `${t} NOT NULL`;
  },
  Boolean: (f, line) => {
    const def = line.match(/@default\((true|false)\)/);
    const v = def ? def[1] : 'false';
    return `BOOLEAN NOT NULL DEFAULT ${v}`;
  },
  DateTime: (f, line) => {
    const nullable = line.includes('DateTime?');
    const def = line.includes('@default(now())');
    if (nullable) return 'DATETIME(3) NULL';
    if (def) return 'DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)';
    return 'DATETIME(3) NOT NULL';
  },
  Json: (f, line) => {
    const nullable = line.includes('Json?');
    const def = line.match(/@default\("([^"]*)"\)/);
    if (nullable) return 'JSON NULL';
    if (def) return `JSON NOT NULL DEFAULT ('${def[1]}')`;
    return 'JSON NOT NULL';
  },
};

const out = ['-- 表/列中文备注（与 schema.prisma /// 注释同步）', ''];
for (const [modelName, m] of Object.entries(models)) {
  if (!m.table) continue;
  const tableComment = (m.tableComment || modelName).replace(/'/g, "''");
  out.push(`ALTER TABLE \`${m.table}\` COMMENT = '${tableComment}';`);

  const modelBlock = schemaPath;
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const blockRe = new RegExp(`model ${modelName} \\{([\\s\\S]*?)\\n\\}`, 'm');
  const block = schema.match(blockRe)?.[1] || '';

  const mods = [];
  for (const { col, comment } of m.fields) {
    const fieldRe = new RegExp(`///[^\\n]*\\n\\s*\\w+[^\\n]*${col.replace(/_/g, '_')}|@map\\("${col}"\\)[^\\n]*`, 'm');
    const fieldLine = block.split('\n').find((l) => l.includes(`@map("${col}")`) || l.match(new RegExp(`\\b${col.replace(/_([a-z])/g, (_, c) => c.toUpperCase())}\\b`))) ||
      block.split('\n').find((l) => {
        const camel = col.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        return l.includes(camel) && /Int|String|Boolean|DateTime|Json/.test(l);
      });
    if (!fieldLine) continue;
    let sqlType = 'INTEGER NOT NULL';
    if (fieldLine.includes('Int')) sqlType = typeSql.Int(col, fieldLine);
    else if (fieldLine.includes('String')) sqlType = typeSql.String(col, fieldLine);
    else if (fieldLine.includes('Boolean')) sqlType = typeSql.Boolean(col, fieldLine);
    else if (fieldLine.includes('DateTime')) sqlType = typeSql.DateTime(col, fieldLine);
    else if (fieldLine.includes('Json')) sqlType = typeSql.Json(col, fieldLine);
    if (fieldLine.includes('@id') && fieldLine.includes('autoincrement')) {
      sqlType = 'INTEGER NOT NULL AUTO_INCREMENT';
    }
    mods.push(`MODIFY COLUMN \`${col}\` ${sqlType} COMMENT '${comment}'`);
  }
  if (mods.length) {
    out.push(`ALTER TABLE \`${m.table}\`\n  ${mods.join(',\n  ')};`);
  }
  out.push('');
}

process.stdout.write(out.join('\n'));
