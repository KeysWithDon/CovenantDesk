declare interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

declare interface D1Database {
  prepare(query: string): unknown;
}

declare module "cloudflare:workers" {
  export const env: { DB?: D1Database };
  export class DurableObject<Env = unknown> {
    protected env: Env;
    constructor(state: unknown, env: Env);
  }
}
