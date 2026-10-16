import { Router } from 'express';
import { atualizarImovel, buscarImovelPorId, cadastrarImovel, excluirImovel, listarImoveis } from '../controllers/propertiesController.js';
import { validarImovel } from '../../middleware/propertyValidation.js';

const router = Router();

router.get('/', listarImoveis);
router.get('/:id', buscarImovelPorId);
router.post('/', validarImovel, cadastrarImovel);
router.put('/:id', validarImovel, atualizarImovel);
router.delete('/:id', excluirImovel);

export default router;
