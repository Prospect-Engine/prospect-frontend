import { toast } from "sonner";

const ShowCustomerSupportMessage = (
  message: string,
  onConfirm?: () => void,
  onCancel?: () => void
) => {
  // Show a toast with action buttons
  toast(message, {
    duration: 0, // Don't auto-dismiss
    action: {
      label: "Contact Support",
      onClick: () => {
        if (onConfirm !== undefined) onConfirm();
        if (typeof window !== "undefined") {
          window.location.href = "javascript:void(Tawk_API.toggle())";
        }
      },
    },
    cancel: {
      label: "Close",
      onClick: () => {
        if (onCancel !== undefined) onCancel();
        return false;
      },
    },
    className: "sonner_container",
    style: {
      padding: "30px",
      // Note: Sonner doesn't support confirmButtonColor directly
      // You can add custom CSS for button colors
    },
    // Note: Sonner doesn't have showCancelButton option - it shows both by default
    // Note: Sonner doesn't support customClass.container - using className instead
  });
};

export default ShowCustomerSupportMessage;
