import { Router } from 'express';
import { atualizarTarefa, buscarTarefaPorId, cadastrarTarefa, excluirTarefa, listarTarefas } from '../controllers/tasksController.js';
import { validarTarefa } from '../../middleware/taskValidation.js';

const router = Router();

router.get('/', listarTarefas);
router.get('/:id', buscarTarefaPorId);
router.post('/', validarTarefa, cadastrarTarefa);
router.put('/:id', validarTarefa, atualizarTarefa);
router.delete('/:id', excluirTarefa);

export default router;
