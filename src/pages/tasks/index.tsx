/**
 * GENDO DASHBOARD
 * ===============
 * Task & project management with Kanban boards.
 */

"use client";

import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import {
  CheckSquare,
  FolderKanban,
  Clock,
  Users,
  Plus,
  ArrowRight,
  ListTodo,
  Calendar,
  Target,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";

// App theme color - Light blue
const APP_COLOR = "#64B5F6";

// Task modules
const modules = [
  {
    id: "projects",
    name: "Projects",
    description: "Organize work into projects with milestones",
    icon: FolderKanban,
    color: APP_COLOR,
    href: "/tasks/projects",
    stats: { active: 0, completed: 0 },
  },
  {
    id: "tasks",
    name: "Tasks",
    description: "Create and manage individual tasks",
    icon: CheckSquare,
    color: APP_COLOR,
    href: "/tasks/list",
    stats: { open: 0, inProgress: 0, done: 0 },
  },
  {
    id: "board",
    name: "Kanban Board",
    description: "Visual task management with drag & drop",
    icon: LayoutGrid,
    color: APP_COLOR,
    href: "/tasks/board",
    stats: { columns: 0, cards: 0 },
  },
  {
    id: "timeline",
    name: "Timeline",
    description: "View tasks and deadlines on a timeline",
    icon: Calendar,
    color: APP_COLOR,
    href: "/tasks/timeline",
    stats: { upcoming: 0, overdue: 0 },
  },
];

// Summary stats
const summaryStats = [
  {
    label: "Active Projects",
    value: "0",
    icon: FolderKanban,
    color: "bg-blue-500",
    change: "in progress",
  },
  {
    label: "Open Tasks",
    value: "0",
    icon: CheckSquare,
    color: "bg-green-500",
    change: "to do",
  },
  {
    label: "Hours Logged",
    value: "0h",
    icon: Clock,
    color: "bg-purple-500",
    change: "this week",
  },
  {
    label: "Team Members",
    value: "0",
    icon: Users,
    color: "bg-orange-500",
    change: "collaborating",
  },
];

export default function GenDoDashboard() {
  const router = useRouter();

  return (
    <AuthGuard checkSubscription={true}>
      <AppLayout activePage="Dashboard">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Tasks Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage projects, tasks, and track progress
              </p>
            </div>
            <Button
              onClick={() => router.push("/tasks/projects/new")}
              className="text-white rounded-xl"
              style={{ backgroundColor: APP_COLOR }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryStats.map((stat, index) => (
              <Card
                key={index}
                className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stat.color}`}>
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {stat.change}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Task Modules */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Task Management
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {modules.map((module) => (
                <Link key={module.id} href={module.href}>
                  <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl hover:shadow-lg transition-all duration-300 cursor-pointer group h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: `${module.color}15` }}
                        >
                          <module.icon
                            className="h-6 w-6"
                            style={{ color: module.color }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {module.name}
                            </h3>
                            <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-muted-foreground text-sm mb-4">
                            {module.description}
                          </p>
                          <div className="flex items-center gap-3 flex-wrap">
                            {Object.entries(module.stats).map(([key, value]) => (
                              <Badge
                                key={key}
                                variant="secondary"
                                className="rounded-full text-xs"
                              >
                                {value} {key}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Tasks */}
            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Recent Tasks
                </CardTitle>
                <CardDescription>
                  Your latest task updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <ListTodo className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    No tasks yet
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Create a project to start managing tasks
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common task operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/tasks/projects/new">
                  <div className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer" style={{ backgroundColor: `${APP_COLOR}10` }}>
                    <FolderKanban className="h-5 w-5" style={{ color: APP_COLOR }} />
                    <span className="font-medium text-foreground">
                      Create Project
                    </span>
                  </div>
                </Link>
                <Link href="/tasks/list/new">
                  <div className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer" style={{ backgroundColor: `${APP_COLOR}10` }}>
                    <CheckSquare className="h-5 w-5" style={{ color: APP_COLOR }} />
                    <span className="font-medium text-foreground">
                      Add Task
                    </span>
                  </div>
                </Link>
                <Link href="/tasks/board">
                  <div className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer" style={{ backgroundColor: `${APP_COLOR}10` }}>
                    <LayoutGrid className="h-5 w-5" style={{ color: APP_COLOR }} />
                    <span className="font-medium text-foreground">
                      Open Kanban Board
                    </span>
                  </div>
                </Link>
                <Link href="/tasks/timeline">
                  <div className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer" style={{ backgroundColor: `${APP_COLOR}10` }}>
                    <Calendar className="h-5 w-5" style={{ color: APP_COLOR }} />
                    <span className="font-medium text-foreground">
                      View Timeline
                    </span>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
