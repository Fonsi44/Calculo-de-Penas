export type DashboardState = 'ok' | 'not_configured' | 'permission_denied' | 'no_data' | 'partial' | 'error';

export type ApiResponse<T> = {
  configured: boolean;
  success: boolean;
  status: DashboardState;
  data: T;
  totals?: Record<string, number>;
  previousPeriod?: {
    totals: Record<string, number>;
    changes: Record<string, number | null>;
  };
  lastUpdatedAt?: string;
  source?: 'cache' | 'fresh';
  warnings?: string[];
  message?: string;
  code?: string;
};

export type TimelinePoint = {
  date: string;
  [key: string]: number | string;
};

export type DeviceBreakdown = { device: string; users: number };
export type SourceBreakdown = { source: string; sessions: number };

export type AnalyticsTimelineResponse = ApiResponse<TimelinePoint[]> & {
  totals?: Record<string, number>;
  previousPeriod?: {
    totals: Record<string, number>;
    changes: Record<string, number | null>;
  };
  deviceBreakdown?: DeviceBreakdown[];
  sourceBreakdown?: SourceBreakdown[];
};

export type GscQueryRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscTimelineResponse = ApiResponse<TimelinePoint[]> & {
  totals?: Record<string, number>;
  previousPeriod?: {
    totals: Record<string, number>;
    changes: Record<string, number | null>;
  };
  topQueries?: GscQueryRow[];
};
