import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId, amount } = await req.json();

    if (!listingId || !amount) {
      return NextResponse.json({ error: 'Missing listingId or amount' }, { status: 400 });
    }

    // @ts-ignore
    const listing = await (prisma as any).marketplaceListing.findUnique({
      where: { id: listingId },
      include: { seller: true }
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // In a real app, you would retrieve the seller's actual VPA from a secure vault.
    // Here we use a mock VPA for the campus seller.
    const sellerVpa = `${listing.seller.username}@okicici`; 
    const payeeName = encodeURIComponent(listing.seller.fullName || 'Campus Seller');
    const txnNote = encodeURIComponent(`CampusApp_${listingId.substring(0, 8)}`);

    // Generate standard UPI Intent URI
    const upiIntentString = `upi://pay?pa=${sellerVpa}&pn=${payeeName}&am=${amount}&cu=INR&tn=${txnNote}`;

    // Create a pending transaction record
    // @ts-ignore
    const transaction = await (prisma as any).transaction.create({
      data: {
        tenantId: listing.tenantId,
        listingId,
        buyerId: userId,
        sellerId: listing.sellerId,
        amount: Number(amount),
        paymentType: 'UPI_INR',
        escrowStatus: 'HELD'
      }
    });

    return NextResponse.json({
      success: true,
      upiIntentString,
      transactionId: transaction.id
    });

  } catch (error: any) {
    console.error('Error generating UPI intent:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
