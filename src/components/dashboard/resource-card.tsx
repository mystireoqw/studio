import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ResourceCardProps {
  title: string;
  icon: React.ReactNode;
  usage: number;
  total: number;
  unit: '%' | 'GB';
}

export function ResourceCard({ title, icon, usage, total, unit }: ResourceCardProps) {
  const percentage = (usage / total) * 100;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {unit === '%' ? `${usage.toFixed(0)}${unit}` : `${usage.toFixed(1)} ${unit}`}
        </div>
        {unit !== '%' && (
          <p className="text-xs text-muted-foreground">
            out of {total} {unit} used
          </p>
        )}
        <Progress value={percentage} className="mt-4 h-2 transition-all duration-500 ease-in-out" />
      </CardContent>
    </Card>
  );
}
