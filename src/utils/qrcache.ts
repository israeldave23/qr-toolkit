import { type QrPayload } from '../models';
import { detectType } from './qr';

const cache = new Map<string, QrPayload>();

let _nextId = 1;

export function putQr(entry: Pick<QrPayload, 'content' | 'source'>): string {
  const id = String(_nextId++);
  const detectedType = detectType(entry.content);
  cache.set(id, { ...entry, detectedType, id, createdAt: Date.now() });
  return id;
}

export function getQr(id: string): QrPayload | undefined {
  return cache.get(id);
}

export function deleteQr(id: string): void {
  cache.delete(id);
}
