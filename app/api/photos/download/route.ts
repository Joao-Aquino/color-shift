import { trackPhotoDownload } from "@/lib/photos/unsplash";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body || typeof body !== "object" ||
    !("photoId" in body) || typeof body.photoId !== "string" ||
    !("location" in body) || typeof body.location !== "string") {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await trackPhotoDownload(body.photoId, body.location);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Unable to track Unsplash photo use", error);
    return Response.json({ error: "Unable to record photo use." }, { status: 502 });
  }
}
