import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { university } = await request.json();
    if (!university) {
      return NextResponse.json({ error: "University required" }, { status: 400 });
    }

    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        university: university,
      },
    });

    return NextResponse.json({ success: true, university });
  } catch (error) {
    console.error("Clerk Metadata Sync Error:", error);
    return NextResponse.json({ error: "Failed to sync metadata" }, { status: 500 });
  }
}
