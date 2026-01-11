"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Eye,
  BarChart3,
  Users,
  MessageSquare,
  Calendar,
  Target,
  Clock,
  TrendingUp,
  Download,
  Share2,
  Rocket,
} from "lucide-react";

interface PreviewStepProps {
  campaignId: string;
  back: () => void;
  role: string;
  campaign: any;
}

export default function PreviewStep({ back }: PreviewStepProps) {
  const [campaignName, setCampaignName] = useState("My LinkedIn Campaign");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleLaunch = useCallback(async () => {
    setIsLaunching(true);
    // Simulate launch process
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsLaunching(false);
  }, []);

  const getEstimatedMetrics = () => {
    const leadCount = 0; // campaign?.target_leads_count || 0;
    const sequenceSteps = 0; // campaign?.sequence_id ? 3 : 0;
    const dailyLimit = 50;
    const workingDays = 5;

    return {
      totalLeads: leadCount,
      totalMessages: leadCount * sequenceSteps,
      estimatedDuration: Math.ceil(leadCount / dailyLimit) * workingDays,
      dailyMessages: Math.min(dailyLimit, leadCount),
      weeklyMessages: Math.min(dailyLimit * workingDays, leadCount),
    };
  };

  const metrics = getEstimatedMetrics();

  return (
    <div className="space-y-6 dark:text-gray-200">
      {/* Campaign Name & Description */}
      <Card className="bg-indigo-50 border-indigo-200 dark:bg-gray-900 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-indigo-900 dark:text-white">
            Campaign Details
          </CardTitle>
          <CardDescription className="text-indigo-700 dark:text-gray-300">
            Give your campaign a name and description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              placeholder="Enter campaign name"
              className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Leads</span>
          </TabsTrigger>
          <TabsTrigger value="sequence" className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Sequence</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Schedule</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-200 dark:bg-gray-900 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-900">
                      {metrics.totalLeads}
                    </p>
                    <p className="text-sm text-blue-700">Total Leads</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200 dark:bg-gray-900 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-900">
                      {metrics.totalMessages}
                    </p>
                    <p className="text-sm text-purple-700">Total Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200 dark:bg-gray-900 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-900">
                      {metrics.dailyMessages}
                    </p>
                    <p className="text-sm text-green-700">Daily Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200 dark:bg-gray-900 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-900">
                      {metrics.estimatedDuration}
                    </p>
                    <p className="text-sm text-orange-700">Days to Complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Timeline */}
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <span className="dark:text-white">Campaign Timeline</span>
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Estimated campaign progression and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Campaign Launch</p>
                    <p className="text-sm text-gray-600">
                      Starts immediately after launch
                    </p>
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-800">Day 0</Badge>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      First Messages Sent
                    </p>
                    <p className="text-sm text-gray-600">
                      Initial connection requests and messages
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Day 1</Badge>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Follow-up Messages
                    </p>
                    <p className="text-sm text-gray-600">
                      Second and third sequence steps
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Day 3-5</Badge>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Campaign Completion
                    </p>
                    <p className="text-sm text-gray-600">
                      All messages sent to all leads
                    </p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">
                    Day {metrics.estimatedDuration}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Selected Leads (0)</span>
              </CardTitle>
              <CardDescription>Review your target audience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {[].slice(0, 10).map((lead: any, index: number) => (
                  <div
                    key={lead.id || index}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {lead.name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("") || "LD"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {lead.name || "Lead Name"}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {lead.headline || lead.company || "Lead Information"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {lead.connectionDegree || "2nd"}
                    </Badge>
                  </div>
                ))}
                {false && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">+0 more leads</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sequence Tab */}
        <TabsContent value="sequence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span>Message Sequence (0 steps)</span>
              </CardTitle>
              <CardDescription>
                Review your message flow and timing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[].map((step: any, index: number) => (
                  <div
                    key={step.id || index}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">
                          {step.name || `Step ${index + 1}`}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {step.type || "MESSAGE"}
                        </Badge>
                        {step.delay && (
                          <Badge variant="secondary" className="text-xs">
                            {step.delay}{" "}
                            {step.delayUnit?.toLowerCase() || "days"} delay
                          </Badge>
                        )}
                      </div>
                      {step.content && (
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                          {step.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span>Timing Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Start Date</span>
                  <span className="text-sm font-medium text-gray-900">
                    {"Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Start Time</span>
                  <span className="text-sm font-medium text-gray-900">
                    {"Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Timezone</span>
                  <span className="text-sm font-medium text-gray-900">
                    {"Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Working Hours</span>
                  <span className="text-sm font-medium text-gray-900">
                    {"24/7"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <span>Limits & Controls</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Daily Limit</span>
                  <span className="text-sm font-medium text-gray-900">
                    50 messages
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Weekly Limit</span>
                  <span className="text-sm font-medium text-gray-900">
                    200 messages
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Between Messages
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    30 minutes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Between Leads</span>
                  <span className="text-sm font-medium text-gray-900">
                    5 minutes
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={back}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Schedule</span>
        </Button>
        <Button
          onClick={handleLaunch}
          disabled={isLaunching || !campaignName}
          className="bg-black hover:bg-black/90 text-white px-8"
        >
          {isLaunching ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Launching...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4 mr-2" />
              Launch Campaign
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
