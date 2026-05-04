export function GET(request: Request): Response {
  return Response.redirect(new URL('/api/docs', request.url), 307)
}
