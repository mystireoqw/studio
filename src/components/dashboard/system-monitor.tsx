'use client';

import { useState, useEffect } from 'react';
import type { SystemResource } from '@/lib/types';
import { ResourceCard } from '@/components/dashboard/resource-card';
import { Cpu, MemoryStick, HardDrive } from 'lucide-react';

const initialResources: SystemResource[] = [
  { name: 'CPU', usage: 34, total: 100, unit: '%' },
  { name: 'Memory', usage: 8.2, total: 16, unit: 'GB' },
  { name: 'Disk', usage: 150, total: 512, unit: 'GB' },
];

export default function SystemMonitor() {
  const [resources, setResources] = useState<SystemResource[]>(initialResources);

  useEffect(() => {
    const interval = setInterval(() => {
      setResources((prevResources) =>
        prevResources.map((resource) => {
          let newUsage = resource.usage;
          if (resource.name === 'CPU') {
            newUsage = Math.floor(Math.random() * 60) + 20; // Fluctuate between 20-80%
          } else if (resource.name === 'Memory') {
            const change = (Math.random() - 0.5) * 0.5; // Small fluctuation
            newUsage = Math.max(0, Math.min(resource.total, resource.usage + change));
          }
          return { ...resource, usage: newUsage };
        })
      );
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const getIcon = (name: SystemResource['name']) => {
    switch (name) {
      case 'CPU':
        return <Cpu className="h-6 w-6 text-muted-foreground" />;
      case 'Memory':
        return <MemoryStick className="h-6 w-6 text-muted-foreground" />;
      case 'Disk':
        return <HardDrive className="h-6 w-6 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight mb-4">System Resources</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.name}
            title={resource.name}
            icon={getIcon(resource.name)}
            usage={resource.usage}
            total={resource.total}
            unit={resource.unit}
          />
        ))}
      </div>
    </section>
  );
}
