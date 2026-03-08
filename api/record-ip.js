// api/record-ip.js
import { kv } from '@vercel/kv';
import { ipAddress, geolocation } from '@vercel/functions';

export const config = {
  runtime: 'edge',  // 指定为 Edge Function
};

export default async function handler(request) {
  // 允许跨域
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    // 使用官方方法获取真实 IP 和地理位置
    const ip = ipAddress(request);
    const geo = geolocation(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // 生成北京时间
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

    // 存入 KV 数据库
    await kv.lpush('visitors', JSON.stringify({
      ip,
      country: geo?.country || 'unknown',
      city: geo?.city || 'unknown',
      userAgent,
      timestamp: beijingTime,
    }));
    await kv.ltrim('visitors', 0, 999);

    // 返回成功响应（包含 IP 用于调试）
    return new Response(JSON.stringify({ 
      success: true, 
      ip, 
      country: geo?.country 
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('KV error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
