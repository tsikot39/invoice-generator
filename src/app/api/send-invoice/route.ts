import { NextResponse } from 'next/server';

export const POST = async (): Promise<NextResponse> => {
  try {
    console.log('Send invoice POST route hit!');

    return NextResponse.json(
      {
        success: true,
        message: 'Test route working',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Test route error:', error);
    return NextResponse.json({ error: 'Test route error' }, { status: 500 });
  }
};
