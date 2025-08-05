// 定期支払い計算ユーティリティ

export type RecurringFrequency = 'monthly' | 'quarterly' | 'semi_annually' | 'annually';

export interface RecurringPaymentConfig {
  frequency: RecurringFrequency;
  paymentDay: number;
  startDate: string;
  endDate: string;
  amount: number;
}

export interface PaymentSchedule {
  date: string;
  amount: number;
  description: string;
}

// 支払い回数を計算
export function calculatePaymentCount(
  startDate: string,
  endDate: string,
  frequency: RecurringFrequency
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startYear = start.getFullYear();
  const startMonth = start.getMonth();
  const endYear = end.getFullYear();
  const endMonth = end.getMonth();
  
  let count = 0;
  
  switch (frequency) {
    case 'monthly':
      count = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
      break;
    case 'quarterly':
      count = Math.ceil(((endYear - startYear) * 12 + (endMonth - startMonth) + 1) / 3);
      break;
    case 'semi_annually':
      count = Math.ceil(((endYear - startYear) * 12 + (endMonth - startMonth) + 1) / 6);
      break;
    case 'annually':
      count = endYear - startYear + 1;
      break;
  }
  
  return Math.max(count, 0);
}

// 総額を計算
export function calculateTotalAmount(amount: number, paymentCount: number): number {
  return amount * paymentCount;
}

// 支払いスケジュールを生成
export function generatePaymentSchedule(config: RecurringPaymentConfig): PaymentSchedule[] {
  const { frequency, paymentDay, startDate, endDate, amount } = config;
  const schedule: PaymentSchedule[] = [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let currentDate = new Date(start);
  currentDate.setDate(Math.min(paymentDay, getLastDayOfMonth(currentDate.getFullYear(), currentDate.getMonth())));
  
  // 開始日より前の場合は次の支払い日に調整
  if (currentDate < start) {
    currentDate = getNextPaymentDate(currentDate, frequency);
    currentDate.setDate(Math.min(paymentDay, getLastDayOfMonth(currentDate.getFullYear(), currentDate.getMonth())));
  }
  
  let counter = 1;
  while (currentDate <= end) {
    schedule.push({
      date: currentDate.toISOString().split('T')[0],
      amount: amount,
      description: `第${counter}回目の支払い`
    });
    
    currentDate = getNextPaymentDate(currentDate, frequency);
    currentDate.setDate(Math.min(paymentDay, getLastDayOfMonth(currentDate.getFullYear(), currentDate.getMonth())));
    counter++;
  }
  
  return schedule;
}

// 次の支払い日を取得
function getNextPaymentDate(currentDate: Date, frequency: RecurringFrequency): Date {
  const nextDate = new Date(currentDate);
  
  switch (frequency) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'semi_annually':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'annually':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  return nextDate;
}

// 月の最終日を取得
function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// 頻度の表示名を取得
export function getFrequencyDisplayName(frequency: RecurringFrequency): string {
  switch (frequency) {
    case 'monthly': return '毎月';
    case 'quarterly': return '四半期毎';
    case 'semi_annually': return '半年毎';
    case 'annually': return '年次';
    default: return frequency;
  }
}

// 支払い日の表示文字列を生成
export function getPaymentDayDisplay(day: number, frequency: RecurringFrequency): string {
  if (day === 31) {
    return '月末';
  }
  
  const suffix = frequency === 'quarterly' ? '四半期末月の' : 
                frequency === 'semi_annually' ? '半期末月の' : 
                frequency === 'annually' ? '年末月の' : '';
  
  return `${suffix}${day}日`;
}

// 定期支払いの説明文を生成
export function getRecurringPaymentDescription(
  frequency: RecurringFrequency,
  paymentDay: number,
  amount: number,
  paymentCount: number
): string {
  const frequencyName = getFrequencyDisplayName(frequency);
  const dayDisplay = getPaymentDayDisplay(paymentDay, frequency);
  
  return `${frequencyName}${dayDisplay}に¥${amount.toLocaleString()}を${paymentCount}回支払い（総額: ¥${(amount * paymentCount).toLocaleString()}）`;
}

// 現在進行中の支払い状況を計算
export function getCurrentPaymentStatus(
  schedule: PaymentSchedule[],
  currentDate: string = new Date().toISOString().split('T')[0]
): {
  completedPayments: number;
  totalPayments: number;
  nextPaymentDate: string | null;
  paidAmount: number;
  remainingAmount: number;
} {
  const current = new Date(currentDate);
  let completedPayments = 0;
  let paidAmount = 0;
  let nextPaymentDate: string | null = null;
  
  for (const payment of schedule) {
    const paymentDate = new Date(payment.date);
    if (paymentDate <= current) {
      completedPayments++;
      paidAmount += payment.amount;
    } else if (nextPaymentDate === null) {
      nextPaymentDate = payment.date;
    }
  }
  
  const totalAmount = schedule.reduce((sum, payment) => sum + payment.amount, 0);
  
  return {
    completedPayments,
    totalPayments: schedule.length,
    nextPaymentDate,
    paidAmount,
    remainingAmount: totalAmount - paidAmount
  };
}