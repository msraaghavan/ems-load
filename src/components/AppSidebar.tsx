import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Building2, 
  FileText,
  MapPin,
  LogOut,
  Ticket
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';

const allMenuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'hr', 'department_head', 'employee'] },
  { title: 'Employees', url: '/employees', icon: Users, roles: ['admin', 'hr', 'department_head'] },
  { title: 'Attendance', url: '/attendance', icon: Clock, roles: ['admin', 'hr', 'department_head', 'employee'] },
  { title: 'Leave', url: '/leave', icon: Calendar, roles: ['admin', 'hr', 'department_head', 'employee'] },
  { title: 'Payroll', url: '/payroll', icon: DollarSign, roles: ['admin', 'hr', 'employee'] },
  { title: 'Performance', url: '/performance', icon: TrendingUp, roles: ['admin', 'hr', 'department_head', 'employee'] },
  { title: 'Departments', url: '/departments', icon: Building2, roles: ['admin', 'hr', 'department_head'] },
  { title: 'Reports', url: '/reports', icon: FileText, roles: ['admin', 'hr'] },
  { title: 'Geofences', url: '/geofences', icon: MapPin, roles: ['admin'] },
  { title: 'Invite Codes', url: '/invite-codes', icon: Ticket, roles: ['admin'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useSupabaseAuth();
  const { role, loading: roleLoading } = useUserRole();
  const isCollapsed = state === 'collapsed';

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => 
    role && item.roles.includes(role)
  );

  if (roleLoading) {
    return (
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarContent className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="px-4 py-6">
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center">
                <Building2 className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-sidebar-foreground">EMS</h2>
                <p className="text-xs text-sidebar-foreground/60">Management Portal</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6 text-accent-foreground" />
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 text-sidebar-foreground hover:text-sidebar-primary transition-colors"
                      activeClassName="text-sidebar-primary bg-sidebar-accent"
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sidebar-foreground hover:text-sidebar-primary"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="icon"
            className="w-10 h-10 mx-auto text-sidebar-foreground hover:text-sidebar-primary"
            onClick={signOut}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
