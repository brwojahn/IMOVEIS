export function notFoundHandler(_request, response) {
  response.status(404).json({ error: 'Route not found.' });
}

export function errorHandler(error, _request, response, _next) {
  console.error(error);
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ error: 'Request body must contain valid JSON.' });
  }
  return response.status(500).json({ error: 'An unexpected server error occurred.' });
}
