import { Router } from 'express';
import { atualizarContrato, buscarContratoPorId, cadastrarContrato, excluirContrato, listarContratos } from '../controllers/imobiliariaController.js';
import { validarContrato } from '../middleware/contractValidation.js';

const router = Router();

router.get('/', listarContratos);
router.get('/:id', buscarContratoPorId);
router.post('/', validarContrato, cadastrarContrato);
router.put('/:id', validarContrato, atualizarContrato);
router.delete('/:id', excluirContrato);

export default router;
