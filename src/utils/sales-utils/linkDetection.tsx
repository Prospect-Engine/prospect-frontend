import React from "react";

// URL regex pattern to detect various types of URLs
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[^\s]{2,})/gi;

// Function to detect and render links in text
export const renderTextWithLinks = (
  text: string,
  className?: string
): React.ReactNode => {
  if (!text) return null;

  const parts = text.split(URL_REGEX);
  const matches: string[] = text.match(URL_REGEX) || [];

  return parts.map((part, index) => {
    if (matches.includes(part)) {
      // This is a URL - make it clickable
      const url = part.startsWith("http") ? part : `https://${part}`;
      return React.createElement(
        "a",
        {
          key: index,
          href: url,
          target: "_blank",
          rel: "noopener noreferrer",
          className: `text-blue-600 hover:text-blue-800 underline ${className || ""}`,
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            window.open(url, "_blank");
          },
        },
        part
      );
    }
    // This is regular text
    return React.createElement("span", { key: index }, part);
  });
};

// Function to check if text contains links
export const hasLinks = (text: string): boolean => {
  if (!text) return false;
  return URL_REGEX.test(text);
};

// Function to extract all links from text
export const extractLinks = (text: string): string[] => {
  if (!text) return [];
  const matches = text.match(URL_REGEX) || [];
  return matches.map(match =>
    match.startsWith("http") ? match : `https://${match}`
  );
};
