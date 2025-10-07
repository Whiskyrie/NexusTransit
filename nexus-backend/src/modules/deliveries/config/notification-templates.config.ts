import { DeliveryStatus } from '../enums/delivery-status.enum';
import { NotificationType } from '../interfaces/notification.interface';
import type { TemplateVariables } from '../interfaces/template-variables.interface';

/**
 * Templates de email por tipo de notificação
 */
export const EMAIL_TEMPLATES: Record<
  NotificationType,
  {
    subject: string;
    body: string;
  }
> = {
  [NotificationType.STATUS_CHANGE]: {
    subject: 'Atualização de Status - Pedido {{trackingCode}}',
    body: `
      <h2>Olá {{customerName}},</h2>
      <p>O status da sua entrega <strong>{{trackingCode}}</strong> foi atualizado.</p>
      <p>Status atual: <strong>{{statusMessage}}</strong></p>
      <p>Para acompanhar sua entrega, acesse: <a href="{{trackingUrl}}">{{trackingUrl}}</a></p>
      <br>
      <p>Atenciosamente,<br>Equipe NexusTransit</p>
    `,
  },

  [NotificationType.DELIVERY_CREATED]: {
    subject: 'Entrega Criada - Pedido {{trackingCode}}',
    body: `
      <h2>Olá {{customerName}},</h2>
      <p>Sua entrega foi criada com sucesso!</p>
      <p>Código de rastreamento: <strong>{{trackingCode}}</strong></p>
      <p>Endereço de entrega: {{deliveryAddress}}</p>
      <p>Data prevista: {{deliveryDate}}</p>
      <p>Para acompanhar sua entrega, acesse: <a href="{{trackingUrl}}">{{trackingUrl}}</a></p>
      <br>
      <p>Atenciosamente,<br>Equipe NexusTransit</p>
    `,
  },

  [NotificationType.DELIVERY_ASSIGNED]: {
    subject: 'Motorista Atribuído - Pedido {{trackingCode}}',
    body: `
      <h2>Olá {{customerName}},</h2>
      <p>Um motorista foi atribuído à sua entrega!</p>
      <p>Código de rastreamento: <strong>{{trackingCode}}</strong></p>
      <p>Motorista: {{driverName}}</p>
      <p>Previsão de entrega: {{estimatedTime}}</p>
      <p>Para acompanhar sua entrega em tempo real, acesse: <a href="{{trackingUrl}}">{{trackingUrl}}</a></p>
      <br>
      <p>Atenciosamente,<br>Equipe NexusTransit</p>
    `,
  },

  [NotificationType.DELIVERY_COMPLETED]: {
    subject: 'Entrega Concluída - Pedido {{trackingCode}}',
    body: `
      <h2>Olá {{customerName}},</h2>
      <p>Sua entrega foi concluída com sucesso! 🎉</p>
      <p>Código de rastreamento: <strong>{{trackingCode}}</strong></p>
      <p>Data de entrega: {{deliveryDate}}</p>
      <p>Obrigado por usar nossos serviços!</p>
      <p>Sua opinião é importante. <a href="{{feedbackUrl}}">Deixe seu feedback</a></p>
      <br>
      <p>Atenciosamente,<br>Equipe NexusTransit</p>
    `,
  },

  [NotificationType.DELIVERY_FAILED]: {
    subject: 'Problema na Entrega - Pedido {{trackingCode}}',
    body: `
      <h2>Olá {{customerName}},</h2>
      <p>Infelizmente houve um problema com sua entrega.</p>
      <p>Código de rastreamento: <strong>{{trackingCode}}</strong></p>
      <p>Motivo: {{failureReason}}</p>
      <p>Entraremos em contato em breve para reagendar.</p>
      <p>Para mais informações, acesse: <a href="{{trackingUrl}}">{{trackingUrl}}</a></p>
      <br>
      <p>Atenciosamente,<br>Equipe NexusTransit</p>
    `,
  },

  [NotificationType.DELIVERY_CANCELLED]: {
    subject: 'Entrega Cancelada - Pedido {{trackingCode}}',
    body: `
      <h2>Olá {{customerName}},</h2>
      <p>Sua entrega foi cancelada.</p>
      <p>Código de rastreamento: <strong>{{trackingCode}}</strong></p>
      <p>Se você não solicitou este cancelamento, entre em contato conosco.</p>
      <p>Suporte: {{supportEmail}} | {{supportPhone}}</p>
      <br>
      <p>Atenciosamente,<br>Equipe NexusTransit</p>
    `,
  },
};

/**
 * Templates de SMS por tipo de notificação
 */
export const SMS_TEMPLATES: Record<NotificationType, string> = {
  [NotificationType.STATUS_CHANGE]:
    'NexusTransit: Status atualizado - {{trackingCode}}. {{statusMessage}}. Acompanhe: {{trackingUrl}}',

  [NotificationType.DELIVERY_CREATED]:
    'NexusTransit: Entrega criada! Código: {{trackingCode}}. Previsão: {{deliveryDate}}. Rastreie em: {{trackingUrl}}',

  [NotificationType.DELIVERY_ASSIGNED]:
    'NexusTransit: Motorista atribuído! Código: {{trackingCode}}. Previsão: {{estimatedTime}}. Rastreie: {{trackingUrl}}',

  [NotificationType.DELIVERY_COMPLETED]:
    'NexusTransit: Entrega concluída! ✓ Código: {{trackingCode}}. Obrigado por usar nossos serviços!',

  [NotificationType.DELIVERY_FAILED]:
    'NexusTransit: Problema na entrega {{trackingCode}}. Motivo: {{failureReason}}. Entraremos em contato.',

  [NotificationType.DELIVERY_CANCELLED]:
    'NexusTransit: Entrega {{trackingCode}} cancelada. Dúvidas? Contate: {{supportPhone}}',
};

/**
 * Templates de push notification
 */
export const PUSH_TEMPLATES: Record<
  NotificationType,
  {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }
> = {
  [NotificationType.STATUS_CHANGE]: {
    title: 'Status Atualizado',
    body: 'Sua entrega {{trackingCode}} teve o status atualizado: {{statusMessage}}',
    data: { type: 'status_change' },
  },

  [NotificationType.DELIVERY_CREATED]: {
    title: 'Entrega Criada',
    body: 'Sua entrega {{trackingCode}} foi criada. Previsão: {{deliveryDate}}',
    data: { type: 'delivery_created' },
  },

  [NotificationType.DELIVERY_ASSIGNED]: {
    title: 'Motorista Atribuído',
    body: 'Motorista {{driverName}} atribuído à sua entrega {{trackingCode}}',
    data: { type: 'delivery_assigned' },
  },

  [NotificationType.DELIVERY_COMPLETED]: {
    title: 'Entrega Concluída! 🎉',
    body: 'Sua entrega {{trackingCode}} foi concluída com sucesso',
    data: { type: 'delivery_completed' },
  },

  [NotificationType.DELIVERY_FAILED]: {
    title: 'Problema na Entrega',
    body: 'Houve um problema com a entrega {{trackingCode}}. Entraremos em contato.',
    data: { type: 'delivery_failed' },
  },

  [NotificationType.DELIVERY_CANCELLED]: {
    title: 'Entrega Cancelada',
    body: 'A entrega {{trackingCode}} foi cancelada',
    data: { type: 'delivery_cancelled' },
  },
};

/**
 * Templates de mensagem por status
 */
export const STATUS_MESSAGES: Record<DeliveryStatus, string> = {
  [DeliveryStatus.PENDING]: 'Aguardando processamento',
  [DeliveryStatus.ASSIGNED]: 'Motorista atribuído',
  [DeliveryStatus.PICKED_UP]: 'Pedido coletado',
  [DeliveryStatus.IN_TRANSIT]: 'Em trânsito para o destino',
  [DeliveryStatus.OUT_FOR_DELIVERY]: 'Saiu para entrega',
  [DeliveryStatus.DELIVERED]: 'Entregue com sucesso',
  [DeliveryStatus.FAILED]: 'Falha na entrega',
  [DeliveryStatus.CANCELLED]: 'Entrega cancelada',
};

/**
 * Função auxiliar para substituir variáveis em templates
 */
export function replaceTemplateVariables(template: string, variables: TemplateVariables): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, value ?? '');
  }

  return result;
}

/**
 * Obtém template de email formatado
 */
export function getEmailTemplate(
  type: NotificationType,
  variables: TemplateVariables,
): { subject: string; body: string } {
  const template = EMAIL_TEMPLATES[type];

  return {
    subject: replaceTemplateVariables(template.subject, variables),
    body: replaceTemplateVariables(template.body, variables),
  };
}

/**
 * Obtém template de SMS formatado
 */
export function getSmsTemplate(type: NotificationType, variables: TemplateVariables): string {
  const template = SMS_TEMPLATES[type];
  return replaceTemplateVariables(template, variables);
}

/**
 * Obtém template de push notification formatado
 */
export function getPushTemplate(
  type: NotificationType,
  variables: TemplateVariables,
): { title: string; body: string; data?: Record<string, unknown> | undefined } {
  const template = PUSH_TEMPLATES[type];

  return {
    title: replaceTemplateVariables(template.title, variables),
    body: replaceTemplateVariables(template.body, variables),
    data: template.data,
  };
}

/**
 * Obtém mensagem de status formatada
 */
export function getStatusMessage(status: DeliveryStatus): string {
  return STATUS_MESSAGES[status] ?? 'Status desconhecido';
}
