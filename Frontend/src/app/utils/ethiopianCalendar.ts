import { mezmur } from '../../../Saints/mezmur';

export interface EthiopianDate {
  year: number;
  month: number;
  day: number;
  monthNameAmharic: string;
  formatted: string;
  formattedNumeric: string;
}

const ETHIOPIAN_MONTH_NAMES_AMHARIC = [
  'መስከረም',
  'ጥቅምት',
  'ኅዳር',
  'ታኅሣሥ',
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'ጳጉሜ',
];

/**
 * Convert Gregorian date components to Julian Day Number (JDN)
 */
export function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * Convert Julian Day Number (JDN) to Ethiopian Date components
 */
export function jdnToEthiopian(jdn: number): EthiopianDate {
  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year =
    4 * Math.floor((jdn - 1723856) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  const monthNameAmharic = ETHIOPIAN_MONTH_NAMES_AMHARIC[month - 1] || '';

  return {
    year,
    month,
    day,
    monthNameAmharic,
    formatted: `${monthNameAmharic} ${day} ቀን ${year} ዓ.ም`,
    formattedNumeric: `${day}/${month}/${year}`,
  };
}

/**
 * Get current (or provided) date converted to Ethiopian Calendar
 */
export function getEthiopianDate(gregorianDate: Date = new Date()): EthiopianDate {
  const jdn = gregorianToJdn(
    gregorianDate.getFullYear(),
    gregorianDate.getMonth() + 1,
    gregorianDate.getDate()
  );
  return jdnToEthiopian(jdn);
}

/**
 * Fetch the mezmur (song/saint information) corresponding to the day of the Ethiopian month.
 */
export function getTodaysMezmur(gregorianDate: Date = new Date()) {
  const ethDate = getEthiopianDate(gregorianDate);
  // mezmur array items have ids 1..30 corresponding to the day of the month
  const todaysMezmur = mezmur.find((m) => m.id === ethDate.day) || mezmur[0];
  
  return {
    ethDate,
    mezmur: todaysMezmur,
  };
}
