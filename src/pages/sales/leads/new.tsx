/**
 * NEW LEAD PAGE
 * =============
 * Create a new contact/lead in CRM.
 */

import { useState } from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { CrmApiService, CreateContactDto } from "@/services/crmApi";
import ShowShortMessage from "@/base-component/ShowShortMessage";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Linkedin,
  Twitter,
  Globe,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NewLeadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateContactDto>({
    name: "",
    email: "",
    phoneNumber: "",
    whatsappNumber: "",
    jobTitle: "",
    linkedinUrl: "",
    twitterUrl: "",
    websiteUrl: "",
    status: "LEAD",
    leadType: "COLD",
    priority: "COLD",
    source: "MANUAL",
  });

  const handleChange = (field: keyof CreateContactDto, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim() && !formData.email?.trim()) {
      ShowShortMessage("Please enter a name or email", "error");
      return;
    }

    setSaving(true);
    try {
      const { data, status } = await CrmApiService.createContact(formData);

      if (status >= 200 && status < 300) {
        ShowShortMessage("Lead created successfully!", "success");
        router.push(`/sales/leads/${data.id}`);
      }
    } catch (error) {
      ShowShortMessage("Failed to create lead", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard checkSubscription={true}>
      <AppLayout activePage="Leads">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/sales/leads"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Leads
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Create New Lead</h1>
            <p className="text-muted-foreground mt-1">
              Add a new contact to your CRM
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-[#3b82f6]" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="john@example.com"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
                    />
                  </div>
                </div>

                {/* Phone Numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={formData.phoneNumber || ""}
                        onChange={(e) => handleChange("phoneNumber", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsappNumber || ""}
                      onChange={(e) => handleChange("whatsappNumber", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="h-5 w-5 text-[#3b82f6]" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.jobTitle || ""}
                      onChange={(e) => handleChange("jobTitle", e.target.value)}
                      placeholder="Sales Manager"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
                    />
                  </div>
                </div>

                {/* Company (will be linked later) */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Company name (link after creation)"
                      disabled
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-muted/30 text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can link a company after creating the lead
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Social Profiles */}
            <Card className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-[#3b82f6]" />
                  Social Profiles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* LinkedIn */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    LinkedIn URL
                  </label>
                  <div className="relative">
                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="url"
                      value={formData.linkedinUrl || ""}
                      onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                      placeholder="https://linkedin.com/in/johndoe"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
                    />
                  </div>
                </div>

                {/* Twitter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Twitter URL
                  </label>
                  <div className="relative">
                    <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="url"
                      value={formData.twitterUrl || ""}
                      onChange={(e) => handleChange("twitterUrl", e.target.value)}
                      placeholder="https://twitter.com/johndoe"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="url"
                      value={formData.websiteUrl || ""}
                      onChange={(e) => handleChange("websiteUrl", e.target.value)}
                      placeholder="https://example.com"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lead Classification */}
            <Card className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
              <CardHeader>
                <CardTitle className="text-lg">Lead Classification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Status
                    </label>
                    <Select
                      value={formData.status || "LEAD"}
                      onValueChange={(value) => handleChange("status", value)}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LEAD">Lead</SelectItem>
                        <SelectItem value="PROSPECT">Prospect</SelectItem>
                        <SelectItem value="ENGAGED">Engaged</SelectItem>
                        <SelectItem value="INTERESTED">Interested</SelectItem>
                        <SelectItem value="CUSTOMER">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lead Type */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Lead Type
                    </label>
                    <Select
                      value={formData.leadType || "COLD"}
                      onValueChange={(value) => handleChange("leadType", value)}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COLD">Cold</SelectItem>
                        <SelectItem value="WARM">Warm</SelectItem>
                        <SelectItem value="HOT">Hot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Priority
                    </label>
                    <Select
                      value={formData.priority || "COLD"}
                      onValueChange={(value) => handleChange("priority", value)}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COLD">Cold</SelectItem>
                        <SelectItem value="WARM">Warm</SelectItem>
                        <SelectItem value="HOT">Hot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Link href="/sales/leads" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={saving || (!formData.name?.trim() && !formData.email?.trim())}
                className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Create Lead
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
