export const publicIdFromUrl = (url: string): string => {
  if (!url) return "";

  // Removing query parameters
  const cleanUrl = url.split("?")[0];

  // Extracting everything after /upload/ (works for both /image/upload/ and /video/upload/)
  const uploadPart = cleanUrl.split("/upload/")[1];

  if (!uploadPart) {
    console.warn("Could not extract upload part from Cloudinary URL:", url);
    return "";
  }

  // Removing version prefix (e.g., v1234567890/) if present
  const withoutVersion = uploadPart.replace(/^v\d+\//, "");

  // Removing file extension (supports many image + video formats)
  const publicId = withoutVersion.replace(/\.[^/.]+$/, "");

  return publicId;
};
