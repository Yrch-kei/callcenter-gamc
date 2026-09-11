export interface ReportResult {
  name: string;
  count: number;
  percentage: number;
}

export interface ReportData {
  total: number;
  results: ReportResult[];
}