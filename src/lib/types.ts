export type SystemResource = {
  name: 'CPU' | 'Memory' | 'Disk';
  usage: number;
  total: number;
  unit: 'GB' | '%';
};

export type WireGuardClient = {
  id: string;
  name: string;
  publicKey: string;
  internalIp: string;
  externalIp: string;
  status: 'connected' | 'disconnected';
  data: {
    transmitted: number; // in bytes
    received: number; // in bytes
  };
  lastSeen: string;
};
