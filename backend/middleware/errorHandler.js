export function notFoundHandler(_request, response) {
  response.status(404).json({ error: 'Rota não encontrada.' });
}

export function errorHandler(error, _request, response, _next) {
  console.error(error);
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ error: 'O corpo da solicitação deve conter um JSON válido.' });
  }
  return response.status(500).json({ error: 'Ocorreu um erro inesperado no servidor.' });
}
