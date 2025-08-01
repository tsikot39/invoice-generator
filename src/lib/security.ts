import { NextRequest, NextResponse } from 'next/server';
import { config } from './config';

export function securityHeaders() {
  return {
    // Prevent XSS attacks
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',

    // HSTS - Force HTTPS
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),

    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions Policy
    'Permissions-Policy': ['camera=()', 'microphone=()', 'geolocation=()', 'payment=()'].join(', '),

    // Remove server information
    Server: '',
    'X-Powered-By': '',
  };
}

export function corsHeaders(origin?: string) {
  const allowedOrigins = config.security.corsOrigins;
  const isAllowed = !origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*');

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin || '*' : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ].join(', '),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

export function validateRequestSize(req: NextRequest): boolean {
  const contentLength = req.headers.get('content-length');
  if (contentLength) {
    const sizeKB = parseInt(contentLength) / 1024;
    return sizeKB <= config.security.maxRequestSizeKB;
  }
  return true;
}

export function sanitizeHeaders(headers: Record<string, string>) {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    // Remove potentially dangerous headers
    if (key.toLowerCase().startsWith('x-forwarded') && !config.security.trustedProxies.length) {
      continue;
    }

    // Sanitize header values
    sanitized[key] = value.replace(/[\r\n]/g, '');
  }

  return sanitized;
}

export function createSecureResponse(data: unknown, status = 200) {
  const response = NextResponse.json(data, { status });

  // Add security headers
  const headers = securityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export class SecurityMiddleware {
  static async validate(req: NextRequest) {
    // Check request size
    if (!validateRequestSize(req)) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }

    // Check for malicious patterns in URL
    const suspiciousPatterns = [
      /\.\./, // Path traversal
      /<script/i, // XSS
      /javascript:/i, // XSS
      /vbscript:/i, // XSS
      /onload=/i, // XSS
    ];

    const url = req.url;
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        return NextResponse.json({ error: 'Malicious request detected' }, { status: 400 });
      }
    }

    return null; // Valid request
  }

  static addSecurityHeaders(response: NextResponse) {
    const headers = securityHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
}
