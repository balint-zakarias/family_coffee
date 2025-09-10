import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Graphql {
  endpoint = '/graphql/';

  // --- publikus API ---
  query<T>(query: string, variables?: Record<string, any>) {
    return this.request<T>({ query, variables });
  }

  mutate<T>(mutation: string, variables?: Record<string, any>) {
    return this.request<T>({ query: mutation, variables });
  }

  async mutateMultipart<T = any>(mutation: string, variables: Record<string, any>): Promise<T> {
    // GraphQL multipart request spec: operations + map + bináris file-ok
    const form = new FormData();

    // a fájl mezők ne maradjanak az operations variables-ben mint File objektumok
    const opsVars: any = {};
    const fileEntries: [path: string, file: File][] = [];

    for (const [k, v] of Object.entries(variables)) {
      if (v instanceof File) {
        fileEntries.push([`variables.${k}`, v]);
        // helyére null kerül az operations-ban
        opsVars[k] = null;
      } else {
        opsVars[k] = v;
      }
    }

    form.append('operations', JSON.stringify({ query: mutation, variables: opsVars }));

    // map összeállítása: index -> ["variables.image", ...]
    const map: Record<string, string[]> = {};
    fileEntries.forEach((entry, idx) => {
      map[idx] = [entry[0]];
    });
    form.append('map', JSON.stringify(map));

    // bináris partok
    fileEntries.forEach(([, file], idx) => {
      form.append(String(idx), file, file.name);
    });

    const res = await fetch(this.endpoint, {
      method: 'POST',
      body: form, // NINCS Content-Type header — a böngésző állítja be a boundary-t
    });

    const text = await res.text();
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) throw new Error(typeof body === 'string' ? body : (body?.errors?.[0]?.message || `HTTP ${res.status}`));
    if (body?.errors?.length) throw new Error(body.errors[0].message || 'GraphQL error');
    return body.data as T;
  }

  // --- belső közös kérés ---
  private async request<T>(payload: { query: string; variables?: Record<string, any>; operationName?: string }): Promise<T> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      credentials: 'include',                      // szükséges a csrftoken sütihöz
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': this.getCsrfToken() || '',  // Django CSRF védelem mutációkhoz
      },
      body: JSON.stringify(payload),
    });

    // A body-t mindig olvassuk ki (400-as esetben is itt a hibaüzenet)
    const text = await res.text();
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; } catch { /* marad nyers text */ }

    if (!res.ok) {
      throw new Error(typeof body === 'string'
        ? body
        : (body?.errors?.[0]?.message || `HTTP ${res.status}`));
    }
    if (body?.errors?.length) {
      throw new Error(body.errors[0].message || 'GraphQL error');
    }
    return body.data as T;
  }

  // --- CSRF token sütiből (Django default: csrftoken) ---
  private getCsrfToken(name = 'csrftoken'): string | null {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : null;
  }
}