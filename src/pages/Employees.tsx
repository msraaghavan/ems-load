import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Plus, Mail, Phone } from 'lucide-react';
import { mockEmployees } from '@/lib/mockData';

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmployees = mockEmployees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'on_leave': return 'secondary';
      case 'inactive': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extralight tracking-wider">Employees</h1>
          <p className="text-muted-foreground mt-2 font-light tracking-wide">Manage your workforce</p>
        </div>
        <Button className="gap-2 font-light tracking-wide">
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search employees by name, department, or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-light"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <CardTitle className="text-lg font-light tracking-wide">{employee.name}</CardTitle>
                    <p className="text-sm text-muted-foreground font-light">{employee.position}</p>
                  </div>
                </div>
                <Badge variant={getStatusColor(employee.status)} className="capitalize">
                  {employee.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{employee.phone}</span>
                </div>
              </div>
              
              <div className="pt-3 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{employee.department}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="font-medium">{new Date(employee.joinDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Salary</span>
                  <span className="font-medium">${employee.salary.toLocaleString()}</span>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4 font-light tracking-wide">
                View Profile
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <p className="text-muted-foreground">No employees found matching your search.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
