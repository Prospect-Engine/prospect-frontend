/**
 * Comprehensive lead validation and filtering utilities
 * Based on the filtering mechanisms from the campaign helper and advanced filtering collection
 */

export interface ValidationResult {
  isValid: boolean;
  publicId?: string;
  error?: string;
}

export interface ProcessedUrlResult {
  urls: string[];
  invalidLines: number;
  duplicates: number;
  validCount: number;
}

export interface LeadFilteringResult {
  validLeads: string[];
  duplicates: number;
  invalidCount: number;
  totalProcessed: number;
  errors: string[];
}

export interface AddLeadForm {
  search: string;
  url: string;
  csv: string;
  cleanedUrls?: string[];
  leadCount?: number;
  originalValue?: string;
}

export interface FormattedLeadsResult {
  leads: string[];
  searchUrl: string;
  hasDuplicate: number;
  invalidCount: number;
}

/**
 * Validates LinkedIn profile URLs with comprehensive checks
 */
export function isValidLinkedInURL(url: string): ValidationResult {
  try {
    // Skip empty lines
    if (!url.trim()) {
      return { isValid: false, error: "Empty URL" };
    }

    let processedUrl = url.trim();

    try {
      // Decode URI encoded URLs
      processedUrl = decodeURIComponent(processedUrl);
    } catch (e) {
      // If decoding fails, continue with original URL
      console.debug("URL decode failed, using original:", url);
    }

    // Basic LinkedIn URL check
    if (!processedUrl.includes("linkedin.com/in/")) {
      return { isValid: false, error: "Not a LinkedIn profile URL" };
    }

    try {
      // Try to construct URL object to validate basic URL structure
      const urlObject = new URL(processedUrl);
      if (!urlObject.hostname.includes("linkedin.com")) {
        return { isValid: false, error: "Invalid LinkedIn domain" };
      }
    } catch (e) {
      // If URL is invalid, try adding https://
      if (!processedUrl.startsWith("http")) {
        processedUrl = "https://" + processedUrl;
      }
      try {
        new URL(processedUrl);
      } catch {
        return { isValid: false, error: "Invalid URL format" };
      }
    }

    // Check if URL matches the LinkedIn profile pattern
    const linkedInPattern =
      /^https?:\/\/([\w-]+\.)?linkedin\.com\/in\/[^\/\s?]+\/?/i;
    if (!linkedInPattern.test(processedUrl)) {
      return { isValid: false, error: "Invalid LinkedIn profile URL format" };
    }

    // Extract public ID from URL
    const urlParts = processedUrl.split("/").filter(Boolean);
    const publicId = urlParts[urlParts.length - 1];

    if (!publicId) {
      return { isValid: false, error: "Could not extract profile ID" };
    }

    return { isValid: true, publicId };
  } catch (e) {
    console.error("URL validation error:", e);
    return { isValid: false, error: "Validation error" };
  }
}

/**
 * Processes multiple LinkedIn URLs and extracts valid public IDs
 */
export function processLinkedInUrls(urls: string[]): ProcessedUrlResult {
  const seenURLs = new Map<string, boolean>();
  const validUrls: string[] = [];
  let invalidLines = 0;
  let duplicates = 0;

  for (const url of urls) {
    const validation = isValidLinkedInURL(url);

    if (!validation.isValid) {
      invalidLines++;
      continue;
    }

    if (validation.publicId) {
      // Check for duplicates within the current batch
      if (seenURLs.has(validation.publicId)) {
        duplicates++;
        continue;
      }

      seenURLs.set(validation.publicId, true);
      validUrls.push(validation.publicId);
    }
  }

  return {
    urls: validUrls,
    invalidLines,
    duplicates,
    validCount: validUrls.length,
  };
}

/**
 * Comprehensive lead filtering with validation, duplicate detection, and limits
 */
export function filterLeads(
  inputLeads: string[],
  existingLeads: string[] = [],
  maxLeads: number = 2500
): LeadFilteringResult {
  const errors: string[] = [];
  const seenURLs = new Map<string, boolean>();
  const validLeads: string[] = [];
  let duplicates = 0;
  let invalidCount = 0;

  // Process each lead
  for (const lead of inputLeads) {
    const validation = isValidLinkedInURL(lead);

    if (!validation.isValid) {
      invalidCount++;
      if (validation.error) {
        errors.push(`${lead}: ${validation.error}`);
      }
      continue;
    }

    if (validation.publicId) {
      // Check for duplicates within current batch
      if (seenURLs.has(validation.publicId)) {
        duplicates++;
        continue;
      }

      // Check for duplicates against existing leads
      if (existingLeads.includes(validation.publicId)) {
        duplicates++;
        continue;
      }

      // Add to valid leads
      seenURLs.set(validation.publicId, true);
      validLeads.push(validation.publicId);

      // Apply lead limit
      if (validLeads.length >= maxLeads) {
        break;
      }
    }
  }

  return {
    validLeads,
    duplicates,
    invalidCount,
    totalProcessed: inputLeads.length,
    errors: errors.slice(0, 10), // Limit error messages to prevent UI overflow
  };
}

/**
 * Get lead limits based on source type
 */
export function getLeadLimit(sourceType: string): number {
  switch (sourceType) {
    case "LinkedIn Search":
      return 1000;
    case "Sales Navigator Search":
      return 2500;
    case "Import URLs":
    case "Upload CSV":
      return 2500;
    default:
      return 2500;
  }
}

/**
 * Format validation results for user feedback
 */
export function formatValidationFeedback(result: LeadFilteringResult): {
  message: string;
  type: "success" | "warning" | "error" | "info";
} {
  const { validLeads, duplicates, invalidCount, totalProcessed } = result;

  if (validLeads.length === 0) {
    if (invalidCount > 0 && duplicates > 0) {
      return {
        message: `No valid leads found. ${invalidCount} invalid URLs, ${duplicates} duplicates.`,
        type: "error",
      };
    } else if (invalidCount > 0) {
      return {
        message: `No valid leads found. All ${invalidCount} URLs are invalid.`,
        type: "error",
      };
    } else if (duplicates > 0) {
      return {
        message: `No new leads found. All ${duplicates} leads are duplicates.`,
        type: "warning",
      };
    } else {
      return {
        message: "No leads provided.",
        type: "error",
      };
    }
  }

  let message = `Successfully processed ${validLeads.length} leads`;
  const warnings: string[] = [];

  if (duplicates > 0) {
    warnings.push(`${duplicates} duplicates removed`);
  }
  if (invalidCount > 0) {
    warnings.push(`${invalidCount} invalid URLs removed`);
  }
  if (validLeads.length < totalProcessed) {
    warnings.push(
      `${totalProcessed - validLeads.length} total entries filtered out`
    );
  }

  if (warnings.length > 0) {
    message += ` (${warnings.join(", ")})`;
  }

  return {
    message,
    type: warnings.length > 0 ? "warning" : "success",
  };
}

/**
 * Advanced LinkedIn URL processing with comprehensive options
 */
export const processLinkedInUrlsAdvanced = (
  text: string,
  options: {
    removeEmpty?: boolean;
    validateUrl?: boolean;
    decodeUri?: boolean;
    removeQuotes?: boolean;
  } = {}
): ProcessedUrlResult => {
  const defaultOptions = {
    removeEmpty: true,
    validateUrl: true,
    decodeUri: true,
    removeQuotes: true,
  };

  const settings = { ...defaultOptions, ...options };
  let invalidLines = 0;
  let duplicates = 0;
  const seenUrls = new Set<string>();

  if (!text || typeof text !== "string") {
    return { urls: [], invalidLines: 0, duplicates: 0, validCount: 0 };
  }

  const linkedInRegex =
    /^(https?:\/\/)?([\w\-.]+\.)?linkedin\.com\/in\/[^\/\s]+\/?$/i;

  const urls = text
    .split(/[\n\r]+/)
    .map(line => {
      let processedUrl = line.trim();

      // Remove quotes and extra whitespace
      if (settings.removeQuotes) {
        processedUrl = processedUrl.replace(/^["'\s]+|["'\s]+$/g, "");
      }

      if (!processedUrl) return "";

      // Basic URL structure check
      if (!processedUrl.includes("linkedin.com/in/")) {
        return processedUrl;
      }

      // Keep the URL as-is if it's already in correct format
      if (linkedInRegex.test(processedUrl)) {
        return processedUrl;
      }

      // Add https:// if missing
      if (!processedUrl.startsWith("http")) {
        processedUrl = "https://" + processedUrl;
      }

      return processedUrl;
    })
    .filter(url => {
      if (!url || (settings.removeEmpty && !url.trim())) return false;

      if (settings.validateUrl) {
        if (!linkedInRegex.test(url)) {
          invalidLines++;
          return false;
        }

        // Check for duplicates
        if (seenUrls.has(url)) {
          duplicates++;
          return false;
        }
        seenUrls.add(url);
      }

      return true;
    });

  return {
    urls,
    invalidLines,
    duplicates,
    validCount: urls.length,
  };
};

/**
 * Extract LinkedIn URLs from text content using regex patterns
 */
export const extractLinkedInUrlsFromText = (input: string): string[] => {
  const linkedInPattern =
    /(https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-_.~%]+)/gi;
  const urls: string[] = [];

  input.split(/\r?\n/).forEach(line => {
    const matches = line.match(linkedInPattern);
    matches?.forEach(match => {
      try {
        const cleaned = decodeURIComponent(match)
          .replace(/(\/+)$/, "")
          .replace(/\?.*$/, "")
          .replace(/\/details\/.*$/, "");
        urls.push(cleaned);
      } catch {
        urls.push(match);
      }
    });
  });

  return Array.from(new Set(urls)); // Deduplicate
};

/**
 * Advanced lead formatting with comprehensive duplicate detection
 */
export const formatLeadsAdvanced = (
  leads: AddLeadForm,
  allTargetLeads: string[]
): FormattedLeadsResult => {
  const seenURLs = new Map<string, boolean>();
  let duplicateLeads = 0;

  // Process profile URLs with advanced options
  const profileResult = processLinkedInUrlsAdvanced(leads.url, {
    removeEmpty: true,
    validateUrl: true,
    decodeUri: true,
    removeQuotes: true,
  });

  // Process CSV URLs
  const csvResult = processLinkedInUrlsAdvanced(leads.csv, {
    removeEmpty: true,
    validateUrl: true,
    decodeUri: true,
    removeQuotes: true,
  });

  // Combine all URLs and filter duplicates
  const allUrls = [...profileResult.urls, ...csvResult.urls];
  const filteredLeads: string[] = [];

  for (const url of allUrls) {
    try {
      // Extract public ID from URL
      const urlParts = url.split("/").filter(Boolean);
      const publicId = urlParts[urlParts.length - 1];

      // Skip if no valid public ID found
      if (!publicId) continue;

      // Check for duplicates both in current batch and existing leads
      if (seenURLs.has(publicId) || allTargetLeads.includes(publicId)) {
        duplicateLeads++;
        continue;
      }

      // Store valid unique leads
      seenURLs.set(publicId, true);
      filteredLeads.push(publicId);
    } catch (error) {
      console.error("Error processing URL:", url, error);
      continue;
    }
  }

  // Return formatted result
  return {
    leads: filteredLeads,
    searchUrl: leads.search || "",
    hasDuplicate: duplicateLeads,
    invalidCount: profileResult.invalidLines + csvResult.invalidLines,
  };
};

/**
 * Remove duplicates from array while preserving order
 */
export const removeDuplicates = <T>(
  array: T[],
  keyExtractor?: (item: T) => string
): T[] => {
  if (!keyExtractor) {
    return Array.from(new Set(array));
  }

  const seen = new Set<string>();
  return array.filter(item => {
    const key = keyExtractor(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

/**
 * Check for duplicates in two arrays
 */
export const findDuplicates = <T>(
  array1: T[],
  array2: T[],
  keyExtractor?: (item: T) => string
): T[] => {
  const keys1 = keyExtractor ? array1.map(keyExtractor) : array1.map(String);
  const set1 = new Set(keys1);
  return array2.filter(item => {
    const key = keyExtractor ? keyExtractor(item) : String(item);
    return set1.has(key);
  });
};

/**
 * Validate lead count limits based on source type
 */
export const validateLeadCount = (
  count: number,
  source: "csv" | "linkedin" | "sales_navigator" | "import_urls"
): boolean => {
  const limits = {
    csv: 2500,
    linkedin: 1000,
    sales_navigator: 2500,
    import_urls: 2500,
  };

  return count >= 1 && count <= limits[source];
};

/**
 * Get maximum lead count for source type
 */
export const getMaxLeadCount = (
  source: "csv" | "linkedin" | "sales_navigator" | "import_urls"
): number => {
  const limits = {
    csv: 2500,
    linkedin: 1000,
    sales_navigator: 2500,
    import_urls: 2500,
  };

  return limits[source];
};

/**
 * Enhanced lead filtering with advanced validation and processing
 */
export function filterLeadsAdvanced(
  inputLeads: string[],
  existingLeads: string[] = [],
  maxLeads: number = 2500,
  options: {
    strictValidation?: boolean;
    removeEmpty?: boolean;
    decodeUri?: boolean;
    removeQuotes?: boolean;
  } = {}
): LeadFilteringResult {
  const {
    strictValidation = true,
    removeEmpty = true,
    decodeUri = true,
    removeQuotes = true,
  } = options;

  const errors: string[] = [];
  const seenURLs = new Map<string, boolean>();
  const validLeads: string[] = [];
  let duplicates = 0;
  let invalidCount = 0;

  // Process each lead with advanced options
  for (const lead of inputLeads) {
    let processedLead = lead.trim();

    // Remove quotes if enabled
    if (removeQuotes) {
      processedLead = processedLead.replace(/^["'\s]+|["'\s]+$/g, "");
    }

    // Skip empty leads if enabled
    if (removeEmpty && !processedLead) {
      continue;
    }

    // Decode URI if enabled
    if (decodeUri) {
      try {
        processedLead = decodeURIComponent(processedLead);
      } catch (e) {
        // If decoding fails, continue with original
        console.debug("URI decode failed, using original:", lead);
      }
    }

    const validation = isValidLinkedInURL(processedLead);

    if (!validation.isValid) {
      invalidCount++;
      if (validation.error) {
        errors.push(`${processedLead}: ${validation.error}`);
      }
      continue;
    }

    if (validation.publicId) {
      // Check for duplicates within current batch
      if (seenURLs.has(validation.publicId)) {
        duplicates++;
        continue;
      }

      // Check for duplicates against existing leads
      if (existingLeads.includes(validation.publicId)) {
        duplicates++;
        continue;
      }

      // Add to valid leads
      seenURLs.set(validation.publicId, true);
      validLeads.push(validation.publicId);

      // Apply lead limit
      if (validLeads.length >= maxLeads) {
        break;
      }
    }
  }

  return {
    validLeads,
    duplicates,
    invalidCount,
    totalProcessed: inputLeads.length,
    errors: errors.slice(0, 10), // Limit error messages to prevent UI overflow
  };
}
