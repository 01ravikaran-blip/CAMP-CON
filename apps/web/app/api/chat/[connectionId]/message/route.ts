import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/utils/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectionId } = await params;
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    return await prisma.$transaction(async (tx: any) => {
      const connection = await tx.connectionRequest.findUnique({
        where: { id: connectionId }
      });

      if (!connection) {
        throw new Error('Connection not found');
      }

      if (connection.status !== 'ACCEPTED') {
        throw new Error('Chat is not active');
      }

      if (connection.requesterId !== userId && connection.targetId !== userId) {
        throw new Error('Unauthorized to post in this chat');
      }

      // Check 48-hour window
      if (!connection.isPermanent) {
        if (connection.chatExpiresAt && new Date() > connection.chatExpiresAt) {
          // If expired, maybe we should update status to EXPIRED?
          await tx.connectionRequest.update({
            where: { id: connection.id },
            data: { status: 'EXPIRED' }
          });
          throw new Error('Chat 48-hour window has expired');
        }
      }

      // Increment counters
      const isRequester = connection.requesterId === userId;
      let newRequesterCount = connection.requesterMsgCount + (isRequester ? 1 : 0);
      let newTargetCount = connection.targetMsgCount + (!isRequester ? 1 : 0);
      
      let isPermanent = connection.isPermanent;
      let chatExpiresAt = connection.chatExpiresAt;

      // Check reciprocity lock
      if (!isPermanent && newRequesterCount >= 10 && newTargetCount >= 10) {
        isPermanent = true;
        chatExpiresAt = null;
      }

      // Update connection
      const updatedConnection = await tx.connectionRequest.update({
        where: { id: connectionId },
        data: {
          requesterMsgCount: newRequesterCount,
          targetMsgCount: newTargetCount,
          isPermanent,
          chatExpiresAt
        }
      });

      // Save message
      const message = await tx.directMessage.create({
        data: {
          connectionId,
          senderId: userId,
          content,
          isRequestPitch: false
        }
      });

      return NextResponse.json({ 
        success: true, 
        message, 
        connectionStatus: {
          requesterMsgCount: updatedConnection.requesterMsgCount,
          targetMsgCount: updatedConnection.targetMsgCount,
          isPermanent: updatedConnection.isPermanent
        }
      });
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}
