import { openApiDocument } from '../src/openapi.js'

export function GET(): Response {
  return Response.json(openApiDocument)
}
