import { useMemo } from "react";
import {
  Contact,
  Company,
  Deal,
  TaskWithRelations,
} from "../../types/sales-types";

interface SearchSuggestion {
  id: string;
  type:
    | "name"
    | "email"
    | "company"
    | "tag"
    | "status"
    | "owner"
    | "industry"
    | "source"
    | "jobTitle"
    | "title"
    | "description"
    | "assignee"
    | "priority"
    | "value"
    | "probability";
  value: string;
  label: string;
  count?: number;
}

export const useSearchSuggestions = (
  searchTerm: string,
  data: Contact[] | Company[] | Deal[] | TaskWithRelations[],
  entityType: "leads" | "companies" | "deals" | "tasks"
) => {
  const suggestions = useMemo(() => {
    if (!searchTerm.trim() || !data.length) {
      return [];
    }

    const term = searchTerm.toLowerCase();
    const suggestions: SearchSuggestion[] = [];
    const seen = new Set<string>();

    const addSuggestion = (
      type: SearchSuggestion["type"],
      value: string,
      label?: string
    ) => {
      const key = `${type}-${value}`;
      if (!seen.has(key) && value.toLowerCase().includes(term)) {
        seen.add(key);
        suggestions.push({
          id: key,
          type,
          value,
          label: label || value,
        });
      }
    };

    // Generate suggestions based on entity type
    switch (entityType) {
      case "leads": {
        const contacts = data as Contact[];
        contacts.forEach(contact => {
          if (contact.name) addSuggestion("name", contact.name);
          if (contact.email) addSuggestion("email", contact.email);
          if (contact.jobTitle) addSuggestion("jobTitle", contact.jobTitle);
          if (contact.industry) addSuggestion("industry", contact.industry);
          if (contact.source) addSuggestion("source", contact.source);
          if (contact.status) addSuggestion("status", contact.status);
          if (contact.owner?.name) addSuggestion("owner", contact.owner.name);
          if (contact.company?.name)
            addSuggestion(
              "company",
              (contact.company as Record<string, unknown>).name as string
            );
          if (contact.tags) {
            contact.tags.forEach(tag => {
              if (typeof tag === "string") {
                addSuggestion("tag", tag);
              } else if (tag && typeof tag === "object") {
                const tagObj = tag as Record<string, unknown>;
                if (tagObj.name && typeof tagObj.name === "string")
                  addSuggestion("tag", tagObj.name);
                if (
                  tagObj.tag &&
                  typeof tagObj.tag === "object" &&
                  (tagObj.tag as Record<string, unknown>).name
                )
                  addSuggestion(
                    "tag",
                    (tagObj.tag as Record<string, unknown>).name as string
                  );
              }
            });
          }
        });
        break;
      }

      case "companies": {
        const companies = data as Company[];
        companies.forEach(company => {
          if (company.name) addSuggestion("name", company.name);
          if (company.domain) addSuggestion("company", company.domain);
          if (company.industry) addSuggestion("industry", company.industry);
          if (company.status) addSuggestion("status", company.status);
          if (company.owner?.name) addSuggestion("owner", company.owner.name);
          if (company.size) addSuggestion("status", company.size);
          if (company.revenue) addSuggestion("status", company.revenue);
          if (company.tags) {
            company.tags.forEach(tag => {
              if (typeof tag === "string") {
                addSuggestion("tag", tag);
              } else if (tag && typeof tag === "object") {
                const tagObj = tag as Record<string, unknown>;
                if (tagObj.name && typeof tagObj.name === "string")
                  addSuggestion("tag", tagObj.name);
                if (
                  tagObj.tag &&
                  typeof tagObj.tag === "object" &&
                  (tagObj.tag as Record<string, unknown>).name
                )
                  addSuggestion(
                    "tag",
                    (tagObj.tag as Record<string, unknown>).name as string
                  );
              }
            });
          }
        });
        break;
      }

      case "deals": {
        const deals = data as Deal[];
        deals.forEach(deal => {
          if (deal.title) addSuggestion("title", deal.title);
          if (deal.description) addSuggestion("description", deal.description);
          if (deal.status) addSuggestion("status", deal.status);
          if (deal.owner?.name) addSuggestion("owner", deal.owner.name);
          if (deal.contact?.name) addSuggestion("name", deal.contact.name);
          if (deal.company?.name) addSuggestion("company", deal.company.name);
          if (deal.value)
            addSuggestion("value", `$${deal.value.toLocaleString()}`);
          if (deal.probability)
            addSuggestion("probability", `${deal.probability}%`);
          if (deal.tags) {
            deal.tags.forEach(tag => {
              if (typeof tag === "string") {
                addSuggestion("tag", tag);
              } else if (tag && typeof tag === "object") {
                const tagObj = tag as Record<string, unknown>;
                if (tagObj.name && typeof tagObj.name === "string")
                  addSuggestion("tag", tagObj.name);
                if (
                  tagObj.tag &&
                  typeof tagObj.tag === "object" &&
                  (tagObj.tag as Record<string, unknown>).name
                )
                  addSuggestion(
                    "tag",
                    (tagObj.tag as Record<string, unknown>).name as string
                  );
              }
            });
          }
        });
        break;
      }

      case "tasks": {
        const tasks = data as TaskWithRelations[];
        tasks.forEach(task => {
          if (task.title) addSuggestion("title", task.title);
          if (task.description) addSuggestion("description", task.description);
          if (task.status) addSuggestion("status", task.status);
          if (task.priority) addSuggestion("priority", task.priority);
          if (task.assignee?.name)
            addSuggestion("assignee", task.assignee.name);
          if (task.contact?.name) addSuggestion("name", task.contact.name);
          if (task.company?.name) addSuggestion("company", task.company.name);
          const taskObj = task as unknown as Record<string, unknown>;
          if (taskObj.tags) {
            (taskObj.tags as unknown[]).forEach((tag: unknown) => {
              if (typeof tag === "string") {
                addSuggestion("tag", tag);
              } else if (tag && typeof tag === "object") {
                const tagObj = tag as Record<string, unknown>;
                if (tagObj.name && typeof tagObj.name === "string")
                  addSuggestion("tag", tagObj.name);
                if (
                  tagObj.tag &&
                  typeof tagObj.tag === "object" &&
                  (tagObj.tag as Record<string, unknown>).name
                )
                  addSuggestion(
                    "tag",
                    (tagObj.tag as Record<string, unknown>).name as string
                  );
              }
            });
          }
        });
        break;
      }
    }

    // Sort suggestions by relevance (exact matches first, then partial matches)
    return suggestions
      .sort((a, b) => {
        const aExactMatch = a.value.toLowerCase() === term;
        const bExactMatch = b.value.toLowerCase() === term;
        const aStartsWith = a.value.toLowerCase().startsWith(term);
        const bStartsWith = b.value.toLowerCase().startsWith(term);

        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        return a.value.localeCompare(b.value);
      })
      .slice(0, 10); // Limit to 10 suggestions
  }, [searchTerm, data, entityType]);

  return suggestions;
};
