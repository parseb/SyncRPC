// File: README.md (update)
# Gun RPC Client

A Gun.js RPC client for Ethereum static calls, using ECDSA signatures.

## Installation

```bash
npm install gun-rpc-client
```

## Usage

First, set your operator's private key as an environment variable:

```bash
export OPERATOR_PRIVATE_KEY=your_private_key_here
```

Then in your TypeScript code:

```typescript
import GunRPCClient, { Request } from 'gun-rpc-client';

const client = new GunRPCClient({
  peers: ['http://your-gun-peer.com/gun'],
  rpcUrl: 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID'
});

// Broadcast a request
const request: Request = {
  requester: '0x1234...',
  price: '1000000000',  // 1 gwei
  rpcCall: {
    contract: '0xabcd...',
    callData: '0x...',
    code: '0x...'
  }
};
const requestId = await client.broadcastRequest(request);

// Fulfill a request
await client.fulfillRequest(requestId, { someData: 'response data' });

// Validate and broadcast
await client.validateAndBroadcast(requestId);

// Get a request
const requestData = await client.getRequest(requestId);
```

## API

- `constructor(options: { gunOptions?: any; peers?: string[]; rpcUrl: string })`: Creates a new GunRPCClient instance
- `broadcastRequest(request: Request): Promise<string>`: Broadcasts a new RPC request
- `fulfillRequest(requestId: string, response: any): Promise<NetworkMessage>`: Fulfills a request with a response
- `validateAndBroadcast(requestId: string): Promise<NetworkMessage>`: Validates a response and broadcasts it
- `getRequest(requestId: string): Promise<NetworkMessage>`: Retrieves a request by its ID

## Security Note

Ensure that your OPERATOR_PRIVATE_KEY environment variable is set securely and not exposed in your codebase or version control system.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.