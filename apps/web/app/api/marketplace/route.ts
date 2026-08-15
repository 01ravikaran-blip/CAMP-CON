import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../utils/prisma';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    const listings = await prisma.marketplaceListing.findMany({
      where: { tenantId },
      include: {
        seller: {
          select: { fullName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ listings });
  } catch (error: any) {
    console.error('Error fetching marketplace listings:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
