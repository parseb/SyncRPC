import Gun from 'gun';
import { NetworkMessage, Request } from './types';
declare class GunRPCClient {
    private gun;
    private provider;
    private signer;
    constructor(options: {
        gunOptions?: Gun.IGunConstructorOptions;
        peers?: string[];
        rpcUrl: string;
    });
    broadcastRequest(request: Request): Promise<string>;
    fulfillRequest(requestId: string, responseData: any): Promise<NetworkMessage>;
    validateAndBroadcast(requestId: string): Promise<NetworkMessage>;
    private verifyRpcCall;
    getRequest(requestId: string): Promise<NetworkMessage>;
}
export default GunRPCClient;
export * from './types';
