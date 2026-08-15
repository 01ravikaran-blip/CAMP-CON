import { NextRequest, NextResponse } from 'next/server';
import { EventEmitter } from 'events';

// Initialize global event emitter for SSE
declare global {
  var sseEmitter: EventEmitter | undefined;
}

if (!globalThis.sseEmitter) {
  globalThis.sseEmitter = new EventEmitter();
  globalThis.sseEmitter.setMaxListeners(100); // Allow many concurrent connections
}
const emitter = globalThis.sseEmitter;

// Helper to broadcast events from other API routes
export const broadcastEvent = (topic: string, data: any) => {
  emitter.emit(topic, data);
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const topicsParam = url.searchParams.get('topics');
  
  if (!topicsParam) {
    return NextResponse.json({ error: 'No topics provided' }, { status: 400 });
  }

  const topics = topicsParam.split(',');

  // Set up SSE Stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection success event
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', topics })}\n\n`));

      const listener = (data: any) => {
        try {
          const payload = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.error('Error sending SSE message:', err);
        }
      };

      // Subscribe to all requested topics
      topics.forEach(topic => {
        emitter.on(topic, listener);
      });

      // Keep connection alive with a ping every 15s
      const pingInterval = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'));
      }, 15000);

      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        topics.forEach(topic => {
          emitter.off(topic, listener);
        });
        controller.close();
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
