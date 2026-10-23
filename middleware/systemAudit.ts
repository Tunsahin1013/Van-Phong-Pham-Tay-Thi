import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from './auth.ts';
import { appendPersistentSystemLog } from '../services/systemPersistence.ts';

/** Records state-changing API calls and failures without persisting request bodies or tokens. */
export function systemAuditMiddleware(req: Request, res: Response, next: NextFunction) {
  const path = req.originalUrl.split('?')[0];
  const method = req.method.toUpperCase();
  const isExport = method === 'GET' && (
    path.endsWith('/system/backup') || path.endsWith('/system/reports/export')
  );
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  res.on('finish', () => {
    const statusCode = res.statusCode;
    // Ignore successful read-only requests; keep failed requests for incident review.
    if (!isMutation && !isExport && statusCode < 400) return;
    // Avoid duplicating successful explicit audit events for settings and exports.
    if (path.endsWith('/system/settings') && method === 'PUT' && statusCode < 400) return;
    if (path.endsWith('/system/reports/export') && statusCode < 400) return;
    if (path.endsWith('/system/backup') && statusCode < 400) return;
    // Successful credential sign-in responses are logged separately by auth only if implemented;
    // never capture password/body/token values here.
    const authReq = req as AuthRequest;
    void appendPersistentSystemLog({
      actorId: authReq.user?.id,
      actorName: authReq.user?.name || 'Khách/Chưa xác thực',
      actorRole: authReq.user?.role || 'UNKNOWN',
      action: statusCode >= 400 ? 'API_REQUEST_FAILED' : 'API_MUTATION',
      method,
      path,
      statusCode,
      ip: req.ip,
      userAgent: String(req.headers['user-agent'] || '').slice(0, 180),
      details: `${method} ${path} trả về HTTP ${statusCode}`,
    }).catch(error => { console.error('Không thể lưu nhật ký hoạt động:', error); });
  });
  next();
}
