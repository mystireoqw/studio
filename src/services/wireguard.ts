import type { WireGuardClient } from '@/lib/types';

// --- IMPORTANT: REAL-WORLD IMPLEMENTATION GUIDE ---
// This file is a blueprint for connecting to a real WireGuard server.
// The current code uses mock data and does NOT make real connections.
//
// To make this work with your server, you need to:
//
// 1. CONFIGURE YOUR SERVER DETAILS:
//    - Create a file named `.env.local` in the root of your project.
//    - Copy the contents of `.env.local.example` into it.
//    - Fill in your WireGuard server's IP, SSH user, and the path to your SSH key.
//
// 2. IMPLEMENT THE LOGIC:
//    - You need a way to run commands on your server via SSH. The Node.js
//      `child_process` module or a library like `node-ssh` can do this.
//    - Replace the mock data logic in the functions below with your real
//      SSH command logic. We've included comments with the `wg` commands
//      you'll need to run.

// This is mock data. In a real implementation, you would fetch this from a
// database and merge it with live data from the `wg` command.
// WireGuard itself doesn't store friendly names, so you need to store them elsewhere.
let clients: WireGuardClient[] = [
  {
    id: '1',
    name: "John's MacBook Pro",
    publicKey: 'aJ5iR3ZlY3JlZSBwbGFjZWhvbGRlcgo=',
    internalIp: '10.0.0.2',
    externalIp: '123.45.67.89',
    status: 'connected',
    data: { transmitted: 1240 * 1024 * 1024, received: 5320 * 1024 * 1024 },
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

/**
 * Fetches the list of all WireGuard clients.
 */
export async function getClients(): Promise<WireGuardClient[]> {
  // --- REAL IMPLEMENTATION ---
  // 1. Run this command on your server: `wg show all dump`
  //    This gives you live data for all peers.
  //
  // 2. Parse the tab-separated output. Each line is a client. The columns are:
  //    public_key, preshared_key, endpoint, allowed_ips, latest_handshake,
  //    transfer_rx, transfer_tx, persistent_keepalive
  //
  // 3. Merge this live data with your stored client names (from the `clients`
  //    array above or a real database). Match them by public_key.
  //
  // 4. Return the merged and updated list of clients.

  console.log("getClients: Using mock data. Implement real logic in src/services/wireguard.ts");
  // Simulate network latency and data fluctuation
  await new Promise(resolve => setTimeout(resolve, 200));
  return clients.map(client => {
    if (client.status === 'connected') {
      return {
        ...client,
        data: {
          transmitted: client.data.transmitted + Math.floor(Math.random() * 10000000),
          received: client.data.received + Math.floor(Math.random() * 50000000),
        },
        lastSeen: new Date().toISOString(),
      };
    }
    return client;
  });
}

/**
 * Toggles a client's connection.
 * This is a simplified simulation. A real implementation is more complex.
 */
export async function toggleConnection(clientId: string): Promise<WireGuardClient | null> {
  const client = clients.find(c => c.id === clientId);
  if (!client) return null;

  // --- REAL IMPLEMENTATION ---
  // Toggling a connection requires modifying the server's configuration.
  // Disabling is easier than enabling.
  //
  // TO DISABLE: Run `sudo wg set <interface> peer <PUBLIC_KEY> remove`
  //   Example: `sudo wg set wg0 peer aJ5iR3ZlY3JlZSBwbGFjZWhvbGRlcgo= remove`
  //
  // TO ENABLE: You must add the peer's config block back to the wg0.conf
  //   file and then reload the WireGuard service. This is complex and
  //   requires careful scripting.
  //
  // Update the status based on the command's success.

  console.log("toggleConnection: Using mock data. Implement real logic in src/services/wireguard.ts");
  await new Promise(resolve => setTimeout(resolve, 500));
  client.status = client.status === 'connected' ? 'disconnected' : 'connected';
  if (client.status === 'connected') {
    client.lastSeen = new Date().toISOString();
  }
  return { ...client };
}

/**
 * Renames a client.
 */
export async function renameClient(clientId: string, newName: string): Promise<WireGuardClient | null> {
  // --- REAL IMPLEMENTATION ---
  // WireGuard does not store friendly names. This function should update
  // the name in your chosen database (e.g., Firestore, PostgreSQL, or
  // even a simple JSON file on the server). The current implementation
  // just updates the in-memory array.

  console.log("renameClient: Using mock data. Implement real logic in src/services/wireguard.ts");
  await new Promise(resolve => setTimeout(resolve, 200));
  const client = clients.find(c => c.id === clientId);
  if (client && newName.trim()) {
    client.name = newName.trim();
    return { ...client };
  }
  return null;
}
