const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

/**
 * AI 助手转发路由
 *
 * 为什么必须走后端而不是前端直连 DeepSeek：
 *   1. DeepSeek 官方 API 不允许浏览器直连（同源策略会拦，报 No 'Access-Control-Allow-Origin'）；
 *   2. API Key 一旦打进前端 bundle，任何访问站点的人都能扒出来刷你的额度。
 * 走这里之后：key 只存在服务端，且请求会经过 app.js 里那层 expressJwt ——
 * 只要 /v1/ai/* 不进白名单，就只有登录用户能调用。
 */

// config/ 整个目录都在 .gitignore 里，key 不会进仓库
const CONFIG_PATH = path.join(__dirname, "..", "config", "ai-config.json");

const DEFAULT_CONFIG = {
  apiKey: "",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-flash",
  // 全量写入方案下输出可能和输入一样长（整篇重写），4096 会把长文截断成半截，
  // 所以给到 32K。max_tokens 是上限不是目标，写短了不会多花钱。
  maxTokens: 32768,
  temperature: 1.0
};

/**
 * 读配置。文件不存在或格式坏了就自动落一份默认配置，
 * 省得用户还要自己照着文档新建文件 —— 建好之后直接填 apiKey 就行。
 */
function readConfig() {
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    return { ...DEFAULT_CONFIG, ...raw };
  } catch (err) {
    try {
      fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
    } catch (_) {
      // 写不了就算了，用内存里的默认值继续跑
    }
    return { ...DEFAULT_CONFIG };
  }
}

/** 落盘。失败要如实报错，不然用户以为存上了其实没存 */
function writeConfig(cfg) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf-8");
}

/**
 * 打码。前端只需要知道「配了没、配的是哪一把」，
 * 绝不能把完整 key 回吐给浏览器 —— 那样等于把 key 又暴露回前端了。
 */
function maskKey(key) {
  if (!key) return "";
  if (key.length <= 8) return "****";
  return `${key.slice(0, 3)}****${key.slice(-4)}`;
}

// 前端用它判断后端有没有配好 key，好在界面上给出提示而不是直接报错
router.get("/ai/status", (req, res) => {
  const cfg = readConfig();
  res.send({
    status: 200,
    configured: Boolean(cfg.apiKey),
    model: cfg.model,
    baseUrl: cfg.baseUrl,
    apiKeyMasked: maskKey(cfg.apiKey)
  });
});

/**
 * 保存配置。支持前端改 key，省得每次都要手动编辑 json 再重启后端。
 *
 * 约定：只有「显式传了非空值」的字段才会被覆盖。
 * 这样用户单独改 baseUrl 时不会把已有的 key 清空；
 * 想删 key 就传 clear: true。
 */
router.post("/ai/config", (req, res) => {
  const { apiKey, baseUrl, model, maxTokens, temperature, clear } = req.body || {};
  const cfg = readConfig();

  if (clear === true) {
    cfg.apiKey = "";
  } else if (typeof apiKey === "string" && apiKey.trim()) {
    cfg.apiKey = apiKey.trim();
  }
  if (typeof baseUrl === "string" && baseUrl.trim()) {
    cfg.baseUrl = baseUrl.trim().replace(/\/+$/, "");
  }
  if (typeof model === "string" && model.trim()) {
    cfg.model = model.trim();
  }
  if (typeof maxTokens === "number" && maxTokens > 0) {
    cfg.maxTokens = Math.floor(maxTokens);
  }
  if (typeof temperature === "number" && temperature >= 0) {
    cfg.temperature = temperature;
  }

  try {
    writeConfig(cfg);
  } catch (err) {
    return res.status(500).send({ status: 500, message: `写入配置失败：${err.message}` });
  }

  res.send({
    status: 200,
    message: cfg.apiKey ? "已保存" : "已清除",
    configured: Boolean(cfg.apiKey),
    model: cfg.model,
    apiKeyMasked: maskKey(cfg.apiKey)
  });
});

/**
 * 校验 key。发一个 max_tokens=1 的最小请求探一下，
 * 这样用户能在「保存前」就知道 key 对不对，而不是保存完再去试对话、对着报错猜。
 * 传了 apiKey 就校验传进来的那把（未保存也能测），否则测已保存的。
 */
router.post("/ai/verify", async (req, res) => {
  const cfg = readConfig();
  const incoming = req.body && typeof req.body.apiKey === "string" ? req.body.apiKey.trim() : "";
  const key = incoming || cfg.apiKey;

  if (!key) {
    return res.status(400).send({ status: 400, message: "还没填 API Key" });
  }

  try {
    const upstream = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
        stream: false
      })
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return res.status(upstream.status).send({
        status: upstream.status,
        message: `Key 校验失败（HTTP ${upstream.status}）`,
        detail: detail.slice(0, 300)
      });
    }

    res.send({ status: 200, message: "Key 有效" });
  } catch (err) {
    res.status(502).send({ status: 502, message: `连接 ${cfg.baseUrl} 失败：${err.message}` });
  }
});

/**
 * 对话 / 改写。messages 由前端组装（含系统提示词、编辑器正文上下文），
 * 这里只负责补上 model、max_tokens 并把请求转发给 DeepSeek。
 * 模型名由服务端决定，前端不能指定，避免被改成贵的档位。
 */
router.post("/ai/chat", async (req, res) => {
  const cfg = readConfig();

  if (!cfg.apiKey) {
    return res.status(400).send({
      status: 400,
      message: "还没配置 DeepSeek API Key，点 AI 面板右上角的设置按钮填一下"
    });
  }

  const { messages, stream = true, temperature, tools, thinking } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).send({ status: 400, message: "messages 不能为空" });
  }

  const useStream = Boolean(stream);
  const payload = {
    model: cfg.model,
    messages,
    stream: useStream,
    max_tokens: cfg.maxTokens,
    temperature: typeof temperature === "number" ? temperature : cfg.temperature
  };

  // 深度思考开关。前端传 boolean，这里翻译成 DeepSeek 的两个字段：
  // thinking.type 是总开关，reasoning_effort 决定强度。
  // 两个都给，是因为只给一个时另一个会取默认值 —— 而 reasoning_effort 默认是 high，
  // 那等于「关不掉」，会静默地把用户的意图覆盖掉。
  if (typeof thinking === "boolean") {
    payload.thinking = { type: thinking ? "enabled" : "disabled" };
    payload.reasoning_effort = thinking ? "high" : "none";
  }

  // 工具调用（function calling）：前端定义「覆写全文」「插入第 N 段后」这些动作，
  // 这里原样透传给 DeepSeek，由模型决定要不要动手。
  if (Array.isArray(tools) && tools.length > 0) {
    payload.tools = tools;
    // tool_choice 写死 auto：DeepSeek 在思考模式下不接受 required 或指定具体 tool，
    // 传了会直接 400。auto 让模型自己判断该答话还是该动手。
    payload.tool_choice = "auto";
  }

  let upstream;
  try {
    upstream = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    return res.status(502).send({
      status: 502,
      message: `连接 DeepSeek 失败：${err.message}`
    });
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return res.status(upstream.status).send({
      status: upstream.status,
      message: `DeepSeek 返回 ${upstream.status}`,
      detail: detail.slice(0, 500)
    });
  }

  // 非流式：一次性拿完再返回
  if (!useStream) {
    const data = await upstream.json();
    return res.send({ status: 200, data });
  }

  // 流式：把上游的 SSE 原样透传给前端，由前端解析 delta
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  // 让可能存在的 nginx 不要缓冲，否则流会被攒成一坨再吐出来
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") res.flushHeaders();

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
      // app.js 全局挂了 compression()，它默认会攒够 1KB 才吐；
      // 手动 flush 一下，保证打字机效果是逐字出来的
      if (typeof res.flush === "function") res.flush();
    }
  } catch (err) {
    // 客户端提前断开或上游中断，直接收尾
  } finally {
    res.end();
  }
});

module.exports = router;
