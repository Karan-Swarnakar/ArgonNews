/**
 * Cloudflare Worker Environment and Database Bindings
 */

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(colName?: string): Promise<T | null>;
  run<T = any>(): Promise<{ success: boolean; meta: any; results?: T[] }>;
  all<T = any>(): Promise<{ success: boolean; results: T[]; meta: any }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = any>(statements: D1PreparedStatement[]): Promise<{ success: boolean; results?: T[]; meta: any }[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

export interface Fetcher {
  fetch(request: Request | string, init?: RequestInit): Promise<Response>;
}

export interface Env {
  argonnews_db?: D1Database;
  DB?: D1Database;
  ASSETS?: Fetcher;
  CRON_SECRET?: string;
  GEMINI_API_KEY?: string;
  ENVIRONMENT?: string;
}

export interface ScheduledEvent {
  cron: string;
  type: string;
  scheduledTime: number;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}
