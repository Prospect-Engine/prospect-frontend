import { useState, useEffect } from "react";
import { CrmApiService } from "@/services/crmApi";

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await CrmApiService.getAllTags();

      if (response.status >= 200 && response.status < 300 && response.data) {
        // Map API response to local interface format
        const apiTags: Tag[] = response.data.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color || "bg-gray-100 text-gray-800",
        }));
        setTags(apiTags);
      } else {
        // Fallback to empty array if API fails
        setTags([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch tags";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  return {
    tags,
    loading,
    error,
    refetch: fetchTags,
  };
}

export default useTags;
