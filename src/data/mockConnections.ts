// Mock data for connections page testing
export interface Connection {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  cityCountry: string;
  campaign: string;
  status: "Connected" | "Pending" | "Accepted" | "Declined" | "Blocked";
  priority: "High" | "Medium" | "Low";
  industry: string;
  source:
    | "LinkedIn"
    | "Email"
    | "Referral"
    | "Cold Outreach"
    | "Event"
    | "Webinar"
    | "Social Media"
    | "Direct Message";
  connectionType: "1st" | "2nd" | "3rd" | "Group";
  connectionStrength: "Strong" | "Medium" | "Weak";
  tags: Array<{ name: string; color: string }>;
  tagCount: number;
  owner: string;
  lastInteraction: string;
  connectionDate: string;
  phone?: string;
  linkedin?: string;
  website?: string;
  notes?: string;
  mutualConnections?: number;
  profileImage?: string;
  responseRate?: number;
  engagementScore?: number;
  lastMessageDate?: string;
  messageCount?: number;
}

// Generate random data for comprehensive testing
const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Real Estate",
  "Consulting",
  "Marketing",
  "Sales",
  "Engineering",
  "Design",
  "Legal",
  "Media",
  "Non-profit",
  "Government",
  "Energy",
  "Transportation",
  "Food & Beverage",
  "Fashion",
];

const companies = [
  "TechCorp Solutions",
  "HealthFirst Inc",
  "FinanceMax Ltd",
  "EduTech Systems",
  "Manufacturing Pro",
  "Retail Dynamics",
  "RealEstate Plus",
  "Consulting Experts",
  "Marketing Masters",
  "SalesForce Pro",
  "Engineering Works",
  "Design Studio",
  "Legal Associates",
  "Media Group",
  "NonProfit Hub",
  "GovTech Solutions",
  "Energy Corp",
  "Transport Systems",
  "FoodTech Inc",
  "Fashion Forward",
];

const jobTitles = [
  "CEO",
  "CTO",
  "VP of Sales",
  "Marketing Director",
  "Product Manager",
  "Software Engineer",
  "Data Scientist",
  "UX Designer",
  "Business Analyst",
  "Project Manager",
  "HR Director",
  "Finance Manager",
  "Operations Manager",
  "Sales Manager",
  "Customer Success",
  "Content Manager",
  "DevOps Engineer",
  "QA Engineer",
  "Research Analyst",
  "Strategy Consultant",
];

const campaigns = [
  "LinkedIn Outreach Q4",
  "Tech Conference 2024",
  "Industry Networking",
  "Referral Program",
  "Cold Outreach Campaign",
  "Event Follow-up",
  "Webinar Attendees",
  "Social Media Outreach",
  "Direct Message Campaign",
  "Email Sequence",
];

const cities = [
  "New York, NY",
  "San Francisco, CA",
  "Los Angeles, CA",
  "Chicago, IL",
  "Boston, MA",
  "Seattle, WA",
  "Austin, TX",
  "Denver, CO",
  "Miami, FL",
  "Atlanta, GA",
  "London, UK",
  "Toronto, CA",
  "Sydney, AU",
  "Berlin, DE",
  "Paris, FR",
  "Tokyo, JP",
  "Singapore, SG",
  "Dubai, AE",
  "Mumbai, IN",
  "São Paulo, BR",
];

const owners = [
  "Shakil Ahmed",
  "Sarah Johnson",
  "Michael Chen",
  "Emily Rodriguez",
  "David Thompson",
  "Lisa Wang",
  "James Wilson",
  "Maria Garcia",
  "Robert Brown",
  "Jennifer Lee",
];

const tagOptions = [
  { name: "Hot Lead", color: "bg-red-100 text-red-800" },
  { name: "VIP", color: "bg-purple-100 text-purple-800" },
  { name: "Follow-up", color: "bg-blue-100 text-blue-800" },
  { name: "Decision Maker", color: "bg-green-100 text-green-800" },
  { name: "Influencer", color: "bg-yellow-100 text-yellow-800" },
  { name: "Potential Partner", color: "bg-indigo-100 text-indigo-800" },
  { name: "Industry Expert", color: "bg-pink-100 text-pink-800" },
  { name: "Event Contact", color: "bg-orange-100 text-orange-800" },
  { name: "Referral Source", color: "bg-teal-100 text-teal-800" },
  { name: "Content Creator", color: "bg-cyan-100 text-cyan-800" },
];

const firstNames = [
  "Alex",
  "Jordan",
  "Taylor",
  "Casey",
  "Morgan",
  "Riley",
  "Avery",
  "Quinn",
  "Blake",
  "Cameron",
  "Drew",
  "Emery",
  "Finley",
  "Hayden",
  "Jamie",
  "Kendall",
  "Logan",
  "Parker",
  "Peyton",
  "Reese",
  "Sage",
  "Skyler",
  "Spencer",
  "Sydney",
  "Aiden",
  "Blake",
  "Carson",
  "Dylan",
  "Ethan",
  "Felix",
  "Grayson",
  "Hunter",
  "Isaac",
  "Jaxon",
  "Kai",
  "Liam",
  "Mason",
  "Noah",
  "Owen",
  "Parker",
  "Quinn",
  "Ryan",
  "Sebastian",
  "Tyler",
  "Wyatt",
  "Zachary",
  "Aaron",
  "Adam",
  "Adrian",
  "Alan",
  "Albert",
  "Alexander",
  "Andrew",
  "Anthony",
  "Arthur",
  "Benjamin",
  "Brandon",
  "Brian",
  "Bruce",
  "Carl",
  "Charles",
  "Christopher",
  "Daniel",
  "David",
  "Dennis",
  "Donald",
  "Douglas",
  "Edward",
  "Eric",
  "Frank",
  "Gary",
  "George",
  "Gregory",
  "Harold",
  "Henry",
  "Jack",
  "James",
  "Jason",
  "Jeffrey",
  "Jeremy",
  "John",
  "Jonathan",
  "Jose",
  "Joseph",
  "Joshua",
  "Justin",
  "Kenneth",
  "Kevin",
  "Larry",
  "Lawrence",
  "Mark",
  "Matthew",
  "Michael",
  "Nicholas",
  "Patrick",
  "Paul",
  "Peter",
  "Philip",
  "Raymond",
  "Richard",
  "Robert",
  "Roger",
  "Ronald",
  "Ryan",
  "Samuel",
  "Scott",
  "Sean",
  "Stephen",
  "Steven",
  "Thomas",
  "Timothy",
  "Victor",
  "Walter",
  "William",
  "Zachary",
];

const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
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
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
  "Green",
  "Adams",
  "Nelson",
  "Baker",
  "Hall",
  "Rivera",
  "Campbell",
  "Mitchell",
  "Carter",
  "Roberts",
  "Gomez",
  "Phillips",
  "Evans",
  "Turner",
  "Diaz",
  "Parker",
  "Cruz",
  "Edwards",
  "Collins",
  "Reyes",
  "Stewart",
  "Morris",
  "Morales",
  "Murphy",
  "Cook",
  "Rogers",
  "Gutierrez",
  "Ortiz",
  "Morgan",
  "Cooper",
  "Peterson",
  "Bailey",
  "Reed",
  "Kelly",
  "Howard",
  "Ramos",
  "Kim",
  "Cox",
  "Ward",
  "Richardson",
  "Watson",
  "Brooks",
  "Chavez",
  "Wood",
  "James",
  "Bennett",
  "Gray",
  "Mendoza",
  "Ruiz",
  "Hughes",
  "Price",
  "Alvarez",
  "Castillo",
  "Sanders",
  "Patel",
  "Myers",
  "Long",
  "Ross",
  "Foster",
  "Jimenez",
];

// Helper functions
const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomItems = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getRandomDate = (daysBack: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date.toLocaleDateString("en-US");
};

const getRandomPhone = (): string => {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `+1-${areaCode}-${exchange}-${number}`;
};

const getRandomHumanImage = (): string => {
  const images = [
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face",
  ];
  return getRandomItem(images);
};

// Generate comprehensive mock data
export const generateMockConnections = (count: number = 50): Connection[] => {
  const connections: Connection[] = [];

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
      "Connected",
      "Pending",
      "Accepted",
      "Declined",
      "Blocked",
    ] as const);
    const priority = getRandomItem(["High", "Medium", "Low"] as const);
    const source = getRandomItem([
      "LinkedIn",
      "Email",
      "Referral",
      "Cold Outreach",
      "Event",
      "Webinar",
      "Social Media",
      "Direct Message",
    ] as const);
    const connectionType = getRandomItem([
      "1st",
      "2nd",
      "3rd",
      "Group",
    ] as const);
    const connectionStrength = getRandomItem([
      "Strong",
      "Medium",
      "Weak",
    ] as const);

    // Generate random tags (1-4 tags per connection)
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
      `High potential connection in ${industry.toLowerCase()}`,
      `Follow up needed for partnership`,
      `Demo scheduled for next week`,
      `Mutual connection with ${getRandomItem(owners)}`,
      `Industry expert in ${industry.toLowerCase()}`,
      `Decision maker at ${company}`,
      `Active on LinkedIn, responds quickly`,
      `Potential collaboration opportunity`,
      `Shared interest in ${industry.toLowerCase()} trends`,
    ];

    const connection: Connection = {
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
      connectionType,
      connectionStrength,
      tags: selectedTags,
      tagCount: selectedTags.length,
      owner,
      lastInteraction: status === "Pending" ? "Never" : getRandomDate(30),
      connectionDate: getRandomDate(90),
      phone: getRandomPhone(),
      linkedin,
      website,
      notes: getRandomItem(notesOptions),
      mutualConnections: Math.floor(Math.random() * 50) + 1,
      profileImage,
      responseRate: Math.floor(Math.random() * 100),
      engagementScore: Math.floor(Math.random() * 100),
      lastMessageDate: Math.random() > 0.3 ? getRandomDate(14) : undefined,
      messageCount: Math.floor(Math.random() * 20),
    };

    connections.push(connection);
  }

  return connections;
};

// Export a default set of mock connections for immediate use
export const mockConnections = generateMockConnections(100);

// Export filter options for testing
export const mockConnectionFilterOptions = {
  status: ["Connected", "Pending", "Accepted", "Declined", "Blocked"],
  priority: ["High", "Medium", "Low"],
  industry: industries,
  source: [
    "LinkedIn",
    "Email",
    "Referral",
    "Cold Outreach",
    "Event",
    "Webinar",
    "Social Media",
    "Direct Message",
  ],
  connectionType: ["1st", "2nd", "3rd", "Group"],
  connectionStrength: ["Strong", "Medium", "Weak"],
  owner: owners,
  campaign: campaigns,
  tags: tagOptions.map(tag => tag.name),
};

// Export column configuration
export const mockConnectionColumns = [
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
  { key: "connectionType", label: "Connection Type", required: false },
  { key: "connectionStrength", label: "Connection Strength", required: false },
  { key: "owner", label: "Owner", required: false },
  { key: "lastInteraction", label: "Last Interaction", required: false },
  { key: "connectionDate", label: "Connection Date", required: false },
  { key: "mutualConnections", label: "Mutual Connections", required: false },
  { key: "responseRate", label: "Response Rate", required: false },
  { key: "engagementScore", label: "Engagement Score", required: false },
  { key: "messageCount", label: "Message Count", required: false },
];
