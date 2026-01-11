import React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  User,
  CheckSquare,
  ArrowUp,
  Tag,
  Building,
  DollarSign,
  Loader2,
  AlertCircle,
  Zap,
} from "lucide-react";
import { SearchResult } from "../../hooks/sales-hooks/useGlobalSearch";
import { useDetailPanel } from "../../contexts/sales-contexts/DetailPanelContext";
import { contactService } from "../../services/sales-services/contactService";
import dealService from "../../services/sales-services/dealService";
import companyService from "../../services/sales-services/companyService";
import taskService from "../../services/sales-services/taskService";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";

interface SearchDropdownProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: SearchResult[];
  isOpen: boolean;
  isSearching?: boolean;
  hasError?: boolean;
  onClose: () => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  searchTerm,
  setSearchTerm,
  searchResults,
  isOpen,
  isSearching = false,
  hasError = false,
  onClose,
}) => {
  const router = useRouter();
  const { openLeadDetail, openDealDetail, openCompanyDetail, openTaskDetail } =
    useDetailPanel();
  const { selectedWorkspace, selectedOrganization } = useWorkspace();

  const handleResultClick = async (result: SearchResult) => {
    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        return;
      }

      // Fetch full entity data and open detail panel
      switch (result.type) {
        case "contact": {
          const contact = await contactService.getContact(
            result.id,
            selectedWorkspace?.id || "",
            selectedOrganization?.id || "",
            token
          );
          if (contact.success && contact.data) {
            openLeadDetail(contact.data);
          }
          break;
        }
        case "deal": {
          const deal = await dealService.getDeal(
            result.id,
            selectedWorkspace?.id || "",
            selectedOrganization?.id || "",
            token
          );
          if (deal.success && deal.data) {
            openDealDetail(deal.data);
          }
          break;
        }
        case "company": {
          const company = await companyService.getCompany(
            result.id,
            selectedWorkspace?.id || "",
            selectedOrganization?.id || "",
            token
          );
          if (company.success && company.data) {
            openCompanyDetail(company.data);
          }
          break;
        }
        case "task": {
          const task = await taskService.getTask(
            result.id,
            selectedWorkspace?.id || "",
            selectedOrganization?.id || "",
            token
          );
          if (task.success && task.data) {
            openTaskDetail(task.data);
          }
          break;
        }
      }

      setSearchTerm("");
      onClose();
    } catch (error) {
      // Fallback to navigation if detail panel fails
      router.push(result.url);
      setSearchTerm("");
      onClose();
    }
  };

  const getTypeIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "lead":
        return <User className="w-4 h-4" />;
      case "task":
        return <CheckSquare className="w-4 h-4" />;
      case "deal":
        return <DollarSign className="w-4 h-4" />;
      case "company":
        return <Building className="w-4 h-4" />;
      case "contact":
        return <User className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "lead":
        return "text-blue-600 bg-blue-50";
      case "task":
        return "text-green-600 bg-green-50";
      case "deal":
        return "text-purple-600 bg-purple-50";
      case "company":
        return "text-indigo-600 bg-indigo-50";
      case "contact":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
      case "urgent":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50  bg-opacity-50 backdrop-blur-sm transition-all duration-300 ease-in-out"
      onClick={onClose}
    >
      <div className="flex justify-center pt-20">
        <div className="mx-4 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-2xl transition-all duration-300 ease-in-out transform animate-in slide-in-from-top-6 fade-in scale-in-95">
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search leads, tasks, deals, companies, contacts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="py-3 pr-12 pl-10 w-full text-lg border-0 focus:outline-none focus:ring-0"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 p-1 rounded transform -translate-y-1/2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="overflow-y-auto max-h-96">
            {isSearching ? (
              <div className="p-8 text-center">
                <Loader2 className="mx-auto mb-2 w-8 h-8 text-gray-400 animate-spin" />
                <p className="text-gray-500 dark:text-gray-400">Searching...</p>
              </div>
            ) : hasError ? (
              <div className="p-8 text-center">
                <AlertCircle className="mx-auto mb-2 w-8 h-8 text-red-400" />
                <p className="text-red-500">Search service unavailable</p>
                <p className="mt-1 text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400">
                  Please try again later
                </p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {searchResults.map(result => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="p-4 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none"
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-lg ${getTypeColor(result.type)}`}
                      >
                        {getTypeIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </h3>
                          {result.priority && (
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(result.priority)}`}
                            >
                              {result.priority}
                            </span>
                          )}
                          {result.status && (
                            <span className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full">
                              {result.status}
                            </span>
                          )}
                        </div>
                        {result.description && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                        <div className="flex items-center mt-2 space-x-4">
                          {result.assignee && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                              <User className="w-3 h-3" />
                              <span>{result.assignee}</span>
                            </div>
                          )}
                          {result.tags && result.tags.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Zap className="w-3 h-3 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
                              <div className="flex space-x-1">
                                {result.tags.slice(0, 2).map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {result.tags.length > 2 && (
                                  <span className="px-1.5 py-0.5 text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">
                                    +{result.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">
                        <span className="capitalize">{result.type}</span>
                        <ArrowUp className="w-3 h-3" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="p-8 text-center">
                <Search className="mx-auto mb-2 w-8 h-8 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">
                  No results found for &quot;{searchTerm}&quot;
                </p>
                <p className="mt-1 text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400">
                  Try searching for leads, tasks, deals, companies, or contacts
                </p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Search className="mx-auto mb-2 w-8 h-8 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">
                  Start typing to search...
                </p>
                <div className="grid grid-cols-5 gap-4 mt-4 text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <User className="mx-auto mb-1 w-4 h-4" />
                    <span>Leads</span>
                  </div>
                  <div className="text-center">
                    <CheckSquare className="mx-auto mb-1 w-4 h-4" />
                    <span>Tasks</span>
                  </div>
                  <div className="text-center">
                    <DollarSign className="mx-auto mb-1 w-4 h-4" />
                    <span>Deals</span>
                  </div>
                  <div className="text-center">
                    <Building className="mx-auto mb-1 w-4 h-4" />
                    <span>Companies</span>
                  </div>
                  <div className="text-center">
                    <User className="mx-auto mb-1 w-4 h-4" />
                    <span>Contacts</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>Press Enter to select, Esc to close</span>
              <div className="flex items-center space-x-4">
                <span>↑↓ to navigate</span>
                <span>⌘K to search</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchDropdown;
