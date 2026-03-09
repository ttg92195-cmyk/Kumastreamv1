import { NextResponse } from 'next/server';

// This API is no longer needed since we're using static data
// But we keep it for compatibility
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Using static data - no seeding required',
  });
}
