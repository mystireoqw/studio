'use server';

import type { WireGuardClient } from '@/lib/types';
import { NodeSSH } from 'node-ssh';
import fs from 'fs/promises';
import path from 'path';

// --- IMPORTANT: REAL-WORLD IMPLEMENTATION GUIDE ---
// This file now contains a REAL implementation for connecting to a WireGuard
// server via SSH to fetch live data and manage clients.

// --- PREREQUISITES ---
// 1. CONFIGURE YOUR SERVER DETAILS:
//    - Ensure you have a `.env.local` file in your project root.
//    - Fill in WG_HOST, WG_USER, WG_PRIVATE_KEY_PATH, and WG_INTERFACE.
//    - The user specified in WG_USER must have passwordless sudo access
//      to run `wg` commands.

// 2. DATA PERSISTENCE:
//    - WireGuard itself doesn't store friendly names. This implementation
//      uses an in-memory array (`clientsDB`) to store these names, linking
//      them by public key.
//    - In a production environment, you should replace this in-memory array
//      with a persistent database (e.g., Firestore, PostgreSQL, or a simple
//      JSON file on the server) to store client names and other metadata.

// This acts as a simple, in-memory database for client names.
// In a real app, this would be a database. You must replace these public keys
// with the actual public keys of your clients.
let clientsDB: Omit<WireGuardClient, 'status' | 'data' | 'lastSeen' | 'externalIp'>[] = [
  {
    id: '1',
    name: "John's MacBook Pro",
    publicKey: 'REPLACE_WITH_CLIENT_1_PUBLIC_KEY',
    internalIp: '10.0.0.2',
  },
  {
    id: '2',
    name: 'Office Server',
    publicKey: 'REPLACE_WITH_CLIENT_2_PUBLIC_KEY',
    internalIp: '10.0.0.3',
  },
  {
    id: '3',
    name: "Jane's iPhone",
    publicKey: 'REPLACE_WITH_CLIENT_3_PUBLIC_KEY',
    internalIp: '10.0.0.4',
  },
];

const ssh = new NodeSSH();

async function getSshConnection() {
  if (ssh.isConnected()) {
    return ssh;
  }
  const privateKeyPath = path.resolve(process.env.WG_PRIVATE_KEY_PATH!);
  const privateKey = await fs.readFile(privateKeyPath, 'utf8');

  await ssh.connect({
    host: process.env.WG_HOST!,
    username: process.env.WG_USER!,
    privateKey: privateKey,
  });
  return ssh;
}

async function runSshCommand(command: string) {
  try {
    const sshConnection = await getSshConnection();
    const result = await sshConnection.execCommand(command);
    if (result.code !== 0) {
      console.error(`SSH command failed: ${command}`, result.stderr);
      throw new Error(`Command failed with code ${result.code}: ${result.stderr}`);
    }
    return result.stdout;
  } catch (error) {
    console.error(`Error executing SSH command: ${command}`, error);
    if (ssh.isConnected()) {
      ssh.dispose();
    }
    throw error;
  }
}

/**
 * Fetches the list of all WireGuard clients with live data from the server.
 */
export async function getClients(): Promise<WireGuardClient[]> {
  try {
    const command = `sudo wg show ${process.env.WG_INTERFACE} dump`;
    const dumpOutput = await runSshCommand(command);

    const lines = dumpOutput.trim().split('\n');
    const liveClientsData = new Map<string, Partial<WireGuardClient>>();
    
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split('\t');
      if (parts.length < 7) continue;

      const [publicKey, _presharedKey, endpoint, allowedIps, latestHandshake, transferRx, transferTx] = parts;

      liveClientsData.set(publicKey, {
        publicKey,
        externalIp: endpoint.split(':')[0],
        internalIp: allowedIps.split('/')[0],
        lastSeen: new Date(parseInt(latestHandshake) * 1000).toISOString(),
        data: {
          received: parseInt(transferRx),
          transmitted: parseInt(transferTx),
        },
        status: (Date.now() / 1000 - parseInt(latestHandshake)) < 180 ? 'connected' : 'disconnected',
      });
    }

    const mergedClients = clientsDB.map(dbClient => {
      const liveData = liveClientsData.get(dbClient.publicKey);
      if (liveData) {
        return { ...dbClient, ...liveData } as WireGuardClient;
      } else {
        return {
          ...dbClient,
          externalIp: 'N/A',
          status: 'disconnected',
          data: { transmitted: 0, received: 0 },
          lastSeen: new Date(0).toISOString(),
        } as WireGuardClient;
      }
    });

    return mergedClients;

  } catch (error) {
    console.error("Failed to get clients from WireGuard server:", error);
    // You might want to add error handling in the UI for this case.
    return [];
  }
}

/**
 * Toggles a client's connection state.
 */
export async function toggleConnection(clientId: string): Promise<void> {
  const clientInDB = clientsDB.find(c => c.id === clientId);
  if (!clientInDB) {
    throw new Error(`Client with ID ${clientId} not found in local database.`);
  }

  const currentClients = await getClients();
  const currentClientState = currentClients.find(c => c.id === clientId);
  if (!currentClientState) {
    throw new Error(`Could not retrieve current state for client ID ${clientId}.`);
  }
  
  if (currentClientState.status === 'connected') {
    console.log(`Disabling client: ${clientInDB.name}`);
    const command = `sudo wg set ${process.env.WG_INTERFACE} peer ${clientInDB.publicKey} remove`;
    await runSshCommand(command);
  } else {
    // WARNING: This is a simplification. It assumes the client does not use a
    // preshared key. A robust solution would need to manage the full configuration.
    console.log(`Enabling client: ${clientInDB.name}`);
    const command = `sudo wg set ${process.env.WG_INTERFACE} peer ${clientInDB.publicKey} allowed-ips ${clientInDB.internalIp}/32`;
    await runSshCommand(command);
  }
}

/**
 * Renames a client.
 */
export async function renameClient(clientId: string, newName: string): Promise<void> {
  const client = clientsDB.find(c => c.id === clientId);
  if (client && newName.trim()) {
    client.name = newName.trim();
    // In a real app, you would save this change to your persistent database.
    console.log(`Renamed client ${clientId} to "${newName.trim()}" in the local database.`);
  } else {
    throw new Error(`Could not rename client with ID ${clientId}.`);
  }
}
