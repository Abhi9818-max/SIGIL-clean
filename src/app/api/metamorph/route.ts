// In your S.I.G.I.L. App: src/app/api/metamorph/route.ts
import { NextResponse } from 'next/server';

/**
 * This endpoint allows external applications (like a habit tracker or fitness app)
 * to send data to S.I.G.I.L. to automatically create a record.
 *
 * Expected POST request body:
 * {
 *   "taskName": "Example Task", // A descriptive name of the completed task
 *   "taskType": "learning", // The ID of the corresponding task in S.I.G.I.L.
 *   "date": "2024-01-01", // The date the task was completed
 *   "value": 1 // The value to record
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // In a real implementation, you would add a secret API key for security.
    const { taskName, taskType, date, value } = body;

    // --- This is where you would process the data ---
    // For now, we'll just log it to the server console to show it's working.
    // A full implementation would call `addRecord` from the UserRecordsProvider
    // or directly interact with a database.
    console.log('Received task from a Metamorph-compatible app:', { taskName, taskType, date, value });
    // ------------------------------------------------

    return NextResponse.json({ message: 'Task received by S.I.G.I.L. successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error in Metamorph API endpoint:', error);
    return NextResponse.json({ message: 'Error processing request' }, { status: 500 });
  }
}
