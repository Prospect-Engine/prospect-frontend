import React from "react";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";

interface MessageStatusIndicatorProps {
  status?: string;
  fromMe: boolean;
  className?: string;
}

const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({
  status,
  fromMe,
  className = "",
}) => {
  // Only show status indicators for messages sent by the user
  if (!fromMe) {
    return null;
  }

  const getStatusIcon = () => {
    switch (status?.toUpperCase()) {
      case "SENT":
        return <Check className="w-3 h-3" />;
      case "DELIVERED":
        return <CheckCheck className="w-3 h-3" />;
      case "READ":
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case "PENDING":
        return <Clock className="w-3 h-3" />;
      case "FAILED":
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusColor = () => {
    switch (status?.toUpperCase()) {
      case "READ":
        return "text-blue-500";
      case "FAILED":
        return "text-red-500";
      case "DELIVERED":
        return "text-gray-400";
      case "SENT":
        return "text-gray-400";
      case "PENDING":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className={`flex items-center ${className}`}>{getStatusIcon()}</div>
  );
};

export default MessageStatusIndicator;
