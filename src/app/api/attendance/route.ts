import { NextRequest, NextResponse } from 'next/server';
import {
  getWorkRecords,
  upsertWorkRecord,
  deleteWorkRecord,
} from '@/utils/supabase/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId') || undefined;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 },
      );
    }

    const records = await getWorkRecords(startDate, endDate, userId);
    return NextResponse.json(records);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const success = await upsertWorkRecord(body);

    if (success) {
      return NextResponse.json({ ...body, id: body.id || Date.now() });
    } else {
      return NextResponse.json({ error: 'Failed to add record' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const success = await upsertWorkRecord(body);

    if (success) {
      return NextResponse.json(body);
    } else {
      return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const success = await deleteWorkRecord(parseInt(id));

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
