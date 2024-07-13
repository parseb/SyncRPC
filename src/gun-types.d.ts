declare module 'gun' {
    namespace Gun {
      interface IGunChainReference<T = any> {
        put(data: T): IGunChainReference<T>;
        get(key: string): IGunChainReference<T>;
        once(cb: (data: T, key: string) => void): IGunChainReference<T>;
        on(cb: (data: T, key: string) => void): IGunChainReference<T>;
        map(): IGunChainReference<T>;
        // Add other chain methods as needed
      }
  
      interface IGunConstructorOptions {
        peers?: string[];
        [key: string]: any;
      }
  
      interface IGunInstance extends IGunChainReference<any> {
        opt(options: IGunConstructorOptions): void;
      }
    }
  
    interface GunConstructor {
      new (options?: Gun.IGunConstructorOptions): Gun.IGunInstance;
      (options?: Gun.IGunConstructorOptions): Gun.IGunInstance;
    }
  
    const Gun: GunConstructor;
    export = Gun;
  }
  
  // File: src/types.ts
  // Remove the import statement at the top of this file
  
  export interface RPCCall {
    contract: string;
    callData: string;
    code: string;
  }
  
  export interface Request {
    timestamp: number;
    requester: string;
    price: string;
    rpcCall: RPCCall;
  }
  
  export interface Signature {
    signature: string;
    signerAddress: string;
  }
  
  export interface ValidationSignature {
    timestamp: number;
    signatures: Signature[];
  }
  
  export interface InvalidationSignature {
    signature: string;
    signerAddress: string;
  }
  
  export interface Response {
    data: any;
    blockNumber: string;
    validationSignatures: ValidationSignature[];
    invalidationSignatures: InvalidationSignature[];
    lastBroadcasterAddress: string;
  }
  
  export interface NetworkMessage {
    id: string;
    request: Request;
    response: Response | null;
  }