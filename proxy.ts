import { NextResponse, type NextRequest } from "next/server";

// What anyone may open without the password: the landing page, the creator
// page and what those two need.
const OPEN = ["/welcome", "/creators", "/api/creators/", "/api/media/"];

// When the app is hosted, APP_PASSWORD puts the brand's side behind a
// browser password prompt. Without it, as on a laptop, nothing is asked.
export function proxy(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (OPEN.some((open) => pathname === open || pathname.startsWith(open))) {
    return NextResponse.next();
  }

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const given = atob(header.slice(6));
      // Any name works. Only the password after the colon is checked.
      if (given.slice(given.indexOf(":") + 1) === password) return NextResponse.next();
    } catch {
      // Not valid base64: fall through to asking again.
    }
  }

  return new NextResponse("A password is needed to open Creator Ops.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Creator Ops", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/((?!_next/|icon|favicon).*)"],
};
