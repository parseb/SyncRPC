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
