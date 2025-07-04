'use server';

import { revalidatePath } from 'next/cache';
import type { WireGuardClient } from '@/lib/types';
import { NodeSSH } from 'node-ssh';

// --- IMPORTANT: REAL-WORLD IMPLEMENTATION GUIDE ---
// This file contains the REAL implementation for connecting to a WireGuard
// server via SSH to fetch live data and manage clients.
// It is marked as a Next.js Server Action module ('use server').

// --- PREREQUISITES ---
// 1. SSH ACCESS:
//    - Ensure you have passwordless SSH access to your WireGuard server
//      from the machine running this application.
//    - The user in WG_USER must have passwordless sudo access for `wg`.
//
// 2. CONFIGURE YOUR SERVER DETAILS:
//    - Fill in WG_HOST, WG_USER, and WG_INTERFACE in your .env.local file.
//
// 3. DATA PERSISTENCE:
//    - This implementation uses an in-memory array (`clientsDB`) for names.
//    - In production, replace this with a persistent database.

// This acts as a simple, in-memory database for client names.
// You must replace these public keys with the actual public keys of your clients.
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

// Internal helper to establish SSH connection
async function getSshConnection() {
  if (ssh.isConnected()) {
    return ssh;
  }
  await ssh.connect({
    host: process.env.WG_HOST!,
    username: process.env.WG_USER!,
  });
  return ssh;
}

// Internal helper to run commands over SSH
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

// Internal helper to fetch and merge client data
async function getClients(): Promise<WireGuardClient[]> {
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
    return [];
  }
}

// --- EXPORTED SERVER ACTIONS ---

export async function getClientsAction() {
  return getClients();
}

export async function toggleClientConnectionAction(clientId: string) {
  const clientInDB = clientsDB.find(c => c.id === clientId);
  if (!clientInDB) {
    throw new Error(`Client with ID ${clientId} not found in local database.`);
  }

  const currentClients = await getClients(); // Fetch current state
  const currentClientState = currentClients.find(c => c.id === clientId);
  if (!currentClientState) {
    throw new Error(`Could not retrieve current state for client ID ${clientId}.`);
  }
  
  if (currentClientState.status === 'connected') {
    console.log(`Disabling client: ${clientInDB.name}`);
    const command = `sudo wg set ${process.env.WG_INTERFACE} peer ${clientInDB.publicKey} remove`;
    await runSshCommand(command);
  } else {
    console.log(`Enabling client: ${clientInDB.name}`);
    const command = `sudo wg set ${process.env.WG_INTERFACE} peer ${clientInDB.publicKey} allowed-ips ${clientInDB.internalIp}/32`;
    await runSshCommand(command);
  }

  revalidatePath('/');
}

export async function renameClientAction(clientId: string, newName: string) {
  const client = clientsDB.find(c => c.id === clientId);
  if (client && newName.trim()) {
    client.name = newName.trim();
    // In a real app, you would save this change to your persistent database.
    console.log(`Renamed client ${clientId} to "${newName.trim()}" in the local database.`);
  } else {
    throw new Error(`Could not rename client with ID ${clientId}.`);
  }
  revalidatePath('/');
}
