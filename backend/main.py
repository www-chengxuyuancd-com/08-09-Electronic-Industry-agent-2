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

import asyncpg
import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
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

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai")

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
    modelType: str = Field(default="openai", description="LLM model type")

class SQLQueryRequest(BaseModel):
    sql: str = Field(..., description="SQL query to execute")

class LLMStreamRequest(BaseModel):
    userInput: str = Field(..., description="User input for streaming LLM")

class ErrorResponse(BaseModel):
    success: bool = False
    error: Dict[str, str]

class SuccessResponse(BaseModel):
    sql: str

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

def build_sql_prompt(user_input: str) -> str:
    """Build SQL generation prompt"""
    return f"""
你是一个 SQL 专家，请将以下自然语言查询转换为 SQL 语句：

用户需求: {user_input}

请只返回有效的 SQL 语句，不需要解释。SQL语句必须是PostgreSQL兼容的。
重要：不要包含任何代码块标记（如```或```sql），不要包含任何注释或解释，只返回SQL语句本身。

数据库表结构如下:
{DB_SCHEMA}
"""

def build_thinking_prompt(user_input: str) -> str:
    """Build thinking prompt for streaming LLM"""
    return f"""
你是一个 SQL 专家，请将以下自然语言查询转换为 SQL 语句。

请按照以下格式回答：

1. 首先分析用户需求（思考过程）
2. 然后提供最终的 SQL 语句

用户需求: {user_input}

请先分析这个需求，思考需要查询哪些表和字段，然后生成对应的 SQL 语句。

数据库表结构如下:
{DB_SCHEMA}

输出的SQL参考如下：
{SQL_PROMPT}

请按照以下格式回答：
思考过程：[详细分析用户需求，确定需要的表和字段]
SQL语句：[最终的PostgreSQL兼容SQL语句]
"""

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

# API endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Electronic Industry Agent Backend", "version": "1.0.0"}

@app.post("/api/call-llm")
async def call_llm(request: LLMRequest):
    """Call LLM for SQL generation"""
    try:
        if not request.userInput:
            raise HTTPException(status_code=400, detail="缺少用户输入")
        
        if not request.modelType:
            raise HTTPException(status_code=400, detail="缺少模型类型")
        
        # Choose LLM client based on model type
        if request.modelType == "gemini":
            client = GeminiClient()
        else:
            client = OpenAIClient()
        
        # Build prompt and generate SQL
        prompt = build_sql_prompt(request.userInput)
        sql_result = await client.generate(prompt)
        
        return {"sql": sql_result}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM处理错误: {str(e)}")

@app.post("/api/call-llm-stream")
async def call_llm_stream(request: LLMStreamRequest):
    """Call LLM with streaming response"""
    
    async def generate_stream():
        try:
            if not request.userInput:
                yield f"data: {json.dumps({'error': '缺少用户输入'})}\n\n"
                return
            
            prompt = build_thinking_prompt(request.userInput)
            
            # Choose LLM client based on environment
            if LLM_PROVIDER == "gemini":
                client = GeminiClient()
            else:
                client = OpenAIClient()
            
            full_response = ""
            thinking_part = ""
            sql_part = ""
            is_in_sql_section = False
            
            async for chunk in client.generate_stream(prompt):
                full_response += chunk
                
                # Check if we've entered the SQL section
                if "SQL语句：" in full_response:
                    is_in_sql_section = True
                    parts = full_response.split("SQL语句：")
                    thinking_part = parts[0].replace("思考过程：", "").strip()
                    sql_part = parts[1] if len(parts) > 1 else ""
                elif not is_in_sql_section:
                    thinking_part = full_response.replace("思考过程：", "").strip()
                else:
                    sql_part += chunk
                
                # Send current state
                data = {
                    "thinking": thinking_part,
                    "sql": sql_part.strip(),
                    "isComplete": False
                }
                
                yield f"data: {json.dumps(data)}\n\n"
            
            # Send completion state
            final_data = {
                "thinking": thinking_part,
                "sql": sql_part.strip(),
                "isComplete": True
            }
            
            yield f"data: {json.dumps(final_data)}\n\n"
            
        except Exception as e:
            error_data = {"error": str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
