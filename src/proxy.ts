import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RouteACL, grantPermissions } from '@/lib/acl';
import { PermissionSubject as S, PermissionAction as A, perm } from '@/constants/permissions';

// ─── Route definitions ────────────────────────────────────────────────────────

const PUBLIC_PATHS = ['/login', '/register'];

// Mirrors Sidebar.tsx nav items — single source of truth for permission→route mapping
const NAV_ITEMS = [
  { href: '/affiliate', subject: S.AFFILIATE, action: A.READ },
  { href: '/affiliate/llm-audit', subject: S.AFFILIATE, action: A.READ },
  { href: '/affiliate/actions', subject: S.AFFILIATE, action: A.MANAGE },
  { href: '/proxy', subject: S.PROXY, action: A.READ },
  { href: '/proxy/actions', subject: S.PROXY, action: A.MANAGE },
  { href: '/roles', subject: S.ROLE, action: A.READ },
  { href: '/users', subject: S.USER, action: A.READ },
  { href: '/config', subject: S.CONFIG, action: A.MANAGE },
];

// ─── ACL ─────────────────────────────────────────────────────────────────────

const acl = new RouteACL();

grantPermissions(NAV_ITEMS, acl);

acl.allow([perm(S.ROLE, A.MANAGE)], ['/roles/create']);
// /docs: accessible to any user who has at least one relevant permission
acl.allow(
  [perm(S.AFFILIATE, A.READ), perm(S.PROXY, A.READ), perm(S.ROLE, A.READ), perm(S.USER, A.READ), perm(S.CONFIG, A.MANAGE)],
  ['/docs'],
);
// /feedback: any authenticated user can submit feedback
acl.allow(
  [perm(S.AFFILIATE, A.READ), perm(S.PROXY, A.READ), perm(S.ROLE, A.READ), perm(S.USER, A.READ), perm(S.CONFIG, A.MANAGE), perm(S.FEEDBACK, A.READ)],
  ['/feedback'],
);
// /feedback/manage: requires feedback:read
acl.allow([perm(S.FEEDBACK, A.READ)], ['/feedback/manage']);

// ─── JWT decode ───────────────────────────────────────────────────────────────

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, b64] = token.split('.');
    const json = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nextWithLocale(request: NextRequest): NextResponse {
  const locale = request.cookies.get('NEXT_LOCALE')?.value ?? 'en';
  const res = NextResponse.next();
  res.headers.set('x-next-intl-locale', locale);
  return res;
}

// ─── Proxy entry point ───────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Strip locale prefix if somehow present in URL
  const path = pathname.replace(/^\/(en|vi)(\/|$)/, (_, __, slash) => slash || '/');

  // Public routes bypass auth and ACL entirely
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'));
  if (isPublic) return nextWithLocale(request);

  // All protected routes require a token
  const token = request.cookies.get('aff_access_token')?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', path);
    return NextResponse.redirect(loginUrl);
  }

  const payload = decodeJwtPayload(token);
  const permissions = Array.isArray(payload?.permissions)
    ? (payload.permissions as string[])
    : [];

  // ACL check — most specific matching rule wins
  if (!acl.isAllowed(permissions, path)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return nextWithLocale(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
