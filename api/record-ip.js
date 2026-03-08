// api/record-ip.js
import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  // 允许跨域
  response.setHeader('Access-Control-Allow-Origin', '*');

  // 从 Vercel 请求头获取真实 IP
  const realIp = request.headers['x-vercel-forwarded-for'] 
                 || request.headers['x-forwarded-for'] 
                 || request.socket.remoteAddress;

  const userAgent = request.headers['user-agent'] || 'unknown';

  // 生成北京时间
  const beijingTime = new Date().toLocaleString('zh-CN', { 
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false 
  }).replace(/\//g, '-');

  try {
    await kv.lpush('visitors', JSON.stringify({
      ip: realIp,
      userAgent,
      timestamp: beijingTime
    }));

    await kv.ltrim('visitors', 0, 999);

    response.status(200).json({ 
      success: true, 
      message: 'IP recorded', 
      ip: realIp  // 返回 IP 用于调试
    });
  } catch (error) {
    console.error('KV error:', error);
    response.status(500).json({ success: false, error: error.message });
  }
}
