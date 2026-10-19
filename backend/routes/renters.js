import { Router } from 'express';
import { atualizarLocatario, buscarLocatarioPorId, cadastrarLocatario, excluirLocatario, listarLocatarios } from '../controllers/imobiliariaController.js';
import { validarLocatario } from '../middleware/renterValidation.js';

const router = Router();

router.get('/', listarLocatarios);
router.get('/:id', buscarLocatarioPorId);
router.post('/', validarLocatario, cadastrarLocatario);
router.put('/:id', validarLocatario, atualizarLocatario);
router.delete('/:id', excluirLocatario);

export default router;
