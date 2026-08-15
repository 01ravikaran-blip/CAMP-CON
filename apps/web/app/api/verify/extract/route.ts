import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';
import { SignJWT } from 'jose';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const idDocument = formData.get('id_document') as File;

    if (!idDocument) {
      return NextResponse.json({ error: 'No ID document provided' }, { status: 400 });
    }

    // Forward the file to the Tesseract verification service
    const verifyFormData = new FormData();
    verifyFormData.append('id_document', idDocument);

    const VERIFY_SERVICE_URL = process.env.VERIFY_SERVICE_URL || 'http://localhost:3002';
    const verifyRes = await fetch(`${VERIFY_SERVICE_URL}/verify`, {
      method: 'POST',
      body: verifyFormData
    });

    if (!verifyRes.ok) {
      const errorText = await verifyRes.text();
      console.error('Verification service failed:', errorText);
      return NextResponse.json({ error: 'Verification processing failed' }, { status: 500 });
    }

    const verifyData = await verifyRes.json();
    const score = verifyData.confidence_score;

    if (score >= 75) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      // Update Prisma
      await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true }
      });

      // Generate Cryptographic JWT Credential
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'campus_super_secret');
      const campusCredential = await new SignJWT({ 
        sub: userId, 
        tenantId: user.tenantId, 
        studentIdNumber: verifyData.extracted_data?.university || 'Unknown', 
        role: "VERIFIED_STUDENT" 
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1y')
        .sign(secret);

      return NextResponse.json({
        success: true,
        isVerified: true,
        score,
        campusCredential,
        extractedData: verifyData.extracted_data
      });
    } else {
      return NextResponse.json({
        success: false,
        isVerified: false,
        score,
        message: 'Verification failed. Please ensure the document is clear and readable.'
      });
    }
  } catch (error: any) {
    console.error('Error during verification extraction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
