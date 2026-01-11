"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { useWorkspace } from "./useWorkspace";
import { useCountsContext } from "@/contexts/sales-contexts/CountsContext";
import contactService from "@/services/sales-services/contactService";
import companyService from "@/services/sales-services/companyService";
import dealService from "@/services/sales-services/dealService";
import taskService from "@/services/sales-services/taskService";
import pipelineService from "@/services/sales-services/pipelineService";
import { calculateUniquePipelineCounts } from "@/utils/sales-utils/pipelineCounts";

export const useCounts = () => {
  const { user } = useAuth();
  const { selectedOrganization, selectedWorkspace } = useWorkspace();
  const { counts, updateCounts } = useCountsContext();
  const [loading, setLoading] = useState(false);
  const lastFetchRef = useRef<string>("");
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCounts = useCallback(async () => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    // Create a unique key for this fetch to prevent duplicate calls
    const fetchKey = `${user.id}-${selectedOrganization.id}-${selectedWorkspace.id}`;
    if (lastFetchRef.current === fetchKey) {
      return; // Already fetched with these parameters
    }

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Debounce the fetch to prevent rapid successive calls
    fetchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("crm_access_token");
        if (!token) return;

        const workspaceId = selectedWorkspace.id;
        const organizationId = selectedOrganization.id;

        // Fetch all data in parallel
        const [
          contactsResponse,
          companiesResponse,
          dealsResponse,
          tasksResponse,
          pipelineCategoriesResponse,
          pipelinesResponse,
          pipelineMapsResponse,
        ] = await Promise.all([
          contactService.getContacts(workspaceId, organizationId, token),
          companyService.getCompanies(workspaceId, organizationId, token),
          dealService.getDeals(workspaceId, organizationId, token),
          taskService.getTasks(workspaceId, organizationId, token),
          pipelineService.getPipelineCategories(workspaceId, organizationId),
          pipelineService.getPipelines(workspaceId, organizationId),
          pipelineService.getPipelineMaps(workspaceId),
        ]);

        if (contactsResponse.success && contactsResponse.data) {
          const contacts = contactsResponse.data;
          const leadCounts = {
            total: contacts.length,
            customers: contacts.filter(c => c.status === "ACTIVE").length,
            prospects: contacts.filter(c => c.status === "INACTIVE").length,
            partnerships: contacts.filter(c => c.leadType === "HOT").length,
            network: contacts.filter(c => c.leadType === "WARM").length,
          };

          updateCounts({ leads: leadCounts });
        }

        if (companiesResponse.success && companiesResponse.data) {
          const companies = companiesResponse.data;
          const companyCounts = {
            total: companies.length,
            active: companies.filter(c => c.status === "ACTIVE").length,
            prospects: companies.filter(c => c.status === "PROSPECT").length,
            customers: companies.filter(c => c.status === "CUSTOMER").length,
            partners: companies.filter(c => c.status === "LOST").length,
          };

          updateCounts({ companies: companyCounts });
        }

        if (dealsResponse.success && dealsResponse.data) {
          const deals = dealsResponse.data;
          const dealCounts = {
            total: deals.length,
            open: deals.filter(d => d.status === "OPEN").length,
            won: deals.filter(d => d.status === "WON").length,
            lost: deals.filter(d => d.status === "LOST").length,
            paused: deals.filter(d => d.status === "PAUSED").length,
          };

          updateCounts({ deals: dealCounts });
        }

        if (tasksResponse.success && tasksResponse.data) {
          const tasks = tasksResponse.data;
          const taskCounts = {
            total: tasks.length,
            pending: tasks.filter(t => t.status === "PENDING").length,
            completed: tasks.filter(t => t.status === "COMPLETED").length,
            overdue: tasks.filter(t => {
              const dueDate = new Date(t.dueDate ?? "");
              const today = new Date();
              return t.status === "PENDING" && dueDate < today;
            }).length,
          };

          updateCounts({ tasks: taskCounts });
        }

        // Calculate unique pipeline counts
        if (
          pipelineCategoriesResponse &&
          pipelinesResponse &&
          pipelineMapsResponse &&
          contactsResponse.success &&
          contactsResponse.data &&
          companiesResponse.success &&
          companiesResponse.data
        ) {
          const pipelineCounts = calculateUniquePipelineCounts(
            pipelineMapsResponse,
            pipelineCategoriesResponse,
            pipelinesResponse,
            contactsResponse.data,
            companiesResponse.data
          );

          updateCounts({
            pipeline: {
              total: pipelineCounts.totalUnique,
              uniqueContacts: pipelineCounts.uniqueContacts,
              uniqueCompanies: pipelineCounts.uniqueCompanies,
              pipelineCounts: pipelineCounts.pipelineCounts,
              categoryCounts: pipelineCounts.categoryCounts,
            },
          });
        }

        // Update the last fetch key
        lastFetchRef.current = fetchKey;
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
  }, [user, selectedOrganization, selectedWorkspace, updateCounts]);

  useEffect(() => {
    fetchCounts();
  }, [user, selectedOrganization, selectedWorkspace, fetchCounts]);

  return { counts, loading, refetch: fetchCounts };
};
