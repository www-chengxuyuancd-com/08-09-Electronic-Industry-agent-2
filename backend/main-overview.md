## main.py 概览（简要）

这是一套基于 FastAPI 的后端，整合了数据库访问、文件导入/导出、LLM（OpenAI/Gemini/DeepSeek）调用、业务意图识别与任务执行。下面按模块粗略分块描述代码结构与职责。

### 启动与配置

- 读取环境变量（数据库/LLM 配置、HTTP 超时与重试等）。
- 应用生命周期 `lifespan`：启动时创建 `asyncpg` 连接池，关闭时释放。
- CORS 配置，允许本地与常见局域网段访问。

### 数据模型（Pydantic）

- 定义请求/响应模型：例如 `LLMRequest`、`SQLQueryRequest`、`IntentRequest/Response`、`FTTRCheckRequest/Response`、`OLTStatisticsResponse` 等。
- 这些模型用于入参校验与自动文档。

### 基础工具函数

- SQL 清洗与校验：移除 markdown 包装，只允许只读查询（SELECT/WITH）。
- 结果序列化：将 `datetime` 等类型转为可 JSON 化格式。
- 通用查询封装：`execute_query_dicts` 基于连接池执行并返回字典列表。

### 文件存储与元数据

- 统一文件目录 `electronic-industry-agent/files`。
- 内部元表：`file_uploads`（登记上传/生成文件）、`csv_metadata`（存放结构签名与列信息）。
- 下载接口根据 `file_uploads` 记录安全返回本地文件。

### 表结构保障与批量读写

- `ensure_target_table`/`get_existing_columns`：确保目标表存在并补齐缺失列。
- 批量插入/更新/删除封装（`bulk_insert_rows`、`bulk_update_rows_by_keys`、`delete_row_by_keys`）。

### CSV/Excel 解析与导入

- CSV：编码探测、标准化表头、列名清洗为安全标识符；按批导入。
- Excel：自动识别表头行与有效列宽，列名转拼音/清洗；按批导入。
- 支持重用同结构表：通过表头“结构签名”复用或创建数据表，必要时截断重导。
- 导入过程会更新 `file_uploads` 状态并记录导入行数。

### 数据集差异对比上传（diff-upload）

- 接收上传文件，解析为行，按配置的唯一键与库内键集合对比，分类为“新增/更新”。
- 批量写回新增与更新；默认不处理删除（固定返回 0）。
- 生成差异 Excel 并登记到 `file_uploads`，返回下载信息。
- 针对 `jiake_yewu_xinxi` 有专项“修正对齐 + 三表导出（错误行、修改前、修改后高亮）”。

### LLM 客户端与意图识别

- 三种客户端：OpenAI、Gemini、DeepSeek，统一 `generate` 与（真/伪）流式 `generate_stream` 行为。
- 基于提示词输出严格 JSON 的意图识别（任务类型：`OLT_STATISTICS`、`FTTR_CHECK`），并做健壮性清洗。

### 任务模板与 SQL 生成

- 预置 OLT 统计与 FTTR 鉴别的 SQL 模板（支持按二级分光器或 ONU 名称查询）。
- 对 FTTR：当目标不支持 CG 口时，基于机房二次聚合推荐同机房可行分光器。

### API 接口（主要）

- 健康检查：`/health` 返回服务与数据库状态。
- LLM：`/api/call-llm` 返回模板 SQL；`/api/call-llm-stream` 流式输出“思考 + SQL 片段”。
- 意图：`/api/intent/recognize` 只识别；`/api/intent/execute` 直接识别并执行对应任务。
- SQL：`/api/sql-query` 只读查询执行并补充实体推断与推荐；`/api/sql-query/export` 导出查询结果为 Excel。
- 任务：`/api/tasks/olt-statistics`、`/api/tasks/fttr-check`。
- 文件：`/api/files/upload`（自动调度 CSV/Excel 后台导入）、`/api/files/import/{id}`（手动触发）、`/api/files`（列表）、`/api/files/download/{id}`（下载）。

### 错误处理与日志

- API 层统一抛出 `HTTPException`，错误信息包含类型与简要上下文。
- 关键路径打印简要日志（导入计数、批处理进度、导出信息、意图识别结果等）。

### 运行

- 模块作为脚本执行时使用 `uvicorn` 启动：`0.0.0.0:8000`。
