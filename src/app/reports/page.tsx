'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMasterDataStore } from '@/lib/store';

interface Summary {
  id: string;
  name: string;
  budget: number;
  total_expenses: number;
  remaining: number;
}

export default function ReportsPage() {
  const { departments: deptData, projects: projectData } = useMasterDataStore();
  const [activeTab, setActiveTab] = useState<string>('departments');

  // Convert Zustand store data to Summary format
  const departments: Summary[] = deptData.map(d => ({
    id: d.id,
    name: d.name,
    budget: d.budget || 0,
    total_expenses: 0,
    remaining: (d.budget || 0)
  }));

  const projects: Summary[] = projectData.map(p => ({
    id: p.id,
    name: p.name,
    budget: p.budget || 0,
    total_expenses: 0,
    remaining: (p.budget || 0)
  }));

  // Mock events data for now
  const events: Summary[] = [
    {
      id: '1',
      name: '東京展示会2024',
      budget: 50000,
      total_expenses: 0,
      remaining: 50000
    },
    {
      id: '2',
      name: '大阪商談会',
      budget: 30000,
      total_expenses: 0,
      remaining: 30000
    },
    {
      id: '3',
      name: '名古屋セミナー',
      budget: 15000,
      total_expenses: 0,
      remaining: 15000
    }
  ];

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
