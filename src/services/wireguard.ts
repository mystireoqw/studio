import type { WireGuardClient } from '@/lib/types';

// In a real application, this data would come from a database or by parsing
// the WireGuard configuration file and command output. Client names (metadata)
// are often stored separately as `wg` doesn't manage friendly names.
let clients: WireGuardClient[] = [
  {
    id: '1',
    name: "John's MacBook Pro",
    publicKey: 'aJ5iR3ZlY3JlZSBwbGFjZWhvbGRlcgo=',
    internalIp: '10.0.0.2',
    externalIp: '123.45.67.89',
    status: 'connected',
    data: { transmitted: 1240 * 1024 * 1024, received: 5320 * 1024 * 1024 }, // In bytes
    lastSeen: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  {
    id: '2',
    name: 'Office Server',
    publicKey: 'bK6jS4ZlY3JlZSBwbGFjZWhvbGRlcgo=',
    internalIp: '10.0.0.3',
    externalIp: '98.76.54.32',
    status: 'connected',
    data: { transmitted: 890 * 1024 * 1024, received: 12000 * 1024 * 1024 },
    lastSeen: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: '3',
    name: "Jane's iPhone",
    publicKey: 'cL7kT5ZlY3JlZSBwbGFjZWhvbGRlcgo=',
    internalIp: '10.0.0.4',
    externalIp: '12.34.56.78',
    status: 'disconnected',
    data: { transmitted: 50 * 1024 * 1024, received: 150 * 1024 * 1024 },
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

// --- SIMULATED BACKEND SERVICE ---
// The following functions simulate a backend service that would interact with
// your WireGuard server. In a real-world scenario, these functions would
// contain logic to SSH into your server and execute `wg` commands, or call
// a dedicated API on your WireGuard server.

/**
 * Fetches the list of all WireGuard clients.
 * In a real implementation, this would run `wg show all dump` on the server
 * and parse the output. Client names would likely be stored separately.
 */
export async function getClients(): Promise<WireGuardClient[]> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 200));

  // Simulate data usage fluctuations for connected clients
  clients = clients.map(client => {
    if (client.status === 'connected') {
      return {
        ...client,
        data: {
          transmitted: client.data.transmitted + Math.floor(Math.random() * 10000000), // ~10MB
          received: client.data.received + Math.floor(Math.random() * 50000000), // ~50MB
        },
        lastSeen: new Date().toISOString(),
      };
    }
    return client;
  });

  return JSON.parse(JSON.stringify(clients)); // Return a deep copy
}

/**
 * Toggles the connection status of a client.
 * In a real implementation, this would enable or disable a peer.
 * Disabling: `wg set wg0 peer <PUBLIC_KEY> remove`
 * Enabling: Add the peer back to the config and reload WireGuard.
 * This is a simplified simulation.
 */
export async function toggleConnection(clientId: string): Promise<WireGuardClient | null> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const client = clients.find(c => c.id === clientId);
  if (client) {
    const isConnected = client.status === 'connected';
    client.status = isConnected ? 'disconnected' : 'connected';
    if (client.status === 'connected') {
      client.lastSeen = new Date().toISOString();
    }
    return { ...client };
  }
  return null;
}

/**
 * Renames a client.
 * In a real implementation, this would update the client's name in your
 * database or configuration management system.
 */
export async function renameClient(clientId: string, newName: string): Promise<WireGuardClient | null> {
  await new Promise(resolve => setTimeout(resolve, 200));
  const client = clients.find(c => c.id === clientId);
  if (client && newName.trim()) {
    client.name = newName.trim();
    return { ...client };
  }
  return null;
}
