import Gun from 'gun';
import { ethers } from 'ethers';
import { NetworkMessage, Request, Response, Signature, RPCCall } from './types';

class GunRPCClient {
  private gun: Gun.IGunInstance;
  private provider: ethers.providers.JsonRpcProvider;
  private signer: ethers.Wallet;

  constructor(options: { gunOptions?: Gun.IGunConstructorOptions; peers?: string[]; rpcUrl: string }) {
    this.gun = Gun(options.gunOptions);
    if (options.peers) {
      this.gun.opt({ peers: options.peers });
    }
    this.provider = new ethers.providers.JsonRpcProvider(options.rpcUrl);
    
    const privateKey = process.env.OPERATOR_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('OPERATOR_PRIVATE_KEY environment variable is not set');
    }
    this.signer = new ethers.Wallet(privateKey, this.provider);
  }

  async broadcastRequest(request: Request): Promise<string> {
    const id = ethers.utils.id(JSON.stringify(request));
    const networkMessage: NetworkMessage = {
      id,
      request: {
        ...request,
        timestamp: Math.floor(Date.now() / 1000)
      },
      response: null
    };

    this.gun.get('requests').get(id).put(networkMessage);
    return id;
  }

  async fulfillRequest(requestId: string, responseData: any): Promise<NetworkMessage> {
    return new Promise((resolve, reject) => {
      this.gun.get('requests').get(requestId).once(async (networkMessage: NetworkMessage | null) => {
        if (networkMessage && !networkMessage.response) {
          const latestBlock = await this.provider.getBlock('latest');
          const messageHash = ethers.utils.id(JSON.stringify(responseData));
          const signature = await this.signer.signMessage(ethers.utils.arrayify(messageHash));
          const response: Response = {
            data: responseData,
            blockNumber: latestBlock.hash,
            validationSignatures: [{
              timestamp: Math.floor(Date.now() / 1000),
              signatures: [{ signature, signerAddress: await this.signer.getAddress() }]
            }],
            invalidationSignatures: [],
            lastBroadcasterAddress: await this.signer.getAddress()
          };

          const updatedMessage: NetworkMessage = {
            ...networkMessage,
            response
          };

          await this.gun.get('requests').get(requestId).put(updatedMessage);
          resolve(updatedMessage);
        } else {
          reject(new Error('Request not found or already fulfilled'));
        }
      });
    });
  }

  async validateAndBroadcast(requestId: string): Promise<NetworkMessage> {
    return new Promise((resolve, reject) => {
      this.gun.get('requests').get(requestId).once(async (networkMessage: NetworkMessage | null) => {
        if (networkMessage?.response) {
          const isValid = await this.verifyRpcCall(networkMessage.request.rpcCall, networkMessage.response.data);
          
          if (isValid) {
            const messageHash = ethers.utils.id(JSON.stringify(networkMessage.response.data));
            const signature = await this.signer.signMessage(ethers.utils.arrayify(messageHash));
            const validationSignature: Signature = { signature, signerAddress: await this.signer.getAddress() };
            const validationTimestamp = Math.floor(Date.now() / 1000);
            
            const updatedMessage: NetworkMessage = {
              ...networkMessage,
              response: {
                ...networkMessage.response,
                validationSignatures: [
                  ...networkMessage.response.validationSignatures,
                  { timestamp: validationTimestamp, signatures: [validationSignature] }
                ],
                lastBroadcasterAddress: await this.signer.getAddress()
              }
            };

            await this.gun.get('requests').get(requestId).put(updatedMessage);
            resolve(updatedMessage);
          } else {
            const messageHash = ethers.utils.id(JSON.stringify({ requestId, reason: 'Invalid response' }));
            const invalidationSignature = await this.signer.signMessage(ethers.utils.arrayify(messageHash));
            const updatedMessage: NetworkMessage = {
              ...networkMessage,
              response: {
                ...networkMessage.response,
                invalidationSignatures: [
                  ...networkMessage.response.invalidationSignatures,
                  { signature: invalidationSignature, signerAddress: await this.signer.getAddress() }
                ]
              }
            };

            await this.gun.get('requests').get(requestId).put(updatedMessage);
            reject(new Error('Invalid response'));
          }
        } else {
          reject(new Error('Request not found or not fulfilled'));
        }
      });
    });
  }

  private async verifyRpcCall(rpcCall: RPCCall, responseData: any): Promise<boolean> {
    // TODO: Implement RPC call verification
    // This should recreate the RPC call and compare the result with responseData
    // Return true if valid, false otherwise
    return true; // Placeholder
  }

  async getRequest(requestId: string): Promise<NetworkMessage> {
    return new Promise((resolve, reject) => {
      this.gun.get('requests').get(requestId).once((networkMessage: NetworkMessage | null) => {
        if (networkMessage) {
          resolve(networkMessage);
        } else {
          reject(new Error('Request not found'));
        }
      });
    });
  }
}

export default GunRPCClient;
export * from './types';