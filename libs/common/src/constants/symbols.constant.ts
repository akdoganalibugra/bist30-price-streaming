/**
 * BIST30 Stock Symbols
 * 
 * These are the 30 major stocks traded on Borsa Istanbul (BIST).
 * Used across all services for price generation and streaming.
 * 
 * Reference: specs/001-bist30-streaming-platform/spec.md (FR-001)
 */
export const BIST30_SYMBOLS: readonly string[] = [
  'AKBNK', // Akbank
  'GARAN', // Garanti Bankası
  'ISCTR', // İş Bankası (C)
  'THYAO', // Türk Hava Yolları
  'PETKM', // Petkim
  'SAHOL', // Sabancı Holding
  'KCHOL', // Koç Holding
  'EREGL', // Ereğli Demir Çelik
  'ARCLK', // Arçelik
  'ASELS', // Aselsan
  'BIMAS', // BİM Mağazalar
  'EKGYO', // Emlak Konut GYO
  'ENKAI', // Enka İnşaat
  'FROTO', // Ford Otosan
  'GUBRF', // Gübre Fabrikaları
  'HALKB', // Halkbank
  'KOZAL', // Koza Altın
  'KOZAA', // Koza Anadolu Metal
  'KRDMD', // Kardemir (D)
  'MGROS', // Migros
  'PGSUS', // Pegasus
  'SISE', // Şişe Cam
  'TAVHL', // TAV Havalimanları
  'TCELL', // Turkcell
  'TKFEN', // Tekfen Holding
  'TOASO', // Tofaş
  'TTKOM', // Türk Telekom
  'TUPRS', // Tüpraş
  'VAKBN', // Vakıfbank
  'YKBNK', // Yapı Kredi Bankası
] as const;

export type BIST30Symbol = typeof BIST30_SYMBOLS[number];
