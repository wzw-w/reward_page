// api/record-ip.js
import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    // 从请求头获取真实 IP（按优先级）
    const realIp = request.headers.get('x-vercel-ip')
                   || request.headers.get('x-vercel-forwarded-for')
                   || request.headers.get('x-forwarded-for')
                   || request.headers.get('x-real-ip')
                   || 'unknown';

    // 获取国家信息（如果有）
    const country = request.headers.get('x-vercel-ip-country') || 'unknown';
    const city = request.headers.get('x-vercel-ip-city') || 'unknown';

    const userAgent = request.headers.get('user-agent') || 'unknown';

    // 北京时间
    const beijingTime = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(/\//g, '-');

    await kv.lpush('visitors', JSON.stringify({
      ip: realIp,
      country,
      city,
      userAgent,
      timestamp: beijingTime,
    }));
    await kv.ltrim('visitors', 0, 999);

    return new Response(JSON.stringify({ 
      success: true, 
      ip: realIp, 
      country 
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
