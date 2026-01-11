import { useState, useEffect, useCallback } from "react";
import {
  CrmApiService,
  Contact,
  ContactEnums,
  QueryContactParams,
} from "@/services/crmApi";
import ShowShortMessage from "@/base-component/ShowShortMessage";

export interface UseContactsOptions {
  initialLoad?: boolean;
  filters?: Partial<QueryContactParams>;
}

export interface UseContactsReturn {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  enums: ContactEnums | null;
  totalCount: number;

  // Actions
  refetch: () => Promise<void>;
  searchContacts: (query: string) => Promise<void>;
  createContact: (contactData: any) => Promise<Contact | null>;
  updateContact: (id: string, contactData: any) => Promise<Contact | null>;
  deleteContact: (id: string) => Promise<boolean>;
  bulkDeleteContacts: (ids: string[]) => Promise<boolean>;
  exportContacts: (
    format?: "CSV" | "EXCEL" | "JSON",
    fields?: string[]
  ) => Promise<boolean>;

  // Filtering
  applyFilters: (filters: Partial<QueryContactParams>) => void;
  clearFilters: () => void;
  currentFilters: Partial<QueryContactParams>;
}

export function useContacts(
  options: UseContactsOptions = {}
): UseContactsReturn {
  const { initialLoad = true, filters: initialFilters = {} } = options;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enums, setEnums] = useState<ContactEnums | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentFilters, setCurrentFilters] =
    useState<Partial<QueryContactParams>>(initialFilters);

  // Fetch contacts
  const fetchContacts = useCallback(
    async (params: Partial<QueryContactParams> = {}) => {
      setLoading(true);
      setError(null);

      try {
        // Don't send filter parameters to API - all filtering is done on frontend
        const response = await CrmApiService.getContacts(params);

        if (response.status === 200) {
          setContacts(response.data);
          setTotalCount(response.data.length); // Note: API doesn't return total count separately
        } else {
          throw new Error("Failed to fetch contacts");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch contacts";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [] // No dependencies needed since we don't use currentFilters anymore
  );

  // Fetch enums
  const fetchEnums = useCallback(async () => {
    try {
      const response = await CrmApiService.getContactEnums();
      if (response.status === 200) {
        setEnums(response.data);
      }
    } catch (err) {}
  }, []);

  // Search contacts
  const searchContacts = useCallback(
    async (query: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await CrmApiService.searchContacts(
          query,
          currentFilters
        );

        if (response.status === 200) {
          setContacts(response.data);
          setTotalCount(response.data.length);
        } else {
          throw new Error("Failed to search contacts");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to search contacts";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [currentFilters]
  );

  // Create contact
  const createContact = useCallback(
    async (contactData: any): Promise<Contact | null> => {
      try {
        const response = await CrmApiService.createContact(contactData);

        if (response.status === 201) {
          // Add new contact to the list
          setContacts(prev => [response.data, ...prev]);
          setTotalCount(prev => prev + 1);

          ShowShortMessage("Contact created successfully", "success");

          return response.data;
        } else {
          throw new Error("Failed to create contact");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create contact";
        setError(errorMessage);
        ShowShortMessage(errorMessage, "error");

        return null;
      }
    },
    []
  );

  // Update contact
  const updateContact = useCallback(
    async (id: string, contactData: any): Promise<Contact | null> => {
      try {
        const response = await CrmApiService.updateContact(id, contactData);

        if (response.status === 200) {
          // Update contact in the list
          setContacts(prev =>
            prev.map(contact => (contact.id === id ? response.data : contact))
          );

          ShowShortMessage("Contact updated successfully", "success");

          return response.data;
        } else {
          throw new Error("Failed to update contact");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update contact";
        setError(errorMessage);
        ShowShortMessage(errorMessage, "error");

        return null;
      }
    },
    []
  );

  // Delete contact
  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await CrmApiService.deleteContact(id);

      if (response.status === 200) {
        // Remove contact from the list
        setContacts(prev => prev.filter(contact => contact.id !== id));
        setTotalCount(prev => prev - 1);

        ShowShortMessage("Contact deleted successfully", "success");

        return true;
      } else {
        throw new Error("Failed to delete contact");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete contact";
      setError(errorMessage);
      ShowShortMessage(errorMessage, "error");

      return false;
    }
  }, []);

  // Bulk delete contacts
  const bulkDeleteContacts = useCallback(
    async (ids: string[]): Promise<boolean> => {
      try {
        const response = await CrmApiService.bulkDeleteContacts(ids);

        if (response.status === 200) {
          // Remove contacts from the list
          setContacts(prev =>
            prev.filter(contact => !ids.includes(contact.id))
          );
          setTotalCount(prev => prev - ids.length);

          ShowShortMessage(
            `${ids.length} contacts deleted successfully`,
            "success"
          );

          return true;
        } else {
          throw new Error("Failed to delete contacts");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete contacts";
        setError(errorMessage);
        ShowShortMessage(errorMessage, "error");

        return false;
      }
    },
    []
  );

  // Export contacts
  const exportContacts = useCallback(
    async (
      format: "CSV" | "EXCEL" | "JSON" = "CSV",
      fields?: string[]
    ): Promise<boolean> => {
      try {
        const response = await CrmApiService.exportContacts({ format, fields });

        if (response.status === 200) {
          // Handle file download (this would typically trigger a download)
          ShowShortMessage("Contacts exported successfully", "success");

          return true;
        } else {
          throw new Error("Failed to export contacts");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to export contacts";
        setError(errorMessage);
        ShowShortMessage(errorMessage, "error");

        return false;
      }
    },
    []
  );

  // Apply filters
  const applyFilters = useCallback((filters: Partial<QueryContactParams>) => {
    setCurrentFilters(prev => ({ ...prev, ...filters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setCurrentFilters({});
  }, []);

  // Refetch data
  const refetch = useCallback(async () => {
    await fetchContacts();
  }, [fetchContacts]);

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      fetchContacts();
      fetchEnums();
    }
  }, [initialLoad, fetchContacts, fetchEnums]);

  // Disabled automatic refetch when filters change - all filtering is now done on frontend
  // useEffect(() => {
  //   if (Object.keys(currentFilters).length > 0) {
  //     fetchContacts();
  //   }
  // }, [currentFilters, fetchContacts]);

  return {
    contacts,
    loading,
    error,
    enums,
    totalCount,
    refetch,
    searchContacts,
    createContact,
    updateContact,
    deleteContact,
    bulkDeleteContacts,
    exportContacts,
    applyFilters,
    clearFilters,
    currentFilters,
  };
}

export default useContacts;
