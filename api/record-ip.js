import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');

  const ip = request.headers['x-forwarded-for'] 
             || request.headers['x-real-ip'] 
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
  }).replace(/\//g, '-'); // 转换为 2025-03-08 20:30:45 格式

  try {
    await kv.lpush('visitors', JSON.stringify({
      ip,
      userAgent,
      timestamp: beijingTime
    }));

    await kv.ltrim('visitors', 0, 999);

    response.status(200).json({ success: true, message: 'IP recorded' });
  } catch (error) {
    console.error('KV error:', error);
    response.status(500).json({ success: false, error: error.message });
  }
}
