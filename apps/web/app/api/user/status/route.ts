import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { ghostMode } = await req.json();

    const client = await clerkClient();
    
    // Update public metadata so Ghost Mode state persists in Clerk
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        isFindable: !ghostMode
      }
    });

    return NextResponse.json({ success: true, isFindable: !ghostMode });
  } catch (error) {
    console.error('Error updating user status:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
