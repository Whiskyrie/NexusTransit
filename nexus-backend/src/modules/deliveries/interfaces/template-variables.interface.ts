/**
 * Interface para variáveis de template
 */
export interface TemplateVariables {
  trackingCode: string;
  customerName?: string;
  driverId?: string;
  driverName?: string;
  estimatedTime?: string;
  deliveryAddress?: string;
  deliveryDate?: string;
  statusMessage?: string;
  [key: string]: string | undefined;
}
