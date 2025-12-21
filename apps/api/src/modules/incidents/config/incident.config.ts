import { registerAs } from '@nestjs/config';

export interface IncidentConfig {
  // Configurações de geração de números de incidentes
  incidentNumber: {
    prefix: string;
    useYear: boolean;
    useMonth: boolean;
    minDigits: number;
  };

  // Configurações de workflow
  workflow: {
    defaultStatus: string;
    autoAssign: boolean;
    autoResolveAfterDays: number;
  };

  // Configurações de notificações
  notifications: {
    enableEmail: boolean;
    enableSms: boolean;
    enablePush: boolean;
  };

  // Configurações de integração
  integrations: {
    enableInsuranceApi: boolean;
    enableTrafficApi: boolean;
  };
}

export default registerAs(
  'incident',
  (): IncidentConfig => ({
    incidentNumber: {
      prefix: process.env.INCIDENT_NUMBER_PREFIX ?? 'INC',
      useYear: process.env.INCIDENT_USE_YEAR !== 'false',
      useMonth: process.env.INCIDENT_USE_MONTH === 'true',
      minDigits: parseInt(process.env.INCIDENT_MIN_DIGITS ?? '4') || 4,
    },
    workflow: {
      defaultStatus: process.env.INCIDENT_DEFAULT_STATUS ?? 'REPORTED',
      autoAssign: process.env.INCIDENT_AUTO_ASSIGN === 'true',
      autoResolveAfterDays: parseInt(process.env.INCIDENT_AUTO_RESOLVE_DAYS ?? '30') || 30,
    },
    notifications: {
      enableEmail: process.env.INCIDENT_NOTIFY_EMAIL !== 'false',
      enableSms: process.env.INCIDENT_NOTIFY_SMS === 'true',
      enablePush: process.env.INCIDENT_NOTIFY_PUSH !== 'false',
    },
    integrations: {
      enableInsuranceApi: process.env.INCIDENT_ENABLE_INSURANCE_API === 'true',
      enableTrafficApi: process.env.INCIDENT_ENABLE_TRAFFIC_API === 'true',
    },
  }),
);
