import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuth = !!req.auth;

  const needsLogin =
    pathname.startsWith("/myposts") ||
    pathname === "/posts/new" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/tags") ||
    pathname.startsWith("/music") ||
    pathname.startsWith("/photos") ||
    /^\/posts\/[^/]+\/edit$/.test(pathname);

  if (!needsLogin) {
    return NextResponse.next();
  }

  if (!isAuth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && req.auth?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/myposts/:path*",
    "/posts/new",
    "/posts/:id/edit",
    "/admin/:path*",
    "/categories",
    "/categories/:path*",
    "/tags",
    "/tags/:path*",
    "/music",
    "/music/:path*",
    "/photos",
    "/photos/:path*",
  ],
};
