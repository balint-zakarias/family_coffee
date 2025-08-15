import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Graphql {
  endpoint = '/graphql/';

  async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (body.errors?.length) throw new Error(body.errors[0].message || 'GraphQL error');
    return body.data as T;
  }
}