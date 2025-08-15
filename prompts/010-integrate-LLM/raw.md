## 需求

本需求主要是提供一个 API，根据用户输入的文本，调用大模型 API，结合我自己的 prompt，将问题转化为 sql，并填充在之前的 sql text 中

## API 定义

- method: POST
- path: /call-llm
- request body:
  - 用户输入的 text
- response body:
  - sql text

## 如何调用大模型 API

- 需要提供两种调用方式
  - 按照 openai 调用的风格，让我输入调用的模型地址，模型类型，API Key
  - 按照 gemini 的方式

## 创建前端客户端实现

在原来的 /demo/query 页面提供一个新输入框，用户输入之后，调用后端 API，后端 API 调用大模型返回 SQL
