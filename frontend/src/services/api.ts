import { PredictRequest, PredictResponse, HealthResponse, MetadataResponse } from "../types/api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

export async function getMetadata(): Promise<MetadataResponse> {
  const res = await fetch(`${BASE_URL}/metadata`);
  if (!res.ok) throw new Error(`Metadata failed: ${res.status}`);
  return res.json();
}

export async function predict(data: PredictRequest): Promise<PredictResponse> {
  const res = await fetch(`${BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err: any = new Error(body.detail || body.message || `Request failed: ${res.status}`);
    err.status = res.status;
    err.detail = body.detail;
    throw err;
  }
  return res.json();
}