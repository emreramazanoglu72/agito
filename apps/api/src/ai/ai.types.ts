export type AiTableColumn = {
  key: string;
  label: string;
};

export type AiTable = {
  title: string;
  columns: AiTableColumn[];
  rows: Record<string, string | number | null>[];
};

export type AiChartDataset = {
  label: string;
  data: number[];
  backgroundColor?: string[];
  borderColor?: string[];
};

export type AiChart = {
  title: string;
  type: 'bar' | 'line' | 'doughnut';
  labels: string[];
  datasets: AiChartDataset[];
};

export type AiResponse = {
  summary: string;
  tables: AiTable[];
  charts: AiChart[];
  suggestions: string[];
};
