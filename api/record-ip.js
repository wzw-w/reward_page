// api/record-ip.js
import { kv } from '@vercel/kv';
import { ipAddress, geolocation } from '@vercel/functions';

export default async function handler(request, response) {
  // 允许跨域
  response.setHeader('Access-Control-Allow-Origin', '*');

  // 1. 使用 Vercel 函数获取真实访客 IP
  const realIp = ipAddress(request) || 'unknown';

  // 2. 获取访客的地理位置信息（可选，但非常有用）
  const geo = geolocation(request);
  // geo 对象包含 country, city, region, latitude, longitude 等字段
  const country = geo?.country || 'unknown';

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
    // 存储真实 IP 和地理位置信息
    await kv.lpush('visitors', JSON.stringify({
      ip: realIp,          // 这里存的就是真实访客 IP 了
      country,             // 存储国家代码，方便你验证
      userAgent,
      timestamp: beijingTime
    }));

    // 保持列表长度
    await kv.ltrim('visitors', 0, 999);

    response.status(200).json({ 
      success: true, 
      message: 'IP recorded', 
      ip: realIp,          // 在 API 响应中返回 IP 用于调试
      country 
    });
  } catch (error) {
    console.error('KV error:', error);
    response.status(500).json({ success: false, error: error.message });
  }
}
