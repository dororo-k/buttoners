import { NextResponse } from 'next/server';
import { promises as fsp } from 'fs';
import fs from 'fs';
import path from 'path';

function safeList(dir: string) {
  try {
    if (!fs.existsSync(dir)) return [] as string[];
    return fs.readdirSync(dir);
  } catch {
    return [] as string[];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const route = (searchParams.get('route') || '').replace(/^\//, '');
  const root = process.cwd();
  const base = path.join(root, '.next', 'static', 'chunks', 'app');

  const routeDir = route ? path.join(base, route) : base;
  const files = safeList(routeDir);
  const appRootFiles = safeList(base);
  const globalChunks = safeList(path.join(root, '.next', 'static', 'chunks'));

  return NextResponse.json({
    route,
    base,
    routeDir,
    appRootFiles,
    files,
    globalChunks,
  });
}

