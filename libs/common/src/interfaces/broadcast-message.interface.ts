import { PriceUpdate } from "./price-update.interface";

export interface BroadcastMessage {
  timestamp: string; // ISO 8601 format
  data: PriceUpdate[];
}
