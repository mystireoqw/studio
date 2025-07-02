'use client';

import { useState, useEffect, useMemo } from 'react';
import type { WireGuardClient } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowDown, ArrowUp, Check, Pencil, CheckCircle2, XCircle, X, ArrowUpDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const initialClients: WireGuardClient[] = [
  {
    id: '1',
    name: 'John\'s MacBook Pro',
    internalIp: '10.0.0.2',
    externalIp: '123.45.67.89',
    status: 'connected',
    data: { transmitted: 1240, received: 5320 },
    lastSeen: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  {
    id: '2',
    name: 'Office Server',
    internalIp: '10.0.0.3',
    externalIp: '98.76.54.32',
    status: 'connected',
    data: { transmitted: 890, received: 12000 },
    lastSeen: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: '3',
    name: 'Jane\'s iPhone',
    internalIp: '10.0.0.4',
    externalIp: '12.34.56.78',
    status: 'disconnected',
    data: { transmitted: 50, received: 150 },
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
];

const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export default function ClientsTable() {
  const [clients, setClients] = useState<WireGuardClient[]>(initialClients);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [now, setNow] = useState(new Date());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });

  useEffect(() => {
    const dataInterval = setInterval(() => {
      setClients(prevClients =>
        prevClients.map(client => {
          if (client.status === 'connected') {
            return {
              ...client,
              data: {
                transmitted: client.data.transmitted + Math.floor(Math.random() * 10),
                received: client.data.received + Math.floor(Math.random() * 50),
              },
              lastSeen: new Date().toISOString(),
            };
          }
          return client;
        })
      );
    }, 5000);

    const timeInterval = setInterval(() => {
        setNow(new Date());
    }, 1000 * 30);

    return () => {
        clearInterval(dataInterval);
        clearInterval(timeInterval);
    };
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
    setClients(clients.map(c => (c.id === clientId ? { ...c, name: editingName } : c)));
    handleCancel();
  };

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
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {editingClientId === client.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            className="h-8"
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
                              <span>{(client.data.transmitted / 1024).toFixed(2)} GB</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Transmitted</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <div className="flex items-center gap-1 text-muted-foreground">
                              <ArrowDown className="h-4 w-4" />
                              <span>{(client.data.received / 1024).toFixed(2)} GB</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Received</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                          <TooltipTrigger>
                             {formatDistanceToNow(new Date(client.lastSeen), { addSuffix: true })}
                          </TooltipTrigger>
                          <TooltipContent>
                              {new Date(client.lastSeen).toLocaleString()}
                          </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">
                      {editingClientId === client.id ? (
                        <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSave(client.id)}>
                              <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancel}>
                              <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(client)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
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
