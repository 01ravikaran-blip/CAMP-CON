import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const user = await currentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { metadata } = await req.json();
    if (!metadata) return new NextResponse("Missing metadata", { status: 400 });

    try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(user.id, {
            publicMetadata: {
                ...user.publicMetadata,
                ...metadata
            }
        });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return new NextResponse(e.message, { status: 500 });
    }
}
