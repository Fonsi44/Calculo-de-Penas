import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/calculadora', '/casos', '/delitos', '/delito-form'];
const authRoutes = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const isProtected = protectedRoutes.some(r => pathname.startsWith(r));
  const isAuth = authRoutes.some(r => pathname.startsWith(r));

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuth && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/calculadora/:path*', '/casos/:path*', '/delitos/:path*', '/delito-form/:path*', '/login/:path*'],
};
