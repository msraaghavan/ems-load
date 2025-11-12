import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const Header = () => {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-foreground" />
        <div>
          <h1 className="text-lg font-light tracking-wider text-foreground">ELEVATE</h1>
          <p className="text-xs text-muted-foreground font-light tracking-wide">Workforce Management</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-accent text-accent-foreground text-xs font-light">
            3
          </Badge>
        </Button>
      </div>
    </header>
  );
};
