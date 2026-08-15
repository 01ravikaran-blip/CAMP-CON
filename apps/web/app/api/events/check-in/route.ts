import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';
import crypto from 'crypto';

// Haversine formula to calculate distance between two coordinates in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const toRadians = (deg: number) => deg * (Math.PI / 180);
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate TOTP based on 15-second window
function generateTOTP(secret: string, window: number = 15): string {
  const timeStep = Math.floor(Date.now() / 1000 / window);
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(timeStep), 0);
  const hmac = crypto.createHmac('sha1', secret).update(buffer).digest('hex');
  
  // Get dynamic truncation (simplified version returning 6 digits)
  // For a real app, use standard RFC 6238 implementation or otplib.
  const offset = parseInt(hmac.slice(-1), 16);
  const code = parseInt(hmac.substr(offset * 2, 8), 16) & 0x7FFFFFFF;
  return (code % 1000000).toString().padStart(6, '0');
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, token, latitude, longitude } = await req.json();

    if (!eventId || !token || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    return await prisma.$transaction(async (tx: any) => {
      const event = await tx.campusEvent.findUnique({
        where: { id: eventId }
      });

      if (!event) {
        throw new Error('Event not found');
      }

      // 1. Validate Time
      const now = new Date();
      if (now < event.startTime || now > event.endTime) {
        throw new Error('Event is not currently active');
      }

      // 2. Validate GPS Coordinates
      const distance = getDistance(latitude, longitude, event.latitude, event.longitude);
      if (distance > event.radiusMeters) {
        throw new Error(`You are too far from the event. Must be within ${event.radiusMeters}m (You are ${Math.round(distance)}m away).`);
      }

      // 3. Validate TOTP
      // We check current 15s window and previous 15s window to account for network delay
      const expectedTokenCurrent = generateTOTP(event.qrSecret, 15);
      
      // Manually calculate previous window for tolerance
      const prevTimeStep = Math.floor(Date.now() / 1000 / 15) - 1;
      const prevBuffer = Buffer.alloc(8);
      prevBuffer.writeBigInt64BE(BigInt(prevTimeStep), 0);
      const prevHmac = crypto.createHmac('sha1', event.qrSecret).update(prevBuffer).digest('hex');
      const offset = parseInt(prevHmac.slice(-1), 16);
      const prevCode = parseInt(prevHmac.substr(offset * 2, 8), 16) & 0x7FFFFFFF;
      const expectedTokenPrev = (prevCode % 1000000).toString().padStart(6, '0');

      if (token !== expectedTokenCurrent && token !== expectedTokenPrev) {
        throw new Error('Invalid or expired QR code token');
      }

      // 4. Check if already attended
      const existingAttendance = await tx.eventAttendance.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId
          }
        }
      });

      if (existingAttendance) {
        throw new Error('You have already checked in to this event');
      }

      // 5. Credit Energy and Record Attendance
      await tx.user.update({
        where: { id: userId },
        data: {
          energy: { increment: event.energyReward }
        }
      });

      const attendance = await tx.eventAttendance.create({
        data: {
          userId,
          eventId,
          energyAwarded: event.energyReward
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Successfully checked in!',
        energyAwarded: event.energyReward,
        attendance
      });
    });
  } catch (error: any) {
    console.error('Error in event check-in:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}
