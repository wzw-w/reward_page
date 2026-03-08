
// api/get-visitors.js
import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  try {
    // 从 KV 中获取 visitors 列表（最近 100 条，可根据需要调整）
    const visitors = await kv.lrange('visitors', 0, 99);
    
    // 将存储的 JSON 字符串解析为对象
    const parsed = visitors.map(v => {
      try {
        return JSON.parse(v);
      } catch {
        return v; // 如果解析失败，返回原始字符串
      }
    });

    response.status(200).json(parsed);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
}
