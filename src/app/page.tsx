import SystemMonitor from '@/components/dashboard/system-monitor';
import ClientsTable from '@/components/dashboard/clients-table';
import { Logo } from '@/components/icons/logo';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Logo className="h-6 w-6 mr-2 text-primary" />
            <span className="font-bold">WireMon Local</span>
          </div>
        </div>
      </header>
      <main className="container py-8">
        <div className="space-y-8">
          <SystemMonitor />
          <ClientsTable />
        </div>
      </main>
    </div>
  );
}
