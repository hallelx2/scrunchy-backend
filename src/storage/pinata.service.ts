import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';

@Injectable()
export class PinataService {
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly gatewayUrl = 'https://gateway.pinata.cloud';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ipfs.pinataApiKey') || '';
    this.secretKey = this.configService.get<string>('ipfs.pinataSecret') || '';
  }

  /**
   * Upload file to IPFS via Pinata
   */
  async uploadFile(file: Buffer | string, fileName: string): Promise<string> {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Pinata API credentials not configured');
    }

    const formData = new FormData();
    
    if (Buffer.isBuffer(file)) {
      formData.append('file', file, fileName);
    } else {
      // If it's a file path
      formData.append('file', fs.createReadStream(file));
    }

    // Pinata options
    const pinataMetadata = JSON.stringify({
      name: fileName,
    });

    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });

    formData.append('pinataMetadata', pinataMetadata);
    formData.append('pinataOptions', pinataOptions);

    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            pinata_api_key: this.apiKey,
            pinata_secret_api_key: this.secretKey,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );

      const ipfsHash = response.data.IpfsHash;
      return `ipfs://${ipfsHash}`;
    } catch (error) {
      throw new Error(`Failed to upload to Pinata: ${error.message}`);
    }
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadJSON(metadata: any, name?: string): Promise<string> {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Pinata API credentials not configured');
    }

    const pinataMetadata = {
      name: name || 'metadata',
    };

    const pinataOptions = {
      cidVersion: 1,
    };

    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          pinataContent: metadata,
          pinataMetadata,
          pinataOptions,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: this.apiKey,
            pinata_secret_api_key: this.secretKey,
          },
        },
      );

      const ipfsHash = response.data.IpfsHash;
      return `ipfs://${ipfsHash}`;
    } catch (error) {
      throw new Error(`Failed to upload JSON to Pinata: ${error.message}`);
    }
  }

  /**
   * Get IPFS gateway URL
   */
  getGatewayUrl(ipfsUri: string): string {
    if (ipfsUri.startsWith('ipfs://')) {
      const hash = ipfsUri.replace('ipfs://', '');
      return `${this.gatewayUrl}/ipfs/${hash}`;
    }
    return ipfsUri;
  }

  /**
   * Check if Pinata is configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.secretKey);
  }
}


