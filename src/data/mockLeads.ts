// Mock data for leads page testing
export interface Lead {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  cityCountry: string;
  campaign: string;
  status: "Active" | "Inactive" | "Qualified" | "Converted" | "Lost";
  priority: "High" | "Medium" | "Low";
  industry: string;
  source:
    | "Website"
    | "Email"
    | "Referral"
    | "LinkedIn"
    | "Cold Call"
    | "Trade Show"
    | "Webinar"
    | "Social Media";
  leadType: "B2B" | "B2C" | "Enterprise" | "SMB";
  leadScore: "Hot" | "Warm" | "Cold";
  tags: Array<{ name: string; color: string }>;
  tagCount: number;
  owner: string;
  lastInteraction: string;
  connection: "Good" | "None" | "Poor";
  phone?: string;
  linkedin?: string;
  website?: string;
  notes?: string;
  dealValue?: number;
  expectedCloseDate?: string;
  probability?: number;
  profileImage?: string;
}

// Generate random data for comprehensive testing
const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Retail",
  "Education",
  "Real Estate",
  "Automotive",
  "Energy",
  "Consulting",
  "Media",
  "Telecommunications",
  "Transportation",
  "Food & Beverage",
  "Pharmaceuticals",
];

const jobTitles = [
  "CEO",
  "CTO",
  "CFO",
  "VP Sales",
  "VP Marketing",
  "Head of Marketing",
  "Sales Manager",
  "Marketing Director",
  "Product Manager",
  "Business Development",
  "Operations Manager",
  "HR Director",
  "IT Director",
  "Finance Director",
  "General Manager",
  "Regional Manager",
  "Account Executive",
  "Sales Representative",
  "Marketing Specialist",
  "Project Manager",
  "Technical Lead",
  "Software Engineer",
  "Data Analyst",
  "Consultant",
];

const companies = [
  "Fintech Corp",
  "Acme Corp",
  "Bluewave Inc",
  "Startech Ltd",
  "Innovate Co",
  "Cloudcorp",
  "Techtrend",
  "Horizon LLC",
  "Techcorp",
  "Global Solutions",
  "Digital Dynamics",
  "Future Systems",
  "NextGen Technologies",
  "Smart Solutions",
  "Enterprise Partners",
  "Growth Ventures",
  "Scale Up Inc",
  "Velocity Corp",
  "Momentum Labs",
  "Catalyst Group",
  "Synergy Systems",
  "Prime Technologies",
  "Elite Solutions",
  "Advanced Corp",
  "Strategic Partners",
  "Dynamic Systems",
];

const cities = [
  "New York, USA",
  "San Francisco, USA",
  "London, UK",
  "Toronto, Canada",
  "Sydney, Australia",
  "Berlin, Germany",
  "Tokyo, Japan",
  "Paris, France",
  "Singapore",
  "Dubai, UAE",
  "Mumbai, India",
  "São Paulo, Brazil",
  "Mexico City, Mexico",
  "Amsterdam, Netherlands",
  "Stockholm, Sweden",
  "Vancouver, Canada",
  "Melbourne, Australia",
  "Zurich, Switzerland",
  "Copenhagen, Denmark",
  "Vienna, Austria",
  "Barcelona, Spain",
  "Milan, Italy",
];

const campaigns = [
  "Tech Startup Outreach",
  "Healthcare Professionals",
  "Email Campaign",
  "B2B Sales",
  "Retail Marketing",
  "Enterprise SaaS",
  "LinkedIn Outreach",
  "Financial Services",
  "Cold Outreach",
  "Content Marketing",
  "Webinar Series",
  "Trade Show Follow-up",
  "Referral Program",
  "Social Media Campaign",
  "Product Launch",
  "Customer Retention",
  "Upselling Campaign",
  "Cross-selling",
];

const tagOptions = [
  { name: "Decision Maker", color: "bg-blue-100 text-blue-800" },
  { name: "Sales Qualified", color: "bg-yellow-100 text-yellow-800" },
  { name: "Healthcare", color: "bg-purple-100 text-purple-800" },
  { name: "Outbound Lead", color: "bg-pink-100 text-pink-800" },
  { name: "Email Marketing", color: "bg-yellow-100 text-yellow-800" },
  { name: "Trade Show", color: "bg-purple-100 text-purple-800" },
  { name: "Proposal Sent", color: "bg-pink-100 text-pink-800" },
  { name: "B2C", color: "bg-yellow-100 text-yellow-800" },
  { name: "Retail", color: "bg-pink-100 text-pink-800" },
  { name: "New Lead", color: "bg-green-100 text-green-800" },
  { name: "Follow-Up Needed", color: "bg-pink-100 text-pink-800" },
  { name: "Content Marketing", color: "bg-green-100 text-green-800" },
  { name: "Contract Signed", color: "bg-yellow-100 text-yellow-800" },
  { name: "Webinar", color: "bg-blue-100 text-blue-800" },
  { name: "Lead Scoring", color: "bg-green-100 text-green-800" },
  { name: "Cold Outreach", color: "bg-gray-100 text-gray-800" },
  { name: "B2B", color: "bg-blue-100 text-blue-800" },
  { name: "Enterprise", color: "bg-indigo-100 text-indigo-800" },
  { name: "High Priority", color: "bg-red-100 text-red-800" },
  { name: "Demo Scheduled", color: "bg-orange-100 text-orange-800" },
];

const owners = [
  "Shakil Ahmed",
  "John Smith",
  "Jane Doe",
  "Mike Johnson",
  "Sarah Wilson",
  "David Brown",
  "Lisa Davis",
  "Tom Miller",
  "Emily Garcia",
  "Alex Rodriguez",
];

const firstNames = [
  "Mason",
  "John",
  "Sarah",
  "Mike",
  "Jane",
  "Emily",
  "David",
  "Lisa",
  "Tom",
  "Alex",
  "Michael",
  "Jennifer",
  "Christopher",
  "Jessica",
  "Matthew",
  "Ashley",
  "Joshua",
  "Amanda",
  "Daniel",
  "Stephanie",
  "Robert",
  "Nicole",
  "William",
  "Elizabeth",
  "James",
  "Helen",
  "Andrew",
  "Samantha",
  "Ryan",
  "Megan",
  "Jacob",
  "Rachel",
  "Nicholas",
  "Lauren",
  "Anthony",
  "Kimberly",
  "Jonathan",
  "Michelle",
  "Kevin",
  "Tiffany",
  "Brian",
  "Christina",
];

const lastNames = [
  "Clark",
  "Doe",
  "Lee",
  "Chen",
  "Smith",
  "Davis",
  "Kim",
  "Wong",
  "Brown",
  "Johnson",
  "Williams",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
];

// Helper functions
const getRandomItem = <T>(array: T[]): T =>
  array[Math.floor(Math.random() * array.length)];
const getRandomItems = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getRandomDate = (daysAgo: number = 30): string => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toLocaleDateString("en-US");
};

const getRandomPhone = (): string => {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `+1 (${areaCode}) ${exchange}-${number}`;
};

const getRandomDealValue = (): number => {
  const values = [5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
  return getRandomItem(values) + Math.floor(Math.random() * 10000);
};

const getRandomProbability = (): number => Math.floor(Math.random() * 40) + 20; // 20-60%

const getRandomHumanImage = (): string => {
  // Using Unsplash for high-quality human profile images
  const imageIds = [
    "1507003211169-0a1dd7d8c5e5", // Professional woman
    "1494790108755-2616b612b786", // Professional woman 2
    "1500648767791-00dcc994a43e", // Professional man
    "1472099645785-5658abf4ff4e", // Professional man 2
    "1506794778202-cad84cf45f1d", // Professional woman 3
    "1517841905240-472988babdf9", // Professional woman 4
    "1507003211169-0a1dd7d8c5e5", // Professional man 3
    "1494790108755-2616b612b786", // Professional woman 5
    "1500648767791-00dcc994a43e", // Professional man 4
    "1472099645785-5658abf4ff4e", // Professional woman 6
    "1506794778202-cad84cf45f1d", // Professional man 5
    "1517841905240-472988babdf9", // Professional woman 7
    "1507003211169-0a1dd7d8c5e5", // Professional man 6
    "1494790108755-2616b612b786", // Professional woman 8
    "1500648767791-00dcc994a43e", // Professional man 7
    "1472099645785-5658abf4ff4e", // Professional woman 9
    "1506794778202-cad84cf45f1d", // Professional man 8
    "1517841905240-472988babdf9", // Professional woman 10
    "1507003211169-0a1dd7d8c5e5", // Professional man 9
    "1494790108755-2616b612b786", // Professional woman 11
    "1500648767791-00dcc994a43e", // Professional man 10
    "1472099645785-5658abf4ff4e", // Professional woman 12
    "1506794778202-cad84cf45f1d", // Professional man 11
    "1517841905240-472988babdf9", // Professional woman 13
    "1507003211169-0a1dd7d8c5e5", // Professional man 12
    "1494790108755-2616b612b786", // Professional woman 14
    "1500648767791-00dcc994a43e", // Professional man 13
    "1472099645785-5658abf4ff4e", // Professional woman 15
    "1506794778202-cad84cf45f1d", // Professional man 14
    "1517841905240-472988babdf9", // Professional woman 16
  ];

  const randomId = getRandomItem(imageIds);
  return `https://images.unsplash.com/photo-${randomId}?w=128&h=128&fit=crop&crop=face&auto=format&q=80`;
};

const getRandomCloseDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * 90) + 7); // 1-3 months from now
  return date.toLocaleDateString("en-US");
};

// Generate comprehensive mock data
export const generateMockLeads = (count: number = 50): Lead[] => {
  const leads: Lead[] = [];

  for (let i = 1; i <= count; i++) {
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);
    const company = getRandomItem(companies);
    const industry = getRandomItem(industries);
    const jobTitle = getRandomItem(jobTitles);
    const campaign = getRandomItem(campaigns);
    const cityCountry = getRandomItem(cities);
    const owner = getRandomItem(owners);
    const status = getRandomItem([
      "Active",
      "Inactive",
      "Qualified",
      "Converted",
      "Lost",
    ] as const);
    const priority = getRandomItem(["High", "Medium", "Low"] as const);
    const source = getRandomItem([
      "Website",
      "Email",
      "Referral",
      "LinkedIn",
      "Cold Call",
      "Trade Show",
      "Webinar",
      "Social Media",
    ] as const);
    const leadType = getRandomItem([
      "B2B",
      "B2C",
      "Enterprise",
      "SMB",
    ] as const);
    const leadScore = getRandomItem(["Hot", "Warm", "Cold"] as const);
    const connection = getRandomItem(["Good", "None", "Poor"] as const);

    // Generate random tags (1-4 tags per lead)
    const tagCount = Math.floor(Math.random() * 4) + 1;
    const selectedTags = getRandomItems(tagOptions, tagCount);

    // Generate email based on name and company
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")}.com`;

    // Generate LinkedIn URL
    const linkedin = `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Math.floor(Math.random() * 1000)}`;

    // Generate website URL
    const website = `https://${company
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")}.com`;

    // Generate profile image URL using random human faces
    const profileImage = getRandomHumanImage();

    // Generate notes
    const notesOptions = [
      `Interested in our ${industry.toLowerCase()} solutions`,
      `Met at ${campaign.toLowerCase()}`,
      `Referred by ${getRandomItem(owners)}`,
      `High potential client in ${industry.toLowerCase()}`,
      `Follow up needed for proposal`,
      `Demo scheduled for next week`,
      `Budget approved, waiting for contract`,
      `Competitor analysis in progress`,
      `Decision maker identified`,
      `Technical requirements discussed`,
    ];

    const lead: Lead = {
      id: i.toString(),
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      email,
      company,
      jobTitle,
      cityCountry,
      campaign,
      status,
      priority,
      industry,
      source,
      leadType,
      leadScore,
      tags: selectedTags,
      tagCount: selectedTags.length,
      owner,
      lastInteraction: connection === "None" ? "Never" : getRandomDate(30),
      connection,
      phone: getRandomPhone(),
      linkedin,
      website,
      notes: getRandomItem(notesOptions),
      dealValue: Math.random() > 0.3 ? getRandomDealValue() : undefined,
      expectedCloseDate: Math.random() > 0.4 ? getRandomCloseDate() : undefined,
      probability: Math.random() > 0.3 ? getRandomProbability() : undefined,
      profileImage,
    };

    leads.push(lead);
  }

  return leads;
};

// Export a default set of mock leads for immediate use
export const mockLeads = generateMockLeads(100);

// Export filter options for testing
export const mockFilterOptions = {
  status: ["Active", "Inactive", "Qualified", "Converted", "Lost"],
  priority: ["High", "Medium", "Low"],
  industry: [...new Set(industries)],
  source: [
    "Website",
    "Email",
    "Referral",
    "LinkedIn",
    "Cold Call",
    "Trade Show",
    "Webinar",
    "Social Media",
  ],
  leadType: ["B2B", "B2C", "Enterprise", "SMB"],
  leadScore: ["Hot", "Warm", "Cold"],
  connection: ["Good", "None", "Poor"],
  owner: [...new Set(owners)],
  campaign: [...new Set(campaigns)],
  tags: tagOptions.map(tag => tag.name),
};

// Export column configuration
export const mockColumns = [
  { key: "id", label: "ID", required: false },
  { key: "name", label: "Name", required: true },
  { key: "campaign", label: "Campaign", required: false },
  { key: "industry", label: "Industry", required: false },
  { key: "company", label: "Company", required: false },
  { key: "position", label: "Position", required: false },
  { key: "location", label: "Location", required: false },
  { key: "tag", label: "Tag", required: false },
  { key: "note", label: "Note", required: false },
  { key: "status", label: "Status", required: false },
  { key: "priority", label: "Priority", required: false },
  { key: "source", label: "Source", required: false },
  { key: "leadType", label: "Lead Type", required: false },
  { key: "leadScore", label: "Lead Score", required: false },
  { key: "owner", label: "Owner", required: false },
  { key: "lastInteraction", label: "Last Interaction", required: false },
  { key: "connection", label: "Connection", required: false },
  { key: "dealValue", label: "Deal Value", required: false },
  { key: "expectedCloseDate", label: "Expected Close", required: false },
  { key: "probability", label: "Probability", required: false },
];
