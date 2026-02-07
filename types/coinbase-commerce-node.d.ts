declare module 'coinbase-commerce-node' {
  export class Client {
    constructor(config: { apiKey: string });
  }

  export class Charge {
    static create(data: any): Promise<any>;
    static retrieve(chargeId: string): Promise<any>;
    id: string;
    timeline: Array<{ status: string }>;
    hosted_url: string;
    metadata: Record<string, any>;
  }
}
