"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  User,
  Briefcase,
  Mail,
  Users,
  Star,
  MapPin,
  Building,
  Globe,
  Phone,
  Calendar,
  ExternalLink,
  CheckCircle,
  Clock,
  Target,
  MessageSquare,
  Award,
  Link as LinkIcon,
} from "lucide-react";
import {
  LeadDetailsDialogProps,
  SkeletonSectionProps,
} from "@/types/lead-details";

// Skeleton Section Component
function SkeletonSection({ title, lines = 3 }: SkeletonSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <Card>
        <CardContent className="p-4">
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              className={cn(
                "h-5 mb-2",
                index === lines - 1 ? "w-3/4" : "w-full"
              )}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Experience Skeleton Item
function ExperienceSkeletonItem({
  showCompany = true,
}: {
  showCompany?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        {showCompany && <Skeleton className="h-3 w-1/3" />}
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </Card>
  );
}

export default function LeadDetailsDialog({
  open,
  selectedLead,
  detailedLeadData,
  leadDetailsLoading,
  onClose,
}: LeadDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("0");

  // Reset tab when modal opens/closes
  useEffect(() => {
    if (open) {
      setActiveTab("0");
    }
  }, [open]);

  const getDegreeSuffix = (degree: number) => {
    switch (degree) {
      case 1:
        return "1st Degree";
      case 2:
        return "2nd Degree";
      case 3:
        return "3rd Degree";
      default:
        return "Out of Network";
    }
  };

  const getDegreeColor = (degree: number) => {
    switch (degree) {
      case 1:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200";
      case 2:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200";
      case 3:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200";
    }
  };

  if (!selectedLead) return null;

  const enrichedProfile = detailedLeadData?.profile?.enriched_profile;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="w-[95vw] max-w-none sm:max-w-none"
        style={{ width: "95vw", maxWidth: "1400px" }}
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">
            Lead Details
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[80vh] space-y-6">
          {/* Basic Profile Section - Always Visible */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage
                    src={
                      selectedLead.profile_image_url ||
                      selectedLead.profile_pic_url
                    }
                  />
                  <AvatarFallback className="text-lg">
                    {selectedLead.name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h2 className="text-2xl font-bold text-foreground truncate">
                      {selectedLead.name}
                    </h2>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        selectedLead.has_enriched_profile
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200"
                      )}
                    >
                      {selectedLead.has_enriched_profile ? "Enriched" : "Basic"}
                    </Badge>
                  </div>
                  <p className="text-lg text-muted-foreground mb-2">
                    {selectedLead.headline}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedLead.location}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        getDegreeColor(selectedLead.connection_degree)
                      )}
                    >
                      {getDegreeSuffix(selectedLead.connection_degree)}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(selectedLead.profile_url, "_blank")
                      }
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View LinkedIn Profile
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {leadDetailsLoading && (
            <div className="space-y-6">
              <SkeletonSection title="Profile Summary" lines={4} />
              <SkeletonSection title="About This Profile" lines={3} />
              <SkeletonSection title="Work History" lines={2} />
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">
                  Experience
                </h3>
                <ExperienceSkeletonItem showCompany={true} />
                <ExperienceSkeletonItem showCompany={false} />
              </div>
            </div>
          )}

          {/* Detailed Content */}
          {!leadDetailsLoading && detailedLeadData && (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="0" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="1" className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="hidden sm:inline">Work</span>
                </TabsTrigger>
                <TabsTrigger value="2" className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Contact</span>
                </TabsTrigger>
                <TabsTrigger value="3" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Social</span>
                </TabsTrigger>
                <TabsTrigger value="4" className="flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span className="hidden sm:inline">Featured</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="0">
                <div className="space-y-6">
                  {/* Profile Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Profile Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-foreground">
                            {enrichedProfile?.experience?.length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Experience
                          </div>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-foreground">
                            {enrichedProfile?.mutualContacts?.totalCount || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Mutual Connections
                          </div>
                        </div>
                        <div className="text-center p-4 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-foreground">
                            {(enrichedProfile?.contactInfo?.email?.length ||
                              0) +
                              (enrichedProfile?.contactInfo?.phone?.length ||
                                0)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Contact Methods
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* About This Profile */}
                  {enrichedProfile?.aboutThisProfile && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          About This Profile
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">
                              Joined
                            </div>
                            <div className="text-sm">
                              {enrichedProfile.aboutThisProfile.joined}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">
                              Contact Information
                            </div>
                            <div className="text-sm">
                              {
                                enrichedProfile.aboutThisProfile
                                  .contact_information
                              }
                            </div>
                          </div>
                        </div>
                        {enrichedProfile.aboutThisProfile.Verifications
                          ?.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-2">
                              Verifications
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {enrichedProfile.aboutThisProfile.Verifications.map(
                                (verification, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {Object.keys(verification)[0]}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* About Section */}
                  {enrichedProfile?.aboutSection?.about && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <MessageSquare className="w-5 h-5" />
                          <span>About</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed">
                          {enrichedProfile.aboutSection.about}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Job Preferences */}
                  {enrichedProfile?.jobPreferences?.isOpenToWork && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Target className="w-5 h-5" />
                          <span>Job Preferences</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center space-x-2 mb-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-800 dark:text-green-200">
                              Open to Work
                            </span>
                          </div>
                          {enrichedProfile.jobPreferences.jobTitles?.length >
                            0 && (
                            <div className="text-sm text-green-700 dark:text-green-300">
                              <div className="font-medium mb-1">
                                Looking for:
                              </div>
                              <div>
                                {enrichedProfile.jobPreferences.jobTitles.join(
                                  ", "
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Work History Tab */}
              <TabsContent value="1">
                <div className="space-y-4">
                  {enrichedProfile?.experience &&
                  enrichedProfile.experience.length > 0 ? (
                    enrichedProfile.experience.map((exp, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-foreground">
                              {exp.position}
                            </h4>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Building className="w-4 h-4" />
                              <span>{exp.company}</span>
                              {exp.url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(exp.url, "_blank")}
                                  className="h-6 w-6 p-0"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{exp.duration}</span>
                              </div>
                              {exp.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{exp.location}</span>
                                </div>
                              )}
                            </div>
                            {exp.description && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {exp.description}
                              </p>
                            )}
                            {exp.skills && (
                              <div className="mt-2">
                                <div className="text-xs font-medium text-muted-foreground mb-1">
                                  Skills:
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {exp.skills}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No work history available
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value="2">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {enrichedProfile?.contactInfo?.email &&
                        enrichedProfile.contactInfo.email.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-2">
                              Email
                            </div>
                            <div className="space-y-1">
                              {enrichedProfile.contactInfo.email.map(
                                (email, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center space-x-2"
                                  >
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <a
                                      href={`mailto:${email}`}
                                      className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      {email}
                                    </a>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {enrichedProfile?.contactInfo?.phone &&
                        enrichedProfile.contactInfo.phone.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-2">
                              Phone
                            </div>
                            <div className="space-y-1">
                              {enrichedProfile.contactInfo.phone.map(
                                (phone, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center space-x-2"
                                  >
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <a
                                      href={`tel:${phone}`}
                                      className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      {phone}
                                    </a>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {enrichedProfile?.contactInfo?.websites &&
                        enrichedProfile.contactInfo.websites.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-2">
                              Websites
                            </div>
                            <div className="space-y-1">
                              {enrichedProfile.contactInfo.websites.map(
                                (website, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center space-x-2"
                                  >
                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                    <a
                                      href={website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      {website}
                                    </a>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {enrichedProfile?.contactInfo?.birthday && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-2">
                            Birthday
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {enrichedProfile.contactInfo.birthday}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Social Tab */}
              <TabsContent value="3">
                <div className="space-y-4">
                  {/* Recent Posts */}
                  {enrichedProfile?.posts &&
                    enrichedProfile.posts.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Recent Posts
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {enrichedProfile.posts
                            .slice(0, 3)
                            .map((post, index) => (
                              <div
                                key={index}
                                className="p-3 bg-muted/50 rounded-lg"
                              >
                                <p className="text-sm text-muted-foreground">
                                  {post.text}
                                </p>
                              </div>
                            ))}
                        </CardContent>
                      </Card>
                    )}

                  {/* Mutual Connections */}
                  {enrichedProfile?.mutualContacts?.accounts &&
                    enrichedProfile.mutualContacts.accounts.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Mutual Connections (
                            {enrichedProfile.mutualContacts.totalCount})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {enrichedProfile.mutualContacts.accounts
                            .slice(0, 5)
                            .map((contact, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div>
                                  <div className="font-medium text-sm">
                                    {contact.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {contact.headline}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      `https://linkedin.com/in/${contact.publicId}`,
                                      "_blank"
                                    )
                                  }
                                  className="h-8 w-8 p-0"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                        </CardContent>
                      </Card>
                    )}
                </div>
              </TabsContent>

              {/* Featured Tab */}
              <TabsContent value="4">
                <div className="space-y-4">
                  {/* Recommendations */}
                  {enrichedProfile?.recommendations &&
                    enrichedProfile.recommendations.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {enrichedProfile.recommendations.map((rec, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                              <div className="flex items-start space-x-3">
                                <Award className="w-5 h-5 text-blue-600 mt-1" />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {rec.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground mb-2">
                                    {rec.headLine}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {rec.text}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                  {/* Featured Section */}
                  {enrichedProfile?.featuredSection &&
                    enrichedProfile.featuredSection.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Featured</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {enrichedProfile.featuredSection.map(
                            (feature, index) => (
                              <div
                                key={index}
                                className="p-4 border rounded-lg"
                              >
                                <div className="space-y-2">
                                  {feature.title && (
                                    <div className="font-medium text-sm">
                                      {feature.title}
                                    </div>
                                  )}
                                  {feature.text && (
                                    <p className="text-sm text-muted-foreground">
                                      {feature.text}
                                    </p>
                                  )}
                                  {feature.links?.length > 0 && (
                                    <div className="space-y-1">
                                      {feature.links.map((link, linkIndex) => (
                                        <div
                                          key={linkIndex}
                                          className="flex items-center space-x-2"
                                        >
                                          <LinkIcon className="w-4 h-4 text-muted-foreground" />
                                          <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                          >
                                            {feature.linkText || link.url}
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </CardContent>
                      </Card>
                    )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
