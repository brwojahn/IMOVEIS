import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import contractsRouter from './routes/contracts.js';
import propertiesRouter from './routes/properties.js';
import rentersRouter from './routes/renters.js';
import tasksRouter from './routes/tasks.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { pool } from './database/conexao.js';

const currentFile = fileURLToPath(import.meta.url);
const backendDirectory = path.dirname(currentFile);
const app = express();
const port = Number(process.env.PORT) || 3000;
app.use('/api', (request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (request.method === 'OPTIONS') return response.sendStatus(204);
  next();
});
app.use(express.json());
app.use(express.static(path.resolve(backendDirectory, '../frontend')));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', message: 'A API imobiliária está em execução.' });
});
app.use('/api/properties', propertiesRouter);
app.use('/api/renters', rentersRouter);
app.use('/api/rental-contracts', contractsRouter);
app.use('/api/tasks', tasksRouter);
app.use(notFoundHandler);
app.use(errorHandler);

async function iniciarServidor() {
  try {
    await pool.query('SELECT 1');
    app.listen(port, () => {
      console.log(`O sistema imobiliário está pronto em http://localhost:${port}`);
    });
  } catch (erro) {
    console.log('Erro ao conectar ao banco de dados: ', erro);
    process.exit(1);
  }
}

iniciarServidor();
