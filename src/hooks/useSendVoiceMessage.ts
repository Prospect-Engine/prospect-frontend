"use client";

import { useState, useCallback } from "react";

/**
 * Options for sending a voice message.
 */
export interface SendVoiceMessageOptions {
  /** The audio blob to send */
  audioBlob: Blob;
  /** Conversation URN ID */
  conversationUrnId: string;
  /** Integration ID */
  integrationId: string;
  /** Optional text to accompany the voice message */
  text?: string;
  /** Audio duration in seconds (optional, for metadata) */
  audioDuration?: number;
}

/**
 * Result of sending a voice message.
 */
export interface SendVoiceMessageResult {
  success: boolean;
  unipile_message_id?: string;
  unipile_chat_id?: string;
  error?: string;
}

/**
 * Return type for the useSendVoiceMessage hook.
 */
interface UseSendVoiceMessageReturn {
  /** Function to send a voice message */
  sendVoiceMessage: (
    options: SendVoiceMessageOptions
  ) => Promise<SendVoiceMessageResult>;
  /** Whether a send is currently in progress */
  isSending: boolean;
  /** Last error from sending, if any */
  error: Error | null;
  /** Clear the error state */
  clearError: () => void;
}

/**
 * Hook for sending voice messages via the unified inbox.
 *
 * This hook handles:
 * - Converting audio blob to form data
 * - Uploading to the backend via the API route
 * - Managing loading and error states
 *
 * @example
 * ```tsx
 * const { sendVoiceMessage, isSending, error } = useSendVoiceMessage();
 *
 * const handleSend = async (audioBlob: Blob) => {
 *   const result = await sendVoiceMessage({
 *     audioBlob,
 *     conversationUrnId: "urn:li:conversation:123",
 *     integrationId: "uuid-here",
 *     audioDuration: 5.5,
 *   });
 *
 *   if (result.success) {
 *     console.log("Voice message sent:", result.unipile_message_id);
 *   } else {
 *     console.error("Failed to send:", result.error);
 *   }
 * };
 * ```
 */
export function useSendVoiceMessage(): UseSendVoiceMessageReturn {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendVoiceMessage = useCallback(
    async (
      options: SendVoiceMessageOptions
    ): Promise<SendVoiceMessageResult> => {
      const {
        audioBlob,
        conversationUrnId,
        integrationId,
        text,
        audioDuration,
      } = options;

      // Validate inputs
      if (!audioBlob || audioBlob.size === 0) {
        const errorMsg = "Audio data is required";
        setError(new Error(errorMsg));
        return { success: false, error: errorMsg };
      }

      if (!conversationUrnId) {
        const errorMsg = "Conversation URN ID is required";
        setError(new Error(errorMsg));
        return { success: false, error: errorMsg };
      }

      if (!integrationId) {
        const errorMsg = "Integration ID is required";
        setError(new Error(errorMsg));
        return { success: false, error: errorMsg };
      }

      setIsSending(true);
      setError(null);

      try {
        // Build form data
        const formData = new FormData();

        // Append audio file with a filename
        const filename = `voice_message_${Date.now()}.webm`;
        formData.append("audio", audioBlob, filename);
        formData.append("conversationUrnId", conversationUrnId);
        formData.append("integrationId", integrationId);

        if (text) {
          formData.append("text", text);
        }

        if (audioDuration !== undefined) {
          formData.append("audioDuration", String(audioDuration));
        }

        // Send to API route
        const response = await fetch(
          "/api/conversations/inbox/linkedin/send-voice",
          {
            method: "POST",
            credentials: "include",
            body: formData,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errorMsg =
            data.error || `Failed to send voice message (${response.status})`;
          setError(new Error(errorMsg));
          return {
            success: false,
            error: errorMsg,
          };
        }

        return {
          success: true,
          unipile_message_id: data.unipile_message_id,
          unipile_chat_id: data.unipile_chat_id,
        };
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to send voice message";
        setError(new Error(errorMsg));
        return { success: false, error: errorMsg };
      } finally {
        setIsSending(false);
      }
    },
    []
  );

  return {
    sendVoiceMessage,
    isSending,
    error,
    clearError,
  };
}

export default useSendVoiceMessage;
