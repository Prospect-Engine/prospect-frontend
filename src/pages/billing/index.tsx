"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Edit,
  Plus,
  Clock,
  Zap,
  Search,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SeatManagementCard } from "@/components/billing/SeatManagementCard";

// Mock data types based on the provided data structure
interface Subscription {
  type: string;
  is_active: boolean;
  is_canceled: boolean;
  is_disabled: boolean;
  has_previous_subscription: boolean;
  is_trial: boolean;
  is_on_grace_period: boolean;
  is_conflict_resolved: boolean;
  trial_used: boolean;
  trial_conflict: boolean;
  grace_period: number;
  is_eligible_for_grace: boolean;
  seat_count: number;
  total_seat: number;
  used_seat: number;
  start_date: string;
  end_date: string;
  plan_code: string;
  payment_status: string;
  plan_duration_type: string;
  owner_tenant_id: string;
  user_tenant_id: string;
  is_selected: boolean;
  next_cycle: {
    seat_count: number;
    package_price: number;
    estimated_cost: number;
  };
  current_cycle: {
    seat_count: number;
    package_price: number;
    current_cost: number;
  };
  team: any;
}

interface PaymentMethod {
  has_payment_method: boolean;
  payment_method: {
    id: string;
    card: {
      brand: string;
      last4: string;
      exp_year: number;
      exp_month: number;
      country: string;
      funding: string;
    };
    type: string;
    billing_details: {
      name: string;
      email: string;
      address: {
        country: string;
        city?: string;
        line1?: string;
        line2?: string;
        state?: string;
        postal_code?: string;
      };
    };
  };
}

interface Invoice {
  id: string;
  status: string;
  paid: boolean;
  total: number;
  currency: string;
  created: number;
  customer_name: string;
  customer_email: string;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
  lines: {
    data: Array<{
      description: string;
      amount: number;
      currency: string;
    }>;
  };
}

export default function BillingPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [seatStats, setSeatStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Load data from API endpoints
  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      // Fetch all billing data in parallel
      const [
        subscriptionResponse,
        cardInfoResponse,
        invoicesResponse,
        seatStatsResponse,
      ] = await Promise.allSettled([
        fetch("/api/billing/getSubscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({}),
        }),
        fetch("/api/billing/getCardInfo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({}),
        }),
        fetch("/api/billing/getAllInvoices", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({}),
        }),
        fetch("/api/workspaces/seat-stat", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }),
      ]);

      // Handle subscription data
      if (
        subscriptionResponse.status === "fulfilled" &&
        subscriptionResponse.value.ok
      ) {
        const subscriptionData = await subscriptionResponse.value.json();

        if (subscriptionData?.subscription) {
          setSubscriptions([subscriptionData.subscription]);
        } else {
          setSubscriptions([]);
        }
      } else {
        setSubscriptions([]);
      }

      // Handle payment method data
      if (
        cardInfoResponse.status === "fulfilled" &&
        cardInfoResponse.value.ok
      ) {
        const cardData = await cardInfoResponse.value.json();

        if (cardData) {
          setPaymentMethod(cardData);
        } else {
          setPaymentMethod(null);
        }
      } else {
        setPaymentMethod(null);
      }

      // Handle invoices data
      if (
        invoicesResponse.status === "fulfilled" &&
        invoicesResponse.value.ok
      ) {
        const invoicesData = await invoicesResponse.value.json();

        // Handle different possible response structures
        if (invoicesData) {
          if (invoicesData.invoices && Array.isArray(invoicesData.invoices)) {
            setInvoices(invoicesData.invoices);
          } else if (Array.isArray(invoicesData)) {
            setInvoices(invoicesData);
          } else if (invoicesData.data && Array.isArray(invoicesData.data)) {
            setInvoices(invoicesData.data);
          } else {
            setInvoices([]);
          }
        } else {
          setInvoices([]);
        }
      } else {
        setInvoices([]);
      }

      // Handle seat stats data
      if (
        seatStatsResponse.status === "fulfilled" &&
        seatStatsResponse.value.ok
      ) {
        const seatStatsData = await seatStatsResponse.value.json();

        if (seatStatsData) {
          setSeatStats(seatStatsData);
        } else {
          setSeatStats(null);
        }
      } else {
        setSeatStats(null);
      }

      setLoading(false);
    } catch (err) {
      setError("Failed to load billing data. Please try again.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle upgrade/manage plan button click
  const handleUpgradePlan = useCallback(async () => {
    try {
      setLoading(true);

      // Check if user has any personal subscription and if it's inactive

      if (subscriptions.length > 0) {
        const personalSubscriptions = subscriptions.filter(
          sub => sub.type === "personal"
        );

        const hasActivePersonalSubscription = personalSubscriptions.some(
          sub => sub.is_active
        );

        // If no active personal subscription found, redirect to choose plan page
        if (!hasActivePersonalSubscription) {
          try {
            await router.push("/onboarding/choose-plan");
            return;
          } catch (redirectError) {
            setError("Failed to redirect to plan selection. Please try again.");
            return;
          }
        }
      } else {
        // If no subscriptions at all, redirect to choose plan page
        try {
          await router.push("/onboarding/choose-plan");
          return;
        } catch (redirectError) {
          setError("Failed to redirect to plan selection. Please try again.");
          return;
        }
      }

      const response = await fetch("/api/billing/customerPortal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (data.error === "Customer not found") {
          // Redirect to choose plan page when customer is not found
          router.push("/onboarding/choose-plan");
          return;
        }

        // Handle authentication errors
        if (response.status === 403 || data.message?.includes("login again")) {
          setError("Please log in again to access billing features.");
          return;
        }

        setError(
          data.message || `Customer portal API failed: ${response.status}`
        );
        return;
      }

      // Check if we have a URL to redirect to
      if (data.url) {
        // Open the customer portal URL in the same tab
        window.open(data.url);
      } else {
        setError(
          data.message || "Failed to open customer portal. Please try again."
        );
      }
    } catch (err) {
      setError("Failed to open customer portal. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router, subscriptions]);

  // Handle add payment method button click
  const handleAddPaymentMethod = useCallback(async () => {
    try {
      setLoading(true);

      // First try to open the Stripe customer portal for payment method setup
      const response = await fetch("/api/billing/customerPortal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Open the customer portal URL for payment method management
        window.open(data.url);
        return;
      }

      // If customer portal fails (no Stripe customer), redirect to checkout
      // to set up subscription with payment method
      router.push("/onboarding/choose-plan");
    } catch (err) {
      // On any error, redirect to plan selection
      router.push("/onboarding/choose-plan");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const formatCurrency = useCallback(
    (amount: number | null | undefined, currency: string = "usd") => {
      // Handle null, undefined, NaN, and invalid values
      const safeAmount =
        typeof amount === "number" && !isNaN(amount) ? amount : 0;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(safeAmount / 100);
    },
    []
  );

  const formatDate = useCallback(
    (dateString: string | number | null | undefined) => {
      // Handle null, undefined, 0, empty string
      if (!dateString || dateString === 0 || dateString === "") {
        return "N/A";
      }

      const date =
        typeof dateString === "string"
          ? new Date(dateString)
          : new Date(dateString * 1000);

      // Check for invalid date
      if (isNaN(date.getTime())) {
        return "N/A";
      }

      // Check for epoch/null dates (before 1971 is likely a null/invalid date)
      // This handles cases where backend returns timestamp 0 or epoch date string
      if (date.getFullYear() < 1971) {
        return "N/A";
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
    []
  );

  const getStatusBadge = (status: string, paid: boolean) => {
    if (paid) {
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Paid
        </Badge>
      );
    }

    switch (status) {
      case "draft":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700"
          >
            <Clock className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        );
      case "open":
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Open
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCardBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case "visa":
        return "💳";
      case "mastercard":
        return "💳";
      case "amex":
        return "💳";
      default:
        return "💳";
    }
  };

  // Memoized filter and sort logic for performance
  const filteredAndSortedInvoices = useMemo(() => {
    return invoices
      .filter(invoice => {
        // Search filter
        const matchesSearch =
          invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.customer_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          invoice.customer_email
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        // Status filter
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "paid" && invoice.paid) ||
          (statusFilter === "unpaid" && !invoice.paid) ||
          (statusFilter === "draft" && invoice.status === "draft");

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case "date":
            comparison = a.created - b.created;
            break;
          case "amount":
            comparison = a.total - b.total;
            break;
          case "status":
            comparison = a.status.localeCompare(b.status);
            break;
        }

        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [invoices, searchTerm, statusFilter, sortBy, sortOrder]);

  // Memoized pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(
      filteredAndSortedInvoices.length / itemsPerPage
    );
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedInvoices = filteredAndSortedInvoices.slice(
      startIndex,
      endIndex
    );

    return { totalPages, paginatedInvoices };
  }, [filteredAndSortedInvoices, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder, itemsPerPage]);

  if (loading) {
    return (
      <AppLayout activePage="Billing">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-80 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-48 animate-pulse"></div>
          </div>

          {/* Two-column grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subscription Card Skeleton */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-600 shadow-sm p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                  <div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-2"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
                </div>
              </div>
            </div>

            {/* Payment Method Card Skeleton */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-600 shadow-sm p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                  <div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                  </div>
                </div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-20"></div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice History Card Skeleton */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-600 shadow-sm p-6 animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                </div>
              </div>
            </div>

            {/* Search and Filter Controls Skeleton */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-32"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-32"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-10"></div>
              </div>
            </div>

            {/* Invoice List Skeleton */}
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                          </div>
                          <div className="hidden sm:block">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-12"></div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout activePage="Billing">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Billing & Subscription
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage your subscription, payment methods, and invoices
              </p>
            </div>
          </div>

          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Error Loading Data
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
                {error}
              </p>
              <Button onClick={loadData} className="rounded-xl">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activePage="Billing">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Billing & Subscription
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage your subscription, payment methods, and invoices
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white"
              onClick={handleUpgradePlan}
              disabled={loading}
              title="Open Stripe Customer Portal to manage your subscription"
            >
              <Plus className="w-4 h-4 mr-2" />
              {loading ? "Loading..." : "Upgrade/Manage Plan"}
            </Button>
          </div>
        </div>

        {/* Subscription Overview and Payment Method - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subscription Information */}
          {subscriptions.length > 0 ? (
            subscriptions.map(subscription => (
              <Card
                key={subscription.plan_code}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">
                          {subscription.plan_code}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
                          {subscription.plan_duration_type}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={subscription.is_active ? "default" : "secondary"}
                      className={cn(
                        subscription.is_active
                          ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
                          : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                      )}
                    >
                      {subscription.is_active ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Seat Usage
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {seatStats?.used_seat ||
                              subscription.used_seat ||
                              0}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            of{" "}
                            {seatStats?.total_seat ||
                              subscription.total_seat ||
                              subscription.seat_count}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all duration-300",
                              (seatStats?.used_seat ||
                                subscription.used_seat ||
                                0) /
                                (seatStats?.total_seat ||
                                  subscription.total_seat ||
                                  subscription.seat_count) >
                                0.8
                                ? "bg-gradient-to-r from-red-500 to-red-600"
                                : (seatStats?.used_seat ||
                                      subscription.used_seat ||
                                      0) /
                                      (seatStats?.total_seat ||
                                        subscription.total_seat ||
                                        subscription.seat_count) >
                                    0.6
                                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                  : "bg-gradient-to-r from-green-500 to-green-600"
                            )}
                            style={{
                              width: `${Math.min(((seatStats?.used_seat || subscription.used_seat || 0) / (seatStats?.total_seat || subscription.total_seat || subscription.seat_count)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(seatStats?.total_seat ||
                            subscription.total_seat ||
                            subscription.seat_count) -
                            (seatStats?.used_seat ||
                              subscription.used_seat ||
                              0)}{" "}
                          seats available
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Monthly
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(
                          subscription.current_cycle.package_price
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        Next billing
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDate(subscription.end_date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        Payment status
                      </span>
                      <Badge
                        variant={
                          subscription.payment_status === "paid"
                            ? "default"
                            : "destructive"
                        }
                        className={cn(
                          subscription.payment_status === "paid"
                            ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
                            : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700"
                        )}
                      >
                        {subscription.payment_status === "paid" ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Paid
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {subscription.payment_status}
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            /* No Subscription Fallback */
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-white">
                        No Active Subscription
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
                        Get started with a plan
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Inactive
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Show seat stats if available, even without subscription */}
                {seatStats ? (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Current Usage
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {seatStats.used_seat || 0}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            of {seatStats.total_seat || 0}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all duration-300",
                              (seatStats.used_seat || 0) /
                                (seatStats.total_seat || 1) >
                                0.8
                                ? "bg-gradient-to-r from-red-500 to-red-600"
                                : (seatStats.used_seat || 0) /
                                      (seatStats.total_seat || 1) >
                                    0.6
                                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                  : "bg-gradient-to-r from-green-500 to-green-600"
                            )}
                            style={{
                              width: `${Math.min(((seatStats.used_seat || 0) / (seatStats.total_seat || 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(seatStats.total_seat || 0) -
                            (seatStats.used_seat || 0)}{" "}
                          seats available
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Status
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        No Plan
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Seat Usage
                      </span>
                    </div>
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Seat information not available
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {seatStats === null
                          ? "API call failed"
                          : "No data received"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-center py-8">
                  <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No subscription found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    You don&apos;t have an active subscription. Choose a plan to
                    get started.
                  </p>
                  <Button
                    className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white"
                    onClick={handleUpgradePlan}
                    disabled={loading}
                    title="Open Stripe Customer Portal to choose a subscription plan"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {loading ? "Loading..." : "Choose a Plan"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      Payment Method
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
                      Your default payment method for subscriptions
                    </CardDescription>
                  </div>
                </div>
                {/* <Button variant="outline" size="sm" className="rounded-xl">
                  <Edit className="w-4 h-4 mr-2" />
                  Update
                </Button> */}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethod?.has_payment_method ? (
                <>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          VISA
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getCardBrandIcon(
                            paymentMethod.payment_method.card.brand
                          )}{" "}
                          •••• {paymentMethod.payment_method.card.last4}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Expires {paymentMethod.payment_method.card.exp_month}/
                          {paymentMethod.payment_method.card.exp_year}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        Cardholder
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {paymentMethod.payment_method.billing_details.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        Billing Email
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {paymentMethod.payment_method.billing_details.email}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        Country
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {
                          paymentMethod.payment_method.billing_details.address
                            .country
                        }
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No payment method
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Add a payment method to manage your subscription
                  </p>
                  <Button
                    className="rounded-xl"
                    onClick={handleAddPaymentMethod}
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {loading ? "Loading..." : "Add Payment Method"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seat Management Card */}
        <SeatManagementCard />

        {/* Invoice History */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Invoice History
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
                    View and download your billing history (
                    {filteredAndSortedInvoices.length} invoices)
                  </CardDescription>
                </div>
              </div>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search invoices by ID, name, or email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-xl border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 rounded-xl border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(value: "date" | "amount" | "status") =>
                    setSortBy(value)
                  }
                >
                  <SelectTrigger className="w-32 rounded-xl border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="rounded-xl border-gray-200 dark:border-gray-700"
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="w-4 h-4" />
                  ) : (
                    <SortDesc className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAndSortedInvoices.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No invoices found
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "You don't have any invoices yet"}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginationData.paginatedInvoices.map(invoice => (
                    <div
                      key={invoice.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  Invoice #{invoice.id.slice(-8)}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {formatDate(invoice.created)}
                                </p>
                              </div>
                              {invoice.lines?.data?.length > 0 && (
                                <div className="hidden sm:block">
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {invoice.lines.data[0].description}
                                  </p>
                                </div>
                              )}
                            </div>
                            {invoice.lines?.data?.length > 0 && (
                              <div className="sm:hidden mt-2">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {invoice.lines.data[0].description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(invoice.total, invoice.currency)}
                            </p>
                            {getStatusBadge(invoice.status, invoice.paid)}
                          </div>
                          <div className="flex space-x-2">
                            {invoice.invoice_pdf && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() =>
                                  window.open(invoice.invoice_pdf, "_blank")
                                }
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            {invoice.hosted_invoice_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() =>
                                  window.open(
                                    invoice.hosted_invoice_url,
                                    "_blank"
                                  )
                                }
                                title="Preview Invoice"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {paginationData.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={paginationData.totalPages}
                      itemsPerPage={itemsPerPage}
                      totalItems={filteredAndSortedInvoices.length}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                      itemsPerPageOptions={[5, 10, 25, 50]}
                      itemLabel="invoices"
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
