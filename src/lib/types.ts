export type SystemResource = {
  name: 'CPU' | 'Memory' | 'Disk';
  usage: number;
  total: number;
  unit: 'GB' | '%';
};

export type WireGuardClient = {
  id: string;
  name: string;
  internalIp: string;
  externalIp: string;
  status: 'connected' | 'disconnected';
  data: {
    transmitted: number; // in MB
    received: number; // in MB
  };
  lastSeen: string;
};
