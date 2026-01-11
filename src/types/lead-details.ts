// Detailed lead data interfaces based on the analysis

export interface DetailedLeadData {
  success: boolean;
  cached: boolean;
  updated: boolean;
  profile: {
    id: string;
    urn_id: string;
    name: string;
    headline: string;
    location: string;
    connection_degree: string;
    profile_url: string;
    profile_image_url: string;
    basic_details: {
      publicIdentifier: string;
      isPremium: boolean;
      isOpenProfile: boolean;
      jobDetails: {
        currentTitle: string;
        currentCompany: string;
        industry: string;
        reactionType: string;
      };
      isInOtherCampaign: boolean;
    };
    enriched_profile: {
      integrationId: string;
      urn_id: string;
      public_id: string;
      aboutThisProfile: {
        name: string;
        joined: string;
        contact_information: string;
        profile_photo: string;
        Verifications: Array<{ [key: string]: string }>;
      };
      contactInfo: {
        profile_public_id: string;
        websites: string[];
        phone: string[];
        address: string[];
        email: string[];
        IM: string[];
        birthday: string;
        connected: string;
      };
      jobPreferences: {
        name: string;
        isOpenToWork: boolean;
        jobTitles: string[];
        locationTypes: string[];
        locationsOnSite: string[];
        locationsRemote: string[];
        startDate: string;
        employmentTypes: string[];
      };
      aboutSection: {
        about: string;
      };
      posts: Array<{
        text: string;
      }>;
      featuredSection: Array<{
        type: string;
        links: Array<{ url: string }>;
        title?: string;
        linkText?: string;
        mediaUrls?: string[];
        text?: string;
      }>;
      recommendations: Array<{
        name: string;
        headLine: string;
        recommendationSource: string;
        text: string;
        recommenderUrn: string;
        publicIdentifier: string;
      }>;
      experience: Array<{
        position: string;
        duration: string;
        location?: string;
        company: string;
        url?: string;
        description?: string;
        skills?: string;
      }>;
      mutualContacts: {
        totalCount: number;
        accounts: Array<{
          name: string;
          headline: string;
          location: string;
          publicId: string;
          urn: string;
          providesServices?: string;
        }>;
      };
      leadLocation?: {
        location?: string;
      };
      companies: Array<{
        url: string;
        data: {
          companyName: string;
          headline: string;
          description: string;
          website?: string;
          founded?: string;
          specialities?: string[];
          phoneNumber?: string;
          companySize: string;
          addresses: Array<{
            country: string;
            geographicArea: string;
            city: string;
            postalCode: string;
            line1: string;
            line2: string;
            description: string;
            headquarter: boolean;
          }>;
          industry: string;
        };
      }>;
    };
    last_enriched: string;
  };
}

export interface LeadDetailsDialogProps {
  open: boolean;
  selectedLead: any | null; // Using any for now, will be replaced with proper Lead type
  detailedLeadData: DetailedLeadData | null;
  leadDetailsLoading: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export interface SkeletonSectionProps {
  title: string;
  lines?: number;
}

export interface ExperienceSkeletonItemProps {
  showCompany?: boolean;
}
