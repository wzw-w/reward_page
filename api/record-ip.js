
// api/record-ip.js
import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  // 允许跨域访问（因为你的前端和 API 同域，其实可以不设置，但为了保险可以加上）
  response.setHeader('Access-Control-Allow-Origin', '*');

  // 获取访客 IP（Vercel 会在请求头中传递真实 IP）
  const ip = request.headers['x-forwarded-for'] 
             || request.headers['x-real-ip'] 
             || request.socket.remoteAddress;

  // 获取 User-Agent（可选）
  const userAgent = request.headers['user-agent'] || 'unknown';

  // 记录时间
  const timestamp = new Date().toISOString();

  try {
    // 将 IP 存入 KV 列表（使用 LPUSH，最新记录在列表头部）
    await kv.lpush('visitors', JSON.stringify({
      ip,
      userAgent,
      timestamp
    }));

    // 可选：限制列表长度，避免无限增长（例如只保留最近 1000 条）
    await kv.ltrim('visitors', 0, 999);

    response.status(200).json({ success: true, message: 'IP recorded' });
  } catch (error) {
    console.error('KV error:', error);
    response.status(500).json({ success: false, error: error.message });
  }
}
