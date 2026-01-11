"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageCircle,
  Search,
  Filter,
  Send,
  Paperclip,
  Smile,
  Archive,
  Trash2,
  Star,
  Clock,
  Inbox,
  MailOpen,
  Star as StarIcon,
  Archive as ArchiveIcon,
  Settings,
  Users,
  MessageSquare,
  Zap,
  Copy,
  ExternalLink,
  Image,
  Video,
  FileText,
  MapPin,
  User,
  X,
  Play,
  Pause,
  Download,
  File,
  Music,
  Map,
  UserPlus,
  Building,
  AtSign,
  Phone,
  Briefcase,
  Linkedin,
  Globe,
  Target,
  CheckCircle2,
  Edit,
  Activity,
  Calendar,
  Gift,
  Link,
  TrendingUp,
  Tag,
  Plus,
} from "lucide-react";
import whatsappService, {
  MessageType,
  MediaMessage,
  LocationMessage,
  ContactMessage,
  InteractiveMessage,
} from "../../services/sales-services/whatsappService";
import contactService, {
  CreateLinkedInExperienceRequest,
  UpdateLinkedInExperienceRequest,
  CreateLinkedInSkillRequest,
  UpdateLinkedInSkillRequest,
  CreateLinkedInJobPreferenceRequest,
  UpdateLinkedInJobPreferenceRequest,
} from "../../services/sales-services/contactService";
import companyService from "../../services/sales-services/companyService";
import tagService from "../../services/sales-services/tagService";
import { Contact } from "../../types/sales-types";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import SearchableDropdown from "./SearchableDropdown";
import { API_BASE_URL } from "../../services/sales-services/baseUrl";
import { renderTextWithLinks } from "../../utils/sales-utils/linkDetection";
import MessageStatusIndicator from "./MessageStatusIndicator";
import NotesSection from "./NotesSection";
import TaskSection from "./TaskSection";
import ActivitiesSection from "./ActivitiesSection";

// LinkedIn data types
interface LinkedInExperience {
  id: string;
  position: string;
  company?: string;
  duration?: string;
  location?: string;
  description?: string;
  skills?: string;
  url?: string;
}

interface LinkedInSkill {
  id: string;
  skillName: string;
  skillCategory?: string;
  skillLevel?: string;
  endorsementCount?: number;
}

interface LinkedInJobPreference {
  id: string;
  jobTitle: string;
  location?: string;
  locationType?: string;
  employmentType?: string;
}

interface Tag {
  id: string;
  name: string;
  description?: string;
  tagId?: string;
  tag?: { id: string; name: string };
}

type MediaAttachment = MediaMessage;

interface Message {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  type: "email" | "linkedin" | "telegram" | "whatsapp";
  avatar?: string;
  attachments?: string[];
  media?: MediaAttachment;
  messageType?: string;
  status?: string;
  fromMe?: boolean;
  location?: LocationMessage;
  contacts?: ContactMessage[];
  interactive?: InteractiveMessage;
}

interface Conversation {
  id: string;
  contact: string;
  contactEmail: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  type: "email" | "linkedin" | "telegram" | "whatsapp";
  avatar?: string;
  isOnline?: boolean;
  isStarred?: boolean;
  isArchived?: boolean;
  isIntegrated?: boolean;
  connection?: string;
  lists?: string[];
  tags?: string[];
  owner?: string;
  ownerAvatar?: string;
  value?: string;
  company?: string;
  companyRole?: string;
  website?: string;
  source?: string;
  linkedin?: string;
  linkedinName?: string;
  phone?: string;
  linkedinCompany?: string;
  whatsapp?: string;
  twitter?: string;
  twitterCompany?: string;
  telegram?: string;
  facebook?: string;
  youtube?: string;
  instagram?: string;
  city?: string;
  icebreaker?: string;
  whatsappId?: string;
  conversationType?: "INDIVIDUAL" | "GROUP";
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    contact: "Sarah Johnson",
    contactEmail: "sarah@techcorp.com",
    lastMessage: "Thanks for the proposal! When can we schedule a call?",
    timestamp: new Date("2024-01-20T10:30:00"),
    unreadCount: 2,
    type: "email",
    avatar:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=2",
    isOnline: true,
    isStarred: true,
    isIntegrated: true,
    connection: "Strong",
    lists: ["Customers", "Partners"],
    tags: ["Tech", "Startup"],
    owner: "hayatunnabinabil832",
    ownerAvatar: "https://randomuser.me/api/portraits/men/33.jpg",
    value: "$100,000",
    company: "TechCorp Solutions",
    companyRole: "CEO",
    website: "https://www.techcorp.com",
    source: "LinkedIn",
    linkedin: "richard-metcalfe-4b4a7b",
    linkedinName: "Richard Metcalfe",
    phone: "+1 234 567 890",
    linkedinCompany: "https://www.linkedin.com/company/techcorp",
    whatsapp: "@sarahj",
    twitter: "@sarahj",
    twitterCompany: "TechCorp",
    telegram: "@sarahj",
    facebook: "@sarahj",
    youtube: "@sarahj",
    instagram: "@sarahj",
    city: "San Francisco",
    icebreaker: "Hey Sarah, I saw your profile on LinkedIn.",
  },
  {
    id: "2",
    contact: "Mike Chen",
    contactEmail: "mike@startup.com",
    lastMessage: "The demo was great! Looking forward to working together.",
    timestamp: new Date("2024-01-20T09:15:00"),
    unreadCount: 0,
    type: "linkedin",
    avatar:
      "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=2",
    isStarred: false,
    isIntegrated: true,
    connection: "Good",
    lists: ["Customers"],
    tags: ["Design"],
    owner: "hayatunnabinabil832",
    ownerAvatar: "https://randomuser.me/api/portraits/men/33.jpg",
    value: "$50,000",
    company: "Startup Design Co.",
    companyRole: "Designer",
    website: "https://www.startupdesign.co",
    source: "Twitter",
    linkedin: "mike-chen-designer",
    linkedinName: "Mike Chen",
    phone: "+1 987 654 321",
    linkedinCompany: "https://www.linkedin.com/company/startupdesign",
    whatsapp: "@mikechen",
    twitter: "@mikechen",
    twitterCompany: "Startup Design",
    telegram: "@mikechen",
    facebook: "@mikechen",
    youtube: "@mikechen",
    instagram: "@mikechen",
    city: "New York",
    icebreaker: "Hi Mike, I love your design work!",
  },
  {
    id: "3",
    contact: "Emma Wilson",
    contactEmail: "emma@design.com",
    lastMessage: "Can you send me the updated pricing?",
    timestamp: new Date("2024-01-20T08:45:00"),
    unreadCount: 1,
    type: "telegram",
    avatar:
      "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=2",
    isStarred: false,
    isIntegrated: false,
    connection: "Weak",
    lists: ["Design"],
    tags: ["Design"],
    owner: "hayatunnabinabil832",
    ownerAvatar: "https://randomuser.me/api/portraits/men/33.jpg",
    value: "$20,000",
    company: "Design Studio",
    companyRole: "Freelancer",
    website: "https://www.designstudio.com",
    source: "LinkedIn",
    linkedin: "emma-wilson-designer",
    linkedinName: "Emma Wilson",
    phone: "+1 123 456 789",
    linkedinCompany: "https://www.linkedin.com/company/designstudio",
    whatsapp: "@emmawilson",
    twitter: "@emmawilson",
    twitterCompany: "Design Studio",
    telegram: "@emmawilson",
    facebook: "@emmawilson",
    youtube: "@emmawilson",
    instagram: "@emmawilson",
    city: "Los Angeles",
    icebreaker: "Hi Emma, I need the pricing details.",
  },
  {
    id: "4",
    contact: "David Brown",
    contactEmail: "david@marketing.com",
    lastMessage: "Perfect! Let's move forward with the contract.",
    timestamp: new Date("2024-01-19T16:20:00"),
    unreadCount: 0,
    type: "whatsapp",
    avatar:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=2",
    isOnline: false,
    isStarred: true,
    isArchived: true,
    isIntegrated: false,
    connection: "None",
    lists: ["Marketing"],
    tags: ["Marketing"],
    owner: "hayatunnabinabil832",
    ownerAvatar: "https://randomuser.me/api/portraits/men/33.jpg",
    value: "$10,000",
    company: "Marketing Agency",
    companyRole: "Marketing Manager",
    website: "https://www.marketingagency.com",
    source: "LinkedIn",
    linkedin: "david-brown-marketing",
    linkedinName: "David Brown",
    phone: "+1 987 654 321",
    linkedinCompany: "https://www.linkedin.com/company/marketingagency",
    whatsapp: "@davidbrown",
    twitter: "@davidbrown",
    twitterCompany: "Marketing Agency",
    telegram: "@davidbrown",
    facebook: "@davidbrown",
    youtube: "@davidbrown",
    instagram: "@davidbrown",
    city: "Chicago",
    icebreaker: "Hi David, I'm ready to sign the contract!",
  },
  {
    id: "5",
    contact: "Lisa Anderson",
    contactEmail: "lisa@consulting.com",
    lastMessage: "I reviewed your portfolio and I'm impressed!",
    timestamp: new Date("2024-01-19T14:30:00"),
    unreadCount: 3,
    type: "email",
    avatar:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=2",
    isStarred: false,
    isIntegrated: true,
    connection: "Strong",
    lists: ["Consulting"],
    tags: ["Consulting"],
    owner: "hayatunnabinabil832",
    ownerAvatar: "https://randomuser.me/api/portraits/men/33.jpg",
    value: "$50,000",
    company: "Consulting Firm",
    companyRole: "Senior Consultant",
    website: "https://www.consultingfirm.com",
    source: "LinkedIn",
    linkedin: "lisa-anderson-consultant",
    linkedinName: "Lisa Anderson",
    phone: "+1 123 456 789",
    linkedinCompany: "https://www.linkedin.com/company/consultingfirm",
    whatsapp: "@lisaanderson",
    twitter: "@lisaanderson",
    twitterCompany: "Consulting Firm",
    telegram: "@lisaanderson",
    facebook: "@lisaanderson",
    youtube: "@lisaanderson",
    instagram: "@lisaanderson",
    city: "Boston",
    icebreaker: "Hi Lisa, I'd love to discuss your consulting services.",
  },
  {
    id: "6",
    contact: "Alex Rodriguez",
    contactEmail: "alex@techstartup.com",
    lastMessage: "The integration looks perfect!",
    timestamp: new Date("2024-01-19T12:15:00"),
    unreadCount: 0,
    type: "linkedin",
    avatar:
      "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=2",
    isOnline: true,
    isStarred: false,
    isIntegrated: true,
    connection: "Good",
    lists: ["Tech"],
    tags: ["Tech"],
    owner: "hayatunnabinabil832",
    ownerAvatar: "https://randomuser.me/api/portraits/men/33.jpg",
    value: "$20,000",
    company: "Tech Startup",
    companyRole: "CTO",
    website: "https://www.techstartup.com",
    source: "LinkedIn",
    linkedin: "alex-rodriguez-tech",
    linkedinName: "Alex Rodriguez",
    phone: "+1 987 654 321",
    linkedinCompany: "https://www.linkedin.com/company/techstartup",
    whatsapp: "@alexrodriguez",
    twitter: "@alexrodriguez",
    twitterCompany: "Tech Startup",
    telegram: "@alexrodriguez",
    facebook: "@alexrodriguez",
    youtube: "@alexrodriguez",
    instagram: "@alexrodriguez",
    city: "San Jose",
    icebreaker: "Hi Alex, I'm impressed with your tech startup!",
  },
  {
    id: "7",
    contact: "Maria Garcia",
    contactEmail: "maria@designstudio.com",
    lastMessage: "Your design concepts are exactly what we need!",
    timestamp: new Date("2024-01-19T11:45:00"),
    unreadCount: 1,
    type: "telegram",
    avatar:
      "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=2",
    isStarred: false,
    isIntegrated: false,
    connection: "Weak",
    lists: ["Design"],
    tags: ["Design"],
    owner: "hayatunnabinabil832",
    ownerAvatar: "https://randomuser.me/api/portraits/men/33.jpg",
    value: "$15,000",
    company: "Design Studio",
    companyRole: "Designer",
    website: "https://www.designstudio.com",
    source: "LinkedIn",
    linkedin: "maria-garcia-designer",
    linkedinName: "Maria Garcia",
    phone: "+1 123 456 789",
    linkedinCompany: "https://www.linkedin.com/company/designstudio",
    whatsapp: "@mariagarcia",
    twitter: "@mariagarcia",
    twitterCompany: "Design Studio",
    telegram: "@mariagarcia",
    facebook: "@mariagarcia",
    youtube: "@mariagarcia",
    instagram: "@mariagarcia",
    city: "Miami",
    icebreaker: "Hi Maria, I'd love to work on your design project!",
  },
  {
    id: "8",
    contact: "John Smith",
    contactEmail: "john@marketingagency.com",
    lastMessage: "Let's discuss the campaign strategy tomorrow.",
    timestamp: new Date("2024-01-19T10:30:00"),
    unreadCount: 0,
    type: "whatsapp",
    avatar:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=2",
    isStarred: false,
    isArchived: true,
    isIntegrated: false,
    connection: "None",
    lists: ["Marketing"],
    tags: ["Marketing"],
    owner: "hayatunnabinabil832",
    ownerAvatar: "https://randomuser.me/api/portraits/men/33.jpg",
    value: "$8,000",
    company: "Marketing Agency",
    companyRole: "Marketing Manager",
    website: "https://www.marketingagency.com",
    source: "LinkedIn",
    linkedin: "john-smith-marketing",
    linkedinName: "John Smith",
    phone: "+1 987 654 321",
    linkedinCompany: "https://www.linkedin.com/company/marketingagency",
    whatsapp: "@johnsmith",
    twitter: "@johnsmith",
    twitterCompany: "Marketing Agency",
    telegram: "@johnsmith",
    facebook: "@johnsmith",
    youtube: "@johnsmith",
    instagram: "@johnsmith",
    city: "New York",
    icebreaker: "Hi John, I'm available for the strategy call tomorrow.",
  },
  {
    id: "9",
    contact: "Sophie Turner",
    contactEmail: "sophie@newtech.com",
    lastMessage: "Just sent you the latest updates!",
    timestamp: new Date(), // Very recent - today
    unreadCount: 1,
    type: "email",
    avatar:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=2",
    isStarred: true,
    isIntegrated: true,
    connection: "Strong",
    lists: ["Tech"],
    tags: ["Tech", "New"],
    owner: "hayatunnabinabil832",
    ownerAvatar: "https://randomuser.me/api/portraits/men/33.jpg",
    value: "$75,000",
    company: "New Tech Solutions",
    companyRole: "Product Manager",
    website: "https://www.newtech.com",
    source: "LinkedIn",
    linkedin: "sophie-turner-tech",
    linkedinName: "Sophie Turner",
    phone: "+1 555 123 456",
    linkedinCompany: "https://www.linkedin.com/company/newtech",
    whatsapp: "@sophieturner",
    twitter: "@sophieturner",
    twitterCompany: "New Tech",
    telegram: "@sophieturner",
    facebook: "@sophieturner",
    youtube: "@sophieturner",
    instagram: "@sophieturner",
    city: "Seattle",
    icebreaker: "Hi Sophie, I'm excited about the new updates!",
  },
  {
    id: "10",
    contact: "Ryan Cooper",
    contactEmail: "ryan@innovate.com",
    lastMessage: "The demo was fantastic! Ready to proceed.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    unreadCount: 0,
    type: "whatsapp",
    avatar:
      "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=2",
    isStarred: false,
    isIntegrated: true,
    connection: "Good",
    lists: ["Innovation"],
    tags: ["Innovation", "Demo"],
    owner: "hayatunnabinabil832",
    ownerAvatar: "https://randomuser.me/api/portraits/men/33.jpg",
    value: "$120,000",
    company: "Innovate Labs",
    companyRole: "Innovation Director",
    website: "https://www.innovate.com",
    source: "LinkedIn",
    linkedin: "ryan-cooper-innovate",
    linkedinName: "Ryan Cooper",
    phone: "+1 555 987 654",
    linkedinCompany: "https://www.linkedin.com/company/innovate",
    whatsapp: "@ryancooper",
    twitter: "@ryancooper",
    twitterCompany: "Innovate Labs",
    telegram: "@ryancooper",
    facebook: "@ryancooper",
    youtube: "@ryancooper",
    instagram: "@ryancooper",
    city: "Austin",
    icebreaker: "Hi Ryan, I'm thrilled about the demo results!",
  },
];

// Function to calculate dynamic filter counts
const calculateFilterCounts = (conversations: Conversation[]) => {
  const allCount = conversations.length;
  const unreadCount = conversations.filter(conv => conv.unreadCount > 0).length;
  const starredCount = conversations.filter(conv => conv.isStarred).length;
  const archivedCount = conversations.filter(conv => conv.isArchived).length;
  const integratedCount = conversations.filter(
    conv => conv.isIntegrated
  ).length;

  // Recent: conversations from the last 24 hours
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const recentCount = conversations.filter(
    conv => conv.timestamp > oneDayAgo
  ).length;

  return {
    all: allCount,
    unread: unreadCount,
    starred: starredCount,
    archived: archivedCount,
    integrated: integratedCount,
    recent: recentCount,
  };
};

// Dynamic filter options based on actual conversation data
const getFilterOptions = (conversations: Conversation[]) => {
  const counts = calculateFilterCounts(conversations);

  return [
    { key: "all", label: "All Conversations", icon: Inbox, count: counts.all },
    { key: "unread", label: "Unread", icon: MailOpen, count: counts.unread },
    { key: "starred", label: "Starred", icon: StarIcon, count: counts.starred },
    {
      key: "archived",
      label: "Archived",
      icon: ArchiveIcon,
      count: counts.archived,
    },
    {
      key: "integrated",
      label: "Integrated Accounts",
      icon: Zap,
      count: counts.integrated,
    },
    { key: "recent", label: "Recent", icon: Clock, count: counts.recent },
  ];
};

// InfoRow component (copied from LeadDetailPanel)
const InfoRow = ({
  icon,
  label,
  value,
  href,
  isEditable = false,
  onSave,
  dropdownOptions,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  href?: string;
  isEditable?: boolean;
  onSave?: (value: string) => Promise<void>;
  dropdownOptions?: { value: string; label: string }[];
}) => {
  const [isEditingField, setIsEditingField] = useState(false);
  const [fieldValue, setFieldValue] = useState(value || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (onSave && fieldValue !== value) {
      setIsSaving(true);
      try {
        await onSave(fieldValue);
        setIsEditingField(false);
      } catch (error) {
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditingField(false);
    }
  };

  const handleCancel = () => {
    setFieldValue(value || "");
    setIsEditingField(false);
  };

  return (
    <div className="flex items-start px-2 py-2 -mx-2 space-x-3 rounded-md transition-colors duration-150 group hover:bg-gray-50 dark:hover:bg-gray-700">
      <div className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-700 mb-0.5">{label}</div>
        {isEditingField ? (
          <div className="space-y-2">
            {dropdownOptions ? (
              <select
                value={fieldValue}
                onChange={e => setFieldValue(e.target.value)}
                className="px-2 py-1 w-full text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSaving}
              >
                <option value="">Select {label.toLowerCase()}</option>
                {dropdownOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={fieldValue}
                onChange={e => setFieldValue(e.target.value)}
                className="px-2 py-1 w-full text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Enter ${label.toLowerCase()}`}
                disabled={isSaving}
              />
            )}
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center px-2 py-1 text-xs text-white bg-gray-900 rounded dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="mr-1 w-3 h-3 rounded-full border border-white animate-spin border-t-transparent" />
                ) : (
                  <CheckCircle2 className="mr-1 w-3 h-3" />
                )}
                Save
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded dark:bg-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : value ? (
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-900 truncate dark:text-white">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {value}
                </a>
              ) : (
                value
              )}
            </div>
            {isEditable && (
              <button
                onClick={() => setIsEditingField(true)}
                className="p-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-gray-600"
              >
                <Edit className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <div className="text-sm italic text-gray-400">Not set</div>
            {isEditable && (
              <button
                onClick={() => setIsEditingField(true)}
                className="p-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-gray-600"
              >
                <Edit className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ProspectSidebarV2: React.FC<{
  open: boolean;
  onToggle: () => void;
  conversation: Conversation | null;
}> = ({ open, onToggle, conversation }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddingToLeads, setIsAddingToLeads] = useState(false);
  const [isAddingToCompanies, setIsAddingToCompanies] = useState(false);
  const [contactExists, setContactExists] = useState(false);
  const [companyExists, setCompanyExists] = useState(false);
  const [existingContact, setExistingContact] = useState<Contact | null>(null);

  // LinkedIn Complex Fields States
  const [linkedinExperience, setLinkedinExperience] = useState<
    LinkedInExperience[]
  >([]);
  const [linkedinSkills, setLinkedinSkills] = useState<LinkedInSkill[]>([]);
  const [linkedinJobPreferences, setLinkedinJobPreferences] = useState<
    LinkedInJobPreference[]
  >([]);
  const [loadingLinkedinExperience, setLoadingLinkedinExperience] =
    useState(false);
  const [loadingLinkedinSkills, setLoadingLinkedinSkills] = useState(false);
  const [loadingLinkedinJobPreferences, setLoadingLinkedinJobPreferences] =
    useState(false);
  const [showLinkedinExperienceInput, setShowLinkedinExperienceInput] =
    useState(false);
  const [showLinkedinSkillsInput, setShowLinkedinSkillsInput] = useState(false);
  const [showLinkedinJobPreferenceInput, setShowLinkedinJobPreferenceInput] =
    useState(false);
  const [editingLinkedinExperience, setEditingLinkedinExperience] = useState<
    string | null
  >(null);
  const [editingLinkedinSkills, setEditingLinkedinSkills] = useState<
    string | null
  >(null);
  const [editingLinkedinJobPreferences, setEditingLinkedinJobPreferences] =
    useState<string | null>(null);

  // Tag management states
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [loadingTags, setLoadingTags] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [assigningTag, setAssigningTag] = useState(false);
  const [removingTag, setRemovingTag] = useState<string | null>(null);
  const [tagAssignments] = useState<Record<string, string>>({});
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  // Prevent infinite loop flag
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { selectedOrganization, selectedWorkspace } = useWorkspace();

  // States from LeadDetailPanel
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Debug function for contact issues
  React.useEffect(() => {
    (
      window as typeof window & { debugContactIssues: () => void }
    ).debugContactIssues = () => {
      if (conversation?.whatsappId) {
        const contactExists = localStorage.getItem(
          `contact_exists_${conversation.whatsappId}`
        );
        const contactData = localStorage.getItem(
          `contact_data_${conversation.whatsappId}`
        );
      }
    };
  }, [conversation, contactExists, existingContact]);

  // Helper functions from LeadDetailPanel
  const scrollTabsLeft = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollTabsRight = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const handleTabScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
  };

  // All update handlers from LeadDetailPanel
  const handleUpdateName = async (value: string) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;
    try {
      const result = await contactService.updateContact(
        existingContact.id,
        workspaceId,
        organizationId,
        { name: value },
        token
      );
      if (result.success) {
        setExistingContact(prev => (prev ? { ...prev, name: value } : null));
        // Update localStorage with fresh data
        if (conversation?.whatsappId) {
          const updatedContact = { ...existingContact, name: value };
          localStorage.setItem(
            `contact_data_${conversation.whatsappId}`,
            JSON.stringify(updatedContact)
          );
        }
      }
    } catch (error) {}
  };

  const handleUpdateEmail = async (value: string) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;
    try {
      const result = await contactService.updateContact(
        existingContact.id,
        workspaceId,
        organizationId,
        { email: value },
        token
      );
      if (result.success) {
        setExistingContact(prev => (prev ? { ...prev, email: value } : null));
        // Update localStorage with fresh data
        if (conversation?.whatsappId) {
          const updatedContact = { ...existingContact, email: value };
          localStorage.setItem(
            `contact_data_${conversation.whatsappId}`,
            JSON.stringify(updatedContact)
          );
        }
      }
    } catch (error) {}
  };

  const handleUpdatePhoneNumber = async (value: string) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;
    try {
      const result = await contactService.updateContact(
        existingContact.id,
        workspaceId,
        organizationId,
        { phoneNumber: value },
        token
      );
      if (result.success) {
        setExistingContact(prev =>
          prev ? { ...prev, phoneNumber: value } : null
        );
      }
    } catch (error) {}
  };

  const handleUpdateWhatsappNumber = async (value: string) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;
    try {
      const result = await contactService.updateContact(
        existingContact.id,
        workspaceId,
        organizationId,
        { whatsappNumber: value },
        token
      );
      if (result.success) {
        setExistingContact(prev =>
          prev ? { ...prev, whatsappNumber: value } : null
        );
      }
    } catch (error) {}
  };

  const handleUpdateLinkedinUrl = async (value: string) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;
    try {
      const result = await contactService.updateContact(
        existingContact.id,
        workspaceId,
        organizationId,
        { linkedinUrl: value },
        token
      );
      if (result.success) {
        setExistingContact(prev =>
          prev ? { ...prev, linkedinUrl: value } : null
        );
      }
    } catch (error) {}
  };

  const handleUpdateTwitterUrl = async (value: string) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;
    try {
      const result = await contactService.updateContact(
        existingContact.id,
        workspaceId,
        organizationId,
        { twitterUrl: value },
        token
      );
      if (result.success) {
        setExistingContact(prev =>
          prev ? { ...prev, twitterUrl: value } : null
        );
      }
    } catch (error) {}
  };

  const handleUpdateWebsiteUrl = async (value: string) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;
    try {
      const result = await contactService.updateContact(
        existingContact.id,
        workspaceId,
        organizationId,
        { websiteUrl: value },
        token
      );
      if (result.success) {
        setExistingContact(prev =>
          prev ? { ...prev, websiteUrl: value } : null
        );
      }
    } catch (error) {}
  };

  const handleUpdateJobTitle = async (value: string) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;
    try {
      const result = await contactService.updateContact(
        existingContact.id,
        workspaceId,
        organizationId,
        { jobTitle: value },
        token
      );
      if (result.success) {
        setExistingContact(prev =>
          prev ? { ...prev, jobTitle: value } : null
        );
      }
    } catch (error) {}
  };

  const handleUpdateStatus = async (value: string) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;
    try {
      const result = await contactService.updateContact(
        existingContact.id,
        workspaceId,
        organizationId,
        {
          status: value as
            | "ACTIVE"
            | "INACTIVE"
            | "PROSPECT"
            | "CUSTOMER"
            | "LOST"
            | "WON"
            | "DEAD"
            | "LEAD"
            | "ENGAGED"
            | "INTERESTED"
            | "WARM"
            | "CLOSED",
        },
        token
      );
      if (result.success) {
        setExistingContact(prev =>
          prev
            ? {
                ...prev,
                status: value as
                  | "ACTIVE"
                  | "INACTIVE"
                  | "PROSPECT"
                  | "CUSTOMER"
                  | "LOST"
                  | "WON"
                  | "DEAD"
                  | "LEAD"
                  | "ENGAGED"
                  | "INTERESTED"
                  | "WARM"
                  | "CLOSED",
              }
            : null
        );
      }
    } catch (error) {}
  };

  // Function to check if contact exists by WhatsApp number
  const checkContactExists = async (whatsappNumber: string) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return null;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return null;
    }

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    try {
      const response = await contactService.getContacts(
        workspaceId,
        organizationId,
        token
      );

      if (response.success && response.data) {
        // Normalize WhatsApp numbers for comparison
        const normalizedSearchNumber = whatsappNumber.replace(/^\+/, ""); // Remove + for comparison

        const existingContact = response.data.find((contact: Contact) => {
          // Compare with whatsappNumber (with or without +)
          const contactWhatsappNumber =
            (contact.whatsappNumber as string)?.replace(/^\+/, "") || "";
          const contactWhatsappId =
            (contact.customAttributes as Record<string, unknown>)?.whatsappId
              ?.toString()
              .replace("@c.us", "") || "";
          const conversationWhatsappId =
            conversation?.whatsappId?.replace("@c.us", "") || "";

          return (
            contactWhatsappNumber === normalizedSearchNumber ||
            contactWhatsappId === conversationWhatsappId
          );
        });

        // Store in localStorage for persistence
        if (existingContact) {
          localStorage.setItem(
            `contact_exists_${conversation?.whatsappId}`,
            "true"
          );
          localStorage.setItem(
            `contact_data_${conversation?.whatsappId}`,
            JSON.stringify(existingContact)
          );
        }

        return existingContact || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Check for existing contact on component mount
  useEffect(() => {
    if (conversation?.whatsappId) {
      // Reset states immediately when conversation changes
      setContactExists(false);
      setExistingContact(null);
      setHasLoadedData(false);

      const exists = localStorage.getItem(
        `contact_exists_${conversation.whatsappId}`
      );
      const contactData = localStorage.getItem(
        `contact_data_${conversation.whatsappId}`
      );

      if (exists === "true" && contactData) {
        try {
          const contact = JSON.parse(contactData);

          // Verify the contact still exists in the database
          const verifyContactExists = async () => {
            try {
              let whatsappNumber =
                conversation.whatsappId?.replace("@c.us", "") || "";
              // Ensure WhatsApp number is in international format for API call
              if (whatsappNumber && !whatsappNumber.startsWith("+")) {
                whatsappNumber = "+" + whatsappNumber;
              }
              const existingContact = await checkContactExists(whatsappNumber);

              if (existingContact) {
                // Contact exists in database, use the fresh data

                setExistingContact(existingContact);
                setContactExists(true);
                setActiveTab("overview");

                // Update localStorage with fresh data
                localStorage.setItem(
                  `contact_exists_${conversation.whatsappId}`,
                  "true"
                );
                localStorage.setItem(
                  `contact_data_${conversation.whatsappId}`,
                  JSON.stringify(existingContact)
                );
              } else {
                // Contact no longer exists in database, clear localStorage

                localStorage.removeItem(
                  `contact_exists_${conversation.whatsappId}`
                );
                localStorage.removeItem(
                  `contact_data_${conversation.whatsappId}`
                );
                setContactExists(false);
                setExistingContact(null);
                setActiveTab("informations");
              }
            } catch (error) {
              // On error, assume contact doesn't exist and clear localStorage
              localStorage.removeItem(
                `contact_exists_${conversation.whatsappId}`
              );
              localStorage.removeItem(
                `contact_data_${conversation.whatsappId}`
              );
              setContactExists(false);
              setExistingContact(null);
              setActiveTab("informations");
            }
          };

          verifyContactExists();
        } catch (error) {
          // Clear invalid data
          localStorage.removeItem(`contact_exists_${conversation.whatsappId}`);
          localStorage.removeItem(`contact_data_${conversation.whatsappId}`);
          setContactExists(false);
          setExistingContact(null);
          setActiveTab("informations");
        }
      } else {
        setContactExists(false);
        setExistingContact(null);
        setActiveTab("informations"); // Set default for non-contact mode
      }
    } else {
      // Reset states when no conversation is selected

      setContactExists(false);
      setExistingContact(null);
      setHasLoadedData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.whatsappId]);

  // Load LinkedIn data and tags when existingContact changes
  useEffect(() => {
    if (
      user &&
      isAuthenticated &&
      selectedOrganization &&
      selectedWorkspace &&
      existingContact &&
      !hasLoadedData
    ) {
      setHasLoadedData(true);
      refreshContactData();
      loadLinkedInExperience();
      loadLinkedInSkills();
      loadLinkedInJobPreferences();
      loadAvailableTags();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user,
    isAuthenticated,
    selectedOrganization,
    selectedWorkspace,
    existingContact,
    hasLoadedData,
  ]);

  // Handle click outside tag dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTagDropdown(false);
      }
    };

    if (showTagDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTagDropdown]);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Function to update contact fields
  const handleUpdateContact = async (fieldName: string, value: string) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) {
      return;
    }

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    try {
      const updateData: Record<string, string> = {};
      updateData[fieldName] = value;

      const result = await contactService.updateContact(
        existingContact.id,
        workspaceId,
        organizationId,
        updateData,
        token
      );

      if (result.success) {
        // Update local state immediately
        setExistingContact(prev =>
          prev ? { ...prev, [fieldName]: value } : null
        );

        // Update localStorage with fresh data
        if (conversation?.whatsappId) {
          const updatedContact = { ...existingContact, [fieldName]: value };
          localStorage.setItem(
            `contact_data_${conversation.whatsappId}`,
            JSON.stringify(updatedContact)
          );
        }
      }
    } catch (error) {}
  };

  // LinkedIn Experience handlers
  const handleCreateLinkedInExperience = async (
    data: CreateLinkedInExperienceRequest
  ) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    try {
      const response = await contactService.createLinkedInExperience(
        existingContact.id,
        workspaceId,
        organizationId,
        data,
        token
      );

      if (response.success) {
        await loadLinkedInExperience();
        setShowLinkedinExperienceInput(false);
      }
    } catch (error) {}
  };

  const handleUpdateLinkedInExperience = async (
    experienceId: string,
    data: UpdateLinkedInExperienceRequest
  ) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    try {
      const response = await contactService.updateLinkedInExperience(
        existingContact.id,
        experienceId,
        workspaceId,
        organizationId,
        data,
        token
      );

      if (response.success) {
        await loadLinkedInExperience();
        setEditingLinkedinExperience(null);
      }
    } catch (error) {}
  };

  const handleDeleteLinkedInExperience = async (experienceId: string) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    try {
      const response = await contactService.deleteLinkedInExperience(
        existingContact.id,
        experienceId,
        workspaceId,
        organizationId,
        token
      );

      if (response.success) {
        await loadLinkedInExperience();
      }
    } catch (error) {}
  };

  // LinkedIn Skills handlers
  const handleCreateLinkedInSkill = async (
    data: CreateLinkedInSkillRequest
  ) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    try {
      const response = await contactService.createLinkedInSkill(
        existingContact.id,
        workspaceId,
        organizationId,
        data,
        token
      );

      if (response.success) {
        await loadLinkedInSkills();
        setShowLinkedinSkillsInput(false);
      }
    } catch (error) {}
  };

  const handleUpdateLinkedInSkill = async (
    skillId: string,
    data: UpdateLinkedInSkillRequest
  ) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    try {
      const response = await contactService.updateLinkedInSkill(
        existingContact.id,
        skillId,
        workspaceId,
        organizationId,
        data,
        token
      );

      if (response.success) {
        await loadLinkedInSkills();
        setEditingLinkedinSkills(null);
      }
    } catch (error) {}
  };

  const handleDeleteLinkedInSkill = async (skillId: string) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    try {
      const response = await contactService.deleteLinkedInSkill(
        existingContact.id,
        skillId,
        workspaceId,
        organizationId,
        token
      );

      if (response.success) {
        await loadLinkedInSkills();
      }
    } catch (error) {}
  };

  // LinkedIn Job Preferences handlers
  const handleCreateLinkedInJobPreference = async (
    data: CreateLinkedInJobPreferenceRequest
  ) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    try {
      const response = await contactService.createLinkedInJobPreference(
        existingContact.id,
        workspaceId,
        organizationId,
        data,
        token
      );

      if (response.success) {
        await loadLinkedInJobPreferences();
        setShowLinkedinJobPreferenceInput(false);
      }
    } catch (error) {}
  };

  const handleUpdateLinkedInJobPreference = async (
    preferenceId: string,
    data: UpdateLinkedInJobPreferenceRequest
  ) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    try {
      const response = await contactService.updateLinkedInJobPreference(
        existingContact.id,
        preferenceId,
        workspaceId,
        organizationId,
        data,
        token
      );

      if (response.success) {
        await loadLinkedInJobPreferences();
        setEditingLinkedinJobPreferences(null);
      }
    } catch (error) {}
  };

  const handleDeleteLinkedInJobPreference = async (preferenceId: string) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    try {
      const response = await contactService.deleteLinkedInJobPreference(
        existingContact.id,
        preferenceId,
        workspaceId,
        organizationId,
        token
      );

      if (response.success) {
        await loadLinkedInJobPreferences();
      }
    } catch (error) {}
  };

  // Tag handlers
  const handleAssignTag = async (tagId: string) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    setAssigningTag(true);
    try {
      const response = await tagService.assignTag(
        {
          tagId,
          entityId: existingContact.id,
          entityType: "contact",
          workspaceId,
          organizationId,
        },
        token
      );

      if (response.success) {
        setShowTagDropdown(false);
        // Refresh the contact data from server to get the latest tag assignments
        await refreshContactData();
      }
    } catch (error) {
    } finally {
      setAssigningTag(false);
    }
  };

  const handleRemoveTag = async (assignmentId: string) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    setRemovingTag(assignmentId);
    try {
      // Use deleteTagAssignment instead of unassignTag for better accuracy (same as LeadDetailPanel)
      const response = await tagService.deleteTagAssignment(
        assignmentId,
        workspaceId,
        organizationId,
        token
      );

      if (response.success) {
        // Refresh the contact data from server to get the latest tag assignments
        await refreshContactData();
      }
    } catch (error) {
    } finally {
      setRemovingTag(null);
    }
  };

  // Load functions
  const loadLinkedInExperience = async () => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    setLoadingLinkedinExperience(true);
    try {
      const response = await contactService.getLinkedInExperience(
        existingContact.id,
        workspaceId,
        organizationId,
        token
      );

      if (response.success && response.data) {
        setLinkedinExperience(
          (response.data || []) as unknown as LinkedInExperience[]
        );
      }
    } catch (error) {
    } finally {
      setLoadingLinkedinExperience(false);
    }
  };

  const loadLinkedInSkills = async () => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    setLoadingLinkedinSkills(true);
    try {
      const response = await contactService.getLinkedInSkills(
        existingContact.id,
        workspaceId,
        organizationId,
        token
      );

      if (response.success && response.data) {
        setLinkedinSkills((response.data || []) as unknown as LinkedInSkill[]);
      }
    } catch (error) {
    } finally {
      setLoadingLinkedinSkills(false);
    }
  };

  const loadLinkedInJobPreferences = async () => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    setLoadingLinkedinJobPreferences(true);
    try {
      const response = await contactService.getLinkedInJobPreferences(
        existingContact.id,
        workspaceId,
        organizationId,
        token
      );

      if (response.success && response.data) {
        setLinkedinJobPreferences(
          (response.data || []) as unknown as LinkedInJobPreference[]
        );
      }
    } catch (error) {
    } finally {
      setLoadingLinkedinJobPreferences(false);
    }
  };

  const loadAvailableTags = async () => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    setLoadingTags(true);
    try {
      const response = await tagService.getAllTags(
        workspaceId,
        organizationId,
        token
      );

      if (response.success && response.data) {
        setAvailableTags(response.data || []);
        setFilteredTags(response.data || []);
      }
    } catch (error) {
    } finally {
      setLoadingTags(false);
    }
  };

  // Refresh contact data from API to get complete information
  const refreshContactData = async () => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!existingContact) return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    try {
      const response = await contactService.getContact(
        existingContact.id,
        workspaceId,
        organizationId,
        token
      );

      if (response.success && response.data) {
        const updatedContact = response.data;
        setExistingContact(updatedContact);

        // Update localStorage with fresh data
        if (conversation?.whatsappId) {
          localStorage.setItem(
            `contact_data_${conversation.whatsappId}`,
            JSON.stringify(updatedContact)
          );
        }
      }
    } catch (error) {}
  };

  // Function to add contact to leads
  const handleAddToLeads = async () => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!conversation) {
      return;
    }

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    try {
      setIsAddingToLeads(true);

      // Check if contact already exists by WhatsApp number
      const whatsappNumber =
        conversation.whatsapp ||
        conversation.whatsappId?.replace("@c.us", "") ||
        "";
      const existingContact = await checkContactExists(whatsappNumber);

      if (existingContact) {
        // Contact exists, set it for editing

        setExistingContact(existingContact);
        setContactExists(true);
        setActiveTab("overview"); // Switch to overview tab
        setIsAddingToLeads(false);
        return;
      }

      // Prepare contact data from conversation - only include non-empty fields
      const contactData: Partial<{
        name: string;
        email: string;
        phoneNumber: string;
        whatsappNumber: string;
        linkedinUrl: string;
        twitterUrl: string;
        websiteUrl: string;
        jobTitle: string;
        status:
          | "LEAD"
          | "ACTIVE"
          | "INACTIVE"
          | "PROSPECT"
          | "CUSTOMER"
          | "LOST"
          | "WON"
          | "DEAD"
          | "ENGAGED"
          | "INTERESTED"
          | "WARM"
          | "CLOSED";
        source: string;
        city: string;
        companyName: string;
        customAttributes: Record<string, string>;
        workspaceId: string;
        organizationId: string;
      }> = {
        name: conversation.contact,
        status: "LEAD",
        source: conversation.source || "WhatsApp",
        workspaceId,
        organizationId,
        customAttributes: {
          whatsappId: conversation.whatsappId || "",
          conversationType: conversation.conversationType || "INDIVIDUAL",
          lastMessage: conversation.lastMessage || "",
          icebreaker: conversation.icebreaker || "",
        },
      };

      // Only add fields if they have valid values
      if (conversation.contactEmail && conversation.contactEmail.length >= 5) {
        contactData.email = conversation.contactEmail;
      }
      if (conversation.phone && conversation.phone.length >= 10) {
        contactData.phoneNumber = conversation.phone;
      }
      // Fix WhatsApp number mapping - use whatsappId instead of whatsapp
      if (conversation.whatsappId) {
        // Ensure WhatsApp number is in international format with + prefix
        let whatsappNumber = conversation.whatsappId.replace("@c.us", "");
        if (!whatsappNumber.startsWith("+")) {
          whatsappNumber = "+" + whatsappNumber;
        }
        contactData.whatsappNumber = whatsappNumber;
      }
      if (conversation.linkedin && conversation.linkedin.length >= 5) {
        contactData.linkedinUrl = conversation.linkedin;
      }
      if (
        conversation.twitter &&
        conversation.twitter.length >= 1 &&
        conversation.twitter.length <= 50
      ) {
        contactData.twitterUrl = conversation.twitter;
      }
      if (conversation.website && conversation.website.length >= 5) {
        contactData.websiteUrl = conversation.website;
      }
      if (
        conversation.companyRole &&
        conversation.companyRole.length >= 1 &&
        conversation.companyRole.length <= 100
      ) {
        contactData.jobTitle = conversation.companyRole;
      }
      if (conversation.city && conversation.city.length > 0) {
        contactData.city = conversation.city;
      }
      if (conversation.company && conversation.company.length > 0) {
        contactData.companyName = conversation.company;
      }

      const result = await contactService.createContact(
        workspaceId,
        organizationId,
        contactData,
        token
      );

      if (result.success && result.data) {
        setContactExists(true);
        setActiveTab("overview"); // Switch to overview tab

        // Save to localStorage for persistence
        if (conversation.whatsappId) {
          localStorage.setItem(
            `contact_exists_${conversation.whatsappId}`,
            "true"
          );
          localStorage.setItem(
            `contact_data_${conversation.whatsappId}`,
            JSON.stringify(result.data)
          );
        }

        // Refresh contact data
        const newContact = await checkContactExists(whatsappNumber);
        if (newContact) {
          setExistingContact(newContact);
        }
      } else {
      }
    } catch (error) {
    } finally {
      setIsAddingToLeads(false);
    }
  };

  // Function to add company to companies
  const handleAddToCompanies = async () => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    if (!conversation) {
      return;
    }

    // Only allow adding to companies if we have company information
    if (!conversation.company) {
      return;
    }

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    try {
      setIsAddingToCompanies(true);

      // Prepare company data from conversation - only include non-empty fields
      const companyData: Partial<{
        name: string;
        domain: string;
        email: string;
        phoneNumber: string;
        websiteUrl: string;
        linkedinUrl: string;
        twitterUrl: string;
        industry: string;
        size: "STARTUP" | "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE";
        status:
          | "ACTIVE"
          | "INACTIVE"
          | "PROSPECT"
          | "CUSTOMER"
          | "LOST"
          | "WON"
          | "DEAD"
          | "LEAD"
          | "ENGAGED"
          | "INTERESTED"
          | "WARM"
          | "CLOSED";
        source: string;
        city: string;
        description: string;
        customAttributes: Record<string, string>;
        workspaceId: string;
        organizationId: string;
      }> = {
        name: conversation.company,
        status: "PROSPECT",
        source: conversation.source || "WhatsApp",
        workspaceId,
        organizationId,
        description: `Company from WhatsApp conversation with ${conversation.contact}`,
        customAttributes: {
          whatsappId: conversation.whatsappId || "",
          conversationType: conversation.conversationType || "INDIVIDUAL",
          contactName: conversation.contact,
          lastMessage: conversation.lastMessage || "",
        },
      };

      // Only add fields if they have valid values
      if (conversation.website) {
        try {
          companyData.domain = new URL(conversation.website).hostname;
          companyData.websiteUrl = conversation.website;
        } catch {
          // Invalid URL, skip domain
        }
      }
      if (conversation.contactEmail && conversation.contactEmail.length >= 5) {
        companyData.email = conversation.contactEmail;
      }
      if (conversation.phone && conversation.phone.length >= 10) {
        companyData.phoneNumber = conversation.phone;
      }
      if (
        conversation.linkedinCompany &&
        conversation.linkedinCompany.length >= 5
      ) {
        companyData.linkedinUrl = conversation.linkedinCompany;
      }
      if (
        conversation.twitterCompany &&
        conversation.twitterCompany.length >= 1
      ) {
        companyData.twitterUrl = conversation.twitterCompany;
      }
      if (conversation.city && conversation.city.length > 0) {
        companyData.city = conversation.city;
      }

      const result = await companyService.createCompany(
        workspaceId,
        organizationId,
        companyData,
        token
      );

      if (result.success) {
        setCompanyExists(true);
      }
    } catch (error) {
    } finally {
      setIsAddingToCompanies(false);
    }
  };

  // Dynamically use conversation data, fallback to elegant placeholders
  const fields = {
    name: conversation?.contact || "No Name",
    avatar: conversation?.avatar || "https://ui-avatars.com/api/?name=No+Name",
    email: conversation?.contactEmail || "",
    company: conversation?.company || "",
    owner: "hayatunnabinabil832",
    ownerAvatar: "https://randomuser.me/api/portraits/men/33.jpg",
    value: conversation?.value || "$0",
    connection: conversation?.connection || "None",
    lists: conversation?.lists || ["Customers"],
    tags: conversation?.tags || [],
    companyRole: conversation?.companyRole || "",
    website: conversation?.website || "",
    source: conversation?.source || "",
    linkedin: conversation?.linkedin || "",
    linkedinName: conversation?.linkedinName || conversation?.contact || "",
    phone: conversation?.phone || "",
    linkedinCompany: conversation?.linkedinCompany || "",
    whatsapp: conversation?.whatsapp || "",
    twitter: conversation?.twitter || "",
    twitterCompany: conversation?.twitterCompany || "",
    telegram: conversation?.telegram || "",
    facebook: conversation?.facebook || "",
    youtube: conversation?.youtube || "",
    instagram: conversation?.instagram || "",
    city: conversation?.city || "",
    icebreaker: conversation?.icebreaker || "",
  };

  return (
    <>
      {/* Toggle button - only visible when sidebar is open */}
      {open && (
        <button
          className="absolute top-4 right-4 z-30 p-2 bg-white rounded-full border border-gray-200 shadow transition-all duration-200 ease-in-out dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-105"
          onClick={onToggle}
          aria-label="Hide prospect details"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      )}

      {/* Sidebar with slide animation */}
      <div
        className={`absolute right-0 top-0 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col z-20 transition-all duration-300 ease-in-out ${
          open ? "translate-x-0 w-[400px]" : "translate-x-full w-[400px]"
        }`}
      >
        {/* Profile Header */}
        <div className="flex flex-col items-center pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <img
            src={fields.avatar}
            alt={fields.name}
            className="object-cover mb-2 w-20 h-20 rounded-full shadow"
          />
          <h2 className="mb-1 text-xl font-bold text-gray-900 truncate dark:text-white">
            {fields.name}
          </h2>

          {/* Add to Leads/Companies Buttons */}
          <div className="flex gap-2 items-center mt-3">
            {!contactExists && (
              <button
                onClick={handleAddToLeads}
                disabled={isAddingToLeads}
                className={`flex items-center px-3 py-1 text-xs font-semibold rounded-full shadow transition ${
                  isAddingToLeads
                    ? "text-gray-500 bg-gray-100 border border-gray-300 cursor-not-allowed"
                    : "text-white bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <UserPlus className="mr-1 w-3 h-3" />
                {isAddingToLeads ? "Adding..." : "Add to Leads"}
              </button>
            )}

            {contactExists && (
              <div className="flex items-center px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full border border-green-300">
                <UserPlus className="mr-1 w-3 h-3" />
                Added to Leads
              </div>
            )}

            {conversation?.company && !companyExists && (
              <button
                onClick={handleAddToCompanies}
                disabled={isAddingToCompanies}
                className={`flex items-center px-3 py-1 text-xs font-semibold rounded-full shadow transition ${
                  isAddingToCompanies
                    ? "text-gray-500 bg-gray-100 border border-gray-300 cursor-not-allowed"
                    : "text-white bg-purple-600 hover:bg-purple-700"
                }`}
              >
                <Building className="mr-1 w-3 h-3" />
                {isAddingToCompanies ? "Adding..." : "Add to Companies"}
              </button>
            )}

            {conversation?.company && companyExists && (
              <div className="flex items-center px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full border border-green-300">
                <Building className="mr-1 w-3 h-3" />
                Added to Companies
              </div>
            )}
          </div>
        </div>
        {/* Tabs - Exact replica from LeadDetailPanel */}
        <div className="relative border-b border-gray-200 dark:border-gray-700">
          {/* Scroll buttons */}
          {canScrollLeft && (
            <button
              onClick={scrollTabsLeft}
              className="flex absolute top-0 left-0 z-10 justify-center items-center w-8 h-full bg-gradient-to-r from-white to-transparent"
            >
              <X className="w-4 h-4 text-gray-400 rotate-90" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={scrollTabsRight}
              className="flex absolute top-0 right-0 z-10 justify-center items-center w-8 h-full bg-gradient-to-l from-white to-transparent"
            >
              <X className="w-4 h-4 text-gray-400 -rotate-90" />
            </button>
          )}

          {/* Tabs container */}
          <div
            ref={tabsContainerRef}
            className="flex overflow-x-auto scrollbar-hide"
            onScroll={handleTabScroll}
          >
            <div className="flex px-6 py-3 space-x-6 min-w-max">
              {contactExists &&
                [
                  { id: "overview", label: "Overview", icon: User },
                  {
                    id: "notes",
                    label: "Notes",
                    icon: MessageSquare,
                  },
                  {
                    id: "activity",
                    label: "Activity",
                    icon: Clock,
                  },
                  {
                    id: "tasks",
                    label: "Tasks",
                    icon: Target,
                  },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}

              {!contactExists &&
                [
                  { id: "informations", label: "Informations", icon: User },
                  { id: "notes", label: "Notes", icon: MessageSquare },
                  { id: "activity", label: "Activity", icon: Clock },
                  { id: "tasks", label: "Tasks", icon: Target },
                  { id: "engagement", label: "Engagement", icon: Target },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
        {/* Tab Content */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          {activeTab === "informations" && (
            <div className="space-y-4">
              {/* Connection strength, lists, tags, owner, value (side by side) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Connection strength
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 dark:bg-gray-700 rounded-full">
                    {fields.connection}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Lists
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                    💸 {fields.lists.join(", ")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Tags
                  </span>
                  <button className="inline-flex items-center px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300 rounded-full border border-gray-300 dark:border-gray-600 transition hover:bg-gray-50 dark:hover:bg-gray-700">
                    + Select tags
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Owner
                  </span>
                  <span className="flex gap-2 items-center">
                    <img
                      src={fields.ownerAvatar}
                      alt="Owner"
                      className="w-5 h-5 rounded-full border"
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {fields.owner}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Value
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300 rounded-full border border-gray-300 dark:border-gray-600">
                    {fields.value}
                  </span>
                </div>
              </div>
              {/* Contact fields (compact) */}
              <div className="pt-1 space-y-2">
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </span>
                  <input
                    className="px-2 py-1 w-full text-sm rounded border transition focus:ring-2 focus:ring-blue-500"
                    placeholder="Add an email"
                    value={fields.email}
                  />
                </div>
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Company
                  </span>
                  <input
                    className="px-2 py-1 w-full text-sm rounded border transition focus:ring-2 focus:ring-blue-500"
                    placeholder="Search for a company"
                    value={fields.company}
                  />
                </div>
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Company Role
                  </span>
                  <input
                    className="px-2 py-1 w-full text-sm rounded border transition focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a text"
                    value={fields.companyRole}
                  />
                </div>
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Website URL
                  </span>
                  <input
                    className="px-2 py-1 w-full text-sm rounded border transition focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a text"
                    value={fields.website}
                  />
                </div>
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Source
                  </span>
                  <input
                    className="px-2 py-1 w-full text-sm rounded border transition focus:ring-2 focus:ring-blue-500"
                    placeholder="Select Source"
                    value={fields.source}
                  />
                </div>
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    LinkedIn URL
                  </span>
                  <div className="flex gap-2 items-center">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold text-gray-700 bg-gray-100 dark:bg-gray-700 rounded-full">
                      Ric
                    </span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {fields.linkedinName}
                    </span>
                    <span className="font-mono text-xs text-blue-600">
                      {fields.linkedin}
                    </span>
                    <button className="p-1 rounded hover:bg-gray-100">
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="p-1 rounded hover:bg-gray-100">
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Phone
                  </span>
                  <input
                    className="px-2 py-1 w-full text-sm rounded border transition focus:ring-2 focus:ring-blue-500"
                    placeholder="+1"
                    value={fields.phone}
                  />
                </div>
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    LinkedIn Company URL
                  </span>
                  <input
                    className="px-2 py-1 w-full text-sm rounded border transition focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a Linkedin username or URL"
                    value={fields.linkedinCompany}
                  />
                </div>
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    WhatsApp Username
                  </span>
                  <input
                    className="px-2 py-1 w-full text-sm rounded border transition focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a text"
                    value={fields.whatsapp}
                  />
                </div>
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Twitter Name
                  </span>
                  <input
                    className="px-2 py-1 w-full text-sm rounded border transition focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a text"
                    value={fields.twitter}
                  />
                </div>
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Twitter Company Name
                  </span>
                  <input
                    className="px-2 py-1 w-full text-sm rounded border transition focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a text"
                    value={fields.twitterCompany}
                  />
                </div>
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Telegram Username
                  </span>
                  <input
                    className="px-2 py-1 w-full text-sm rounded border transition focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a text"
                    value={fields.telegram}
                  />
                </div>
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Facebook Username
                  </span>
                  <input
                    className="px-2 py-1 w-full text-sm rounded border transition focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a text"
                    value={fields.facebook}
                  />
                </div>
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    YouTube Username
                  </span>
                  <input
                    className="px-2 py-1 w-full text-sm rounded border transition focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a text"
                    value={fields.youtube}
                  />
                </div>
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Instagram Username
                  </span>
                  <input
                    className="px-2 py-1 w-full text-sm rounded border transition focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a text"
                    value={fields.instagram}
                  />
                </div>
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    City
                  </span>
                  <input
                    className="px-2 py-1 w-full text-sm rounded border transition focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a text"
                    value={fields.city}
                  />
                </div>
                <div>
                  <span className="block mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Icebreaker
                  </span>
                  <input
                    className="px-2 py-1 w-full text-sm rounded border transition focus:ring-2 focus:ring-blue-500"
                    placeholder="Add text"
                    value={fields.icebreaker}
                  />
                </div>
              </div>
            </div>
          )}
          {activeTab === "overview" && (
            <div className="p-4 space-y-4" data-tab="overview">
              {existingContact ? (
                <>
                  {/* Contact Information */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                      Contact Information
                    </h3>
                    <div className="space-y-1">
                      <InfoRow
                        icon={<User className="w-4 h-4" />}
                        label="Name"
                        value={existingContact.name}
                        isEditable={true}
                        onSave={handleUpdateName}
                      />
                      <InfoRow
                        icon={<AtSign className="w-4 h-4" />}
                        label="Email"
                        value={existingContact.email}
                        isEditable={true}
                        onSave={handleUpdateEmail}
                      />
                      <InfoRow
                        icon={<Phone className="w-4 h-4" />}
                        label="Phone"
                        value={existingContact.phoneNumber}
                        isEditable={true}
                        onSave={handleUpdatePhoneNumber}
                      />
                      <InfoRow
                        icon={<MessageSquare className="w-4 h-4" />}
                        label="WhatsApp"
                        value={existingContact.whatsappNumber}
                        isEditable={true}
                        onSave={handleUpdateWhatsappNumber}
                      />
                      <InfoRow
                        icon={<Briefcase className="w-4 h-4" />}
                        label="Job Title"
                        value={existingContact.jobTitle}
                        isEditable={true}
                        onSave={handleUpdateJobTitle}
                      />
                    </div>
                  </div>

                  {/* Social & Web */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                      Social & Web
                    </h3>
                    <div className="space-y-1">
                      <InfoRow
                        icon={<Linkedin className="w-4 h-4" />}
                        label="LinkedIn"
                        value={existingContact.linkedinUrl}
                        href={existingContact.linkedinUrl || undefined}
                        isEditable={true}
                        onSave={handleUpdateLinkedinUrl}
                      />
                      <InfoRow
                        icon={<Globe className="w-4 h-4" />}
                        label="Twitter"
                        value={existingContact.twitterUrl}
                        isEditable={true}
                        onSave={handleUpdateTwitterUrl}
                      />
                      <InfoRow
                        icon={<Globe className="w-4 h-4" />}
                        label="Website"
                        value={existingContact.websiteUrl}
                        href={existingContact.websiteUrl || undefined}
                        isEditable={true}
                        onSave={handleUpdateWebsiteUrl}
                      />
                    </div>
                  </div>

                  {/* LinkedIn Information */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                      LinkedIn Information
                    </h3>
                    <div className="space-y-1">
                      <InfoRow
                        icon={<Linkedin className="w-4 h-4" />}
                        label="LinkedIn URN ID"
                        value={existingContact.linkedinUrnId}
                        isEditable={true}
                        onSave={value =>
                          handleUpdateContact("linkedinUrnId", value)
                        }
                      />
                      <InfoRow
                        icon={<Linkedin className="w-4 h-4" />}
                        label="LinkedIn Public ID"
                        value={existingContact.linkedinPublicId}
                        isEditable={true}
                        onSave={value =>
                          handleUpdateContact("linkedinPublicId", value)
                        }
                      />
                      <InfoRow
                        icon={<MapPin className="w-4 h-4" />}
                        label="LinkedIn Location"
                        value={existingContact.linkedinLocation}
                        isEditable={true}
                        onSave={value =>
                          handleUpdateContact("linkedinLocation", value)
                        }
                      />
                      <InfoRow
                        icon={<Briefcase className="w-4 h-4" />}
                        label="LinkedIn Headline"
                        value={existingContact.linkedinHeadline}
                        isEditable={true}
                        onSave={value =>
                          handleUpdateContact("linkedinHeadline", value)
                        }
                      />
                      <InfoRow
                        icon={<FileText className="w-4 h-4" />}
                        label="LinkedIn About"
                        value={existingContact.linkedinAbout}
                        isEditable={true}
                        onSave={value =>
                          handleUpdateContact("linkedinAbout", value)
                        }
                      />
                      <InfoRow
                        icon={<Calendar className="w-4 h-4" />}
                        label="LinkedIn Joined"
                        value={existingContact.linkedinJoined}
                        isEditable={true}
                        onSave={value =>
                          handleUpdateContact("linkedinJoined", value)
                        }
                      />
                      <InfoRow
                        icon={<Gift className="w-4 h-4" />}
                        label="LinkedIn Birthday"
                        value={existingContact.linkedinBirthday}
                        isEditable={true}
                        onSave={value =>
                          handleUpdateContact("linkedinBirthday", value)
                        }
                      />
                      <InfoRow
                        icon={<Link className="w-4 h-4" />}
                        label="LinkedIn Connected"
                        value={existingContact.linkedinConnected}
                        isEditable={true}
                        onSave={value =>
                          handleUpdateContact("linkedinConnected", value)
                        }
                      />
                      <InfoRow
                        icon={<MapPin className="w-4 h-4" />}
                        label="LinkedIn Address"
                        value={existingContact.linkedinAddress}
                        isEditable={true}
                        onSave={value =>
                          handleUpdateContact("linkedinAddress", value)
                        }
                      />
                      <InfoRow
                        icon={<CheckCircle2 className="w-4 h-4" />}
                        label="Open to Work"
                        value={
                          existingContact.linkedinIsOpenToWork ? "Yes" : "No"
                        }
                        isEditable={true}
                        onSave={value =>
                          handleUpdateContact(
                            "linkedinIsOpenToWork",
                            value === "Yes" ? "true" : "false"
                          )
                        }
                        dropdownOptions={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                      />
                      <InfoRow
                        icon={
                          <Image
                            className="w-4 h-4"
                            aria-label="Profile Photo Icon"
                          />
                        }
                        label="LinkedIn Profile Photo"
                        value={existingContact.linkedinProfilePhoto}
                        href={existingContact.linkedinProfilePhoto || undefined}
                        isEditable={true}
                        onSave={value =>
                          handleUpdateContact("linkedinProfilePhoto", value)
                        }
                      />
                      <InfoRow
                        icon={<Clock className="w-4 h-4" />}
                        label="Profile Updated"
                        value={existingContact.linkedinProfileUpdated}
                        isEditable={true}
                        onSave={value =>
                          handleUpdateContact("linkedinProfileUpdated", value)
                        }
                      />
                      <InfoRow
                        icon={<Clock className="w-4 h-4" />}
                        label="Contact Info Updated"
                        value={existingContact.linkedinContactInfoUpdated}
                        isEditable={true}
                        onSave={value =>
                          handleUpdateContact(
                            "linkedinContactInfoUpdated",
                            value
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Company Information */}
                  {existingContact.company && (
                    <div>
                      <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                        Company
                      </h3>
                      <div className="space-y-1">
                        <InfoRow
                          icon={<Building className="w-4 h-4" />}
                          label="Company"
                          value={existingContact.company.name as string}
                        />
                      </div>
                    </div>
                  )}

                  {/* Lead Information */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                      Lead Information
                    </h3>
                    <div className="space-y-1">
                      <InfoRow
                        icon={<CheckCircle2 className="w-4 h-4" />}
                        label="Status"
                        value={existingContact.status}
                        isEditable={true}
                        onSave={handleUpdateStatus}
                        dropdownOptions={[
                          { value: "LEAD", label: "Lead" },
                          { value: "ACTIVE", label: "Active" },
                          { value: "INACTIVE", label: "Inactive" },
                          { value: "PROSPECT", label: "Prospect" },
                          { value: "CUSTOMER", label: "Customer" },
                          { value: "LOST", label: "Lost" },
                          { value: "WON", label: "Won" },
                          { value: "DEAD", label: "Dead" },
                          { value: "ENGAGED", label: "Engaged" },
                          { value: "INTERESTED", label: "Interested" },
                          { value: "WARM", label: "Warm" },
                          { value: "CLOSED", label: "Closed" },
                        ]}
                      />
                      <InfoRow
                        icon={<Star className="w-4 h-4" />}
                        label="Priority"
                        value={existingContact.priority}
                        isEditable={true}
                        onSave={value => handleUpdateContact("priority", value)}
                        dropdownOptions={[
                          { value: "HOT", label: "Hot" },
                          { value: "WARM", label: "Warm" },
                          { value: "COLD", label: "Cold" },
                        ]}
                      />
                      <InfoRow
                        icon={<Target className="w-4 h-4" />}
                        label="Source"
                        value={existingContact.source}
                        isEditable={true}
                        onSave={value => handleUpdateContact("source", value)}
                      />
                      <InfoRow
                        icon={<Briefcase className="w-4 h-4" />}
                        label="Industry"
                        value={existingContact.industry}
                        isEditable={true}
                        onSave={value => handleUpdateContact("industry", value)}
                      />
                      <InfoRow
                        icon={<TrendingUp className="w-4 h-4" />}
                        label="Lead Type"
                        value={existingContact.leadType}
                        isEditable={true}
                        onSave={value => handleUpdateContact("leadType", value)}
                        dropdownOptions={[
                          { value: "COLD", label: "Cold" },
                          { value: "WARM", label: "Warm" },
                          { value: "HOT", label: "Hot" },
                        ]}
                      />
                      <InfoRow
                        icon={<Star className="w-4 h-4" />}
                        label="Lead Score"
                        value={existingContact.leadScore.toString()}
                        isEditable={true}
                        onSave={value =>
                          handleUpdateContact("leadScore", value)
                        }
                      />
                      <InfoRow
                        icon={<MessageSquare className="w-4 h-4" />}
                        label="Preferred Channel"
                        value={existingContact.preferredChannel}
                        isEditable={true}
                        onSave={value =>
                          handleUpdateContact("preferredChannel", value)
                        }
                        dropdownOptions={[
                          { value: "EMAIL", label: "Email" },
                          { value: "PHONE", label: "Phone" },
                          { value: "WHATSAPP", label: "WhatsApp" },
                          { value: "LINKEDIN", label: "LinkedIn" },
                          { value: "TWITTER", label: "Twitter" },
                          { value: "TELEGRAM", label: "Telegram" },
                          { value: "WEBSITE", label: "Website" },
                        ]}
                      />
                      <InfoRow
                        icon={<Clock className="w-4 h-4" />}
                        label="Last Contacted"
                        value={
                          existingContact.lastContactedAt
                            ? formatDate(existingContact.lastContactedAt)
                            : "Never"
                        }
                      />
                      <InfoRow
                        icon={<Calendar className="w-4 h-4" />}
                        label="Next Follow-up"
                        value={
                          existingContact.nextFollowUpAt
                            ? formatDate(existingContact.nextFollowUpAt)
                            : "Not scheduled"
                        }
                      />
                    </div>
                  </div>

                  {/* Owner */}
                  {existingContact.owner && (
                    <div>
                      <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                        Owner
                      </h3>
                      <div className="space-y-1">
                        <InfoRow
                          icon={<User className="w-4 h-4" />}
                          label="Assigned To"
                          value={existingContact.owner.name}
                        />
                      </div>
                    </div>
                  )}

                  {/* LinkedIn Experience */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                      LinkedIn Experience
                    </h3>
                    <div className="space-y-2">
                      {loadingLinkedinExperience ? (
                        <div className="flex justify-center items-center py-4">
                          <div className="w-4 h-4 rounded-full border-2 border-blue-600 animate-spin border-t-transparent"></div>
                        </div>
                      ) : (
                        <>
                          {linkedinExperience.map((experience, index) => (
                            <div
                              key={experience.id || index}
                              className="p-3 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800"
                            >
                              {editingLinkedinExperience === experience.id ? (
                                <form
                                  onSubmit={e => {
                                    e.preventDefault();
                                    const formData = new FormData(
                                      e.currentTarget
                                    );
                                    const data = {
                                      position: formData.get(
                                        "position"
                                      ) as string,
                                      company: formData.get(
                                        "company"
                                      ) as string,
                                      duration: formData.get(
                                        "duration"
                                      ) as string,
                                      location: formData.get(
                                        "location"
                                      ) as string,
                                      description: formData.get(
                                        "description"
                                      ) as string,
                                      skills: formData.get("skills") as string,
                                      url:
                                        (formData.get("url") as string) || null,
                                    };
                                    handleUpdateLinkedInExperience(
                                      experience.id,
                                      data as UpdateLinkedInExperienceRequest
                                    );
                                  }}
                                >
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      name="position"
                                      defaultValue={experience.position}
                                      className="px-2 py-1 text-xs rounded border border-gray-300"
                                      placeholder="Position"
                                    />
                                    <input
                                      name="company"
                                      defaultValue={experience.company || ""}
                                      className="px-2 py-1 text-xs rounded border border-gray-300"
                                      placeholder="Company"
                                    />
                                    <input
                                      name="duration"
                                      defaultValue={experience.duration || ""}
                                      className="px-2 py-1 text-xs rounded border border-gray-300"
                                      placeholder="Duration"
                                    />
                                    <input
                                      name="location"
                                      defaultValue={experience.location || ""}
                                      className="px-2 py-1 text-xs rounded border border-gray-300"
                                      placeholder="Location"
                                    />
                                    <textarea
                                      name="description"
                                      defaultValue={
                                        experience.description || ""
                                      }
                                      className="col-span-2 px-2 py-1 text-xs rounded border border-gray-300"
                                      placeholder="Description"
                                      rows={2}
                                    />
                                    <input
                                      name="skills"
                                      defaultValue={experience.skills || ""}
                                      className="px-2 py-1 text-xs rounded border border-gray-300"
                                      placeholder="Skills"
                                    />
                                    <input
                                      name="url"
                                      defaultValue={experience.url || ""}
                                      className="px-2 py-1 text-xs rounded border border-gray-300"
                                      placeholder="URL"
                                    />
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      type="submit"
                                      className="px-2 py-1 text-xs text-white bg-gray-900 rounded dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingLinkedinExperience(null)
                                      }
                                      className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded dark:bg-gray-700 hover:bg-gray-200"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div>
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <div className="text-sm font-medium">
                                        {experience.position}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400">
                                        {experience.company}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {experience.duration} •{" "}
                                        {experience.location}
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() =>
                                          setEditingLinkedinExperience(
                                            experience.id
                                          )
                                        }
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteLinkedInExperience(
                                            experience.id
                                          )
                                        }
                                        className="p-1 text-red-400 hover:text-red-600"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  {experience.description && (
                                    <div className="mb-2 text-xs text-gray-600 dark:text-gray-400">
                                      {experience.description}
                                    </div>
                                  )}
                                  {experience.skills && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Skills: {experience.skills}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                          {showLinkedinExperienceInput ? (
                            <form
                              onSubmit={e => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const data = {
                                  position: formData.get("position") as string,
                                  company: formData.get("company") as string,
                                  duration: formData.get("duration") as string,
                                  location: formData.get("location") as string,
                                  description: formData.get(
                                    "description"
                                  ) as string,
                                  skills: formData.get("skills") as string,
                                  url:
                                    (formData.get("url") as string) ||
                                    undefined,
                                };
                                handleCreateLinkedInExperience(data);
                                if (e.currentTarget) {
                                  e.currentTarget.reset();
                                }
                              }}
                            >
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  name="position"
                                  className="px-2 py-1 text-xs rounded border border-gray-300"
                                  placeholder="Position"
                                  required
                                />
                                <input
                                  name="company"
                                  className="px-2 py-1 text-xs rounded border border-gray-300"
                                  placeholder="Company"
                                  required
                                />
                                <input
                                  name="duration"
                                  className="px-2 py-1 text-xs rounded border border-gray-300"
                                  placeholder="Duration"
                                />
                                <input
                                  name="location"
                                  className="px-2 py-1 text-xs rounded border border-gray-300"
                                  placeholder="Location"
                                />
                                <textarea
                                  name="description"
                                  className="col-span-2 px-2 py-1 text-xs rounded border border-gray-300"
                                  placeholder="Description"
                                  rows={2}
                                />
                                <input
                                  name="skills"
                                  className="px-2 py-1 text-xs rounded border border-gray-300"
                                  placeholder="Skills"
                                />
                                <input
                                  name="url"
                                  className="px-2 py-1 text-xs rounded border border-gray-300"
                                  placeholder="URL"
                                />
                              </div>
                              <div className="flex gap-2 mt-2">
                                <button
                                  type="submit"
                                  className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                                >
                                  Add Experience
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowLinkedinExperienceInput(false)
                                  }
                                  className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded dark:bg-gray-700 hover:bg-gray-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              onClick={() =>
                                setShowLinkedinExperienceInput(true)
                              }
                              className="flex gap-2 items-center px-3 py-2 text-xs text-blue-600 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100"
                            >
                              <Plus className="w-3 h-3" />
                              Add Experience
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* LinkedIn Skills */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                      LinkedIn Skills
                    </h3>
                    <div className="space-y-2">
                      {loadingLinkedinSkills ? (
                        <div className="flex justify-center items-center py-4">
                          <div className="w-4 h-4 rounded-full border-2 border-blue-600 animate-spin border-t-transparent"></div>
                        </div>
                      ) : (
                        <>
                          {linkedinSkills.map((skill, index) => (
                            <div
                              key={skill.id || index}
                              className="p-3 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800"
                            >
                              {editingLinkedinSkills === skill.id ? (
                                <form
                                  onSubmit={e => {
                                    e.preventDefault();
                                    const formData = new FormData(
                                      e.currentTarget
                                    );
                                    const data = {
                                      skillName: formData.get("name") as string,
                                    };
                                    handleUpdateLinkedInSkill(skill.id, data);
                                  }}
                                >
                                  <div className="grid grid-cols-1 gap-2">
                                    <input
                                      name="name"
                                      defaultValue={skill.skillName || ""}
                                      className="px-2 py-1 text-xs rounded border border-gray-300"
                                      placeholder="Skill Name"
                                      required
                                    />
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      type="submit"
                                      className="px-2 py-1 text-xs text-white bg-gray-900 rounded dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingLinkedinSkills(null)
                                      }
                                      className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded dark:bg-gray-700 hover:bg-gray-200"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div>
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <div className="text-sm font-medium">
                                        {skill.skillName}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400">
                                        {String(
                                          (
                                            skill as unknown as Record<
                                              string,
                                              unknown
                                            >
                                          ).skillCategory || ""
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Level:{" "}
                                        {String(
                                          (
                                            skill as unknown as Record<
                                              string,
                                              unknown
                                            >
                                          ).skillLevel || ""
                                        )}{" "}
                                        • Endorsements:{" "}
                                        {Number(
                                          (
                                            skill as unknown as Record<
                                              string,
                                              unknown
                                            >
                                          ).endorsementCount || 0
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() =>
                                          setEditingLinkedinSkills(skill.id)
                                        }
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteLinkedInSkill(skill.id)
                                        }
                                        className="p-1 text-red-400 hover:text-red-600"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {showLinkedinSkillsInput ? (
                            <form
                              onSubmit={e => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const data = {
                                  skillName: formData.get("name") as string,
                                };
                                handleCreateLinkedInSkill(data);
                                if (e.currentTarget) {
                                  e.currentTarget.reset();
                                }
                              }}
                            >
                              <div className="grid grid-cols-1 gap-2">
                                <input
                                  name="name"
                                  className="px-2 py-1 text-xs rounded border border-gray-300"
                                  placeholder="Skill Name"
                                  required
                                />
                              </div>
                              <div className="flex gap-2 mt-2">
                                <button
                                  type="submit"
                                  className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                                >
                                  Add Skill
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowLinkedinSkillsInput(false)
                                  }
                                  className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded dark:bg-gray-700 hover:bg-gray-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              onClick={() => setShowLinkedinSkillsInput(true)}
                              className="flex gap-2 items-center px-3 py-2 text-xs text-blue-600 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100"
                            >
                              <Plus className="w-3 h-3" />
                              Add Skill
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* LinkedIn Job Preferences */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                      LinkedIn Job Preferences
                    </h3>
                    <div className="space-y-2">
                      {loadingLinkedinJobPreferences ? (
                        <div className="flex justify-center items-center py-4">
                          <div className="w-4 h-4 rounded-full border-2 border-blue-600 animate-spin border-t-transparent"></div>
                        </div>
                      ) : (
                        <>
                          {linkedinJobPreferences.map((preference, index) => (
                            <div
                              key={preference.id || index}
                              className="p-3 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-800"
                            >
                              {editingLinkedinJobPreferences ===
                              preference.id ? (
                                <form
                                  onSubmit={e => {
                                    e.preventDefault();
                                    const formData = new FormData(
                                      e.currentTarget
                                    );
                                    const data = {
                                      jobTitle: formData.get(
                                        "jobTitle"
                                      ) as string,
                                      location: formData.get(
                                        "location"
                                      ) as string,
                                      locationType: formData.get(
                                        "locationType"
                                      ) as string,
                                      employmentType: formData.get(
                                        "employmentType"
                                      ) as string,
                                    };
                                    handleUpdateLinkedInJobPreference(
                                      preference.id,
                                      data
                                    );
                                  }}
                                >
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      name="jobTitle"
                                      defaultValue={preference.jobTitle || ""}
                                      className="px-2 py-1 text-xs rounded border border-gray-300"
                                      placeholder="Job Title"
                                    />
                                    <input
                                      name="location"
                                      defaultValue={preference.location || ""}
                                      className="px-2 py-1 text-xs rounded border border-gray-300"
                                      placeholder="Location"
                                    />
                                    <select
                                      name="locationType"
                                      defaultValue={
                                        preference.locationType || ""
                                      }
                                      className="px-2 py-1 text-xs rounded border border-gray-300"
                                    >
                                      <option value="">
                                        Select Location Type
                                      </option>
                                      <option value="ONSITE">On-site</option>
                                      <option value="REMOTE">Remote</option>
                                      <option value="HYBRID">Hybrid</option>
                                    </select>
                                    <select
                                      name="employmentType"
                                      defaultValue={
                                        preference.employmentType || ""
                                      }
                                      className="px-2 py-1 text-xs rounded border border-gray-300"
                                    >
                                      <option value="">
                                        Select Employment Type
                                      </option>
                                      <option value="FULL_TIME">
                                        Full-time
                                      </option>
                                      <option value="PART_TIME">
                                        Part-time
                                      </option>
                                      <option value="CONTRACT">Contract</option>
                                      <option value="INTERNSHIP">
                                        Internship
                                      </option>
                                    </select>
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      type="submit"
                                      className="px-2 py-1 text-xs text-white bg-gray-900 rounded dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingLinkedinJobPreferences(null)
                                      }
                                      className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded dark:bg-gray-700 hover:bg-gray-200"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div>
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <div className="text-sm font-medium">
                                        {preference.jobTitle}
                                      </div>
                                      <div className="text-xs text-gray-600 dark:text-gray-400">
                                        {preference.location}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {preference.locationType} •{" "}
                                        {preference.employmentType}
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() =>
                                          setEditingLinkedinJobPreferences(
                                            preference.id
                                          )
                                        }
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteLinkedInJobPreference(
                                            preference.id
                                          )
                                        }
                                        className="p-1 text-red-400 hover:text-red-600"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {showLinkedinJobPreferenceInput ? (
                            <form
                              onSubmit={e => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const data = {
                                  jobTitle: formData.get("jobTitle") as string,
                                  location: formData.get("location") as string,
                                  locationType:
                                    (formData.get("locationType") as string) ||
                                    "ONSITE",
                                  employmentType:
                                    (formData.get(
                                      "employmentType"
                                    ) as string) || "FULL_TIME",
                                };
                                handleCreateLinkedInJobPreference(data);
                                if (e.currentTarget) {
                                  e.currentTarget.reset();
                                }
                              }}
                            >
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  name="jobTitle"
                                  className="px-2 py-1 text-xs rounded border border-gray-300"
                                  placeholder="Job Title"
                                  required
                                />
                                <input
                                  name="location"
                                  className="px-2 py-1 text-xs rounded border border-gray-300"
                                  placeholder="Location"
                                />
                                <select
                                  name="locationType"
                                  className="px-2 py-1 text-xs rounded border border-gray-300"
                                  defaultValue="ONSITE"
                                >
                                  <option value="ONSITE">On-site</option>
                                  <option value="REMOTE">Remote</option>
                                  <option value="HYBRID">Hybrid</option>
                                </select>
                                <select
                                  name="employmentType"
                                  className="px-2 py-1 text-xs rounded border border-gray-300"
                                  defaultValue="FULL_TIME"
                                >
                                  <option value="FULL_TIME">Full-time</option>
                                  <option value="PART_TIME">Part-time</option>
                                  <option value="CONTRACT">Contract</option>
                                  <option value="INTERNSHIP">Internship</option>
                                </select>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <button
                                  type="submit"
                                  className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                                >
                                  Add Job Preference
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowLinkedinJobPreferenceInput(false)
                                  }
                                  className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded dark:bg-gray-700 hover:bg-gray-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              onClick={() =>
                                setShowLinkedinJobPreferenceInput(true)
                              }
                              className="flex gap-2 items-center px-3 py-2 text-xs text-blue-600 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100"
                            >
                              <Plus className="w-3 h-3" />
                              Add Job Preference
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                      Tags
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-start px-2 py-2 -mx-2 space-x-3 rounded-md transition-colors duration-150 group hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="text-gray-400 mt-0.5 flex-shrink-0">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                            Tags
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {existingContact.tags &&
                            existingContact.tags.length > 0 ? (
                              existingContact.tags.map((tag, index) => {
                                let tagName: string | undefined,
                                  assignmentId: string | undefined;

                                if (typeof tag === "string") {
                                  tagName = tag;
                                  assignmentId = tagAssignments[tag];
                                } else if (tag && typeof tag === "object") {
                                  const tagObj = tag as Record<string, unknown>;
                                  if (
                                    tagObj.tag &&
                                    (tagObj.tag as Record<string, unknown>)
                                      .name &&
                                    tagObj.id
                                  ) {
                                    tagName = (
                                      tagObj.tag as Record<string, unknown>
                                    ).name as string;
                                    assignmentId = tagObj.id as string;
                                  } else if (tagObj.name && tagObj.id) {
                                    tagName = tagObj.name as string;
                                    assignmentId = tagObj.id as string;
                                  } else if (
                                    tagObj.tag &&
                                    (tagObj.tag as Record<string, unknown>).name
                                  ) {
                                    tagName = (
                                      tagObj.tag as Record<string, unknown>
                                    ).name as string;
                                    assignmentId =
                                      ((tagObj.tag as Record<string, unknown>)
                                        .id as string) || (tagObj.id as string);
                                  } else if (tagObj.name) {
                                    tagName = tagObj.name as string;
                                    assignmentId = tagObj.id as string;
                                  } else if (
                                    tagObj.tag &&
                                    (tagObj.tag as Record<string, unknown>).id
                                  ) {
                                    tagName =
                                      ((tagObj.tag as Record<string, unknown>)
                                        .name as string) || "Unknown Tag";
                                    assignmentId =
                                      (tagObj.id as string) ||
                                      ((tagObj.tag as Record<string, unknown>)
                                        .id as string);
                                  } else if (tagObj.id) {
                                    tagName =
                                      (tagObj.name as string) || "Unknown Tag";
                                    assignmentId = tagObj.id as string;
                                  }
                                }

                                if (!tagName || !assignmentId) {
                                  return (
                                    <div
                                      key={index}
                                      className="flex items-center px-1 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full border border-gray-200 w-fit justify-self-start"
                                    >
                                      <span className="p-1">
                                        {tagName || "Unknown Tag"}
                                      </span>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={index}
                                    className="flex items-center px-1 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200 w-fit justify-self-start"
                                  >
                                    <span className="p-1">{tagName}</span>
                                    {assignmentId && (
                                      <button
                                        onClick={() =>
                                          handleRemoveTag(assignmentId)
                                        }
                                        disabled={removingTag === assignmentId}
                                        className="flex-shrink-0 text-blue-500 hover:text-blue-700 disabled:opacity-50"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                No tags assigned
                              </span>
                            )}
                          </div>

                          {/* Add Tag Section */}
                          <div
                            className="relative tag-dropdown-container"
                            ref={tagDropdownRef}
                          >
                            <button
                              onClick={() => {
                                if (!showTagDropdown) {
                                  setTagSearchTerm("");
                                  setFilteredTags(availableTags);
                                }
                                setShowTagDropdown(!showTagDropdown);
                              }}
                              disabled={loadingTags || assigningTag}
                              className="flex gap-2 items-center px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-3 h-3" />
                              {loadingTags ? "Loading..." : "Add Tag"}
                            </button>

                            {/* Tag Dropdown */}
                            <div
                              className={`absolute bottom-full left-0 mb-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 max-h-48 overflow-hidden transition-all duration-200 ease-in-out ${
                                showTagDropdown
                                  ? "opacity-100 transform scale-100 translate-y-0"
                                  : "opacity-0 transform scale-95 translate-y-2 pointer-events-none"
                              }`}
                            >
                              {/* Search Input */}
                              <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                                <input
                                  type="text"
                                  placeholder="Search tags..."
                                  value={tagSearchTerm}
                                  className="px-2 py-1 w-full text-xs text-gray-900 bg-white rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  onChange={e => {
                                    const searchTerm = e.target.value;
                                    setTagSearchTerm(searchTerm);
                                    const filtered = availableTags.filter(
                                      tag =>
                                        tag.name
                                          .toLowerCase()
                                          .includes(searchTerm.toLowerCase()) ||
                                        (tag.description &&
                                          tag.description
                                            .toLowerCase()
                                            .includes(searchTerm.toLowerCase()))
                                    );
                                    setFilteredTags(filtered);
                                  }}
                                />
                              </div>

                              {/* Tags List */}
                              <div className="overflow-y-auto max-h-36">
                                {(tagSearchTerm ? filteredTags : availableTags)
                                  .length > 0 ? (
                                  (tagSearchTerm
                                    ? filteredTags
                                    : availableTags
                                  ).map(tag => {
                                    const isAssigned =
                                      existingContact.tags?.some(leadTag => {
                                        let leadTagId;
                                        if (typeof leadTag === "string") {
                                          const matchingTag =
                                            availableTags.find(
                                              t => t.name === leadTag
                                            );
                                          leadTagId = matchingTag?.id;
                                        } else if (
                                          leadTag &&
                                          typeof leadTag === "object"
                                        ) {
                                          const leadTagObj = leadTag as Record<
                                            string,
                                            unknown
                                          >;
                                          if (
                                            leadTagObj.tag &&
                                            (
                                              leadTagObj.tag as Record<
                                                string,
                                                unknown
                                              >
                                            ).id
                                          ) {
                                            leadTagId = (
                                              leadTagObj.tag as Record<
                                                string,
                                                unknown
                                              >
                                            ).id as string;
                                          } else if (leadTagObj.id) {
                                            leadTagId = leadTagObj.id as string;
                                          }
                                        }
                                        return leadTagId === tag.id;
                                      });

                                    return (
                                      <button
                                        key={tag.id}
                                        onClick={() => {
                                          if (!isAssigned) {
                                            handleAssignTag(tag.id);
                                          }
                                        }}
                                        disabled={isAssigned || assigningTag}
                                        className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 whitespace-nowrap ${
                                          isAssigned
                                            ? "text-gray-400 bg-gray-50 dark:bg-gray-800"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        <div className="flex justify-between items-center">
                                          <div className="flex gap-2 items-center">
                                            <Zap className="w-3 h-3 text-purple-600" />
                                            <span className="font-medium">
                                              {tag.name}
                                            </span>
                                          </div>
                                          {isAssigned && (
                                            <CheckCircle2 className="flex-shrink-0 w-3 h-3 text-green-500" />
                                          )}
                                        </div>
                                        {tag.description && (
                                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                            {tag.description}
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                                    {tagSearchTerm
                                      ? "No tags found"
                                      : "No tags available"}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                    Contact Information
                  </h3>
                  <div className="space-y-1">
                    <InfoRow
                      icon={<User className="w-4 h-4" />}
                      label="Name"
                      value={conversation?.contact || ""}
                      isEditable={false}
                    />
                    <InfoRow
                      icon={<AtSign className="w-4 h-4" />}
                      label="Email"
                      value={conversation?.contactEmail || ""}
                      isEditable={false}
                    />
                    <InfoRow
                      icon={<Phone className="w-4 h-4" />}
                      label="Phone"
                      value={conversation?.phone || ""}
                      isEditable={false}
                    />
                    <InfoRow
                      icon={<MessageSquare className="w-4 h-4" />}
                      label="WhatsApp"
                      value={conversation?.whatsapp || ""}
                      isEditable={false}
                    />
                    <InfoRow
                      icon={<Briefcase className="w-4 h-4" />}
                      label="Job Title"
                      value={conversation?.companyRole || ""}
                      isEditable={false}
                    />
                    <InfoRow
                      icon={<Building className="w-4 h-4" />}
                      label="Company"
                      value={conversation?.company || ""}
                      isEditable={false}
                    />
                    <InfoRow
                      icon={<Linkedin className="w-4 h-4" />}
                      label="LinkedIn"
                      value={conversation?.linkedin || ""}
                      href={
                        conversation?.linkedin
                          ? `https://linkedin.com/in/${conversation.linkedin}`
                          : undefined
                      }
                      isEditable={false}
                    />
                    <InfoRow
                      icon={<Globe className="w-4 h-4" />}
                      label="Website"
                      value={conversation?.website || ""}
                      href={conversation?.website || undefined}
                      isEditable={false}
                    />
                  </div>
                  <div className="p-3 mt-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Add to Leads to Edit Contact Information
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-blue-700">
                      Currently showing read-only data from the conversation.
                      Add this contact to leads to make all fields editable.
                    </p>
                    <button
                      onClick={handleAddToLeads}
                      disabled={isAddingToLeads}
                      className="px-4 py-2 mt-2 text-sm text-white bg-gray-900 rounded-md dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      {isAddingToLeads ? "Adding..." : "Add to Leads"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "notes" && (
            <div className="p-4">
              {existingContact ? (
                <NotesSection
                  entityId={existingContact.id}
                  entityType="contact"
                  onRefresh={() => {
                    // Refresh contact data if needed
                  }}
                />
              ) : (
                <div className="py-8 text-center">
                  <MessageSquare className="mx-auto mb-2 w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add this contact to leads to manage notes
                  </p>
                  <button
                    onClick={handleAddToLeads}
                    disabled={isAddingToLeads}
                    className="px-4 py-2 mt-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isAddingToLeads ? "Adding..." : "Add to Leads"}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="p-4">
              {existingContact ? (
                <ActivitiesSection
                  entityId={existingContact.id}
                  entityType="contact"
                  onRefresh={() => {
                    // Refresh contact data if needed
                  }}
                />
              ) : (
                <div className="py-8 text-center">
                  <Activity className="mx-auto mb-2 w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add this contact to leads to track activities
                  </p>
                  <button
                    onClick={handleAddToLeads}
                    disabled={isAddingToLeads}
                    className="px-4 py-2 mt-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isAddingToLeads ? "Adding..." : "Add to Leads"}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="p-4">
              {existingContact ? (
                <TaskSection
                  entityId={existingContact.id}
                  entityType="contact"
                  entityName={existingContact.name || "Contact"}
                  onRefresh={() => {
                    // Refresh contact data if needed
                  }}
                />
              ) : (
                <div className="py-8 text-center">
                  <Target className="mx-auto mb-2 w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add this contact to leads to manage tasks
                  </p>
                  <button
                    onClick={handleAddToLeads}
                    disabled={isAddingToLeads}
                    className="px-4 py-2 mt-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isAddingToLeads ? "Adding..." : "Add to Leads"}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "engagement" && (
            <div className="flex justify-center items-center h-full text-sm text-gray-400">
              Engagement metrics coming soon...
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const InboxView: React.FC = () => {
  const searchParams = useSearchParams();
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { selectedOrganization, selectedWorkspace } = useWorkspace();
  const [accounts, setAccounts] = useState<
    {
      id: string;
      remoteAccountId: string;
      displayName?: string;
      phoneNumber?: string;
    }[]
  >([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );
  const [accountIdMapping, setAccountIdMapping] = useState<
    Record<string, string>
  >({});
  const [, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [refreshConversationsTrigger, setRefreshConversationsTrigger] =
    useState(0);
  // Removed composer state as it's now handled in MessageInput component

  // Get the selected inbox type from URL parameters or default to 'email'
  const getSelectedInboxType = ():
    | "email"
    | "linkedin"
    | "telegram"
    | "whatsapp" => {
    const type = searchParams.get("type");
    if (type && ["email", "linkedin", "telegram", "whatsapp"].includes(type)) {
      return type as "email" | "linkedin" | "telegram" | "whatsapp";
    }
    return "whatsapp";
  };

  const selectedInboxType = getSelectedInboxType();

  // Debug logging for component initialization (only log when values change)
  React.useEffect(() => {}, [
    selectedInboxType,
    user,
    selectedOrganization,
    selectedWorkspace,
    accounts.length,
    selectedAccountId,
  ]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to handle conversation selection and mark as read
  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation);

    // Mark conversation as read if it's a WhatsApp conversation with unread messages
    if (
      selectedInboxType === "whatsapp" &&
      selectedAccountId &&
      conversation.whatsappId &&
      conversation.unreadCount > 0
    ) {
      try {
        const internalAccountId = accountIdMapping[selectedAccountId];
        if (!internalAccountId) {
          return;
        }

        const workspaceId = selectedWorkspace?.id;
        const organizationId = selectedOrganization?.id;

        if (!workspaceId || !organizationId) {
          return;
        }

        await whatsappService.markConversationAsRead({
          organizationId,
          workspaceId,
          accountId: internalAccountId,
          conversationId: conversation.whatsappId,
          type:
            conversation.conversationType === "GROUP" ? "GROUP" : "INDIVIDUAL",
        });

        // Update the conversation's unread count locally
        setWaConversations(prev =>
          prev.map(conv =>
            conv.whatsappId === conversation.whatsappId
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );

        // Add to locally read conversations set
        if (conversation.whatsappId) {
          setLocallyReadConversations(
            prev => new Set([...prev, conversation.whatsappId as string])
          );
        }
      } catch (error) {
        // Don't show error toast to user as this is not critical
      }
    }
  };

  // Load WhatsApp accounts for the workspace
  useEffect(() => {
    const loadAccounts = async () => {
      if (
        !user ||
        !selectedOrganization ||
        !selectedWorkspace ||
        !isAuthenticated
      ) {
        return;
      }

      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        return;
      }

      const workspaceId = selectedWorkspace.id;
      const organizationId = selectedOrganization.id;

      try {
        setLoading(true);
        const res = await whatsappService.listAccounts({
          organizationId,
          workspaceId,
        });

        const accountMapping: Record<string, string> = {};
        const mappedAccounts = res.accounts.map((a: any) => {
          accountMapping[a.remoteAccountId] = a.id;
          return {
            id: a.id,
            remoteAccountId: a.remoteAccountId,
            displayName: a.displayName || a.phoneNumber || a.remoteAccountId,
            phoneNumber: a.phoneNumber,
          };
        });

        setAccounts(mappedAccounts);
        setAccountIdMapping(accountMapping);

        if (res.accounts.length && !selectedAccountId) {
          const firstAccountId = res.accounts[0].remoteAccountId;

          setSelectedAccountId(firstAccountId);
        } else if (selectedAccountId) {
        } else {
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedOrganization, selectedWorkspace]);

  // Force account selection if accounts are loaded but none is selected
  useEffect(() => {
    if (
      accounts.length > 0 &&
      !selectedAccountId &&
      selectedInboxType === "whatsapp"
    ) {
      setSelectedAccountId(accounts[0].remoteAccountId);
    }
  }, [
    user,
    isAuthenticated,
    selectedOrganization,
    selectedWorkspace,
    accounts,
    selectedAccountId,
    selectedInboxType,
  ]);

  // Fetch conversations for selected account when inboxType is whatsapp
  type WaConversationDTO = {
    id: string;
    name: string;
    whatsappId: string;
    lastMessage?: { content: string; timestamp: string; fromMe: boolean };
    unreadCount: number;
    lastMessageAt: string;
    profilePicUrl?: string;
    type: "INDIVIDUAL" | "GROUP";
  };
  const [waConversations, setWaConversations] = useState<WaConversationDTO[]>(
    []
  );
  // Track conversations that have been marked as read locally
  const [locallyReadConversations, setLocallyReadConversations] = useState<
    Set<string>
  >(new Set());
  useEffect(() => {
    const loadConversations = async () => {
      if (
        !user ||
        !selectedOrganization ||
        !selectedWorkspace ||
        !isAuthenticated
      ) {
        return;
      }

      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        return;
      }

      const workspaceId = selectedWorkspace.id;
      const organizationId = selectedOrganization.id;

      if (selectedInboxType !== "whatsapp" || !selectedAccountId) {
        return;
      }
      try {
        setLoading(true);
        const internalAccountId = accountIdMapping[selectedAccountId];
        if (!internalAccountId) {
          return;
        }

        const res = await whatsappService.getConversations({
          accountId: internalAccountId,
          organizationId,
          workspaceId,
          search: searchTerm || undefined,
          limit: 100,
          offset: 0,
        });

        // Preserve locally read conversations by setting their unread count to 0
        const conversationsWithLocalReadState = (res.conversations || []).map(
          (conv: Conversation) => {
            if (
              conv.whatsappId &&
              locallyReadConversations.has(conv.whatsappId)
            ) {
              return { ...conv, unreadCount: 0 };
            }
            return conv;
          }
        );

        setWaConversations(conversationsWithLocalReadState);
        // auto-select first conversation if none selected
        if (!selectedConversation && res.conversations?.length) {
          const c = res.conversations[0];
          const conversation: Conversation = {
            id: c.id,
            contact: c.name,
            contactEmail: "",
            lastMessage: c.lastMessage?.content || "",
            timestamp: new Date(c.lastMessageAt),
            unreadCount: c.unreadCount,
            type: "whatsapp" as const,
            avatar: c.profilePicUrl,
            whatsappId: c.whatsappId,
            conversationType: c.type,
          };
          setSelectedConversation(conversation);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user,
    isAuthenticated,
    selectedOrganization,
    selectedWorkspace,
    selectedInboxType,
    selectedAccountId,
    searchTerm,
    refreshConversationsTrigger,
  ]);

  // Subscribe to general real-time message updates (for conversation list updates)
  useEffect(() => {
    if (
      !user ||
      !selectedOrganization ||
      !selectedWorkspace ||
      !isAuthenticated ||
      selectedInboxType !== "whatsapp"
    )
      return;

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    // Don't subscribe if we don't have accounts loaded yet or selectedAccountId
    if (accounts.length === 0 || !selectedAccountId) {
      return;
    }

    const base = API_BASE_URL;
    const token = localStorage.getItem("crm_access_token") || "";

    const sseUrl = `${base.replace(/\/$/, "")}/whatsapp/accounts/message-updates?organizationId=${encodeURIComponent(organizationId)}&workspaceId=${encodeURIComponent(workspaceId)}`;

    // Note: EventSource doesn't support custom headers, so we'll use fetch with SSE
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(sseUrl, {
          headers: {
            Accept: "text/event-stream",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() || "";

          for (const chunk of chunks) {
            const dataLines = chunk
              .split("\n")
              .filter(l => l.startsWith("data:"))
              .map(l => l.slice(5).trim());

            if (!dataLines.length) continue;

            const dataStr = dataLines.join("\n");
            try {
              const data = JSON.parse(dataStr);

              if (data.type === "message_update") {
                // Map the selected remote account ID to backend account ID for comparison
                const selectedBackendAccountId = selectedAccountId
                  ? accountIdMapping[selectedAccountId]
                  : null;

                // Check if this message is from the currently selected account
                const isFromSelectedAccount =
                  data.accountId === selectedBackendAccountId;

                // Check if this message is for the currently selected conversation
                // Handle different WhatsApp ID formats (with/without @c.us or @g.us suffix)
                const normalizeWhatsAppId = (id: string) =>
                  id.replace("@c.us", "").replace("@g.us", "");

                const isForCurrentConversation =
                  selectedConversation &&
                  selectedConversation.whatsappId &&
                  (normalizeWhatsAppId(data.from) ===
                    normalizeWhatsAppId(selectedConversation.whatsappId) ||
                    normalizeWhatsAppId(data.to) ===
                      normalizeWhatsAppId(selectedConversation.whatsappId));

                // Always update conversation list for messages from the selected account
                // This ensures conversation reordering works properly
                if (isFromSelectedAccount) {
                  updateConversationList({
                    messageId: data.messageId,
                    messageType: data.messageType,
                    content: data.content,
                    from: data.from,
                    to: data.to,
                    fromName: data.fromName,
                    toName: data.toName,
                    timestamp: data.timestamp,
                  });

                  // Only add messages that belong to the current conversation AND are from selected account
                  if (isForCurrentConversation) {
                  } else {
                    return;
                  }
                } else {
                  return;
                }

                // Check if message already exists to prevent duplicates
                setMessages(prev => {
                  const messageExists = prev.some(
                    msg => msg.id === data.messageId
                  );
                  if (messageExists) {
                    return prev;
                  }

                  // For group conversations, ensure we show individual sender names
                  let senderName = data.fromName || "Contact";

                  // If this is a group conversation and the message is not from "Me",
                  // ensure we're showing the individual sender's name, not the group name
                  if (
                    selectedConversation?.conversationType === "GROUP" &&
                    data.fromName !== "Me"
                  ) {
                    // The backend should provide the individual sender's name in fromName
                    // If it's still showing group name, we'll use a fallback
                    if (data.fromName === selectedConversation.contact) {
                      // This means the backend is still sending group name instead of individual sender
                      // Use the sender's WhatsApp ID as fallback
                      senderName =
                        data.from?.replace("@c.us", "") || "Unknown User";
                    }
                  }

                  // Create a new message object
                  const newMessage: Message = {
                    id: data.messageId,
                    from: senderName,
                    fromEmail: "",
                    subject: "",
                    preview: data.content,
                    timestamp: new Date(data.timestamp),
                    isRead: data.messageType === "outgoing",
                    isStarred: false,
                    type: "whatsapp" as const,
                    avatar:
                      senderName === "Me"
                        ? `https://ui-avatars.com/api/?name=Me&background=10b981&color=ffffff&size=24&bold=true` // Green for "Me"
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=6366f1&color=ffffff&size=24&bold=true`, // Blue for contacts
                    attachments: data.media ? [data.media] : [],
                    media: data.media,
                    messageType: data.contentType,
                  };

                  // Add new message to the end and sort by timestamp
                  const updatedMessages = [...prev, newMessage].sort(
                    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
                  );

                  return updatedMessages;
                });

                // Note: Sound notifications are now handled globally by GlobalMessageProvider
                // Only play sound if we're not in the inbox view (to avoid duplicate notifications)
                if (
                  data.messageType === "incoming" &&
                  !window.location.pathname.includes("/inbox")
                ) {
                  playNotificationSound();
                }

                // Update conversation list to reflect new message
                updateConversationList(data);
              } else if (data.type === "message_deleted") {
                // Remove the deleted message from the messages list
                setMessages(prev => {
                  const updatedMessages = prev.filter(
                    msg => msg.id !== data.data.messageId
                  );

                  return updatedMessages;
                });
              }
            } catch (error) {}
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
        }
      }
    })();

    // Cleanup function
    return () => {
      controller.abort();
    };
  }, [
    user,
    isAuthenticated,
    selectedOrganization,
    selectedWorkspace,
    selectedInboxType,
    selectedAccountId,
    accounts,
    accountIdMapping,
    selectedConversation,
  ]);

  // Function to update conversation list when new messages arrive
  const updateConversationList = (messageData: {
    messageId: string;
    messageType: "incoming" | "outgoing";
    content: string;
    from: string;
    to: string;
    fromName?: string;
    toName?: string;
    timestamp: string;
  }) => {
    setWaConversations(prev => {
      // Find the conversation that this message belongs to
      // For incoming messages, the sender is the contact
      // For outgoing messages, the recipient is the contact
      const conversationWhatsappId =
        messageData.messageType === "incoming"
          ? messageData.from
          : messageData.to;

      // Handle different WhatsApp ID formats (with/without @c.us or @g.us suffix)
      const normalizeWhatsAppId = (id: string) =>
        id.replace("@c.us", "").replace("@g.us", "");

      const existingConversationIndex = prev.findIndex(
        conv =>
          normalizeWhatsAppId(conv.whatsappId) ===
          normalizeWhatsAppId(conversationWhatsappId)
      );

      if (existingConversationIndex >= 0) {
        // Update existing conversation
        const updatedConversations = [...prev];
        const conversation = updatedConversations[existingConversationIndex];

        updatedConversations[existingConversationIndex] = {
          ...conversation,
          lastMessage: {
            content: messageData.content,
            timestamp: messageData.timestamp,
            fromMe: messageData.messageType === "outgoing",
          },
          lastMessageAt: messageData.timestamp,
          unreadCount:
            messageData.messageType === "incoming"
              ? conversation.unreadCount + 1
              : conversation.unreadCount,
        };

        // Move updated conversation to top
        const updatedConversation = updatedConversations.splice(
          existingConversationIndex,
          1
        )[0];
        updatedConversations.unshift(updatedConversation);

        // Force a small delay to ensure UI update is visible
        setTimeout(() => {}, 100);

        return updatedConversations;
      }

      // If conversation doesn't exist, we might need to refresh the conversation list
      // This could happen if a new contact messages us

      // Trigger a conversation list refresh to include the new conversation
      setRefreshConversationsTrigger(prev => prev + 1);

      return prev;
    });
  };

  // Function to play notification sound
  const playNotificationSound = () => {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz tone
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // 30% volume
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );

      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {}
  };

  // Load messages for selected conversation
  useEffect(() => {
    const loadMessages = async () => {
      if (
        !user ||
        !selectedOrganization ||
        !selectedWorkspace ||
        !isAuthenticated
      ) {
        return;
      }

      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        return;
      }

      const workspaceId = selectedWorkspace.id;
      const organizationId = selectedOrganization.id;

      if (
        selectedInboxType !== "whatsapp" ||
        !selectedAccountId ||
        !selectedConversation?.whatsappId
      ) {
        setMessages([]);
        return;
      }
      try {
        setLoading(true);
        const internalAccountId = accountIdMapping[selectedAccountId];
        if (!internalAccountId) {
          return;
        }

        const res = await whatsappService.getConversationMessages({
          accountId: internalAccountId,
          whatsappId: selectedConversation.whatsappId,
          organizationId,
          workspaceId,
          limit: 300,
          offset: 0,
        });
        const mapped = (res.messages || []).map((m: any) => ({
          id: m.id,
          from: m.fromMe ? "Me" : m.senderName || "Contact",
          fromEmail: "",
          subject: "",
          preview: m.content,
          timestamp: new Date(m.timestamp),
          isRead: !!m.fromMe,
          isStarred: false,
          type: "whatsapp" as const,
          avatar:
            m.senderProfilePicUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fromMe ? "Me" : m.senderName || "Contact")}&background=6366f1&color=ffffff&size=24&bold=true`,
          attachments: m.media?.cloudUrl
            ? [m.media.cloudUrl]
            : m.media?.localPath
              ? [m.media.localPath]
              : [],
          media: m.media,
          messageType: m.messageType,
          status: m.status,
          fromMe: m.fromMe,
        }));

        // Sort messages by timestamp (oldest first, latest last)
        const sortedMessages = mapped.sort(
          (a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime()
        );
        setMessages(sortedMessages);

        // Conversation-specific realtime stream with auth header (SSE over fetch)
        const base = API_BASE_URL;
        const sseUrl = `${base.replace(/\/$/, "")}/whatsapp/accounts/${encodeURIComponent(
          internalAccountId
        )}/events?organizationId=${encodeURIComponent(
          organizationId
        )}&workspaceId=${encodeURIComponent(workspaceId)}`;
        const token = localStorage.getItem("crm_access_token") || "";
        const ctrl = new AbortController();
        (async () => {
          try {
            const res = await fetch(sseUrl, {
              headers: {
                Accept: "text/event-stream",
                Authorization: `Bearer ${token}`,
              },
              signal: ctrl.signal,
            });
            if (!res.ok || !res.body) return;
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const chunks = buffer.split("\n\n");
              buffer = chunks.pop() || "";
              for (const chunk of chunks) {
                const dataLines = chunk
                  .split("\n")
                  .filter(l => l.startsWith("data:"))
                  .map(l => l.slice(5).trim());
                if (!dataLines.length) continue;
                const dataStr = dataLines.join("\n");
                try {
                  const raw = JSON.parse(dataStr);
                  const msg = raw?.message || raw;
                  if (!msg?.id) continue;

                  setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;

                    // For group conversations, ensure we show individual sender names
                    let senderName = msg.fromMe
                      ? "Me"
                      : msg.senderName || "Contact";

                    // If this is a group conversation and the message is not from "Me",
                    // ensure we're showing the individual sender's name, not the group name
                    if (
                      selectedConversation?.conversationType === "GROUP" &&
                      !msg.fromMe
                    ) {
                      // The backend should provide the individual sender's name in senderName
                      // If it's still showing group name, we'll use a fallback
                      if (msg.senderName === selectedConversation.contact) {
                        // This means the backend is still sending group name instead of individual sender
                        // Use the sender's WhatsApp ID as fallback
                        senderName =
                          msg.senderWhatsappId?.replace("@c.us", "") ||
                          "Unknown User";
                      }
                    }

                    const newMessage = {
                      id: msg.id,
                      from: senderName,
                      fromEmail: "",
                      subject: "",
                      preview: msg.content,
                      timestamp: new Date(msg.timestamp || Date.now()),
                      isRead: !!msg.fromMe,
                      isStarred: false,
                      type: "whatsapp" as const,
                      avatar:
                        msg.senderProfilePicUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=6366f1&color=ffffff&size=24&bold=true`,
                      attachments: msg.media?.cloudUrl
                        ? [msg.media.cloudUrl]
                        : msg.media?.localPath
                          ? [msg.media.localPath]
                          : [],
                      media: msg.media,
                      status: msg.status,
                      fromMe: msg.fromMe,
                      messageType: msg.messageType,
                    };

                    // Add new message to the end and sort by timestamp
                    const updatedMessages = [...prev, newMessage].sort(
                      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
                    );
                    return updatedMessages;
                  });
                } catch {
                  /* ignore SSE chunk parse errors */
                }
              }
            }
          } catch {
            /* ignore SSE stream errors */
          }
        })();
        return () => ctrl.abort();
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user,
    isAuthenticated,
    selectedOrganization,
    selectedWorkspace,
    selectedInboxType,
    selectedAccountId,
    selectedConversation?.whatsappId,
    accountIdMapping,
  ]);

  // Filter conversations based on selected inbox type, filter, and search term
  const getFilteredConversations = () => {
    let source: Conversation[] = mockConversations;
    if (selectedInboxType === "whatsapp") {
      source = waConversations.map(c => ({
        id: c.id,
        contact: c.name,
        contactEmail: "",
        lastMessage: c.lastMessage?.content || "",
        timestamp: new Date(c.lastMessageAt),
        unreadCount: c.unreadCount,
        type: "whatsapp",
        avatar: c.profilePicUrl,
        whatsappId: c.whatsappId,
        conversationType: c.type,
      }));
    }
    let filtered = source.filter(conv => conv.type === selectedInboxType);

    // Apply additional filters
    switch (selectedFilter) {
      case "unread":
        filtered = filtered.filter(conv => conv.unreadCount > 0);
        break;
      case "starred":
        filtered = filtered.filter(conv => conv.isStarred);
        break;
      case "archived":
        filtered = filtered.filter(conv => conv.isArchived);
        break;
      case "integrated":
        filtered = filtered.filter(conv => conv.isIntegrated);
        break;
      case "recent":
        {
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          filtered = filtered.filter(conv => conv.timestamp > oneDayAgo);
        }
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        conv =>
          (conv.contact &&
            typeof conv.contact === "string" &&
            conv.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (conv.lastMessage &&
            typeof conv.lastMessage === "string" &&
            conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  };

  const filteredConversations = getFilteredConversations();

  // Set the first conversation as selected if none is selected and there are conversations
  React.useEffect(() => {
    if (!selectedConversation && filteredConversations.length > 0) {
      handleConversationSelect(filteredConversations[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInboxType, selectedFilter, filteredConversations]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return "now";
  };

  // Removed unused getInboxTypeLabel to satisfy linter

  return (
    <div className="flex relative h-full bg-gray-50 dark:bg-gray-900">
      {/* Secondary Sidebar - Filters */}
      <div className="flex flex-col w-64 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Filters
          </h3>
        </div>

        <div className="overflow-y-auto flex-1">
          {(() => {
            // Get the appropriate conversation source based on inbox type
            let sourceConversations: Conversation[] = mockConversations;
            if (selectedInboxType === "whatsapp") {
              sourceConversations = waConversations.map(c => ({
                id: c.id,
                contact: c.name,
                contactEmail: "",
                lastMessage: c.lastMessage?.content || "",
                timestamp: new Date(c.lastMessageAt),
                unreadCount: c.unreadCount,
                type: "whatsapp",
                avatar: c.profilePicUrl,
                whatsappId: c.whatsappId,
                conversationType: c.type,
              }));
            }

            // Filter conversations by selected inbox type
            const conversations = sourceConversations.filter(
              conv => conv.type === selectedInboxType
            );
            const dynamicFilterOptions = getFilterOptions(conversations);

            return dynamicFilterOptions.map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.key}
                  onClick={() => setSelectedFilter(option.key)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    selectedFilter === option.key
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-r-2 border-blue-600 dark:border-blue-500"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                  <span className="px-2 py-1 text-xs text-gray-500 bg-gray-200 rounded-full">
                    {option.count}
                  </span>
                </button>
              );
            });
          })()}
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Quick Actions
          </h4>
          <div className="space-y-2">
            <button className="flex items-center px-3 py-2 space-x-3 w-full text-left rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
              <Settings className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Inbox Settings
              </span>
            </button>
            <button className="flex items-center px-3 py-2 space-x-3 w-full text-left rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Manage Contacts
              </span>
            </button>
            <button className="flex items-center px-3 py-2 space-x-3 w-full text-left rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Message Templates
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex flex-col w-96 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2 items-center">
              {/* <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {getInboxTypeLabel(selectedInboxType)}
              </h2> */}
              {selectedInboxType === "whatsapp" && (
                <div className="max-w-[200px]">
                  <SearchableDropdown
                    items={accounts}
                    selectedItem={
                      accounts.find(
                        a => a.remoteAccountId === selectedAccountId
                      ) || null
                    }
                    onSelect={item => {
                      setSelectedAccountId(item.remoteAccountId);
                    }}
                    placeholder="Select account"
                    searchPlaceholder="Search accounts..."
                    getDisplayValue={item =>
                      item.displayName || item.remoteAccountId
                    }
                  />
                </div>
              )}
            </div>
            <span className="px-2 py-1 text-sm text-gray-500 bg-gray-100 rounded-full dark:bg-gray-700">
              {filteredConversations.length} conversations
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Filter
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {(() => {
                // Get the appropriate conversation source based on inbox type
                let sourceConversations: Conversation[] = mockConversations;
                if (selectedInboxType === "whatsapp") {
                  sourceConversations = waConversations.map(c => ({
                    id: c.id,
                    contact: c.name,
                    contactEmail: "",
                    lastMessage: c.lastMessage?.content || "",
                    timestamp: new Date(c.lastMessageAt),
                    unreadCount: c.unreadCount,
                    type: "whatsapp",
                    avatar: c.profilePicUrl,
                    whatsappId: c.whatsappId,
                    conversationType: c.type,
                  }));
                }

                // Filter conversations by selected inbox type
                const conversations = sourceConversations.filter(
                  conv => conv.type === selectedInboxType
                );
                const dynamicFilterOptions = getFilterOptions(conversations);

                return (
                  dynamicFilterOptions.find(f => f.key === selectedFilter)
                    ?.label || "All Conversations"
                );
              })()}
            </span>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredConversations.length > 0 ? (
            filteredConversations.map(conversation => (
              <button
                key={conversation.id}
                onClick={() => handleConversationSelect(conversation)}
                className={`w-full p-4 text-left border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedConversation?.id === conversation.id
                    ? "bg-blue-50 border-r-2 border-blue-600"
                    : ""
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <img
                      src={conversation.avatar}
                      alt={conversation.contact}
                      className="object-cover w-10 h-10 rounded-full"
                    />
                    {conversation.isOnline && (
                      <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-semibold text-gray-900 truncate dark:text-white">
                        {conversation.contact}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(conversation.timestamp)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 truncate dark:text-gray-400">
                      {renderTextWithLinks(conversation.lastMessage)}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center space-x-2">
                        {conversation.isStarred && (
                          <StarIcon className="w-3 h-3 text-yellow-500" />
                        )}
                        {conversation.isIntegrated && (
                          <Zap className="w-3 h-3 text-blue-500" />
                        )}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="px-2 py-1 text-xs text-white bg-blue-600 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <MessageCircle className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                  No conversations
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No conversations found for this filter
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message View */}
      <div
        className={`flex flex-col bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "flex-1 mr-[400px]" : "flex-1"
        }`}
      >
        {selectedConversation ? (
          <>
            {/* Message Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <img
                    src={selectedConversation.avatar}
                    alt={selectedConversation.contact}
                    className="object-cover w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.contact}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedConversation.contactEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100"
                    onClick={() => setSidebarOpen(true)}
                    title="Show prospect details"
                  >
                    <User className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100">
                    <Star className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100">
                    <Archive className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100">
                    <Trash2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="space-y-6">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.from === "Me" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-md ${message.from === "Me" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-900"} rounded-lg p-4`}
                    >
                      <div className="flex items-center mb-2 space-x-2">
                        <img
                          src={message.avatar}
                          alt={message.from}
                          className="object-cover w-6 h-6 rounded-full"
                          onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.from)}&background=6366f1&color=ffffff&size=24&bold=true`;
                          }}
                        />
                        <span className="text-sm font-medium">
                          {message.from}
                        </span>
                        <span className="text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {/* Message content */}
                      {message.preview && (
                        <p className="mb-2 text-sm whitespace-pre-wrap break-words">
                          {renderTextWithLinks(message.preview)}
                        </p>
                      )}

                      {/* Media, Location, Contact, and Interactive messages */}
                      <MediaMessageDisplay message={message} />

                      {/* Legacy attachments */}
                      {message.attachments &&
                        message.attachments.length > 0 && (
                          <div className="flex items-center mt-2 space-x-2">
                            <Paperclip className="w-3 h-3" />
                            <span className="text-xs opacity-70">
                              {message.attachments.length} attachment(s)
                            </span>
                          </div>
                        )}

                      {/* Message Status Indicator */}
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center space-x-1">
                          <MessageStatusIndicator
                            status={message.status}
                            fromMe={message.fromMe || message.from === "Me"}
                            className="text-xs opacity-70"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <MessageInput
              onSendMessage={async messageData => {
                if (!selectedAccountId || !selectedConversation?.whatsappId)
                  return;

                if (!selectedOrganization || !selectedWorkspace) {
                  return;
                }

                const workspaceId = selectedWorkspace.id;
                const organizationId = selectedOrganization.id;

                try {
                  const internalAccountId = accountIdMapping[selectedAccountId];
                  if (!internalAccountId) {
                    return;
                  }

                  await whatsappService.sendMessage({
                    accountId: internalAccountId,
                    organizationId,
                    workspaceId,
                    to: selectedConversation.whatsappId,
                    ...messageData,
                  });
                } catch (error) {}
              }}
              disabled={!selectedAccountId || !selectedConversation?.whatsappId}
            />
          </>
        ) : (
          <div className="flex flex-1 justify-center items-center">
            <div className="text-center">
              <MessageCircle className="mx-auto mb-4 w-12 h-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Select a conversation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
      {/* Prospect Sidebar V2 (collapsible, screenshot design) */}
      {sidebarOpen && (
        <ProspectSidebarV2
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(o => !o)}
          conversation={selectedConversation}
        />
      )}
    </div>
  );
};

// Media Message Component
const MediaMessageDisplay: React.FC<{ message: Message }> = ({ message }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleAudioPlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getMediaUrl = () => {
    return message.media?.cloudUrl || message.media?.localPath || "";
  };

  const getFileIcon = () => {
    const mimeType = message.media?.mimeType || "";
    const filename = message.media?.filename || "";

    if (mimeType.startsWith("image/"))
      return <Image className="w-4 h-4" aria-label="Image Icon" />;
    if (mimeType.startsWith("video/")) return <Video className="w-4 h-4" />;
    if (mimeType.startsWith("audio/")) return <Music className="w-4 h-4" />;
    if (mimeType === "application/pdf") return <FileText className="w-4 h-4" />;
    if (filename.endsWith(".doc") || filename.endsWith(".docx"))
      return <FileText className="w-4 h-4" />;
    if (filename.endsWith(".xls") || filename.endsWith(".xlsx"))
      return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleDownload = () => {
    const url = getMediaUrl();
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = message.media?.filename || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Image message
  if (message.media?.mimeType?.startsWith("image/")) {
    return (
      <div className="mt-2 max-w-xs">
        <img
          src={getMediaUrl()}
          alt={message.media?.filename || "image"}
          className="max-w-full rounded-lg transition-opacity cursor-pointer hover:opacity-90"
          onClick={() => window.open(getMediaUrl(), "_blank")}
        />
      </div>
    );
  }

  // Video message
  if (message.media?.mimeType?.startsWith("video/")) {
    return (
      <div className="mt-2 max-w-xs">
        <video
          ref={videoRef}
          className="max-w-full rounded-lg"
          controls
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
        >
          <source src={getMediaUrl()} type={message.media?.mimeType} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Audio message
  if (message.media?.mimeType?.startsWith("audio/")) {
    return (
      <div className="flex items-center p-3 mt-2 space-x-2 max-w-xs bg-gray-50 rounded-lg dark:bg-gray-800">
        <button
          onClick={handleAudioPlay}
          className="flex justify-center items-center w-8 h-8 text-white bg-blue-600 rounded-full hover:bg-blue-700"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Music className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">
              {message.media?.filename || "Audio"}
            </span>
          </div>
          <div className="flex items-center mt-1 space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-1 bg-gray-200 rounded-full">
              <div
                className="h-1 bg-blue-600 rounded-full"
                style={{
                  width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(duration)}
            </span>
          </div>
        </div>
        <audio
          ref={audioRef}
          src={getMediaUrl()}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      </div>
    );
  }

  // Document message
  if (
    message.media &&
    !message.media.mimeType?.startsWith("image/") &&
    !message.media.mimeType?.startsWith("audio/") &&
    !message.media.mimeType?.startsWith("video/")
  ) {
    return (
      <div className="flex items-center p-3 mt-2 space-x-3 max-w-xs bg-gray-50 rounded-lg dark:bg-gray-800">
        <div className="flex justify-center items-center w-10 h-10 bg-blue-100 rounded-lg">
          {getFileIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {message.media?.filename || "Document"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {message.media?.mimeType}
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="p-1 text-gray-500 hover:text-gray-700"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Location message
  if (message.location) {
    return (
      <div className="mt-2 max-w-xs">
        <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
          <div className="flex items-center mb-2 space-x-2">
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium">Location</span>
          </div>
          {message.location.name && (
            <p className="mb-1 text-sm font-medium">{message.location.name}</p>
          )}
          {message.location.address && (
            <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
              {message.location.address}
            </p>
          )}
          <div className="flex justify-center items-center h-24 bg-gray-200 rounded-lg">
            <Map className="w-8 h-8 text-gray-400" />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {message.location.latitude.toFixed(6)},{" "}
            {message.location.longitude.toFixed(6)}
          </p>
        </div>
      </div>
    );
  }

  // Contact message
  if (message.contacts && message.contacts.length > 0) {
    return (
      <div className="mt-2 space-y-2">
        {message.contacts.map((contact, index) => (
          <div
            key={index}
            className="p-3 max-w-xs bg-gray-50 rounded-lg dark:bg-gray-800"
          >
            <div className="flex items-center space-x-3">
              <div className="flex justify-center items-center w-10 h-10 bg-green-100 rounded-full">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{contact.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {contact.phone}
                </p>
                {contact.company && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {contact.company}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Interactive message
  if (message.interactive) {
    return (
      <div className="mt-2 max-w-xs">
        <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
          {message.interactive.header && (
            <div className="mb-2">
              {message.interactive.header.type === "text" && (
                <p className="text-sm font-medium">
                  {message.interactive.header.text}
                </p>
              )}
            </div>
          )}
          <p className="mb-2 text-sm">{message.interactive.body}</p>
          {message.interactive.footer && (
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              {message.interactive.footer}
            </p>
          )}
          {message.interactive.action.buttons && (
            <div className="space-y-1">
              {message.interactive.action.buttons.map((button, index) => (
                <button
                  key={index}
                  className="px-3 py-2 w-full text-sm text-left bg-white rounded border border-gray-200 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {button.reply.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

// Message Input Component with Media Support
const MessageInput: React.FC<{
  onSendMessage: (message: {
    type: MessageType;
    text?: string;
    media?: string | File;
    caption?: string;
    filename?: string;
    location?: LocationMessage;
    contacts?: ContactMessage[];
    interactive?: InteractiveMessage;
    previewUrl?: string;
  }) => Promise<void>;
  disabled?: boolean;
}> = ({ onSendMessage, disabled }) => {
  const [composer, setComposer] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [messageType, setMessageType] = useState<MessageType>("text");
  const [caption, setCaption] = useState("");
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (disabled || (!composer.trim() && !selectedFile)) return;

    try {
      const messageData = { type: messageType } as {
        type: MessageType;
        text?: string;
        media?: string | File;
        caption?: string;
        filename?: string;
        location?: LocationMessage;
        contacts?: ContactMessage[];
        interactive?: InteractiveMessage;
        previewUrl?: string;
      };

      switch (messageType) {
        case "text":
          messageData.text = composer.trim();
          break;
        case "image":
        case "video":
        case "audio":
        case "document":
        case "sticker":
          if (selectedFile) {
            messageData.media = selectedFile;
            if (caption) messageData.caption = caption;
            if (selectedFile.name) messageData.filename = selectedFile.name;
          }
          break;
      }

      await onSendMessage(messageData);

      // Reset form
      setComposer("");
      setSelectedFile(null);
      setMessageType("text");
      setCaption("");
      setShowMediaOptions(false);
    } catch (error) {}
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileInfo = whatsappService.getFileInfo(file);
      setSelectedFile(file);
      setMessageType(fileInfo.type);
      setCaption("");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setMessageType("text");
    setCaption("");
  };

  return (
    <div className="p-6 border-t border-gray-200">
      {/* File Preview */}
      {selectedFile && (
        <div className="p-3 mb-4 bg-gray-50 rounded-lg dark:bg-gray-800">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex justify-center items-center w-10 h-10 bg-blue-100 rounded-lg">
                {messageType === "image" && (
                  <Image
                    className="w-5 h-5 text-blue-600"
                    aria-label="Image Icon"
                  />
                )}
                {messageType === "video" && (
                  <Video className="w-5 h-5 text-blue-600" />
                )}
                {messageType === "audio" && (
                  <Music className="w-5 h-5 text-blue-600" />
                )}
                {messageType === "document" && (
                  <FileText className="w-5 h-5 text-blue-600" />
                )}
                {messageType === "sticker" && (
                  <Image
                    className="w-5 h-5 text-blue-600"
                    aria-label="Sticker Icon"
                  />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeSelectedFile}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {(messageType === "image" ||
            messageType === "video" ||
            messageType === "document") && (
            <input
              type="text"
              placeholder="Add a caption..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="px-3 py-2 mt-2 w-full text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
        </div>
      )}

      {/* Message Input */}
      <div className="flex items-center space-x-3">
        {/* Media Options Button */}
        <div className="relative">
          <button
            onClick={() => setShowMediaOptions(!showMediaOptions)}
            className="p-2 rounded-lg hover:bg-gray-100"
            disabled={disabled}
          >
            <Paperclip className="w-4 h-4 text-gray-600" />
          </button>

          {/* Media Options Dropdown */}
          {showMediaOptions && (
            <div className="absolute left-0 bottom-full z-10 p-3 mb-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 shadow-lg min-w-[280px]">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowMediaOptions(false);
                  }}
                  className="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Image
                    className="mr-3 w-5 h-5 text-blue-600"
                    aria-label="Photo & Video Icon"
                  />
                  <span className="text-sm font-medium">Photo & Video</span>
                </button>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowMediaOptions(false);
                  }}
                  className="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <File className="mr-3 w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Document</span>
                </button>
                <button
                  onClick={() => {
                    setShowLocationPicker(true);
                    setShowMediaOptions(false);
                  }}
                  className="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <MapPin className="mr-3 w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Location</span>
                </button>
                <button
                  onClick={() => {
                    setShowContactPicker(true);
                    setShowMediaOptions(false);
                  }}
                  className="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <User className="mr-3 w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Contact</span>
                </button>
                <button
                  onClick={() => {
                    setShowMediaOptions(false);
                  }}
                  className="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Smile className="mr-3 w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Sticker</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={
              selectedFile ? "Add a caption..." : "Type your message..."
            }
            value={selectedFile ? caption : composer}
            onChange={e =>
              selectedFile
                ? setCaption(e.target.value)
                : setComposer(e.target.value)
            }
            onKeyPress={handleKeyPress}
            className="px-4 py-3 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={disabled}
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Smile className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || (!composer.trim() && !selectedFile)}
          className="p-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-opacity-50">
          <div className="p-6 mx-4 w-full max-w-md bg-white rounded-lg dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold">Share Location</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Office, Home, Restaurant"
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Full address"
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowLocationPicker(false)}
                  className="flex-1 px-4 py-2 text-gray-600 rounded-lg border border-gray-300 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle location sharing
                    setShowLocationPicker(false);
                  }}
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Share Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Picker Modal */}
      {showContactPicker && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
          <div className="p-6 mx-4 w-full max-w-md bg-white rounded-lg dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold">Share Contact</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Contact name"
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email (optional)
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowContactPicker(false)}
                  className="flex-1 px-4 py-2 text-gray-600 rounded-lg border border-gray-300 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle contact sharing
                    setShowContactPicker(false);
                  }}
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Share Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxView;
