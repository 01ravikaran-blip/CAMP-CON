import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '../../../../utils/prisma';
import { isDeveloper } from '../../../../lib/auth';
import { CAMPUS_REGISTRY } from '../../../../config/campuses';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || !isDeveloper(sessionClaims)) {
      return NextResponse.json({ error: 'Unauthorized. Developer or Admin role required.' }, { status: 403 });
    }

    const tenantId = req.headers.get('x-tenant-id') || 'campus-global';
    
    const body = await req.json();
    const { 
      title, 
      description, 
      locationName, 
      latitude, 
      longitude, 
      radiusMeters,
      energyReward,
      startTime,
      endTime
    } = body;

    if (!title || !description || !locationName || !latitude || !longitude || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const qrSecret = crypto.randomBytes(16).toString('hex');

    const event = await prisma.campusEvent.create({
      data: {
        tenantId,
        title,
        description,
        locationName,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radiusMeters: radiusMeters ? parseFloat(radiusMeters) : 25.0,
        energyReward: energyReward ? parseInt(energyReward, 10) : 50,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        qrSecret,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
