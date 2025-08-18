#!/usr/bin/env python3
"""
Python Backend for Electronic Industry Agent
FastAPI-based backend replacing Next.js API routes
"""

import os
import json
import re
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional, AsyncGenerator
from contextlib import asynccontextmanager
import uuid
import csv
import aiofiles
import pathlib
import hashlib

import asyncpg
import pandas as pd
import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://username:password@localhost:5432/dbname")

# LLM configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_API_ENDPOINT = os.getenv("OPENAI_API_ENDPOINT", "https://api.openai.com/v1/chat/completions")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_ENDPOINT = os.getenv("GEMINI_ENDPOINT", "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent")

# DeepSeek (OpenAI-compatible Chat Completions)
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_API_ENDPOINT = os.getenv("DEEPSEEK_API_ENDPOINT", "https://api.deepseek.com/v1/chat/completions")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "deepseek")

# Database schema (same as from the original TypeScript file)
DB_SCHEMA = """
```sql
create schema assessment;

create schema assessment_profile;

create schema platform_management;

create table platform_management.assignment
(
    id                    bigserial
        primary key,
    assignment_id         integer
        constraint uk_69g7kc6aba38ao4e3el6wmf6l
            unique,
    effort                integer,
    assignment_end_date   date,
    opportunity_id        varchar(255),
    shadow                boolean,
    staffing_request_id   varchar(255),
    assignment_start_date date,
    status                boolean,
    employee_id           varchar(255)
);

create table platform_management."user"
(
    id          bigserial
        primary key,
    created_at  timestamp,
    email       varchar(255)
        constraint uk_ob8kqyqqgmefl0aco34akdtpe
            unique,
    employee_id varchar(255)
        constraint uk_r1usl9qoplqsbrhha5e0niqng
            unique,
    is_active   boolean,
    name        varchar(255),
    updated_at  timestamp
);

-- Additional tables truncated for brevity, full schema available in doc
```
"""

# SQL prompt (truncated for brevity)
SQL_PROMPT = """
企业级BI数据示例，涵盖常见的复杂数据图表场景。
请生成PostgreSQL兼容的SQL语句，不包含任何解释或代码块标记。
"""

# Prompt helpers
def build_sql_prompt(user_input: str) -> str:
    instructions = (
        "你是资管与网管数据分析专家。根据用户需求，输出严格的PostgreSQL查询语句。"
        "注意：不要输出除SQL以外的任何文字，不要包裹Markdown代码块。"
    )
    return f"{instructions}\n业务背景:\n{SQL_PROMPT}\n用户需求:\n{user_input}\n只输出SQL："

def build_thinking_prompt(user_input: str) -> str:
    instructions = (
        "你是资管与网管数据分析专家。请先简要给出思考过程，再给出SQL语句。"
        "输出格式必须包含两段：\n思考过程：<你的简要思考>\nSQL语句：<仅SQL>"
    )
    return f"{instructions}\n业务背景:\n{SQL_PROMPT}\n用户需求:\n{user_input}"

# Global database connection pool
db_pool: Optional[asyncpg.Pool] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global db_pool
    
    # Initialize database connection pool
    try:
        db_pool = await asyncpg.create_pool(DATABASE_URL)
        print("Database connection pool created successfully")
    except Exception as e:
        print(f"Failed to create database pool: {e}")
        db_pool = None
    
    yield
    
    # Cleanup
    if db_pool:
        await db_pool.close()
        print("Database connection pool closed")

# FastAPI app
app = FastAPI(
    title="Electronic Industry Agent Backend",
    description="Python backend for Electronic Industry Agent",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class LLMRequest(BaseModel):
    userInput: str = Field(..., description="User input for LLM processing")
    modelType: str = Field(default="deepseek", description="LLM model type")

class SQLQueryRequest(BaseModel):
    sql: str = Field(..., description="SQL query to execute")

class LLMStreamRequest(BaseModel):
    userInput: str = Field(..., description="User input for streaming LLM")

class ErrorResponse(BaseModel):
    success: bool = False
    error: Dict[str, str]

class SuccessResponse(BaseModel):
    sql: str

class IntentRequest(BaseModel):
    text: str = Field(..., description="用户输入的原始文本")

class IntentTask(BaseModel):
    type: str = Field(..., description="任务类型，如 OLT_STATISTICS 或 FTTR_CHECK")
    params: Dict[str, Any] = Field(default_factory=dict, description="任务需要的参数")

class IntentResponse(BaseModel):
    tasks: List[IntentTask]

class OLTStatisticsResponse(BaseModel):
    preview: List[Dict[str, Any]]
    fileId: str
    filename: str
    downloadUrl: str
    rowCount: int

class FTTRCheckRequest(BaseModel):
    erjiFenGuang: Optional[str] = Field(default=None, description="二级分光器名称")
    onuMingCheng: Optional[str] = Field(default=None, description="ONU名称")

class FTTRCheckResponse(BaseModel):
    preview: List[Dict[str, Any]]
    fileId: str
    filename: str
    downloadUrl: str
    rowCount: int

class SQLExportResponse(BaseModel):
    fileId: str
    filename: str
    downloadUrl: str
    rowCount: int

# Utility functions
def clean_sql_query(sql: str) -> str:
    """Clean SQL query by removing markdown code blocks and extra whitespace"""
    if not sql or not isinstance(sql, str):
        return ""
    
    cleaned_sql = sql.strip()
    
    # Remove markdown code blocks
    if cleaned_sql.startswith("```sql") or cleaned_sql.startswith("```"):
        cleaned_sql = re.sub(r'^```(sql)?\n?', '', cleaned_sql)
        cleaned_sql = re.sub(r'\n?```$', '', cleaned_sql)
    
    # Remove extra whitespace
    cleaned_sql = cleaned_sql.strip()
    cleaned_sql = re.sub(r'\n\s*\n', '\n', cleaned_sql)
    
    return cleaned_sql

def validate_sql_query(sql: str) -> Dict[str, Any]:
    """Validate SQL query for safety"""
    if not sql or not isinstance(sql, str):
        return {"isValid": False, "error": "SQL查询语句不能为空"}
    
    cleaned_sql = clean_sql_query(sql).lower()
    
    if not cleaned_sql:
        return {"isValid": False, "error": "SQL查询语句为空"}
    
    # Check for dangerous operations
    dangerous_operations = [
        "drop table", "drop database", "truncate", "delete from",
        "update ", "insert into", "alter table", "create table", "create database"
    ]
    
    for operation in dangerous_operations:
        if operation in cleaned_sql:
            return {
                "isValid": False,
                "error": f"不允许执行 {operation.upper()} 操作，仅支持查询操作"
            }
    
    # Check if it starts with SELECT or WITH
    if not cleaned_sql.startswith("select") and not cleaned_sql.startswith("with"):
        return {"isValid": False, "error": "仅支持 SELECT 查询语句"}
    
    return {"isValid": True}

def serialize_db_result(data: Any) -> Any:
    """Serialize database results, handling datetime and other types"""
    if data is None:
        return data
    
    if isinstance(data, datetime):
        return data.isoformat()
    
    if isinstance(data, list):
        return [serialize_db_result(item) for item in data]
    
    if isinstance(data, dict):
        return {key: serialize_db_result(value) for key, value in data.items()}
    
    return data

async def execute_query_dicts(sql: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
    """Execute a SQL query and return list of dict rows."""
    global db_pool
    if not db_pool:
        raise HTTPException(status_code=500, detail="数据库连接不可用")
    params = params or []
    async with db_pool.acquire() as connection:
        rows = await connection.fetch(sql, *params)
        result: List[Dict[str, Any]] = []
        for r in rows:
            result.append(serialize_db_result(dict(r)))
        return result

async def export_rows_to_excel(rows: List[Dict[str, Any]], base_filename: str) -> Dict[str, str]:
    """Export rows to an Excel file under storage dir. Returns dict with id, filename, path."""
    if not rows:
        columns: List[str] = []
    else:
        # Preserve column order from first row
        columns = list(rows[0].keys())
    df = pd.DataFrame(rows, columns=columns)
    storage_dir = get_storage_dir()
    export_id = str(uuid.uuid4())
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    safe_base = re.sub(r"[^0-9a-zA-Z\u4e00-\u9fff_-]+", "_", base_filename).strip("_") or "export"
    filename = f"{safe_base}_{ts}.xlsx"
    path = os.path.join(storage_dir, filename)
    # Write Excel
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="结果", index=False)
    # Record in DB
    global db_pool
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                await ensure_migrations_tables(conn)
                await conn.execute(
                    "insert into file_uploads (id, filename, path, size_bytes, content_type, status) values ($1, $2, $3, $4, $5, 'generated')",
                    uuid.UUID(export_id), filename, path, os.path.getsize(path), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
        except Exception:
            pass
    return {"id": export_id, "filename": filename, "path": path}

def recognize_task_from_text(text: str) -> str:
    """Return one of: 'OLT_STATISTICS', 'FTTR_CHECK', or 'UNKNOWN'"""
    t = (text or "").lower()
    if ("olt" in t) and ("统计" in text or "低效" in text or "数量" in text or "数" in text):
        return "OLT_STATISTICS"
    if ("fttr" in t) or ("分光" in text) or ("二级分光" in text) or ("onu" in t):
        return "FTTR_CHECK"
    return "UNKNOWN"

def extract_erji_fenguang_name(text: str) -> Optional[str]:
    """Best-effort extraction of 二级分光器名称 from free text.
    Heuristics:
    - Prefer substring containing '/'
    - Otherwise try text between keywords like 查询/判断 and 能否/是否/能开通/FTTR
    """
    if not text:
        return None
    # 1) Look for token containing '/'
    m = re.search(r'([\u4e00-\u9fffA-Za-z0-9_-]+/[A-Za-z0-9_-]+)', text)
    if m:
        return m.group(1)
    # 2) Between verbs and question
    m2 = re.search(r'(?:查询|判断|鉴别|查看|请帮我|请帮忙)([\u4e00-\u9fffA-Za-z0-9_\-]+)/?(?:能否|是否|能开通|能不能|可否|开通)?', text)
    if m2:
        candidate = m2.group(1).strip()
        return candidate if candidate else None
    return None

OLT_SQL_TEMPLATE = (
    "with OLT_and_OLT_yonghu as\n"
    "(\n"
    "    SELECT\n"
    "    distinct\n"
    "    suo_shu_qu_xian,\n"
    "    suo_shu_ji_fang_zi_yuan_dian,\n"
    "    COUNT(*) OVER (PARTITION BY suo_shu_ji_fang_zi_yuan_dian) AS ji_fang_count,\n"
    "    SUM(CAST(onu_shu_liang as integer)) OVER (PARTITION BY suo_shu_ji_fang_zi_yuan_dian) AS yonghu_liang\n"
    "FROM\n"
    "    \"zi_guan_-_olt_68131c82\"\n"
    ")\n\n"
    "-- 低效\n"
    "SELECT\n"
    "    *,\n"
    "    CASE\n"
    "        WHEN ji_fang_count - CEILING(COALESCE(yonghu_liang, 0) / 4500.0) < 0 THEN 0\n"
    "        ELSE ji_fang_count - CEILING(COALESCE(yonghu_liang, 0) / 4500.0)\n"
    "    END AS dixiao_OLT_taishu\n"
    "FROM\n"
    "    OLT_and_OLT_yonghu;"
)

FTTR_FGQ_SQL_TEMPLATE = (
    "select A.fen_guang_qi_ming_cheng as erji_fen_guang, A.fen_guang_qi_ji_bie, B.fen_guang_qi_ming_cheng as yiji_fen_guang, A.shang_lian_she_bei_zhu_yong_duan_kou, A.shang_lian_she_bei_zhu_yong_duan_kou ~ 'CG' as support_open_FTTR  from \"zi_guan_-_fen_guang_qi_763b860d\" A\n"
    "left join \"zi_guan_-_fen_guang_qi_763b860d\" B\n"
    "    on B.fen_guang_qi_ming_cheng = A.shang_lian_fen_guang_qi\n"
    "where A.fen_guang_qi_ji_bie = '二级分光'"
)

FTTR_ONU_SQL_TEMPLATE = (
    "select C.onu_ming_cheng,\n"
    "       A.fen_guang_qi_ming_cheng as erji_fen_guang,\n"
    "       A.fen_guang_qi_ji_bie,\n"
    "       B.fen_guang_qi_ming_cheng as yiji_fen_guang,\n"
    "       A.shang_lian_she_bei_zhu_yong_duan_kou,\n"
    "       A.shang_lian_she_bei_zhu_yong_duan_kou ~ 'CG' as fenguangqi_support_open_FTTR,\n"
    "       C.zhong_duan_lei_xing,\n"
    "       C.zhong_duan_lei_xing in ('V176-20', 'HN8145XR', 'HG3142F', 'ZXHN G7611 V2', 'V175', 'V173', 'UNF130Z') as single_ONU_support_fttr\n\n"
    "from  \"yue_ri_wang_guan_onu_zai_xian_qing_dan_4f929071\" C\n"
    "join \"zi_guan_-_onu_guang_mao_yong_hu_d88a2209\" D on C.onu_ming_cheng = D.xin_zeng_onu\n"
    "left join     \"zi_guan_-_fen_guang_qi_763b860d\" A on A.fen_guang_qi_ming_cheng = D.jie_ru_she_bei_ming_cheng\n"
    "left join \"zi_guan_-_fen_guang_qi_763b860d\" B\n"
    "    on B.fen_guang_qi_ming_cheng = A.shang_lian_fen_guang_qi\n"
    "where A.fen_guang_qi_ji_bie = '二级分光'\n"
    "-- and A.fen_guang_qi_ming_cheng is null"
)

def build_sql_for_intent(text: str) -> Dict[str, Any]:
    task = recognize_task_from_text(text)
    if task == "OLT_STATISTICS":
        return {"task": task, "sql": OLT_SQL_TEMPLATE}
    if task == "FTTR_CHECK":
        erji = extract_erji_fenguang_name(text)
        if erji:
            # Escape single quotes for SQL literal safety
            erji_escaped = erji.replace("'", "''")
            sql = (
                "select A.fen_guang_qi_ming_cheng as erji_fen_guang, A.fen_guang_qi_ji_bie, B.fen_guang_qi_ming_cheng as yiji_fen_guang, A.shang_lian_she_bei_zhu_yong_duan_kou, A.shang_lian_she_bei_zhu_yong_duan_kou ~ 'CG' as support_open_FTTR  from \"zi_guan_-_fen_guang_qi_763b860d\" A\n"
                "left join \"zi_guan_-_fen_guang_qi_763b860d\" B\n"
                "    on B.fen_guang_qi_ming_cheng = A.shang_lian_fen_guang_qi\n"
                "where A.fen_guang_qi_ji_bie = '二级分光'\n"
                f"and A.fen_guang_qi_ming_cheng = '{erji_escaped}'"
            )
            print(f"[INTENT][FTTR] Parsed erji='{erji}' from text")
            return {"task": task, "sql": sql, "params": {"erjiFenGuang": erji}}
        # Default to 二级分光器版本。ONU版本可根据需要切换
        return {"task": task, "sql": FTTR_FGQ_SQL_TEMPLATE, "alternative": FTTR_ONU_SQL_TEMPLATE}
    return {"task": "UNKNOWN", "sql": "", "message": "未识别到任务"}

def get_storage_dir() -> str:
    base_dir = os.path.dirname(__file__)
    storage = os.path.join(base_dir, "electronic-industry-agent", "files")
    os.makedirs(storage, exist_ok=True)
    return storage

def sanitize_identifier(name: str) -> str:
    cleaned = re.sub(r"[^0-9a-zA-Z_]+", "_", name.strip())
    cleaned = re.sub(r"_+", "_", cleaned)
    cleaned = cleaned.strip("_")
    if not cleaned:
        cleaned = "col"
    if cleaned[0].isdigit():
        cleaned = f"c_{cleaned}"
    return cleaned.lower()

def _is_chinese_char(ch: str) -> bool:
    return '\u4e00' <= ch <= '\u9fff'

def compute_pretty_table_name(file_path: str) -> str:
    """Derive a pinyin-based table name from filename by:
    - Removing leading UUID and underscore
    - Removing trailing 14-digit timestamp
    - Keeping only Chinese characters, hyphens, and letters
    - Converting to pinyin using the same utility as columns
    """
    stem = pathlib.Path(file_path).stem
    # Remove leading UUID followed by underscore
    stem = re.sub(r'^[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}_', '', stem)
    # Remove trailing 14-digit timestamp
    stem = re.sub(r'\d{14}$', '', stem)
    # Remove specific unwanted words
    stem = stem.replace('副本', '')
    # Filter allowed characters: Chinese, letters, hyphen
    filtered_chars = []
    for ch in stem:
        if _is_chinese_char(ch) or ch.isalpha() or ch == '-':
            filtered_chars.append(ch)
    filtered = ''.join(filtered_chars)
    filtered = re.sub(r'-{2,}', '-', filtered).strip('-')
    if not filtered:
        filtered = 'dataset'
    # Pinyin conversion (lazy import similar to Excel path)
    try:
        import sys as _sys
        _utils_dir = os.path.join(os.path.dirname(__file__), 'electronic-industry-agent')
        if _utils_dir not in _sys.path:
            _sys.path.append(_utils_dir)
        from utils import to_pinyin_list as _to_pinyin_list_name
        pinyin_res = _to_pinyin_list_name([filtered])
        name = pinyin_res[0] if pinyin_res else 'dataset'
    except Exception:
        # Fallback: basic sanitize preserving hyphens
        name = re.sub(r'[^a-zA-Z\-]+', '_', filtered).strip('_') or 'dataset'
    # Normalize underscores and lowercase; keep hyphens
    name = re.sub(r'_+', '_', name).strip('_').lower()
    return name or 'dataset'

async def ensure_migrations_tables(connection: asyncpg.Connection) -> None:
    await connection.execute(
        """
        create table if not exists file_uploads (
            id uuid primary key,
            filename text not null,
            path text not null,
            size_bytes bigint not null,
            content_type text,
            status text not null default 'uploaded',
            dataset_table text,
            rows_imported bigint default 0,
            created_at timestamp not null default now(),
            updated_at timestamp not null default now()
        );
        
        create table if not exists csv_metadata (
            id uuid primary key,
            header_signature text unique not null,
            headers jsonb not null,
            columns jsonb not null,
            table_name text not null,
            created_at timestamp not null default now(),
            updated_at timestamp not null default now()
        );
        """
    )

def _try_read_csv_headers(file_path: str, encoding: str):
    with open(file_path, mode="r", encoding=encoding, newline="") as f_sync:
        reader_sync = csv.reader(f_sync)
        headers = next(reader_sync)
        return headers

def _detect_csv_encoding(file_path: str) -> str:
    """Best-effort CSV encoding detection with sensible fallbacks."""
    candidate_encodings = [
        "utf-8",
        "utf-8-sig",
        "gb18030",
        "gbk",
        "gb2312",
        "big5",
        "latin1",
    ]
    for enc in candidate_encodings:
        try:
            _ = _try_read_csv_headers(file_path, enc)
            return enc
        except UnicodeDecodeError:
            continue
        except StopIteration:
            # Empty file
            return enc
        except Exception:
            continue
    # Last resort
    return "utf-8"

async def import_csv_background(upload_id: str, file_path: str) -> None:
    global db_pool
    if not db_pool:
        return
    try:
        async with db_pool.acquire() as conn:
            await ensure_migrations_tables(conn)
            await conn.execute(
                "update file_uploads set status='importing', updated_at=now() where id=$1",
                uuid.UUID(upload_id),
            )

            path_obj = pathlib.Path(file_path)

            # Detect encoding and read headers
            detected_encoding = _detect_csv_encoding(file_path)
            print(f"[csv] start id={upload_id} path={file_path} encoding={detected_encoding}")
            with open(file_path, mode="r", encoding=detected_encoding, newline="") as f_sync:
                reader_sync = csv.reader(f_sync)
                headers = next(reader_sync)

            # Normalize headers for signature
            normalized_headers = [
                (h.strip().lower() if isinstance(h, str) else str(h).strip().lower()) for h in headers
            ]
            signature_src = json.dumps(normalized_headers, ensure_ascii=False)
            header_signature = hashlib.sha256(signature_src.encode("utf-8")).hexdigest()
            print(f"[csv] headers={headers}")

            # Check metadata for existing table
            rec_meta = await conn.fetchrow(
                "select table_name, columns from csv_metadata where header_signature=$1",
                header_signature,
            )
            if rec_meta:
                table_name = rec_meta["table_name"]
                columns = rec_meta["columns"]
                if not isinstance(columns, list):
                    try:
                        columns = json.loads(columns)
                    except Exception:
                        columns = []
                # Ensure table exists with expected columns
                column_defs_existing = ", ".join([f'"{c}" text' for c in columns])
                await conn.execute(f'create table if not exists "{table_name}" ({column_defs_existing});')
                # Truncate existing table for overwrite
                await conn.execute(f'truncate table "{table_name}"')
                print(f"[csv] reuse table={table_name} (truncate)")
            else:
                # Create new table and record metadata
                columns = [sanitize_identifier(h or f"col_{i}") for i, h in enumerate(headers)]
                base_name = compute_pretty_table_name(file_path)
                table_name = f"{base_name}_{header_signature[:8]}"
                column_defs = ", ".join([f'"{c}" text' for c in columns])
                await conn.execute(f'create table if not exists "{table_name}" ({column_defs});')
                await conn.execute(
                    """
                    insert into csv_metadata (id, header_signature, headers, columns, table_name)
                    values ($1::uuid, $2, $3::jsonb, $4::jsonb, $5)
                    on conflict (header_signature) do update
                    set headers = excluded.headers,
                        columns = excluded.columns,
                        table_name = excluded.table_name,
                        updated_at = now()
                    """,
                    uuid.uuid4(),
                    header_signature,
                    json.dumps(headers, ensure_ascii=False),
                    json.dumps(columns, ensure_ascii=False),
                    table_name,
                )
                print(f"[csv] create table={table_name} columns={columns}")

            rows_imported = 0
            batch_size = 1000
            insert_sql = f'insert into "{table_name}" ({", ".join([f"\"{c}\"" for c in columns])}) values ({", ".join([f"${i+1}" for i in range(len(columns))])})'

            def chunked(iterable, size):
                chunk: List[List[Optional[str]]] = []
                for row in iterable:
                    chunk.append(row)
                    if len(chunk) >= size:
                        yield chunk
                        chunk = []
                if chunk:
                    yield chunk

            with open(file_path, mode="r", encoding=detected_encoding, newline="") as f_sync:
                reader_sync = csv.reader(f_sync)
                next(reader_sync)
                for batch in chunked(reader_sync, batch_size):
                    values_list = []
                    for row in batch:
                        row = [(cell if cell != '' else None) for cell in row]
                        if len(row) < len(columns):
                            row += [None] * (len(columns) - len(row))
                        elif len(row) > len(columns):
                            row = row[:len(columns)]
                        values_list.append(row)
                    await conn.executemany(insert_sql, values_list)
                    rows_imported += len(values_list)

            await conn.execute(
                "update file_uploads set status='imported', dataset_table=$2, rows_imported=$3, updated_at=now() where id=$1",
                uuid.UUID(upload_id),
                table_name,
                rows_imported,
            )
            print(f"[csv] done id={upload_id} table={table_name} rows={rows_imported}")
    except Exception as e:
        try:
            async with db_pool.acquire() as conn:
                await conn.execute(
                    "update file_uploads set status='failed', updated_at=now() where id=$1",
                    uuid.UUID(upload_id),
                )
        except Exception:
            pass
        print(f"CSV import failed: {e}")

async def import_excel_background(upload_id: str, file_path: str) -> None:
    """Import first sheet of an Excel file as text columns."""
    global db_pool
    if not db_pool:
        return
    try:
        async with db_pool.acquire() as conn:
            await ensure_migrations_tables(conn)
            await conn.execute(
                "update file_uploads set status='importing', updated_at=now() where id=$1",
                uuid.UUID(upload_id),
            )

            path_obj = pathlib.Path(file_path)

            # Lazy import to avoid hard dependency unless used
            from openpyxl import load_workbook
            print(f"[xlsx] start id={upload_id} path={file_path}")
            wb = load_workbook(filename=file_path, read_only=True, data_only=True)
            ws = wb.worksheets[0]

            # In read_only mode, worksheet dimensions can default to 'A1' until calculated.
            # Force dimension calculation to ensure iter_rows and max_row/max_column are correct.
            try:
                dimension_str = ws.calculate_dimension(force=True)
                print(f"[xlsx] dimension={dimension_str} max_row={ws.max_row} max_col={ws.max_column}")
            except Exception as e:
                print(f"[xlsx] warn: calculate_dimension failed: {e}")

            # Detect header row by scanning first N rows for max non-empty cells
            def non_empty_count(row_vals):
                return sum(1 for v in row_vals if v is not None and str(v).strip() != "")
            def effective_width(row_vals):
                last_idx = -1
                for idx, v in enumerate(row_vals):
                    if v is not None and str(v).strip() != "":
                        last_idx = idx
                return last_idx + 1
            # For large files, some generators write an incorrect dimension (e.g., A1:A1).
            # Avoid relying on ws.max_row/ws.max_column: read a wide column range and trim trailing empties.
            max_scan_rows = 50
            scanned = list(ws.iter_rows(min_row=1, max_row=max_scan_rows, max_col=1024, values_only=True))

            header_row_index = 1
            header_non_empty = 0
            for idx, row_vals in enumerate(scanned, start=1):
                cnt = non_empty_count(row_vals)
                if cnt > header_non_empty and (cnt >= 2 or header_non_empty == 0):
                    header_row_index = idx
                    header_non_empty = cnt

            header_row = scanned[header_row_index - 1] if scanned else []
            headers = [str(h).strip() if h is not None else "" for h in header_row]
            # Determine the effective number of columns based on non-empty tail trimming
            num_cols = effective_width(header_row)
            print(f"[xlsx] sheet={ws.title} header_row={header_row_index} non_empty={header_non_empty}")
            print(f"[xlsx] headers={headers}")

            if num_cols == 0:
                next_index = header_row_index + 1
                next_rows = list(ws.iter_rows(min_row=next_index, max_row=next_index, max_col=1024, values_only=True))
                first_data = next_rows[0] if next_rows else []
                num_cols = effective_width(first_data)
                headers = [f"col_{i}" for i in range(num_cols)]
                data_start_row = next_index
            else:
                # Ensure headers length matches effective width
                if len(headers) < num_cols:
                    headers = headers + [f"col_{i}" for i in range(len(headers), num_cols)]
                elif len(headers) > num_cols:
                    headers = headers[:num_cols]
                data_start_row = header_row_index + 1

            # Build column names using Pinyin conversion utility
            try:
                import sys as _sys
                _utils_dir = os.path.join(os.path.dirname(__file__), "electronic-industry-agent")
                if _utils_dir not in _sys.path:
                    _sys.path.append(_utils_dir)
                from utils import to_pinyin_list as _to_pinyin_list
            except Exception as e:
                print(f"[xlsx] warn: failed to import to_pinyin_list: {e}")
                def _to_pinyin_list(words, exclude_chars=['%']):
                    # Fallback: sanitize to a safe identifier if pinyin isn't available
                    return [sanitize_identifier(w) for w in words]

            base_names = [h if (h and isinstance(h, str) and h.strip() != "") else f"col_{i}" for i, h in enumerate(headers)]
            computed_columns = _to_pinyin_list(base_names)
            # Ensure final safety for SQL identifiers
            computed_columns = [sanitize_identifier(c) for c in computed_columns]

            # Build a stable header signature to deduplicate by structure
            normalized_headers = [
                (h.strip().lower() if isinstance(h, str) else str(h).strip().lower()) for h in headers
            ]
            signature_src = json.dumps(normalized_headers, ensure_ascii=False)
            header_signature = hashlib.sha256(signature_src.encode("utf-8")).hexdigest()

            # Try find existing metadata to reuse table
            rec_meta = await conn.fetchrow(
                "select table_name, columns from csv_metadata where header_signature=$1",
                header_signature,
            )
            if rec_meta:
                table_name = rec_meta["table_name"]
                columns = rec_meta["columns"]
                if not isinstance(columns, list):
                    try:
                        columns = json.loads(columns)
                    except Exception:
                        columns = []
                column_defs_existing = ", ".join([f'"{c}" text' for c in columns])
                await conn.execute(f'create table if not exists "{table_name}" ({column_defs_existing});')
                await conn.execute(f'truncate table "{table_name}"')
                print(f"[xlsx] reuse table={table_name} (truncate)")
            else:
                columns = computed_columns
                base_name = compute_pretty_table_name(file_path)
                table_name = f"{base_name}_{header_signature[:8]}"
                column_defs = ", ".join([f'"{c}" text' for c in columns])
                await conn.execute(f'create table if not exists "{table_name}" ({column_defs});')
                await conn.execute(
                    "insert into csv_metadata (id, header_signature, headers, columns, table_name) values ($1::uuid, $2, $3::jsonb, $4::jsonb, $5)",
                    uuid.uuid4(),
                    header_signature,
                    json.dumps(headers, ensure_ascii=False),
                    json.dumps(columns, ensure_ascii=False),
                    table_name,
                )
                print(f"[xlsx] create table={table_name} columns={columns}")

            insert_sql = f'insert into "{table_name}" ({", ".join([f"\"{c}\"" for c in columns])}) values ({", ".join([f"${i+1}" for i in range(len(columns))])})'

            def chunked_rows(iterator, size):
                chunk: List[List[Optional[str]]] = []
                for row in iterator:
                    chunk.append(row)
                    if len(chunk) >= size:
                        yield chunk
                        chunk = []
                if chunk:
                    yield chunk

            rows_imported = 0
            batch_size = 1000

            def normalize_row(row_tuple):
                row_list = [
                    (str(cell).strip() if cell is not None and str(cell).strip() != "" else None)
                    for cell in row_tuple
                ]
                if all(v is None for v in row_list):
                    return None
                if len(row_list) < len(columns):
                    row_list += [None] * (len(columns) - len(row_list))
                elif len(row_list) > len(columns):
                    row_list = row_list[:len(columns)]
                return row_list

            # Iterate rows with explicit max_col to bypass incorrect worksheet dimensions
            data_rows_iter = ws.iter_rows(min_row=data_start_row, max_col=len(columns), values_only=True)
            normalized_iter = (normalize_row(r) for r in data_rows_iter)
            filtered_iter = (r for r in normalized_iter if r is not None)

            preview = []
            for _ in range(2):
                try:
                    nxt = next(filtered_iter)
                    preview.append(nxt)
                except StopIteration:
                    break
            if preview:
                print(f"[xlsx] sample_row_1={preview[0]}")
                if len(preview) > 1:
                    print(f"[xlsx] sample_row_2={preview[1]}")

            async with db_pool.acquire() as conn2:
                if preview:
                    await conn2.executemany(insert_sql, preview)
                    rows_imported += len(preview)
                for batch in chunked_rows(filtered_iter, batch_size):
                    await conn2.executemany(insert_sql, batch)
                    rows_imported += len(batch)

            await conn.execute(
                "update file_uploads set status='imported', dataset_table=$2, rows_imported=$3, updated_at=now() where id=$1",
                uuid.UUID(upload_id),
                table_name,
                rows_imported,
            )
            print(f"[xlsx] done id={upload_id} table={table_name} rows={rows_imported}")
            try:
                wb.close()
            except Exception:
                pass
    except Exception as e:
        try:
            async with db_pool.acquire() as conn:
                await conn.execute(
                    "update file_uploads set status='failed', updated_at=now() where id=$1",
                    uuid.UUID(upload_id),
                )
        except Exception:
            pass
        print(f"Excel import failed: {e}")


# LLM clients
class OpenAIClient:
    """OpenAI API client"""
    
    def __init__(self):
        if not OPENAI_API_KEY:
            raise ValueError("未配置OpenAI API密钥。请在环境变量中设置OPENAI_API_KEY。")
    
    async def generate(self, prompt: str) -> str:
        """Generate response from OpenAI API"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    OPENAI_API_ENDPOINT,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {OPENAI_API_KEY}"
                    },
                    json={
                        "model": OPENAI_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.1
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"OpenAI API Error: {str(e)}")
    
    async def generate_stream(self, prompt: str) -> AsyncGenerator[str, None]:
        """Generate streaming response from OpenAI API"""
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream(
                    "POST",
                    OPENAI_API_ENDPOINT,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {OPENAI_API_KEY}"
                    },
                    json={
                        "model": OPENAI_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.1,
                        "stream": True
                    }
                ) as response:
                    response.raise_for_status()
                    
                    buffer = ""
                    async for chunk in response.aiter_text():
                        buffer += chunk
                        lines = buffer.split("\n")
                        buffer = lines.pop()
                        
                        for line in lines:
                            if line.startswith("data: "):
                                data = line[6:]
                                if data == "[DONE]":
                                    return
                                
                                try:
                                    parsed = json.loads(data)
                                    content = parsed.get("choices", [{}])[0].get("delta", {}).get("content")
                                    if content:
                                        yield content
                                except json.JSONDecodeError:
                                    continue
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"OpenAI API Error: {str(e)}")

class GeminiClient:
    """Gemini API client"""
    
    def __init__(self):
        if not GEMINI_API_KEY:
            raise ValueError("未配置Gemini API密钥。请在环境变量中设置GEMINI_API_KEY。")
    
    async def generate(self, prompt: str) -> str:
        """Generate response from Gemini API"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{GEMINI_ENDPOINT}?key={GEMINI_API_KEY}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.1}
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")
    
    async def generate_stream(self, prompt: str) -> AsyncGenerator[str, None]:
        """Generate streaming response from Gemini API (simulated)"""
        # Note: Gemini doesn't have true streaming, so we simulate it
        content = await self.generate(prompt)
        
        # Split content into chunks and yield with small delays
        chunks = list(content)
        for chunk in chunks:
            yield chunk
            await asyncio.sleep(0.01)  # Small delay to simulate streaming

class DeepSeekClient:
    """DeepSeek API client (OpenAI-compatible chat completions)."""
    
    def __init__(self):
        if not DEEPSEEK_API_KEY:
            raise ValueError("未配置DeepSeek API密钥。请在环境变量中设置DEEPSEEK_API_KEY。")
    
    async def generate(self, prompt: str) -> str:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    DEEPSEEK_API_ENDPOINT,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
                    },
                    json={
                        "model": DEEPSEEK_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.1
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"DeepSeek API Error: {str(e)}")
    
    async def generate_stream(self, prompt: str) -> AsyncGenerator[str, None]:
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream(
                    "POST",
                    DEEPSEEK_API_ENDPOINT,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
                    },
                    json={
                        "model": DEEPSEEK_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.1,
                        "stream": True
                    }
                ) as response:
                    response.raise_for_status()
                    
                    buffer = ""
                    async for chunk in response.aiter_text():
                        buffer += chunk
                        lines = buffer.split("\n")
                        buffer = lines.pop()
                        
                        for line in lines:
                            if line.startswith("data: "):
                                data = line[6:]
                                if data == "[DONE]":
                                    return
                                try:
                                    parsed = json.loads(data)
                                    content = parsed.get("choices", [{}])[0].get("delta", {}).get("content")
                                    if content:
                                        yield content
                                except json.JSONDecodeError:
                                    continue
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"DeepSeek API Error: {str(e)}")

# API endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Electronic Industry Agent Backend", "version": "1.0.0"}

@app.post("/api/call-llm")
async def call_llm(request: LLMRequest):
    """Return fixed SQL templates based on intent recognition (no free-form generation)."""
    try:
        if not request.userInput:
            raise HTTPException(status_code=400, detail="缺少用户输入")
        intent_sql = build_sql_for_intent(request.userInput)
        print(f"[LLM] input={request.userInput} -> intent={intent_sql.get('task')} sql_len={len(intent_sql.get('sql', ''))}")
        return {"sql": intent_sql.get("sql", "")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM处理错误: {str(e)}")

@app.post("/api/call-llm-stream")
async def call_llm_stream(request: LLMStreamRequest):
    """Stream fixed SQL template chunks based on intent (UTF-8 JSON, unescaped)."""

    async def generate_stream():
        try:
            if not request.userInput:
                yield f"data: {json.dumps({'error': '缺少用户输入'}, ensure_ascii=False)}\n\n"
                return

            intent_sql = build_sql_for_intent(request.userInput)
            task = intent_sql.get("task")
            sql_text = intent_sql.get("sql", "")
            print(f"[LLM-STREAM] input={request.userInput} -> intent={task} sql_len={len(sql_text)}")
            thinking_part = f"识别任务: {task}"
            params = intent_sql.get("params", {})

            # Send thinking first
            yield f"data: {json.dumps({'thinking': thinking_part, 'sql': '', 'isComplete': False, 'params': params}, ensure_ascii=False)}\n\n"

            # Stream SQL in chunks
            chunk_size = 200
            for i in range(0, len(sql_text), chunk_size):
                partial_sql = sql_text[: i + chunk_size]
                payload = {"thinking": thinking_part, "sql": partial_sql, "isComplete": False, "params": params}
                yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

            # Completion
            yield f"data: {json.dumps({'thinking': thinking_part, 'sql': sql_text, 'isComplete': True, 'params': params}, ensure_ascii=False)}\n\n"

        except Exception as e:
            error_data = {"error": str(e)}
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

@app.post("/api/intent/recognize", response_model=IntentResponse)
async def recognize_intent(request: IntentRequest):
    """Simple rule-based intent recognition for OLT统计 and FTTR鉴别."""
    text = (request.text or "").strip().lower()
    tasks: List[IntentTask] = []
    # OLT统计: keywords
    if ("olt" in text) and ("统计" in request.text or "低效" in request.text or "数量" in request.text or "数" in request.text):
        tasks.append(IntentTask(type="OLT_STATISTICS", params={}))
    # FTTR鉴别
    if ("fttr" in text) or ("分光" in request.text) or ("二级分光" in request.text) or ("onu" in text):
        params: Dict[str, Any] = {}
        erji = extract_erji_fenguang_name(request.text)
        if erji:
            params["erjiFenGuang"] = erji
        tasks.append(IntentTask(type="FTTR_CHECK", params=params))
    if not tasks:
        # default: try both, frontend can choose
        tasks = [IntentTask(type="OLT_STATISTICS", params={}), IntentTask(type="FTTR_CHECK", params={})]
    return {"tasks": tasks}

@app.post("/api/sql-query")
async def execute_sql_query(request: SQLQueryRequest):
    """Execute SQL query"""
    global db_pool
    
    if not db_pool:
        raise HTTPException(status_code=500, detail="数据库连接不可用")
    
    try:
        if not request.sql:
            raise HTTPException(status_code=400, detail="缺少SQL查询语句")
        
        # Clean and validate SQL
        cleaned_sql = clean_sql_query(request.sql)
        
        if not cleaned_sql:
            raise HTTPException(status_code=400, detail="SQL查询语句为空")
        
        validation = validate_sql_query(cleaned_sql)
        if not validation["isValid"]:
            raise HTTPException(status_code=400, detail=validation.get("error", "SQL查询语句无效"))
        
        # Execute query
        async with db_pool.acquire() as connection:
            try:
                result = await connection.fetch(cleaned_sql)
                
                # Convert result to list of dictionaries
                data = []
                for row in result:
                    row_dict = dict(row)
                    data.append(serialize_db_result(row_dict))
                
                return data
            
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"SQL查询错误: {str(e)}")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理请求时发生错误: {str(e)}")

@app.post("/api/sql-query/export", response_model=SQLExportResponse)
async def export_sql_query(request: SQLQueryRequest):
    """Execute a SQL query and export full result to Excel, return download info."""
    global db_pool
    if not db_pool:
        raise HTTPException(status_code=500, detail="数据库连接不可用")
    if not request.sql:
        raise HTTPException(status_code=400, detail="缺少SQL查询语句")
    cleaned_sql = clean_sql_query(request.sql)
    validation = validate_sql_query(cleaned_sql)
    if not validation["isValid"]:
        raise HTTPException(status_code=400, detail=validation.get("error", "SQL查询语句无效"))
    print("[SQL-EXPORT] executing export for SQL len=", len(cleaned_sql))
    rows = await execute_query_dicts(cleaned_sql)
    export = await export_rows_to_excel(rows, base_filename="查询结果")
    print(f"[SQL-EXPORT] rows={len(rows)} file={export['filename']}")
    return {
        "fileId": export["id"],
        "filename": export["filename"],
        "downloadUrl": f"/api/files/download/{export['id']}",
        "rowCount": len(rows),
    }

@app.post("/api/tasks/olt-statistics", response_model=OLTStatisticsResponse)
async def task_olt_statistics():
    """Execute OLT统计 query, export to Excel, return preview and download link."""
    sql = (
        "with OLT_and_OLT_yonghu as (\n"
        "    SELECT distinct suo_shu_qu_xian, suo_shu_ji_fang_zi_yuan_dian,\n"
        "    COUNT(*) OVER (PARTITION BY suo_shu_ji_fang_zi_yuan_dian) AS ji_fang_count,\n"
        "    SUM(CAST(onu_shu_liang as integer)) OVER (PARTITION BY suo_shu_ji_fang_zi_yuan_dian) AS yonghu_liang\n"
        "    FROM \"zi_guan_-_olt_68131c82\"\n"
        ")\n"
        "SELECT *, CASE WHEN ji_fang_count - CEILING(COALESCE(yonghu_liang, 0) / 4500.0) < 0 THEN 0 ELSE ji_fang_count - CEILING(COALESCE(yonghu_liang, 0) / 4500.0) END AS dixiao_OLT_taishu\n"
        "FROM OLT_and_OLT_yonghu;"
    )
    print("[TASK][OLT-STAT] executing SQL")
    rows = await execute_query_dicts(sql)
    preview = rows[:5]
    export = await export_rows_to_excel(rows, base_filename="OLT统计")
    print(f"[TASK][OLT-STAT] rows={len(rows)} file={export['filename']}")
    return {
        "preview": preview,
        "fileId": export["id"],
        "filename": export["filename"],
        "downloadUrl": f"/api/files/download/{export['id']}",
        "rowCount": len(rows),
    }

@app.post("/api/tasks/fttr-check", response_model=FTTRCheckResponse)
async def task_fttr_check(request: FTTRCheckRequest):
    """FTTR鉴别：基于二级分光器或ONU名称。"""
    erji = (request.erjiFenGuang or "").strip()
    onu = (request.onuMingCheng or "").strip()
    if not erji and not onu:
        raise HTTPException(status_code=400, detail="请提供二级分光器名称或ONU名称")

    if onu:
        sql = (
            "select C.onu_ming_cheng,\n"
            "       A.fen_guang_qi_ming_cheng as erji_fen_guang,\n"
            "       A.fen_guang_qi_ji_bie,\n"
            "       B.fen_guang_qi_ming_cheng as yiji_fen_guang,\n"
            "       A.shang_lian_she_bei_zhu_yong_duan_kou,\n"
            "       A.shang_lian_she_bei_zhu_yong_duan_kou ~ 'CG' as fenguangqi_support_open_FTTR,\n"
            "       C.zhong_duan_lei_xing,\n"
            "       C.zhong_duan_lei_xing in ('V176-20', 'HN8145XR', 'HG3142F', 'ZXHN G7611 V2', 'V175', 'V173', 'UNF130Z') as single_ONU_support_fttr\n"
            "from  \"yue_ri_wang_guan_onu_zai_xian_qing_dan_4f929071\" C\n"
            "join \"zi_guan_-_onu_guang_mao_yong_hu_d88a2209\" D on C.onu_ming_cheng = D.xin_zeng_onu\n"
            "left join     \"zi_guan_-_fen_guang_qi_763b860d\" A on A.fen_guang_qi_ming_cheng = D.jie_ru_she_bei_ming_cheng\n"
            "left join \"zi_guan_-_fen_guang_qi_763b860d\" B on B.fen_guang_qi_ming_cheng = A.shang_lian_fen_guang_qi\n"
            "where A.fen_guang_qi_ji_bie = '二级分光' and C.onu_ming_cheng = $1\n"
        )
        print(f"[TASK][FTTR][ONU] onu={onu} executing SQL")
        rows = await execute_query_dicts(sql, [onu])
        base_name = f"FTTR鉴别_ONU_{onu}"
    else:
        sql = (
            "select A.fen_guang_qi_ming_cheng as erji_fen_guang, A.fen_guang_qi_ji_bie, B.fen_guang_qi_ming_cheng as yiji_fen_guang, A.shang_lian_she_bei_zhu_yong_duan_kou, A.shang_lian_she_bei_zhu_yong_duan_kou ~ 'CG' as support_open_FTTR\n"
            "from \"zi_guan_-_fen_guang_qi_763b860d\" A left join \"zi_guan_-_fen_guang_qi_763b860d\" B on B.fen_guang_qi_ming_cheng = A.shang_lian_fen_guang_qi\n"
            "where A.fen_guang_qi_ji_bie = '二级分光' and A.fen_guang_qi_ming_cheng = $1\n"
        )
        print(f"[TASK][FTTR][FGQ] erji={erji} executing SQL")
        rows = await execute_query_dicts(sql, [erji])
        base_name = f"FTTR鉴别_二级分光_{erji}"

    preview = rows[:5]
    export = await export_rows_to_excel(rows, base_filename=base_name)
    print(f"[TASK][FTTR] rows={len(rows)} file={export['filename']}")
    return {
        "preview": preview,
        "fileId": export["id"],
        "filename": export["filename"],
        "downloadUrl": f"/api/files/download/{export['id']}",
        "rowCount": len(rows),
    }

@app.get("/api/files/download/{file_id}")
async def download_file(file_id: str):
    """Download a generated/uploaded file by id."""
    global db_pool
    if not db_pool:
        raise HTTPException(status_code=500, detail="数据库连接不可用")
    try:
        async with db_pool.acquire() as conn:
            rec = await conn.fetchrow("select filename, path, content_type from file_uploads where id=$1", uuid.UUID(file_id))
            if not rec:
                raise HTTPException(status_code=404, detail="未找到文件")
            filename = rec["filename"]
            path = rec["path"]
            content_type = rec["content_type"] or "application/octet-stream"
            if not os.path.exists(path):
                raise HTTPException(status_code=404, detail="文件不存在或已删除")
            return FileResponse(path=path, media_type=content_type, filename=filename)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"下载失败: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "disconnected"
    }
    
    if db_pool:
        try:
            async with db_pool.acquire() as connection:
                await connection.fetchval("SELECT 1")
                status["database"] = "connected"
        except Exception:
            status["database"] = "error"
    
    return status

# File upload & listing endpoints
@app.post("/api/files/upload")
async def upload_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    global db_pool
    if not db_pool:
        raise HTTPException(status_code=500, detail="数据库连接不可用")
    try:
        storage_dir = get_storage_dir()
        upload_id = str(uuid.uuid4())
        target_path = os.path.join(storage_dir, f"{upload_id}_{file.filename}")

        size_bytes = 0
        async with aiofiles.open(target_path, 'wb') as out:
            while True:
                chunk = await file.read(1024 * 1024 * 4)  # 4MB chunks
                if not chunk:
                    break
                size_bytes += len(chunk)
                await out.write(chunk)
        # Minimal upload log
        print(f"[upload] id={upload_id} name={file.filename} type={file.content_type} size={size_bytes} path={target_path}")

        async with db_pool.acquire() as conn:
            await ensure_migrations_tables(conn)
            await conn.execute(
                "insert into file_uploads (id, filename, path, size_bytes, content_type, status) values ($1, $2, $3, $4, $5, 'uploaded')",
                uuid.UUID(upload_id), file.filename, target_path, size_bytes, file.content_type
            )

        if (file.content_type and 'csv' in (file.content_type or '').lower()) or file.filename.lower().endswith('.csv'):
            print(f"[upload] scheduling csv import id={upload_id}")
            background_tasks.add_task(import_csv_background, upload_id, target_path)
        elif file.filename.lower().endswith(('.xlsx', '.xls')):
            print(f"[upload] scheduling excel import id={upload_id}")
            background_tasks.add_task(import_excel_background, upload_id, target_path)
        else:
            print(f"[upload] no import scheduled id={upload_id} name={file.filename}")
        return {"id": upload_id, "filename": file.filename, "size": size_bytes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件上传失败: {str(e)}")

@app.get("/api/files")
async def list_files():
    global db_pool
    if not db_pool:
        raise HTTPException(status_code=500, detail="数据库连接不可用")
    try:
        async with db_pool.acquire() as conn:
            await ensure_migrations_tables(conn)
            rows = await conn.fetch(
                "select id::text as id, filename, size_bytes, content_type, status, dataset_table, rows_imported, created_at from file_uploads order by created_at desc"
            )
            return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取文件列表失败: {str(e)}")

@app.post("/api/files/import/{upload_id}")
async def trigger_import(upload_id: str, background_tasks: BackgroundTasks):
    global db_pool
    if not db_pool:
        raise HTTPException(status_code=500, detail="数据库连接不可用")
    try:
        async with db_pool.acquire() as conn:
            rec = await conn.fetchrow("select path, status from file_uploads where id=$1", uuid.UUID(upload_id))
            if not rec:
                raise HTTPException(status_code=404, detail="未找到上传记录")
            if rec["status"] in ("importing", "imported"):
                return {"message": "已在导入中或已完成"}
            file_path = rec["path"]
            print(f"[import] id={upload_id} name={file_path}")
            suffix = pathlib.Path(file_path).suffix.lower()
            if suffix == ".csv":
                print(f"[import] manual schedule csv id={upload_id}")
                background_tasks.add_task(import_csv_background, upload_id, file_path)
            elif suffix in (".xlsx", ".xls"):
                print(f"[import] manual schedule excel id={upload_id}")
                background_tasks.add_task(import_excel_background, upload_id, file_path)
            else:
                await conn.execute(
                    "update file_uploads set status='failed', updated_at=now() where id=$1",
                    uuid.UUID(upload_id),
                )
                raise HTTPException(status_code=400, detail="仅支持导入CSV或Excel文件")
            return {"message": "已触发导入"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"触发导入失败: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
