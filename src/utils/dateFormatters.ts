import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

export function formatDate(date: string | Date) {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'dd/MM', { locale: ar });
}

export function formatDateTime(date: string | Date) {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'dd/MM HH:mm', { locale: ar });
}

export function formatFullDateTime(date: string | Date) {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, 'dd/MM/yyyy HH:mm', { locale: ar });
}