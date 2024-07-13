"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gun_1 = __importDefault(require("gun"));
const ethers_1 = require("ethers");
class GunRPCClient {
    constructor(options) {
        var _a;
        this.gun = (0, gun_1.default)(options.gunOptions);
        (_a = options.peers) === null || _a === void 0 ? void 0 : _a.forEach(peer => this.gun.opt({ peers: [peer] }));
        this.provider = new ethers_1.ethers.providers.JsonRpcProvider(options.rpcUrl);
        const privateKey = process.env.OPERATOR_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('OPERATOR_PRIVATE_KEY environment variable is not set');
        }
        this.signer = new ethers_1.ethers.Wallet(privateKey, this.provider);
    }
    async broadcastRequest(request) {
        const id = ethers_1.ethers.utils.id(JSON.stringify(request));
        const networkMessage = {
            id,
            request: {
                ...request,
                timestamp: Math.floor(Date.now() / 1000)
            },
            response: null
        };
        await this.gun.get('requests').get(id).put(networkMessage);
        return id;
    }
    async fulfillRequest(requestId, responseData) {
        return new Promise((resolve, reject) => {
            this.gun.get('requests').get(requestId).once(async (networkMessage) => {
                if (networkMessage && !networkMessage.response) {
                    const latestBlock = await this.provider.getBlock('latest');
                    const messageHash = ethers_1.ethers.utils.id(JSON.stringify(responseData));
                    const signature = await this.signer.signMessage(ethers_1.ethers.utils.arrayify(messageHash));
                    const response = {
                        data: responseData,
                        blockNumber: latestBlock.hash,
                        validationSignatures: [{
                                timestamp: Math.floor(Date.now() / 1000),
                                signatures: [{ signature, signerAddress: await this.signer.getAddress() }]
                            }],
                        invalidationSignatures: [],
                        lastBroadcasterAddress: await this.signer.getAddress()
                    };
                    const updatedMessage = {
                        ...networkMessage,
                        response
                    };
                    await this.gun.get('requests').get(requestId).put(updatedMessage);
                    resolve(updatedMessage);
                }
                else {
                    reject(new Error('Request not found or already fulfilled'));
                }
            });
        });
    }
    async validateAndBroadcast(requestId) {
        return new Promise((resolve, reject) => {
            this.gun.get('requests').get(requestId).once(async (networkMessage) => {
                if (networkMessage === null || networkMessage === void 0 ? void 0 : networkMessage.response) {
                    const isValid = await this.verifyRpcCall(networkMessage.request.rpcCall, networkMessage.response.data);
                    if (isValid) {
                        const messageHash = ethers_1.ethers.utils.id(JSON.stringify(networkMessage.response.data));
                        const signature = await this.signer.signMessage(ethers_1.ethers.utils.arrayify(messageHash));
                        const validationSignature = { signature, signerAddress: await this.signer.getAddress() };
                        const validationTimestamp = Math.floor(Date.now() / 1000);
                        const updatedMessage = {
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
                    }
                    else {
                        const messageHash = ethers_1.ethers.utils.id(JSON.stringify({ requestId, reason: 'Invalid response' }));
                        const invalidationSignature = await this.signer.signMessage(ethers_1.ethers.utils.arrayify(messageHash));
                        const updatedMessage = {
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
                }
                else {
                    reject(new Error('Request not found or not fulfilled'));
                }
            });
        });
    }
    async verifyRpcCall(rpcCall, responseData) {
        // TODO: Implement RPC call verification
        // This should recreate the RPC call and compare the result with responseData
        // Return true if valid, false otherwise
        return true; // Placeholder
    }
    async getRequest(requestId) {
        return new Promise((resolve, reject) => {
            this.gun.get('requests').get(requestId).once((networkMessage) => {
                if (networkMessage) {
                    resolve(networkMessage);
                }
                else {
                    reject(new Error('Request not found'));
                }
            });
        });
    }
}
exports.default = GunRPCClient;
__exportStar(require("../types"), exports);
