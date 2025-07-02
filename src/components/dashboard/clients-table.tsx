'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import type { WireGuardClient } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowDown, ArrowUp, Check, Pencil, CheckCircle2, XCircle, X, ArrowUpDown, Power, PowerOff, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getClientsAction, renameClientAction, toggleClientConnectionAction } from '@/app/actions/wireguard';

const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}


export default function ClientsTable() {
  const [clients, setClients] = useState<WireGuardClient[]>([]);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [now, setNow] = useState(new Date());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchClients = async () => {
    const freshClients = await getClientsAction();
    setClients(freshClients);
    if (isLoading) setIsLoading(false);
  };

  useEffect(() => {
    fetchClients();
    
    const dataInterval = setInterval(() => {
        startTransition(fetchClients);
    }, 5000);

    const timeInterval = setInterval(() => {
        setNow(new Date());
    }, 1000 * 30);

    return () => {
        clearInterval(dataInterval);
        clearInterval(timeInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedClients = useMemo(() => {
    let sortableItems = [...clients];
    if (sortConfig) {
      sortableItems.sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [clients, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
        return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    if (sortConfig.direction === 'ascending') {
        return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const handleEdit = (client: WireGuardClient) => {
    setEditingClientId(client.id);
    setEditingName(client.name);
  };

  const handleCancel = () => {
    setEditingClientId(null);
    setEditingName('');
  };

  const handleSave = (clientId: string) => {
    if (!editingName.trim()) return;
    startTransition(async () => {
      await renameClientAction(clientId, editingName);
      await fetchClients();
      handleCancel();
    });
  };

  const handleToggleConnection = (clientId: string) => {
    startTransition(async () => {
        await toggleClientConnectionAction(clientId);
        await fetchClients();
    });
  };

  if (isLoading) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>WireGuard Clients</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
          </Card>
      );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>WireGuard Clients</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">
                  <Button variant="ghost" onClick={() => requestSort('name')} className="-ml-4">
                    Name
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('status')} className="-ml-4">
                    Status
                    {getSortIcon('status')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('internalIp')} className="-ml-4">
                    Internal IP
                    {getSortIcon('internalIp')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('externalIp')} className="-ml-4">
                    External IP
                    {getSortIcon('externalIp')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('data.received')} className="-ml-4">
                    Data Transfer
                    {getSortIcon('data.received')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('lastSeen')} className="-ml-4">
                    Last Seen
                    {getSortIcon('lastSeen')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TooltipProvider>
                {sortedClients.map(client => (
                  <TableRow key={client.id} className={isPending ? 'opacity-50 transition-opacity' : ''}>
                    <TableCell className="font-medium">
                      {editingClientId === client.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            className="h-8"
                            disabled={isPending}
                          />
                        </div>
                      ) : (
                        client.name
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'connected' ? 'default' : 'secondary'} className={client.status === 'connected' ? 'bg-accent text-accent-foreground hover:bg-accent/80' : ''}>
                        {client.status === 'connected' ? (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-code">{client.internalIp}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-code">{client.externalIp}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <ArrowUp className="h-4 w-4" />
                              <span>{formatBytes(client.data.transmitted)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Transmitted</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <div className="flex items-center gap-1 text-muted-foreground">
                              <ArrowDown className="h-4 w-4" />
                              <span>{formatBytes(client.data.received)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Received</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                          <TooltipTrigger>
                             {formatDistanceToNow(new Date(client.lastSeen), { addSuffix: true, now })}
                          </TooltipTrigger>
                          <TooltipContent>
                              {new Date(client.lastSeen).toLocaleString()}
                          </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">
                      {editingClientId === client.id ? (
                        <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSave(client.id)} disabled={isPending}>
                              {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancel} disabled={isPending}>
                              <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                           <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleConnection(client.id)} disabled={isPending}>
                                        {isPending && !editingClientId ? <Loader2 className="h-4 w-4 animate-spin" /> : (client.status === 'connected' 
                                            ? <PowerOff className="h-4 w-4 text-destructive" /> 
                                            : <Power className="h-4 w-4 text-accent" />)}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {client.status === 'connected' ? 'Disconnect' : 'Connect'}
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(client)} disabled={isPending}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Edit Name
                                </TooltipContent>
                            </Tooltip>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TooltipProvider>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
