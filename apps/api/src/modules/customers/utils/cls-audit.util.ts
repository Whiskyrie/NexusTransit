import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import type { AuditContext } from '../interfaces/auditable.interface';

@Injectable()
export class ClsAuditUtils {
  static getAuditContext(clsService: ClsService): AuditContext {
    return {
      requestId: clsService.get('requestId'),
      userId: clsService.get('userId'),
      userEmail: clsService.get('userEmail'),
      userName: clsService.get('userName'),
      ipAddress: clsService.get('ipAddress'),
      userAgent: clsService.get('userAgent'),
      method: clsService.get('method'),
      url: clsService.get('url'),
      timestamp: clsService.get('timestamp'),
    };
  }
}
