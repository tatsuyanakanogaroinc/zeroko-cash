'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { departmentService, eventService, projectService, expenseService } from '@/lib/database';

interface Expense {
  id: string;
  amount: number;
  category_id: string;
  event_id?: string;
  project_id?: string;
  user_id: string;
}

interface Summary {
  id: string;
  name: string;
  budget: number;
  total_expenses: number;
  remaining: number;
}

export default function ReportsPage() {
  const [departments, setDepartments] = useState<Summary[]>([]);
  const [events, setEvents] = useState<Summary[]>([]);
  const [projects, setProjects] = useState<Summary[]>([]);
  const [activeTab, setActiveTab] = useState<'departments' | 'events' | 'projects'>('departments');

  useEffect(() => {
    const fetchData = async () => {
      const deptData = await departmentService.getDepartments();
      setDepartments(deptData.map(d => ({
        id: d.id,
        name: d.name,
        budget: d.budget,
        total_expenses: 0,
        remaining: d.budget
      })));

      const eventData = await eventService.getEvents();
      setEvents(eventData.map(e => ({
        id: e.id,
        name: e.name,
        budget: e.budget,
        total_expenses: 0,
        remaining: e.budget
      })));

      const projectData = await projectService.getProjects();
      setProjects(projectData.map(p => ({
        id: p.id,
        name: p.name,
        budget: p.budget,
        total_expenses: 0,
        remaining: p.budget
      })));
    };

    fetchData();
  }, []);

  return (
    <MainLayout>
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>
          <TabsContent value="departments">
            {departments.map(department => (
              <Card key={department.id}>
                <CardHeader>
                  <CardTitle>{department.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Budget: ¥{department.budget.toLocaleString()}</p>
                  <p>Total Expenses: ¥{department.total_expenses.toLocaleString()}</p>
                  <p>Remaining Budget: ¥{department.remaining.toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="events">
            {events.map(event => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Budget: ¥{event.budget.toLocaleString()}</p>
                  <p>Total Expenses: ¥{event.total_expenses.toLocaleString()}</p>
                  <p>Remaining Budget: ¥{event.remaining.toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="projects">
            {projects.map(project => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Budget: ¥{project.budget.toLocaleString()}</p>
                  <p>Total Expenses: ¥{project.total_expenses.toLocaleString()}</p>
                  <p>Remaining Budget: ¥{project.remaining.toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
