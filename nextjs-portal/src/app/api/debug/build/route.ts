import { NextResponse } from 'next/server';
import { promises as fsp } from 'fs';
import path from 'path';

export async function GET() {
  const root = process.cwd();
  const buildFile = path.join(root, '.next', 'BUILD_ID');
  let buildId = null as string | null;
  try {
    buildId = (await fsp.readFile(buildFile, 'utf8')).trim();
  } catch {}
  return NextResponse.json({
    buildId,
    cwd: root,
    now: new Date().toISOString(),
    node: process.version,
    env: process.env.NODE_ENV,
  });
}

