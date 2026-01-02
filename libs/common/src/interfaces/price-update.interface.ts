export interface PriceUpdate {
  symbol: string;
  open: number;
  close: number;
  high: number;
  low: number;
  dataTimestamp: string; // ISO 8601 format
}
