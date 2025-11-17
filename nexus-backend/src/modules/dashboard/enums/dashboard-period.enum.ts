
export enum DashboardPeriod {

  TODAY = 'TODAY',

  LAST_7_DAYS = 'LAST_7_DAYS',

  LAST_30_DAYS = 'LAST_30_DAYS',

  CURRENT_MONTH = 'CURRENT_MONTH',

  LAST_MONTH = 'LAST_MONTH',

  LAST_3_MONTHS = 'LAST_3_MONTHS',

  LAST_6_MONTHS = 'LAST_6_MONTHS',

  CURRENT_YEAR = 'CURRENT_YEAR',

  CUSTOM = 'CUSTOM',
}


export function getPeriodStartDate(period: DashboardPeriod, customStartDate?: Date): Date {
  const now = new Date();
  
  switch (period) {
    case DashboardPeriod.TODAY:
      now.setHours(0, 0, 0, 0);
      return now;
      
    case DashboardPeriod.LAST_7_DAYS:
      now.setDate(now.getDate() - 7);
      return now;
      
    case DashboardPeriod.LAST_30_DAYS:
      now.setDate(now.getDate() - 30);
      return now;
      
    case DashboardPeriod.CURRENT_MONTH:
      return new Date(now.getFullYear(), now.getMonth(), 1);
      
    case DashboardPeriod.LAST_MONTH:
      return new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
    case DashboardPeriod.LAST_3_MONTHS:
      now.setMonth(now.getMonth() - 3);
      return now;
      
    case DashboardPeriod.LAST_6_MONTHS:
      now.setMonth(now.getMonth() - 6);
      return now;
      
    case DashboardPeriod.CURRENT_YEAR:
      return new Date(now.getFullYear(), 0, 1);
      
    case DashboardPeriod.CUSTOM:
      return customStartDate ?? now;
      
    default:
      return now;
  }
}

export function getPeriodEndDate(period: DashboardPeriod, customEndDate?: Date): Date {
  const now = new Date();
  
  switch (period) {
    case DashboardPeriod.LAST_MONTH:
      return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      
    case DashboardPeriod.CUSTOM:
      return customEndDate ?? now;
      
    default:
      now.setHours(23, 59, 59, 999);
      return now;
  }
}
