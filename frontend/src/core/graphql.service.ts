import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Graphql {
  endpoint = '/graphql/';

  async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const res = await fetch('/graphql/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
  
    // Olvassuk ki mindig a body-t (text), mert 400 esetben itt van a hasznos hiba
    const text = await res.text();
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; } catch { /* marad text */ }
  
    if (!res.ok) {
      // pl. "Invalid HTTP_HOST header", "Must provide query string.", stb.
      throw new Error(typeof body === 'string' ? body : (body?.errors?.[0]?.message || `HTTP ${res.status}`));
    }
    if (body?.errors?.length) throw new Error(body.errors[0].message || 'GraphQL error');
    return body.data as T;
  }
}