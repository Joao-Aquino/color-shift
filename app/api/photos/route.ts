import { getRandomPhotos } from "@/lib/photos/unsplash";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedCount = Number.parseInt(searchParams.get("count") ?? "10", 10);
  const count = Number.isFinite(requestedCount)
    ? Math.min(Math.max(requestedCount, 1), 30)
    : 10;
  const requestedTheme = searchParams.get("theme");
  const theme = requestedTheme === "light" || requestedTheme === "dark" ? requestedTheme : undefined;

  try {
    const photos = await getRandomPhotos(count, theme);
    return Response.json(
      { photos },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Unable to fetch Unsplash photos", error);
    return Response.json(
      { error: "We could not load a new photo. Please try again." },
      { status: 502 },
    );
  }
}
