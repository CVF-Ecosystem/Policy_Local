import { NextRequest, NextResponse } from 'next/server';
import { ingestFile } from '@/lib/ingest';

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const results = [];

    const overrides = {
      documentType: formData.get('documentType')?.toString(),
      issuingBody: formData.get('issuingBody')?.toString(),
      effectiveDate: formData.get('effectiveDate')?.toString(),
      sensitivity: formData.get('sensitivity')?.toString(),
      jurisdiction: formData.get('jurisdiction')?.toString(),
    };

    const files = formData.getAll('files');
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    for (const file of files) {
      if (!(file instanceof File)) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await ingestFile(buffer, file.name, overrides);
      results.push(result);
    }

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
