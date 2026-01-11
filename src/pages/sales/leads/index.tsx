/**
 * LEADS / CONTACTS PAGE
 * =====================
 * CRM contact management with outreach integration.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { CrmApiService, Contact } from "@/services/crmApi";
import { OutreachSyncService, OutreachSyncResult, OutreachConnection } from "@/services/outreachSyncService";
import outreachConfig from "@/configs/outreach";
import ShowShortMessage from "@/base-component/ShowShortMessage";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Linkedin,
  Building2,
  Trash2,
  Edit,
  Eye,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  Crown,
  UserCheck,
  Sparkles,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Award,
  Target,
  Zap,
  RefreshCw,
  SlidersHorizontal,
  FilterX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Comprehensive mock data with full LinkedIn enrichment
const MOCK_CONTACTS: Contact[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@techcorp.com",
    phoneNumber: "+1 (555) 123-4567",
    whatsappNumber: "+1 (555) 123-4567",
    jobTitle: "VP of Engineering",
    status: "PROSPECT",
    source: "LINKEDIN_OUTREACH",
    priority: "HOT",
    leadScore: 85,
    leadType: "HOT",
    preferredChannel: "LINKEDIN",
    linkedinUrl: "https://linkedin.com/in/sarahjohnson",
    linkedinUrnId: "urn:li:fsd_profile:ACoAABCD1234",
    linkedinPublicId: "sarahjohnson",
    linkedinHeadline: "VP Engineering at TechCorp | Building scalable systems | Ex-Google",
    linkedinProfilePhoto: "https://randomuser.me/api/portraits/women/44.jpg",
    linkedinLocation: "San Francisco Bay Area",
    linkedinAbout: "Passionate engineering leader with 15+ years of experience building high-performance teams and scalable systems. Previously led engineering at Google Cloud and AWS. Speaker at KubeCon and re:Invent.",
    linkedinJoined: "2010-03-15",
    linkedinIsOpenToWork: false,
    linkedinIsPremium: true,
    linkedinIsOpenProfile: true,
    linkedinConnectionDegree: "1st",
    linkedinConnectedOn: "2024-01-15",
    linkedinExperience: [
      { position: "VP of Engineering", company: "TechCorp Inc.", duration: "2022 - Present", location: "San Francisco, CA", isCurrent: true, description: "Leading a team of 150+ engineers across 12 product teams" },
      { position: "Senior Director of Engineering", company: "Google", duration: "2018 - 2022", location: "Mountain View, CA", description: "Led Cloud Infrastructure team" },
      { position: "Engineering Manager", company: "AWS", duration: "2014 - 2018", location: "Seattle, WA", description: "Built and scaled EC2 auto-scaling systems" },
    ],
    linkedinSkills: [
      { name: "Cloud Architecture", endorsements: 99 },
      { name: "Kubernetes", endorsements: 87 },
      { name: "Team Leadership", endorsements: 76 },
      { name: "Python", endorsements: 65 },
      { name: "Go", endorsements: 54 },
    ],
    linkedinEducation: [
      { school: "Stanford University", degree: "M.S.", field: "Computer Science", startYear: "2008", endYear: "2010" },
      { school: "MIT", degree: "B.S.", field: "Computer Science", startYear: "2004", endYear: "2008" },
    ],
    linkedinMutualConnectionsCount: 47,
    linkedinMutualConnections: [
      { name: "John Smith", headline: "CEO at TechStartup" },
      { name: "Jane Doe", headline: "CTO at Innovation Labs" },
    ],
    linkedinCompanySize: "1001-5000",
    linkedinCompanyIndustry: "Technology",
    linkedinCompanyWebsite: "https://techcorp.com",
    company: { id: "c1", name: "TechCorp Inc.", industry: "Technology", size: "1001-5000", location: "San Francisco, CA" },
    lastContactedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    nextFollowUpAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    enrichmentScore: 95,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workspaceId: "ws1",
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "mchen@innovate.io",
    phoneNumber: "+1 (555) 234-5678",
    jobTitle: "CTO",
    status: "CUSTOMER",
    source: "LINKEDIN_OUTREACH",
    priority: "WARM",
    leadScore: 92,
    leadType: "HOT",
    preferredChannel: "EMAIL",
    linkedinUrl: "https://linkedin.com/in/michaelchen",
    linkedinUrnId: "urn:li:fsd_profile:ACoAABEF5678",
    linkedinPublicId: "michaelchen",
    linkedinHeadline: "CTO at Innovate.io | AI & Machine Learning Pioneer | Forbes 30 Under 30",
    linkedinProfilePhoto: "https://randomuser.me/api/portraits/men/32.jpg",
    linkedinLocation: "New York, NY",
    linkedinAbout: "Building the future of AI-powered enterprise software. PhD in Machine Learning from MIT. 3x founder with 2 successful exits. Angel investor in 20+ startups.",
    linkedinJoined: "2012-06-20",
    linkedinIsOpenToWork: false,
    linkedinIsPremium: true,
    linkedinIsOpenProfile: false,
    linkedinConnectionDegree: "1st",
    linkedinConnectedOn: "2024-02-10",
    linkedinExperience: [
      { position: "CTO & Co-founder", company: "Innovate.io", duration: "2020 - Present", location: "New York, NY", isCurrent: true },
      { position: "VP of AI", company: "DataTech", duration: "2017 - 2020", location: "Boston, MA" },
      { position: "ML Research Scientist", company: "OpenAI", duration: "2015 - 2017", location: "San Francisco, CA" },
    ],
    linkedinSkills: [
      { name: "Machine Learning", endorsements: 120 },
      { name: "Deep Learning", endorsements: 98 },
      { name: "Python", endorsements: 89 },
      { name: "TensorFlow", endorsements: 76 },
      { name: "Strategic Planning", endorsements: 65 },
    ],
    linkedinEducation: [
      { school: "MIT", degree: "Ph.D.", field: "Machine Learning", startYear: "2012", endYear: "2015" },
      { school: "UC Berkeley", degree: "B.S.", field: "Computer Science", startYear: "2008", endYear: "2012" },
    ],
    linkedinMutualConnectionsCount: 32,
    linkedinCompanySize: "51-200",
    linkedinCompanyIndustry: "Artificial Intelligence",
    company: { id: "c2", name: "Innovate.io", industry: "AI/ML", size: "51-200", location: "New York, NY" },
    lastContactedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    enrichmentScore: 98,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workspaceId: "ws1",
  },
  {
    id: "3",
    name: "Emily Davis",
    email: "emily.davis@startup.co",
    phoneNumber: "+1 (555) 345-6789",
    jobTitle: "Head of Product",
    status: "ENGAGED",
    source: "LINKEDIN_OUTREACH",
    priority: "HOT",
    leadScore: 78,
    leadType: "WARM",
    preferredChannel: "LINKEDIN",
    linkedinUrl: "https://linkedin.com/in/emilydavis",
    linkedinUrnId: "urn:li:fsd_profile:ACoAABGH9012",
    linkedinPublicId: "emilydavis",
    linkedinHeadline: "Head of Product at StartupCo | Product-Led Growth Expert | B2B SaaS",
    linkedinProfilePhoto: "https://randomuser.me/api/portraits/women/33.jpg",
    linkedinLocation: "Austin, TX",
    linkedinAbout: "Product leader passionate about building products that users love. 10+ years in B2B SaaS. Helped scale 3 products from 0 to $10M ARR.",
    linkedinJoined: "2014-09-01",
    linkedinIsOpenToWork: true,
    linkedinIsPremium: false,
    linkedinConnectionDegree: "2nd",
    linkedinExperience: [
      { position: "Head of Product", company: "StartupCo", duration: "2021 - Present", location: "Austin, TX", isCurrent: true },
      { position: "Senior Product Manager", company: "Salesforce", duration: "2018 - 2021", location: "San Francisco, CA" },
    ],
    linkedinSkills: [
      { name: "Product Management", endorsements: 88 },
      { name: "Product Strategy", endorsements: 72 },
      { name: "User Research", endorsements: 65 },
      { name: "Agile", endorsements: 58 },
    ],
    linkedinEducation: [
      { school: "Harvard Business School", degree: "MBA", field: "Business Administration", startYear: "2016", endYear: "2018" },
    ],
    linkedinMutualConnectionsCount: 15,
    linkedinJobTitles: ["VP of Product", "Chief Product Officer"],
    linkedinLocationTypes: ["Remote", "Hybrid"],
    linkedinCompanySize: "11-50",
    company: { id: "c3", name: "StartupCo", industry: "Software", size: "11-50", location: "Austin, TX" },
    enrichmentScore: 82,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workspaceId: "ws1",
  },
  {
    id: "4",
    name: "James Wilson",
    email: "jwilson@enterprise.com",
    phoneNumber: "+1 (555) 456-7890",
    jobTitle: "Director of Sales",
    status: "LEAD",
    source: "LINKEDIN_OUTREACH",
    priority: "COLD",
    leadScore: 45,
    leadType: "COLD",
    preferredChannel: "PHONE",
    linkedinUrl: "https://linkedin.com/in/jameswilson",
    linkedinUrnId: "urn:li:fsd_profile:ACoAABIJ3456",
    linkedinPublicId: "jameswilson",
    linkedinHeadline: "Director of Sales at Enterprise Solutions | Revenue Growth | B2B Enterprise",
    linkedinProfilePhoto: "https://randomuser.me/api/portraits/men/45.jpg",
    linkedinLocation: "Chicago, IL",
    linkedinAbout: "Sales leader with 12+ years driving enterprise revenue growth. Closed $50M+ in enterprise deals.",
    linkedinJoined: "2011-02-14",
    linkedinIsOpenToWork: false,
    linkedinIsPremium: true,
    linkedinConnectionDegree: "3rd",
    linkedinExperience: [
      { position: "Director of Sales", company: "Enterprise Solutions", duration: "2019 - Present", location: "Chicago, IL", isCurrent: true },
      { position: "Senior Account Executive", company: "Oracle", duration: "2015 - 2019", location: "Chicago, IL" },
    ],
    linkedinSkills: [
      { name: "Enterprise Sales", endorsements: 95 },
      { name: "Negotiation", endorsements: 82 },
      { name: "Account Management", endorsements: 78 },
    ],
    linkedinMutualConnectionsCount: 8,
    linkedinCompanySize: "501-1000",
    linkedinCompanyIndustry: "Enterprise Software",
    company: { id: "c4", name: "Enterprise Solutions", industry: "Enterprise Software", size: "501-1000", location: "Chicago, IL" },
    enrichmentScore: 68,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workspaceId: "ws1",
  },
  {
    id: "5",
    name: "Lisa Martinez",
    email: "lisa.m@growth.io",
    phoneNumber: "+1 (555) 567-8901",
    whatsappNumber: "+1 (555) 567-8901",
    jobTitle: "CEO & Founder",
    status: "INTERESTED",
    source: "LINKEDIN_OUTREACH",
    priority: "HOT",
    leadScore: 90,
    leadType: "HOT",
    preferredChannel: "LINKEDIN",
    linkedinUrl: "https://linkedin.com/in/lisamartinez",
    linkedinUrnId: "urn:li:fsd_profile:ACoAABKL7890",
    linkedinPublicId: "lisamartinez",
    linkedinHeadline: "CEO & Founder at Growth.io | Scaling B2B SaaS | YC W21 | Inc 5000",
    linkedinProfilePhoto: "https://randomuser.me/api/portraits/women/68.jpg",
    linkedinLocation: "Los Angeles, CA",
    linkedinAbout: "Serial entrepreneur building the future of B2B growth. YC alumnus. Raised $25M Series B. Previously scaled company to $20M ARR and successful exit.",
    linkedinJoined: "2013-08-22",
    linkedinIsOpenToWork: false,
    linkedinIsPremium: true,
    linkedinIsOpenProfile: true,
    linkedinConnectionDegree: "1st",
    linkedinConnectedOn: "2024-03-01",
    linkedinExperience: [
      { position: "CEO & Founder", company: "Growth.io", duration: "2021 - Present", location: "Los Angeles, CA", isCurrent: true, description: "Building AI-powered growth platform for B2B SaaS" },
      { position: "Co-founder & COO", company: "ScaleUp (Acquired)", duration: "2017 - 2021", location: "San Francisco, CA", description: "Scaled to $20M ARR, acquired by HubSpot" },
    ],
    linkedinSkills: [
      { name: "Entrepreneurship", endorsements: 110 },
      { name: "Fundraising", endorsements: 95 },
      { name: "Growth Strategy", endorsements: 88 },
      { name: "Leadership", endorsements: 82 },
    ],
    linkedinEducation: [
      { school: "Stanford University", degree: "MBA", field: "Entrepreneurship", startYear: "2015", endYear: "2017" },
      { school: "UCLA", degree: "B.A.", field: "Economics", startYear: "2009", endYear: "2013" },
    ],
    linkedinRecommendations: [
      { name: "John Investor", headline: "Partner at Top VC", text: "Lisa is one of the most driven founders I've backed." },
      { name: "Sarah Mentor", headline: "CEO at BigCo", text: "Exceptional leader with incredible vision." },
    ],
    linkedinMutualConnectionsCount: 62,
    linkedinCompanySize: "51-200",
    linkedinCompanyIndustry: "SaaS",
    linkedinCompanyFounded: "2021",
    company: { id: "c5", name: "Growth.io", industry: "SaaS", size: "51-200", location: "Los Angeles, CA" },
    lastContactedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    nextFollowUpAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    enrichmentScore: 96,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workspaceId: "ws1",
  },
  {
    id: "6",
    name: "Robert Taylor",
    email: "rtaylor@bigtech.com",
    phoneNumber: "+1 (555) 678-9012",
    jobTitle: "Senior Software Engineer",
    status: "PROSPECT",
    source: "LINKEDIN_OUTREACH",
    priority: "WARM",
    leadScore: 55,
    leadType: "WARM",
    linkedinUrl: "https://linkedin.com/in/roberttaylor",
    linkedinUrnId: "urn:li:fsd_profile:ACoAABMN1234",
    linkedinPublicId: "roberttaylor",
    linkedinHeadline: "Senior Software Engineer at BigTech | Full Stack | React & Node.js",
    linkedinProfilePhoto: "https://randomuser.me/api/portraits/men/52.jpg",
    linkedinLocation: "Seattle, WA",
    linkedinAbout: "Full stack developer with 8 years of experience. Passionate about clean code and scalable architectures.",
    linkedinJoined: "2015-04-10",
    linkedinIsOpenToWork: true,
    linkedinIsPremium: false,
    linkedinConnectionDegree: "2nd",
    linkedinExperience: [
      { position: "Senior Software Engineer", company: "BigTech Corp", duration: "2020 - Present", location: "Seattle, WA", isCurrent: true },
      { position: "Software Engineer", company: "Microsoft", duration: "2016 - 2020", location: "Redmond, WA" },
    ],
    linkedinSkills: [
      { name: "React", endorsements: 72 },
      { name: "Node.js", endorsements: 68 },
      { name: "TypeScript", endorsements: 65 },
      { name: "AWS", endorsements: 58 },
    ],
    linkedinJobTitles: ["Staff Engineer", "Engineering Manager"],
    linkedinMutualConnectionsCount: 12,
    linkedinCompanySize: "10001+",
    company: { id: "c6", name: "BigTech Corp", industry: "Technology", size: "10001+", location: "Seattle, WA" },
    enrichmentScore: 75,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workspaceId: "ws1",
  },
  {
    id: "7",
    name: "Amanda Brown",
    email: "amanda.b@fintech.io",
    phoneNumber: "+1 (555) 789-0123",
    jobTitle: "CFO",
    status: "CUSTOMER",
    source: "LINKEDIN_OUTREACH",
    priority: "WARM",
    leadScore: 88,
    leadType: "WARM",
    preferredChannel: "EMAIL",
    linkedinUrl: "https://linkedin.com/in/amandabrown",
    linkedinUrnId: "urn:li:fsd_profile:ACoAABNO5678",
    linkedinPublicId: "amandabrown",
    linkedinHeadline: "CFO at FinTech.io | Finance & Strategy | CPA | Ex-Goldman Sachs",
    linkedinProfilePhoto: "https://randomuser.me/api/portraits/women/22.jpg",
    linkedinLocation: "New York, NY",
    linkedinAbout: "Finance executive with 15+ years in fintech and investment banking. Led 3 successful IPOs. Board member at 2 public companies.",
    linkedinJoined: "2009-11-30",
    linkedinIsOpenToWork: false,
    linkedinIsPremium: true,
    linkedinConnectionDegree: "1st",
    linkedinConnectedOn: "2024-01-20",
    linkedinExperience: [
      { position: "CFO", company: "FinTech.io", duration: "2021 - Present", location: "New York, NY", isCurrent: true },
      { position: "VP of Finance", company: "Stripe", duration: "2017 - 2021", location: "San Francisco, CA" },
      { position: "Director", company: "Goldman Sachs", duration: "2012 - 2017", location: "New York, NY" },
    ],
    linkedinSkills: [
      { name: "Financial Planning", endorsements: 105 },
      { name: "IPO", endorsements: 88 },
      { name: "M&A", endorsements: 82 },
      { name: "Strategic Finance", endorsements: 78 },
    ],
    linkedinEducation: [
      { school: "Wharton School", degree: "MBA", field: "Finance", startYear: "2010", endYear: "2012" },
      { school: "NYU", degree: "B.S.", field: "Accounting", startYear: "2005", endYear: "2009" },
    ],
    linkedinMutualConnectionsCount: 38,
    linkedinCompanySize: "201-500",
    linkedinCompanyIndustry: "Financial Technology",
    company: { id: "c7", name: "FinTech.io", industry: "FinTech", size: "201-500", location: "New York, NY" },
    lastContactedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    enrichmentScore: 92,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workspaceId: "ws1",
  },
  {
    id: "8",
    name: "David Kim",
    email: "dkim@cloudservices.com",
    phoneNumber: "+1 (555) 890-1234",
    jobTitle: "Engineering Manager",
    status: "LEAD",
    source: "LINKEDIN_OUTREACH",
    priority: "WARM",
    leadScore: 62,
    leadType: "WARM",
    linkedinUrl: "https://linkedin.com/in/davidkim",
    linkedinUrnId: "urn:li:fsd_profile:ACoAABOP9012",
    linkedinPublicId: "davidkim",
    linkedinHeadline: "Engineering Manager at Cloud Services | DevOps | Platform Engineering",
    linkedinProfilePhoto: "https://randomuser.me/api/portraits/men/28.jpg",
    linkedinLocation: "Denver, CO",
    linkedinAbout: "Engineering leader focused on building world-class platform teams. Passionate about developer experience and infrastructure automation.",
    linkedinJoined: "2014-03-15",
    linkedinIsOpenToWork: false,
    linkedinIsPremium: false,
    linkedinConnectionDegree: "2nd",
    linkedinExperience: [
      { position: "Engineering Manager", company: "Cloud Services Inc", duration: "2021 - Present", location: "Denver, CO", isCurrent: true },
      { position: "Senior DevOps Engineer", company: "Netflix", duration: "2018 - 2021", location: "Los Gatos, CA" },
    ],
    linkedinSkills: [
      { name: "Kubernetes", endorsements: 78 },
      { name: "Terraform", endorsements: 72 },
      { name: "AWS", endorsements: 68 },
      { name: "Team Leadership", endorsements: 55 },
    ],
    linkedinMutualConnectionsCount: 22,
    linkedinCompanySize: "201-500",
    company: { id: "c8", name: "Cloud Services Inc", industry: "Cloud Computing", size: "201-500", location: "Denver, CO" },
    enrichmentScore: 78,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workspaceId: "ws1",
  },
];

// Status color mapping
const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  INACTIVE: "bg-gray-100 text-gray-700 border-gray-200",
  PROSPECT: "bg-blue-100 text-blue-700 border-blue-200",
  CUSTOMER: "bg-purple-100 text-purple-700 border-purple-200",
  LOST: "bg-red-100 text-red-700 border-red-200",
  WON: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DEAD: "bg-gray-100 text-gray-700 border-gray-200",
  LEAD: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ENGAGED: "bg-cyan-100 text-cyan-700 border-cyan-200",
  INTERESTED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  WARM: "bg-orange-100 text-orange-700 border-orange-200",
  CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
};

// Priority colors
const priorityColors: Record<string, string> = {
  HOT: "bg-red-500 text-white",
  WARM: "bg-orange-500 text-white",
  COLD: "bg-blue-500 text-white",
};

// Lead score colors
const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-500 bg-green-50 dark:bg-green-900/20";
  if (score >= 60) return "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
  if (score >= 40) return "text-orange-500 bg-orange-50 dark:bg-orange-900/20";
  return "text-red-500 bg-red-50 dark:bg-red-900/20";
};

// Connection degree colors
const degreeColors: Record<string, string> = {
  "1st": "bg-green-100 text-green-700 border-green-300",
  "2nd": "bg-blue-100 text-blue-700 border-blue-300",
  "3rd": "bg-gray-100 text-gray-700 border-gray-300",
};

export default function LeadsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [connectionDegreeFilter, setConnectionDegreeFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [hasEmailFilter, setHasEmailFilter] = useState<string>("all");
  const [hasPhoneFilter, setHasPhoneFilter] = useState<string>("all");
  const [isPremiumFilter, setIsPremiumFilter] = useState<string>("all");
  const [isOpenToWorkFilter, setIsOpenToWorkFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  const ITEMS_PER_PAGE = 20;

  // Convert Ashborn connection to Contact format
  const connectionToContact = (conn: any): Contact => {
    const nameParts = (conn.name || "").split(" ");
    const firstName = conn.first_name || nameParts[0] || "";
    const lastName = conn.last_name || nameParts.slice(1).join(" ") || "";

    return {
      id: conn.id || conn.urn_id,
      name: conn.name || `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      email: conn.email,
      phoneNumber: conn.phone,
      jobTitle: conn.position || conn.job_title,
      linkedinUrl: conn.profile_url,
      linkedinUrnId: conn.urn_id,
      linkedinPublicId: conn.public_id,
      linkedinHeadline: conn.headline,
      linkedinProfilePhoto: conn.profile_pic_url,
      linkedinLocation: conn.location,
      linkedinAbout: conn.about,
      linkedinConnectedOn: conn.connected_on,
      linkedinConnectionDegree: conn.connection_degree || "1st",
      linkedinIsPremium: conn.is_premium,
      linkedinIsOpenProfile: conn.is_open_profile,
      linkedinIsOpenToWork: conn.is_open_to_work,
      linkedinMutualConnectionsCount: conn.mutual_connections_count,
      linkedinCompanySize: conn.company_size,
      linkedinCompanyIndustry: conn.company_industry,
      linkedinSkills: conn.skills,
      linkedinExperience: conn.work_experience,
      linkedinEducation: conn.education,
      linkedinLanguages: conn.languages,
      source: "LINKEDIN_OUTREACH",
      status: "LEAD",
      priority: "WARM",
      leadScore: 50,
      company: conn.company ? {
        id: "",
        name: conn.company,
        industry: conn.company_industry,
        size: conn.company_size,
      } : undefined,
      createdAt: conn.connected_on || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workspaceId: "",
    };
  };

  // Fetch connections directly from Ashborn (outreach backend)
  const fetchOutreachConnections = async (): Promise<Contact[]> => {
    try {
      const response = await fetch(outreachConfig.getConnectionList, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          page: page,
          limit: ITEMS_PER_PAGE,
          orderBy: "connected_on",
          sortType: "desc",
        }),
      });

      if (!response.ok) {
        console.error("Failed to fetch outreach connections:", response.status);
        return [];
      }

      const result = await response.json();
      // Handle Ashborn wrapped response format { success, data: { data: [...] } }
      let connections: any[] = [];
      if (result && result.data && Array.isArray(result.data.data)) {
        connections = result.data.data;
      } else if (result && Array.isArray(result.data)) {
        connections = result.data;
      } else if (Array.isArray(result)) {
        connections = result;
      }

      return connections.map(connectionToContact);
    } catch (error) {
      console.error("Error fetching outreach connections:", error);
      return [];
    }
  };

  // Fetch contacts - try CRM first, fallback to Ashborn connections
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: ITEMS_PER_PAGE,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }
      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (sourceFilter && sourceFilter !== "all") {
        params.source = sourceFilter;
      }

      // Try CRM first
      const { data, status } = await CrmApiService.getContacts(params);

      if (status >= 200 && status < 300 && Array.isArray(data) && data.length > 0) {
        setContacts(data);
        setTotalPages(Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE)));
      } else {
        // CRM returned empty or error - try fetching from Ashborn directly
        console.log("CRM returned no data, fetching from Ashborn...");
        const outreachContacts = await fetchOutreachConnections();

        if (outreachContacts.length > 0) {
          setContacts(outreachContacts);
          setTotalPages(Math.max(1, Math.ceil(outreachContacts.length / ITEMS_PER_PAGE)));
        } else {
          // Fallback to mock data
          setContacts(MOCK_CONTACTS);
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      // Try Ashborn as fallback
      const outreachContacts = await fetchOutreachConnections();
      if (outreachContacts.length > 0) {
        setContacts(outreachContacts);
        setTotalPages(Math.max(1, Math.ceil(outreachContacts.length / ITEMS_PER_PAGE)));
      } else {
        setContacts(MOCK_CONTACTS);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, sourceFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchContacts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Delete contact
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    setDeleting(id);
    try {
      const { status } = await CrmApiService.deleteContact(id);
      if (status >= 200 && status < 300) {
        ShowShortMessage("Contact deleted successfully", "success");
        fetchContacts();
      }
    } catch (error) {
      ShowShortMessage("Failed to delete contact", "error");
    } finally {
      setDeleting(null);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;
    if (!confirm(`Delete ${selectedContacts.length} contacts?`)) return;

    try {
      const { status } = await CrmApiService.bulkDeleteContacts(selectedContacts);
      if (status >= 200 && status < 300) {
        ShowShortMessage(`${selectedContacts.length} contacts deleted`, "success");
        setSelectedContacts([]);
        fetchContacts();
      }
    } catch (error) {
      ShowShortMessage("Failed to delete contacts", "error");
    }
  };

  // Toggle contact selection
  const toggleSelect = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select all on current page (filtered) - uses contacts directly to avoid circular dependency
  const toggleSelectAll = () => {
    const currentFiltered = contacts.filter((contact) => {
      const matchesSearch =
        searchQuery === "" ||
        contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
      const matchesSource = sourceFilter === "all" || contact.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });
    if (selectedContacts.length === currentFiltered.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(currentFiltered.map((c) => c.id));
    }
  };

  // Get initials for avatar
  const getInitials = (contact: Contact) => {
    if (contact.name) {
      return contact.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return contact.email?.[0]?.toUpperCase() || "?";
  };

  // Check if contact is from LinkedIn outreach
  const isFromOutreach = (contact: Contact) => {
    return contact.source === "LINKEDIN_OUTREACH" || contact.linkedinUrnId;
  };

  // Toggle row expansion
  const toggleExpand = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Count active filters
  const activeFilterCount = [
    statusFilter !== "all",
    sourceFilter !== "all",
    priorityFilter !== "all",
    connectionDegreeFilter !== "all",
    scoreFilter !== "all",
    hasEmailFilter !== "all",
    hasPhoneFilter !== "all",
    isPremiumFilter !== "all",
    isOpenToWorkFilter !== "all",
    companyFilter !== "",
  ].filter(Boolean).length;

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSourceFilter("all");
    setPriorityFilter("all");
    setConnectionDegreeFilter("all");
    setScoreFilter("all");
    setHasEmailFilter("all");
    setHasPhoneFilter("all");
    setIsPremiumFilter("all");
    setIsOpenToWorkFilter("all");
    setCompanyFilter("");
  };

  // Filter contacts
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      searchQuery === "" ||
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.linkedinHeadline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || contact.status === statusFilter;
    const matchesSource = sourceFilter === "all" || contact.source === sourceFilter;
    const matchesPriority = priorityFilter === "all" || contact.priority === priorityFilter;
    const matchesConnectionDegree = connectionDegreeFilter === "all" || contact.linkedinConnectionDegree === connectionDegreeFilter;

    const matchesScore = (() => {
      if (scoreFilter === "all") return true;
      const score = contact.leadScore ?? 0;
      switch (scoreFilter) {
        case "high": return score >= 80;
        case "medium": return score >= 50 && score < 80;
        case "low": return score < 50;
        default: return true;
      }
    })();

    const matchesHasEmail = hasEmailFilter === "all" || (hasEmailFilter === "yes" ? !!contact.email : !contact.email);
    const matchesHasPhone = hasPhoneFilter === "all" || (hasPhoneFilter === "yes" ? !!contact.phoneNumber : !contact.phoneNumber);
    const matchesIsPremium = isPremiumFilter === "all" || (isPremiumFilter === "yes" ? contact.linkedinIsPremium : !contact.linkedinIsPremium);
    const matchesIsOpenToWork = isOpenToWorkFilter === "all" || (isOpenToWorkFilter === "yes" ? contact.linkedinIsOpenToWork : !contact.linkedinIsOpenToWork);
    const matchesCompany = companyFilter === "" || contact.company?.name?.toLowerCase().includes(companyFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesSource && matchesPriority &&
           matchesConnectionDegree && matchesScore && matchesHasEmail &&
           matchesHasPhone && matchesIsPremium && matchesIsOpenToWork && matchesCompany;
  });

  // Sync from outreach
  const handleOutreachSync = async () => {
    setSyncing(true);
    setSyncProgress({ current: 0, total: 0 });

    try {
      const result: OutreachSyncResult = await OutreachSyncService.syncToCRM({
        limit: 100,
        onProgress: (current, total) => {
          setSyncProgress({ current, total });
        },
      });

      if (result.success) {
        const message = `Sync complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`;
        ShowShortMessage(message, "success");
        // Refresh the contacts list
        fetchContacts();
      } else {
        ShowShortMessage(
          `Sync failed: ${result.errors[0]?.error || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      ShowShortMessage("Failed to sync from outreach", "error");
    } finally {
      setSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  };

  return (
    <AuthGuard checkSubscription={true}>
      <AppLayout activePage="Leads">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Leads</h1>
              <p className="text-muted-foreground text-sm">
                Manage your contacts and leads
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Sync from Outreach Button */}
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-[#0077b5]/30 text-[#0077b5] hover:bg-[#0077b5]/10"
                onClick={handleOutreachSync}
                disabled={syncing}
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    {syncProgress.total > 0
                      ? `${syncProgress.current}/${syncProgress.total}`
                      : "Syncing"}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Sync
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => router.push("/sales/leads/import")}
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Import
              </Button>
              <Button
                size="sm"
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg"
                onClick={() => router.push("/sales/leads/new")}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Lead
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-xl">
            <CardContent className="p-3">
              {/* Main Filter Row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, job title, company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-border/30 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px] h-8 text-sm rounded-lg border-border/30">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="LEAD">Lead</SelectItem>
                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                    <SelectItem value="ENGAGED">Engaged</SelectItem>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                  </SelectContent>
                </Select>

                {/* Source Filter */}
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[130px] h-8 text-sm rounded-lg border-border/30">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="LINKEDIN_OUTREACH">LinkedIn Outreach</SelectItem>
                    <SelectItem value="MANUAL">Manual Entry</SelectItem>
                    <SelectItem value="IMPORT">Import</SelectItem>
                    <SelectItem value="WEBSITE">Website</SelectItem>
                  </SelectContent>
                </Select>

                {/* Priority Filter */}
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[110px] h-8 text-sm rounded-lg border-border/30">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="HOT">🔥 Hot</SelectItem>
                    <SelectItem value="WARM">🌤️ Warm</SelectItem>
                    <SelectItem value="COLD">❄️ Cold</SelectItem>
                  </SelectContent>
                </Select>

                {/* Advanced Filters Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 rounded-lg",
                    showAdvancedFilters && "bg-[#3b82f6]/10 border-[#3b82f6]/30"
                  )}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center bg-[#3b82f6] text-white text-[10px]">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>

                {/* Clear All Filters */}
                {(activeFilterCount > 0 || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-muted-foreground hover:text-foreground"
                    onClick={clearAllFilters}
                  >
                    <FilterX className="h-3.5 w-3.5 mr-1.5" />
                    Clear
                  </Button>
                )}

                {/* Results Count */}
                <div className="text-sm text-muted-foreground ml-auto">
                  {filteredContacts.length} of {contacts.length} leads
                </div>

                {/* Bulk Actions */}
                {selectedContacts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-lg">
                      {selectedContacts.length} selected
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 rounded-lg"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => setSelectedContacts([])}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="mt-3 pt-3 border-t border-border/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {/* Connection Degree */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Connection</label>
                      <Select value={connectionDegreeFilter} onValueChange={setConnectionDegreeFilter}>
                        <SelectTrigger className="h-8 text-sm rounded-lg border-border/30">
                          <SelectValue placeholder="Degree" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="1st">1st Degree</SelectItem>
                          <SelectItem value="2nd">2nd Degree</SelectItem>
                          <SelectItem value="3rd">3rd Degree</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Lead Score */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Lead Score</label>
                      <Select value={scoreFilter} onValueChange={setScoreFilter}>
                        <SelectTrigger className="h-8 text-sm rounded-lg border-border/30">
                          <SelectValue placeholder="Score" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Scores</SelectItem>
                          <SelectItem value="high">High (80+)</SelectItem>
                          <SelectItem value="medium">Medium (50-79)</SelectItem>
                          <SelectItem value="low">Low (&lt;50)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Has Email */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Has Email</label>
                      <Select value={hasEmailFilter} onValueChange={setHasEmailFilter}>
                        <SelectTrigger className="h-8 text-sm rounded-lg border-border/30">
                          <SelectValue placeholder="Email" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Has Phone */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Has Phone</label>
                      <Select value={hasPhoneFilter} onValueChange={setHasPhoneFilter}>
                        <SelectTrigger className="h-8 text-sm rounded-lg border-border/30">
                          <SelectValue placeholder="Phone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* LinkedIn Premium */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">LinkedIn Premium</label>
                      <Select value={isPremiumFilter} onValueChange={setIsPremiumFilter}>
                        <SelectTrigger className="h-8 text-sm rounded-lg border-border/30">
                          <SelectValue placeholder="Premium" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="yes">Premium</SelectItem>
                          <SelectItem value="no">Non-Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Open to Work */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Open to Work</label>
                      <Select value={isOpenToWorkFilter} onValueChange={setIsOpenToWorkFilter}>
                        <SelectTrigger className="h-8 text-sm rounded-lg border-border/30">
                          <SelectValue placeholder="Open" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="yes">Open to Work</SelectItem>
                          <SelectItem value="no">Not Open</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Company Filter */}
                    <div className="space-y-1 col-span-2">
                      <label className="text-xs text-muted-foreground">Company</label>
                      <div className="relative">
                        <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Filter by company..."
                          value={companyFilter}
                          onChange={(e) => setCompanyFilter(e.target.value)}
                          className="w-full pl-8 pr-4 py-1.5 h-8 text-sm rounded-lg border border-border/30 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contacts Table */}
          <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-xl overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No contacts found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? "Try adjusting your search or filters"
                      : "Get started by adding your first lead"}
                  </p>
                  <Button
                    className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl"
                    onClick={() => router.push("/sales/leads/new")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
                  </Button>
                </div>
              ) : (
                <>
                  {/* Table Header */}
                  <div className="grid grid-cols-[40px_32px_minmax(250px,1fr)_80px_180px_130px_140px_100px_100px_50px] gap-4 px-6 py-3 bg-muted/30 border-b border-border/20 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center">
                      <Checkbox
                        checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </div>
                    <div></div>
                    <div>Contact</div>
                    <div className="text-center">Score</div>
                    <div>Contact Info</div>
                    <div>Activity</div>
                    <div>Company</div>
                    <div>Status</div>
                    <div>Source</div>
                    <div></div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-border/10">
                    {filteredContacts.map((contact) => (
                      <div key={contact.id}>
                        {/* Main Row */}
                        <div
                          className={cn(
                            "grid grid-cols-[40px_32px_minmax(250px,1fr)_80px_180px_130px_140px_100px_100px_50px] gap-4 px-6 py-4 items-center hover:bg-muted/20 transition-colors cursor-pointer",
                            selectedContacts.includes(contact.id) && "bg-muted/10",
                            expandedRows.includes(contact.id) && "bg-muted/10"
                          )}
                          onClick={() => toggleExpand(contact.id)}
                        >
                          {/* Checkbox */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedContacts.includes(contact.id)}
                              onCheckedChange={() => toggleSelect(contact.id)}
                            />
                          </div>

                          {/* Expand Icon */}
                          <div className="flex justify-center">
                            {expandedRows.includes(contact.id) ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>

                          {/* Contact Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative">
                              <Avatar className="h-11 w-11">
                                {contact.linkedinProfilePhoto || contact.avatar ? (
                                  <AvatarImage
                                    src={contact.linkedinProfilePhoto || contact.avatar}
                                    alt={contact.name || ""}
                                  />
                                ) : null}
                                <AvatarFallback className="bg-[#3b82f6]/10 text-[#3b82f6] font-medium">
                                  {getInitials(contact)}
                                </AvatarFallback>
                              </Avatar>
                              {/* Premium badge */}
                              {contact.linkedinIsPremium && (
                                <div className="absolute -top-0.5 -right-0.5 bg-amber-400 rounded-full p-0.5">
                                  <Crown className="h-2.5 w-2.5 text-amber-900" />
                                </div>
                              )}
                              {/* Open to work indicator */}
                              {contact.linkedinIsOpenToWork && (
                                <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full w-3 h-3 border-2 border-background" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                  href={`/sales/leads/${contact.id}`}
                                  className="font-medium text-foreground hover:text-[#3b82f6] truncate"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {contact.name || "Unnamed"}
                                </Link>
                                {contact.linkedinConnectionDegree && (
                                  <Badge
                                    className={cn(
                                      "text-[10px] px-1.5 py-0 font-medium",
                                      degreeColors[contact.linkedinConnectionDegree] || "bg-gray-100 text-gray-700"
                                    )}
                                  >
                                    {contact.linkedinConnectionDegree}
                                  </Badge>
                                )}
                                {contact.priority && (
                                  <Badge
                                    className={cn(
                                      "text-[10px] px-1.5 py-0",
                                      priorityColors[contact.priority]
                                    )}
                                  >
                                    {contact.priority}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {contact.jobTitle || "No title"}
                              </p>
                              {/* LinkedIn headline for outreach contacts */}
                              {contact.linkedinHeadline && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {contact.linkedinHeadline}
                                </p>
                              )}
                              {/* Top skills preview */}
                              {contact.linkedinSkills && contact.linkedinSkills.length > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  {contact.linkedinSkills.slice(0, 3).map((skill, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0 bg-background/50"
                                    >
                                      {skill.name}
                                    </Badge>
                                  ))}
                                  {contact.linkedinSkills.length > 3 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      +{contact.linkedinSkills.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Lead Score */}
                          <div className="text-center" onClick={(e) => e.stopPropagation()}>
                            {contact.leadScore !== undefined ? (
                              <div className={cn(
                                "inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm",
                                getScoreColor(contact.leadScore)
                              )}>
                                {contact.leadScore}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>

                          {/* Contact Info (Email/Phone/LinkedIn) */}
                          <div className="text-sm space-y-1" onClick={(e) => e.stopPropagation()}>
                            {contact.email && (
                              <a
                                href={`mailto:${contact.email}`}
                                className="flex items-center gap-1.5 text-muted-foreground hover:text-[#3b82f6] truncate"
                              >
                                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate text-xs">{contact.email}</span>
                              </a>
                            )}
                            {contact.phoneNumber && (
                              <a
                                href={`tel:${contact.phoneNumber}`}
                                className="flex items-center gap-1.5 text-muted-foreground hover:text-[#3b82f6]"
                              >
                                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate text-xs">{contact.phoneNumber}</span>
                              </a>
                            )}
                            {contact.linkedinUrl && (
                              <a
                                href={contact.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[#0077b5] hover:underline"
                              >
                                <Linkedin className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="text-xs">LinkedIn</span>
                              </a>
                            )}
                          </div>

                          {/* Activity (Last Contacted / Next Follow-up) */}
                          <div className="text-sm space-y-1" onClick={(e) => e.stopPropagation()}>
                            {contact.lastContactedAt && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="text-xs">{formatDate(contact.lastContactedAt)}</span>
                              </div>
                            )}
                            {contact.nextFollowUpAt && (
                              <div className="flex items-center gap-1.5 text-green-600">
                                <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="text-xs">{formatDate(contact.nextFollowUpAt)}</span>
                              </div>
                            )}
                            {!contact.lastContactedAt && !contact.nextFollowUpAt && (
                              <span className="text-xs text-muted-foreground">No activity</span>
                            )}
                          </div>

                          {/* Company */}
                          <div className="text-sm" onClick={(e) => e.stopPropagation()}>
                            {contact.company?.name ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-foreground font-medium truncate">
                                  <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{contact.company.name}</span>
                                </div>
                                {contact.linkedinCompanySize && (
                                  <p className="text-xs text-muted-foreground">
                                    {contact.linkedinCompanySize}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>

                          {/* Status */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <Badge
                              className={cn(
                                "rounded-full text-xs",
                                statusColors[contact.status || "LEAD"]
                              )}
                            >
                              {contact.status || "Lead"}
                            </Badge>
                          </div>

                          {/* Source */}
                          <div onClick={(e) => e.stopPropagation()}>
                            {isFromOutreach(contact) ? (
                              <div className="flex flex-col items-start gap-1">
                                <Badge className="bg-[#0077b5]/10 text-[#0077b5] border-[#0077b5]/20 rounded-full text-xs">
                                  <Linkedin className="h-3 w-3 mr-1" />
                                  Outreach
                                </Badge>
                                {contact.linkedinMutualConnectionsCount !== undefined && contact.linkedinMutualConnectionsCount > 0 && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <UserCheck className="h-3 w-3" />
                                    {contact.linkedinMutualConnectionsCount} mutual
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {contact.source || "Manual"}
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem
                                  onClick={() => router.push(`/sales/leads/${contact.id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/sales/leads/${contact.id}/edit`)
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                {contact.linkedinUrl && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      window.open(contact.linkedinUrl, "_blank")
                                    }
                                  >
                                    <Linkedin className="h-4 w-4 mr-2" />
                                    LinkedIn
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDelete(contact.id)}
                                  disabled={deleting === contact.id}
                                >
                                  {deleting === contact.id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                  )}
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Expanded Detail View */}
                        {expandedRows.includes(contact.id) && (
                          <div className="px-6 py-4 bg-muted/5 border-t border-border/10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Left Column - Contact & LinkedIn Info */}
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    Contact Information
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    {contact.email && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Email:</span>
                                        <a href={`mailto:${contact.email}`} className="text-[#3b82f6] hover:underline">
                                          {contact.email}
                                        </a>
                                      </div>
                                    )}
                                    {contact.phoneNumber && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Phone:</span>
                                        <a href={`tel:${contact.phoneNumber}`} className="text-foreground">
                                          {contact.phoneNumber}
                                        </a>
                                      </div>
                                    )}
                                    {contact.linkedinUrl && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">LinkedIn:</span>
                                        <a
                                          href={contact.linkedinUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[#0077b5] hover:underline flex items-center gap-1"
                                        >
                                          Profile <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </div>
                                    )}
                                    {contact.linkedinConnectedOn && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Connected:</span>
                                        <span className="text-foreground">{formatDate(contact.linkedinConnectedOn)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* About */}
                                {contact.linkedinAbout && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2">About</h4>
                                    <p className="text-sm text-muted-foreground line-clamp-4">
                                      {contact.linkedinAbout}
                                    </p>
                                  </div>
                                )}

                                {/* Enrichment Score */}
                                {contact.enrichmentScore !== undefined && (
                                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                    <span className="text-sm text-muted-foreground">Enrichment Score:</span>
                                    <span className={cn(
                                      "font-semibold",
                                      contact.enrichmentScore >= 80 ? "text-green-500" : contact.enrichmentScore >= 50 ? "text-yellow-500" : "text-red-500"
                                    )}>
                                      {contact.enrichmentScore}%
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Middle Column - Experience */}
                              <div className="space-y-4">
                                {contact.linkedinExperience && contact.linkedinExperience.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                                      Experience
                                    </h4>
                                    <div className="space-y-3">
                                      {contact.linkedinExperience.slice(0, 3).map((exp, idx) => (
                                        <div key={idx} className="text-sm border-l-2 border-border pl-3">
                                          <p className="font-medium text-foreground flex items-center gap-1">
                                            {exp.position}
                                            {exp.isCurrent && (
                                              <Badge variant="outline" className="text-[10px] px-1 py-0 text-green-600 border-green-300">
                                                Current
                                              </Badge>
                                            )}
                                          </p>
                                          <p className="text-muted-foreground">{exp.company}</p>
                                          {exp.duration && (
                                            <p className="text-xs text-muted-foreground">{exp.duration}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Education */}
                                {contact.linkedinEducation && contact.linkedinEducation.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                      Education
                                    </h4>
                                    <div className="space-y-2">
                                      {contact.linkedinEducation.slice(0, 2).map((edu, idx) => (
                                        <div key={idx} className="text-sm">
                                          <p className="font-medium text-foreground">{edu.school}</p>
                                          <p className="text-muted-foreground">
                                            {edu.degree} {edu.field && `in ${edu.field}`}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Right Column - Skills & Recommendations */}
                              <div className="space-y-4">
                                {/* All Skills */}
                                {contact.linkedinSkills && contact.linkedinSkills.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                      <Star className="h-4 w-4 text-muted-foreground" />
                                      Skills ({contact.linkedinSkills.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                      {contact.linkedinSkills.map((skill, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="secondary"
                                          className="text-xs flex items-center gap-1"
                                        >
                                          {skill.name}
                                          {skill.endorsements !== undefined && skill.endorsements > 0 && (
                                            <span className="text-[10px] text-muted-foreground ml-1">
                                              ({skill.endorsements})
                                            </span>
                                          )}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Recommendations */}
                                {contact.linkedinRecommendations && contact.linkedinRecommendations.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                      <Award className="h-4 w-4 text-muted-foreground" />
                                      Recommendations
                                    </h4>
                                    <div className="space-y-2">
                                      {contact.linkedinRecommendations.slice(0, 2).map((rec, idx) => (
                                        <div key={idx} className="text-sm p-2 bg-background/50 rounded-lg">
                                          <p className="text-muted-foreground italic text-xs line-clamp-2">"{rec.text}"</p>
                                          <p className="text-foreground font-medium mt-1">- {rec.name}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Job Seeking Info */}
                                {(contact.linkedinIsOpenToWork || contact.linkedinJobTitles?.length) && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                      <Target className="h-4 w-4 text-muted-foreground" />
                                      Open to Opportunities
                                    </h4>
                                    {contact.linkedinJobTitles && contact.linkedinJobTitles.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {contact.linkedinJobTitles.map((title, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs text-green-600 border-green-300">
                                            {title}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Quick Actions */}
                                <div className="pt-2 border-t border-border/20">
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-xs"
                                      onClick={() => router.push(`/sales/leads/${contact.id}`)}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      Full Profile
                                    </Button>
                                    {contact.linkedinUrl && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 text-xs text-[#0077b5]"
                                        onClick={() => window.open(contact.linkedinUrl, "_blank")}
                                      >
                                        <Linkedin className="h-3 w-3 mr-1" />
                                        LinkedIn
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border/20">
                    <p className="text-sm text-muted-foreground">
                      Showing {contacts.length} contacts
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground px-2">
                        Page {page}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        disabled={contacts.length < ITEMS_PER_PAGE}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
