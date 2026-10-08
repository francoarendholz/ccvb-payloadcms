import { NextResponse, type NextRequest } from 'next/server'

/** Wird vom TOTP-Plugin benötigt (Pfad als Header für Server-Komponenten). */
export function proxy(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.append('x-pathname', request.nextUrl.pathname)
  return response
}
