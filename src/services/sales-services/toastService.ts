import toast from "react-hot-toast";

export interface ToastOptions {
  duration?: number;
  position?:
    | "top-right"
    | "top-center"
    | "top-left"
    | "bottom-right"
    | "bottom-center"
    | "bottom-left";
}

class ToastService {
  private defaultOptions: ToastOptions = {
    duration: 4000,
    position: "bottom-center",
  };

  success(message: string, options?: ToastOptions) {
    return toast.success(message, {
      ...this.defaultOptions,
      ...options,
      style: {
        background: "#1f2937",
        color: "#f9fafb",
        border: "1px solid #374151",
        borderRadius: "8px",
        padding: "12px 16px",
        fontSize: "14px",
        fontWeight: "500",
      },
      iconTheme: {
        primary: "#10b981",
        secondary: "#f9fafb",
      },
    });
  }

  error(message: string, options?: ToastOptions) {
    return toast.error(message, {
      ...this.defaultOptions,
      ...options,
      style: {
        background: "#1f2937",
        color: "#f9fafb",
        border: "1px solid #374151",
        borderRadius: "8px",
        padding: "12px 16px",
        fontSize: "14px",
        fontWeight: "500",
      },
      iconTheme: {
        primary: "#ef4444",
        secondary: "#f9fafb",
      },
    });
  }

  info(message: string, options?: ToastOptions) {
    return toast(message, {
      ...this.defaultOptions,
      ...options,
      style: {
        background: "#1f2937",
        color: "#f9fafb",
        border: "1px solid #374151",
        borderRadius: "8px",
        padding: "12px 16px",
        fontSize: "14px",
        fontWeight: "500",
      },
      iconTheme: {
        primary: "#3b82f6",
        secondary: "#f9fafb",
      },
    });
  }

  loading(message: string, options?: ToastOptions) {
    return toast.loading(message, {
      ...this.defaultOptions,
      ...options,
      style: {
        background: "#1f2937",
        color: "#f9fafb",
        border: "1px solid #374151",
        borderRadius: "8px",
        padding: "12px 16px",
        fontSize: "14px",
        fontWeight: "500",
      },
    });
  }

  dismiss(toastId: string) {
    toast.dismiss(toastId);
  }

  // Promise-based toast for async operations
  async promise<T>(
    promise: Promise<T>,
    {
      loading = "Loading...",
      success = "Success!",
      error = "Something went wrong",
    }: {
      loading?: string;
      success?: string;
      error?: string;
    } = {}
  ): Promise<T> {
    const loadingToast = this.loading(loading);

    try {
      const result = await promise;
      this.dismiss(loadingToast);
      this.success(success);
      return result;
    } catch (err) {
      this.dismiss(loadingToast);
      this.error(error);
      throw err;
    }
  }
}

const toastService = new ToastService();
export default toastService;
