import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing";

// Document processing (extract + embed) runs in onUploadComplete, so give
// the route ample time. Vercel Pro allows up to 300s.
export const maxDuration = 300;

export const { GET, POST } = createRouteHandler({ router: ourFileRouter });
