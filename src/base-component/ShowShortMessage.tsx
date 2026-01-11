import { toast } from "sonner";

const ShowShortMessage = (
  title: string,
  type: "success" | "error" | "warning" | "info" = "success"
) => {
  if (typeof window !== "undefined") {
    const toastOptions = {
      duration: 2300,
      position: "top-right" as const,
      className: "sonner_container",
      style: {
        padding: "25px",
      },
    };

    switch (type) {
      case "success":
        return toast.success(title, toastOptions);
      case "error":
        return toast.error(title, toastOptions);
      case "warning":
        return toast.warning(title, toastOptions);
      case "info":
        return toast.info(title, toastOptions);
      default:
        return toast(title, toastOptions);
    }
  }
};

export default ShowShortMessage;
