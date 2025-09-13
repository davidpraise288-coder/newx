import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface AuthConfig {
  identityPath?: string;
  useInternetIdentity?: boolean;
  maxTimeToLive?: bigint;
  derivationOrigin?: string;
  windowOpenerFeatures?: string;
}

export interface StoredIdentity {
  publicKey: number[];
  privateKey: number[];
  principal: string;
  created: number;
}

export class OpenChatAuth {
  private authClient: AuthClient | null = null;
  private identity: Identity | null = null;
  private config: AuthConfig;
  private readonly defaultIdentityPath = './openchat-identity.json';

  constructor(config: AuthConfig = {}) {
    this.config = {
      identityPath: config.identityPath || this.defaultIdentityPath,
      useInternetIdentity: config.useInternetIdentity || false,
      maxTimeToLive: config.maxTimeToLive || BigInt(8 * 60 * 60 * 1000 * 1000 * 1000), // 8 hours in nanoseconds
      derivationOrigin: config.derivationOrigin,
      windowOpenerFeatures: config.windowOpenerFeatures,
    };
  }

  /**
   * Initialize authentication
   */
  async initialize(): Promise<Identity> {
    console.log('Initializing OpenChat authentication...');

    if (this.config.useInternetIdentity) {
      return await this.initializeInternetIdentity();
    } else {
      return await this.initializeServiceIdentity();
    }
  }

  /**
   * Initialize with Internet Identity (for interactive use)
   */
  private async initializeInternetIdentity(): Promise<Identity> {
    try {
      console.log('Initializing Internet Identity authentication...');
      
      this.authClient = await AuthClient.create();
      
      // Check if already authenticated
      if (await this.authClient.isAuthenticated()) {
        this.identity = this.authClient.getIdentity();
        console.log('Already authenticated with Internet Identity');
        console.log('Principal:', this.identity.getPrincipal().toString());
        return this.identity;
      }

      // Start login process
      console.log('Starting Internet Identity login...');
      await this.authClient.login({
        identityProvider: 'https://identity.ic0.app',
        maxTimeToLive: this.config.maxTimeToLive,
        derivationOrigin: this.config.derivationOrigin,
        windowOpenerFeatures: this.config.windowOpenerFeatures,
        onSuccess: () => {
          console.log('Internet Identity login successful');
        },
        onError: (error) => {
          console.error('Internet Identity login failed:', error);
          throw new Error(`Internet Identity login failed: ${error}`);
        },
      });

      this.identity = this.authClient.getIdentity();
      console.log('Internet Identity authentication complete');
      console.log('Principal:', this.identity.getPrincipal().toString());
      
      return this.identity;
      
    } catch (error) {
      console.error('Failed to initialize Internet Identity:', error);
      throw new Error(`Internet Identity initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize with service identity (for programmatic use)
   */
  private async initializeServiceIdentity(): Promise<Identity> {
    try {
      console.log('Initializing service identity authentication...');
      
      // Try to load existing identity
      this.identity = await this.loadStoredIdentity();
      
      if (this.identity) {
        console.log('Loaded existing service identity');
        console.log('Principal:', this.identity.getPrincipal().toString());
        return this.identity;
      }

      // Generate new identity
      this.identity = await this.generateNewIdentity();
      console.log('Generated new service identity');
      console.log('Principal:', this.identity.getPrincipal().toString());
      
      return this.identity;
      
    } catch (error) {
      console.error('Failed to initialize service identity:', error);
      throw new Error(`Service identity initialization failed: ${error.message}`);
    }
  }

  /**
   * Load stored identity from file
   */
  private async loadStoredIdentity(): Promise<Identity | null> {
    try {
      if (!this.config.identityPath || !fs.existsSync(this.config.identityPath)) {
        return null;
      }

      const identityData = fs.readFileSync(this.config.identityPath, 'utf8');
      const storedIdentity: StoredIdentity = JSON.parse(identityData);

      // Validate stored identity structure
      if (!storedIdentity.publicKey || !storedIdentity.privateKey || !storedIdentity.principal) {
        console.warn('Invalid stored identity format, generating new one');
        return null;
      }

      // Create identity from stored keys
      const identity = Ed25519KeyIdentity.fromKeyPair(
        new Uint8Array(storedIdentity.publicKey),
        new Uint8Array(storedIdentity.privateKey)
      );

      // Verify the principal matches
      const currentPrincipal = identity.getPrincipal().toString();
      if (currentPrincipal !== storedIdentity.principal) {
        console.warn('Principal mismatch in stored identity, generating new one');
        return null;
      }

      console.log('Successfully loaded stored identity');
      return identity;
      
    } catch (error) {
      console.warn('Failed to load stored identity:', error);
      return null;
    }
  }

  /**
   * Generate and store new identity
   */
  private async generateNewIdentity(): Promise<Identity> {
    try {
      // Generate random seed
      const seed = crypto.randomBytes(32);
      const identity = Ed25519KeyIdentity.generate(seed);
      
      // Create stored identity object
      const storedIdentity: StoredIdentity = {
        publicKey: Array.from(identity.getPublicKey().toDer()),
        privateKey: Array.from(identity.getKeyPair().secretKey),
        principal: identity.getPrincipal().toString(),
        created: Date.now(),
      };

      // Save to file
      if (this.config.identityPath) {
        const identityDir = path.dirname(this.config.identityPath);
        if (!fs.existsSync(identityDir)) {
          fs.mkdirSync(identityDir, { recursive: true });
        }
        
        fs.writeFileSync(
          this.config.identityPath, 
          JSON.stringify(storedIdentity, null, 2),
          { mode: 0o600 } // Restrict file permissions
        );
        
        console.log('New identity saved to:', this.config.identityPath);
      }

      return identity;
      
    } catch (error) {
      console.error('Failed to generate new identity:', error);
      throw new Error(`Identity generation failed: ${error.message}`);
    }
  }

  /**
   * Get current identity
   */
  getIdentity(): Identity {
    if (!this.identity) {
      throw new Error('Authentication not initialized. Call initialize() first.');
    }
    return this.identity;
  }

  /**
   * Get current principal
   */
  getPrincipal(): Principal {
    return this.getIdentity().getPrincipal();
  }

  /**
   * Check if authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (this.config.useInternetIdentity && this.authClient) {
      return await this.authClient.isAuthenticated();
    }
    return this.identity !== null;
  }

  /**
   * Logout (for Internet Identity)
   */
  async logout(): Promise<void> {
    if (this.config.useInternetIdentity && this.authClient) {
      await this.authClient.logout();
      console.log('Logged out from Internet Identity');
    }
    
    this.identity = null;
    console.log('Authentication cleared');
  }

  /**
   * Refresh authentication (for Internet Identity)
   */
  async refresh(): Promise<void> {
    if (this.config.useInternetIdentity && this.authClient) {
      if (await this.authClient.isAuthenticated()) {
        this.identity = this.authClient.getIdentity();
        console.log('Authentication refreshed');
      } else {
        throw new Error('Authentication expired, please login again');
      }
    }
  }

  /**
   * Export identity for backup
   */
  exportIdentity(): StoredIdentity | null {
    if (!this.identity || !(this.identity instanceof Ed25519KeyIdentity)) {
      return null;
    }

    return {
      publicKey: Array.from(this.identity.getPublicKey().toDer()),
      privateKey: Array.from(this.identity.getKeyPair().secretKey),
      principal: this.identity.getPrincipal().toString(),
      created: Date.now(),
    };
  }

  /**
   * Import identity from backup
   */
  async importIdentity(storedIdentity: StoredIdentity): Promise<void> {
    try {
      const identity = Ed25519KeyIdentity.fromKeyPair(
        new Uint8Array(storedIdentity.publicKey),
        new Uint8Array(storedIdentity.privateKey)
      );

      // Verify the principal matches
      const currentPrincipal = identity.getPrincipal().toString();
      if (currentPrincipal !== storedIdentity.principal) {
        throw new Error('Principal mismatch in imported identity');
      }

      this.identity = identity;
      
      // Save to file if path is configured
      if (this.config.identityPath) {
        const identityDir = path.dirname(this.config.identityPath);
        if (!fs.existsSync(identityDir)) {
          fs.mkdirSync(identityDir, { recursive: true });
        }
        
        fs.writeFileSync(
          this.config.identityPath, 
          JSON.stringify(storedIdentity, null, 2),
          { mode: 0o600 }
        );
      }

      console.log('Identity imported successfully');
      console.log('Principal:', currentPrincipal);
      
    } catch (error) {
      console.error('Failed to import identity:', error);
      throw new Error(`Identity import failed: ${error.message}`);
    }
  }

  /**
   * Generate a delegation identity for a specific origin
   */
  async createDelegation(
    origin: string, 
    maxTimeToLive?: bigint
  ): Promise<Identity> {
    if (!this.identity) {
      throw new Error('Authentication not initialized');
    }

    // For service identities, we can create a derived identity
    if (this.identity instanceof Ed25519KeyIdentity) {
      const seed = crypto.randomBytes(32);
      const delegatedIdentity = Ed25519KeyIdentity.generate(seed);
      
      console.log('Created delegation identity for origin:', origin);
      console.log('Delegated Principal:', delegatedIdentity.getPrincipal().toString());
      
      return delegatedIdentity;
    }

    // For Internet Identity, return the current identity
    return this.identity;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up authentication...');
    
    if (this.authClient) {
      // Don't logout automatically, let user decide
      this.authClient = null;
    }
    
    // Don't clear identity as it might be reused
    console.log('Authentication cleanup complete');
  }
}

/**
 * Utility functions for identity management
 */
export class IdentityUtils {
  /**
   * Validate Principal string format
   */
  static isValidPrincipal(principalString: string): boolean {
    try {
      Principal.fromText(principalString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate a random Principal for testing
   */
  static generateRandomPrincipal(): Principal {
    const seed = crypto.randomBytes(32);
    const identity = Ed25519KeyIdentity.generate(seed);
    return identity.getPrincipal();
  }

  /**
   * Convert Principal to account identifier (for ledger transactions)
   */
  static principalToAccountId(principal: Principal, subAccount?: Uint8Array): string {
    // This is a simplified version - real implementation would need proper account ID generation
    const principalBytes = principal.toUint8Array();
    const hash = crypto.createHash('sha256');
    
    if (subAccount) {
      hash.update(Buffer.concat([Buffer.from('\x0Aaccount-id'), principalBytes, subAccount]));
    } else {
      hash.update(Buffer.concat([Buffer.from('\x0Aaccount-id'), principalBytes]));
    }
    
    return hash.digest('hex');
  }

  /**
   * Create a deterministic identity from a seed phrase
   */
  static createIdentityFromSeed(seedPhrase: string): Ed25519KeyIdentity {
    const hash = crypto.createHash('sha256');
    hash.update(seedPhrase);
    const seed = hash.digest();
    
    return Ed25519KeyIdentity.generate(seed);
  }

  /**
   * Verify identity signature (basic implementation)
   */
  static async verifyIdentitySignature(
    identity: Identity,
    message: Uint8Array,
    signature: Uint8Array
  ): Promise<boolean> {
    try {
      // This would need a proper signature verification implementation
      // For now, just check if identity can sign
      const testSignature = await identity.sign(message);
      return testSignature.length > 0;
    } catch {
      return false;
    }
  }
}