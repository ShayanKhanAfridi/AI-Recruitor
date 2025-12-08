import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Interview } from "@shared/schema";
import {
  Plus,
  Video,
  Copy,
  Check,
  Users,
  Clock,
  Calendar,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
} from "lucide-react";

const createInterviewSchema = z.object({
  candidateName: z.string().min(1, "Candidate name is required"),
  candidateEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  role: z.string().min(1, "Role is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

type CreateInterviewForm = z.infer<typeof createInterviewSchema>;

export default function DashboardPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: interviews, isLoading, refetch } = useQuery<Interview[]>({
    queryKey: ["/api/interviews"],
  });

  const form = useForm<CreateInterviewForm>({
    resolver: zodResolver(createInterviewSchema),
    defaultValues: {
      candidateName: "",
      candidateEmail: "",
      role: "",
      startTime: "",
      endTime: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateInterviewForm) => {
      return await apiRequest("POST", "/api/interviews", {
        ...data,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Interview Created",
        description: "The interview has been scheduled successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create interview",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateInterviewForm) => {
    createMutation.mutate(data);
  };

  const copyToClipboard = async (interview: Interview) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/interview/${interview.id}`;
    
    try {
      // Fetch the actual password from the secure endpoint
      const credRes = await fetch(`/api/interviews/${interview.id}/credentials`);
      const credentials = await credRes.json();
      const text = `Interview Link: ${link}\nPassword: ${credentials.password}`;
      
      await navigator.clipboard.writeText(text);
      setCopiedId(interview.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copied!",
        description: "Interview link and password copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const getInterviewStatus = (interview: Interview) => {
    const now = new Date();
    const start = new Date(interview.startTime);
    const end = new Date(interview.endTime);

    if (interview.isUsed) {
      return { label: "Completed", variant: "secondary" as const };
    }
    if (now < start) {
      return { label: "Scheduled", variant: "outline" as const };
    }
    if (now > end) {
      return { label: "Expired", variant: "destructive" as const };
    }
    return { label: "Active", variant: "default" as const };
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const stats = {
    total: interviews?.length || 0,
    active: interviews?.filter((i) => {
      const now = new Date();
      const start = new Date(i.startTime);
      const end = new Date(i.endTime);
      return now >= start && now <= end && !i.isUsed;
    }).length || 0,
    completed: interviews?.filter((i) => i.isUsed).length || 0,
    scheduled: interviews?.filter((i) => new Date(i.startTime) > new Date()).length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">AI Interview System</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Admin Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh">
              <RefreshCw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2" data-testid="button-create-interview">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Interview</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule New Interview</DialogTitle>
                  <DialogDescription>
                    Create a new interview session. The candidate will receive a unique link and password.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="candidateName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Candidate Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="John Doe"
                              data-testid="input-candidate-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="candidateEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="john@example.com"
                              data-testid="input-candidate-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position/Role</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Software Engineer"
                              data-testid="input-role"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="datetime-local"
                                data-testid="input-start-time"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="datetime-local"
                                data-testid="input-end-time"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createMutation.isPending}
                      data-testid="button-submit-interview"
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Interview"
                      )}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <Card className="border-card-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold" data-testid="stat-total">{stats.total}</p>
                  <p className="text-xs text-muted-foreground truncate">Total Interviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold" data-testid="stat-active">{stats.active}</p>
                  <p className="text-xs text-muted-foreground truncate">Active Now</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold" data-testid="stat-scheduled">{stats.scheduled}</p>
                  <p className="text-xs text-muted-foreground truncate">Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold" data-testid="stat-completed">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground truncate">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interviews Table */}
        <Card className="border-card-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Scheduled Interviews</CardTitle>
            <CardDescription>Manage and track all interview sessions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !interviews || interviews.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1">No interviews scheduled</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first interview to get started
                </p>
                <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Interview
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead className="hidden sm:table-cell">Role</TableHead>
                      <TableHead className="hidden md:table-cell">Schedule</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interviews.map((interview) => {
                      const status = getInterviewStatus(interview);
                      return (
                        <TableRow key={interview.id} data-testid={`row-interview-${interview.id}`}>
                          <TableCell>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{interview.candidateName}</p>
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                ID: {interview.id}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className="truncate max-w-[150px]">
                              {interview.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="text-sm">
                              <p>{formatDateTime(interview.startTime)}</p>
                              <p className="text-xs text-muted-foreground">
                                to {formatDateTime(interview.endTime)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(interview)}
                              data-testid={`button-copy-link-${interview.id}`}
                            >
                              {copiedId === interview.id ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
