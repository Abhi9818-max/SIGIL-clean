// In your Record Tracker App: src/app/api/life-tracker/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskName, taskType, date } = body;

    // --- This is where you would process the data ---
    // For now, we'll just log it to the server console to show it's working.
    // Later, you could save this to a database or update your life tracker's state.
    console.log('Received task from Metamorph app:', { taskName, taskType, date });
    // ------------------------------------------------

    return NextResponse.json({ message: 'Task received successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error in life tracker API:', error);
    return NextResponse.json({ message: 'Error processing request' }, { status: 500 });
  }
}
