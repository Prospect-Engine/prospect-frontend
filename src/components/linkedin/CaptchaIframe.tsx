"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ShieldCheck, RefreshCw, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IframeConfig {
  viewportWidth: number;
  viewportHeight: number;
  cropOffset: number;
  iframeHeight: number;
  containerHeight: number;
}

interface CaptchaIframeProps {
  debugUrl: string;
  iframeConfig?: IframeConfig;
  onCaptchaSolved?: () => void;
  className?: string;
  status?: string;
}

export function CaptchaIframe({
  debugUrl,
  iframeConfig,
  onCaptchaSolved,
  className,
  status,
}: CaptchaIframeProps) {
  const config = iframeConfig;
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [debugUrl, retryCount]);

  // Handle when debugUrl becomes null or status indicates completion (captcha solved)
  useEffect(() => {
    const isCaptchaSolved =
      status === "completed" || status === "connected" || !debugUrl;

    if (isCaptchaSolved && onCaptchaSolved) {
      onCaptchaSolved();
      setIsModalOpen(false);
    }
  }, [debugUrl, status, onCaptchaSolved]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleOpenInNewTab = () => {
    window.open(debugUrl, "_blank", "noopener,noreferrer");
  };

  // Don't render modal if captcha is solved
  const isCaptchaSolved =
    status === "completed" || status === "connected" || !debugUrl;

  if (isCaptchaSolved) {
    return null;
  }

  return (
    <>
      {/* Modal for iframe */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] max-w-6xl h-[90vh] p-0">
          <div className="flex-1 p-6 flex items-center justify-center min-h-0 overflow-hidden">
            <div
              className="relative bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden"
              style={{
                width: `${config?.viewportWidth}px`,
                height: `${config?.iframeHeight}px`, // Use iframe height instead of container height
                maxWidth: "100%",
                maxHeight: "100%",
                // Center the container
                margin: "0 auto",
                position: "relative",
              }}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg z-10">
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-base font-medium text-gray-700">
                      Loading security verification...
                    </span>
                  </div>
                </div>
              )}

              {hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 rounded-lg z-10">
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-red-100 rounded-full">
                      <ShieldCheck className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-red-700">
                        Verification Failed
                      </p>
                      <p className="text-sm text-red-600 mt-2">
                        Unable to load the security verification. Please try
                        again.
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRetry}
                        className="text-sm border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleOpenInNewTab}
                        className="text-sm border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <iframe
                src={debugUrl}
                width={`${config?.viewportWidth}px`}
                height={`${config?.iframeHeight}px`}
                className="rounded border-0 absolute"
                style={{
                  top: `-${config?.cropOffset}px`,
                  left: "50%",
                  transform: "translateX(-50%)",
                  // The container's overflow: hidden will crop the top and bottom
                }}
                title="Captcha verification"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            </div>

            {/* <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Complete the verification above</p>
                  <p className="text-xs text-gray-600">This is a secure LinkedIn verification process</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenInNewTab}
                className="text-sm border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </div> */}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
