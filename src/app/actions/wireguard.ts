'use server';

import { revalidatePath } from 'next/cache';
import * as wireguardService from '@/services/wireguard';

export async function getClientsAction() {
  return wireguardService.getClients();
}

export async function toggleClientConnectionAction(clientId: string) {
  await wireguardService.toggleConnection(clientId);
  revalidatePath('/'); // This helps ensure data consistency across the app
}

export async function renameClientAction(clientId: string, newName: string) {
  await wireguardService.renameClient(clientId, newName);
  revalidatePath('/');
}
