"use client";

import React, { useState, ReactNode } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CreditCard, Shield, AlertCircle } from "lucide-react";
import { apiCall } from "@/lib/apiCall";
import ShowShortMessage from "@/base-component/ShowShortMessage";

const Warning = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleYesClick = async () => {
    setLoading(true);
    try {
      const response = await apiCall({
        url: "/api/subscription/acceptSubscription",
        method: "post",
        applyDefaultDomain: false,
      });

      if (response.status === 200) {
        ShowShortMessage("Purchase completed successfully!", "success");
        router.replace("/sales");
      } else {
        ShowShortMessage("Failed to complete purchase.", "error");
      }
    } catch (error) {
      ShowShortMessage(
        "An error occurred while completing the purchase.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNoClick = async () => {
    setLoading(true);
    try {
      const response = await apiCall({
        url: "/api/subscription/rejectSubscription",
        method: "post",
        applyDefaultDomain: false,
      });

      if (response.status === 200) {
        ShowShortMessage("Process canceled successfully!", "success");
        router.replace("/onboarding/choose-plan");
      } else {
        ShowShortMessage("Failed to cancel the process.", "error");
      }
    } catch (error) {
      ShowShortMessage(
        "An error occurred while cancelling the process.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-orange-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-orange-600 mb-2">
            Warning!
          </CardTitle>
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">
              You have already used the trial with this card.
            </p>
            <p className="text-lg font-semibold text-foreground">
              Would you like to complete the purchase now?
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Payment Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Payment Information</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Your card will be charged immediately</p>
              <p>• You can cancel anytime from your account settings</p>
              <p>• All features will be available immediately</p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Your payment is secure and encrypted</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleYesClick}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                "Yes, Complete Purchase"
              )}
            </Button>

            <Button
              onClick={handleNoClick}
              disabled={loading}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                "No, Cancel"
              )}
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Need help? Contact our support team for assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

Warning.getLayout = (page: ReactNode) => (
  <div className="min-h-screen bg-background">{page}</div>
);

export default Warning;
