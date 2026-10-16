-- Dados ficticios para demonstracao. Execute 01_estrutura.sql primeiro.
USE imobiliaria;

INSERT INTO properties
  (id, title, address, city, state, postal_code, property_type, is_for_sale, sale_price, bedrooms, bathrooms, area_sqm, status, description)
VALUES
  (1, 'Casa Jardim das Palmeiras', 'Rua das Acacias, 128', 'Campinas', 'SP', '13025-110', 'House', TRUE, 780000.00, 3, 2, 168.00, 'Active', 'Casa familiar com jardim amplo, cozinha renovada e duas vagas. Atualmente alugada e tambem anunciada para venda.'),
  (2, 'Apartamento Vista do Lago', 'Av. Norte Sul, 940, ap. 82', 'Campinas', 'SP', '13083-120', 'Apartment', FALSE, NULL, 2, 2, 84.50, 'Active', 'Apartamento mobiliado com varanda e vista para o lago. Contrato de aluguel vigente.'),
  (3, 'Sala Comercial Cambui', 'Rua Coronel Quirino, 615, sala 4', 'Campinas', 'SP', '13025-002', 'Commercial', TRUE, 465000.00, 0, 1, 53.00, 'Active', 'Sala comercial pronta para uso, proxima a bancos, restaurantes e transporte publico.'),
  (4, 'Sobrado Vila Mariana', 'Rua Dona Avelina, 72', 'Sao Paulo', 'SP', '04111-010', 'House', TRUE, 1250000.00, 4, 3, 210.00, 'Active', 'Sobrado com patio e espaco gourmet. Imovel alugado; o proprietario tambem aceita proposta de compra.'),
  (5, 'Studio Pinheiros', 'Rua dos Pinheiros, 1510, ap. 34', 'Sao Paulo', 'SP', '05422-002', 'Apartment', FALSE, NULL, 1, 1, 41.00, 'Active', 'Studio compacto perto do metro, com armarios planejados e lavanderia coletiva.'),
  (6, 'Casa Bosque dos Ipes', 'Alameda dos Ipes, 305', 'Valinhos', 'SP', '13270-210', 'House', TRUE, 920000.00, 3, 3, 194.00, 'Active', 'Casa em condominio com quintal, churrasqueira e portaria 24 horas. Locada ate o fim do contrato atual.'),
  (7, 'Terreno Parque das Flores', 'Rua Um, lote 18', 'Jundiai', 'SP', '13214-500', 'Land', TRUE, 340000.00, 0, 0, 300.00, 'Active', 'Terreno plano em bairro residencial com agua, energia e acesso asfaltado.'),
  (8, 'Apartamento Centro Historico', 'Rua Baronesa, 210, ap. 51', 'Santos', 'SP', '11015-001', 'Apartment', TRUE, 590000.00, 2, 2, 96.00, 'Active', 'Apartamento amplo com sacada e garagem. O contrato de locacao segue ativo durante a venda.'),
  (9, 'Loja Avenida Brasil', 'Av. Brasil, 1830, loja 2', 'Sao Paulo', 'SP', '01430-001', 'Commercial', FALSE, NULL, 0, 1, 78.00, 'Active', 'Loja de rua com vitrine, banheiro e bom fluxo de pedestres.'),
  (10, 'Casa Recanto Verde', 'Rua das Paineiras, 56', 'Sorocaba', 'SP', '18047-660', 'House', TRUE, 640000.00, 3, 2, 152.00, 'Active', 'Casa arejada com jardim frontal, edicula e duas vagas cobertas.'),
  (11, 'Apartamento Alto da Boa Vista', 'Rua Amalia de Noronha, 450, ap. 103', 'Sao Paulo', 'SP', '05410-000', 'Apartment', FALSE, NULL, 2, 1, 72.00, 'Active', 'Apartamento silencioso com elevador, salao de festas e portaria.'),
  (12, 'Casa das Oliveiras', 'Rua Jose Bonifacio, 811', 'Sao Jose dos Campos', 'SP', '12245-000', 'House', TRUE, 870000.00, 4, 3, 205.00, 'Active', 'Casa com escritorio, varanda e placas solares. Esta alugada e disponivel para compra.'),
  (13, 'Conjunto Comercial Paulista', 'Av. Paulista, 1000, cj. 1205', 'Sao Paulo', 'SP', '01310-100', 'Commercial', TRUE, 710000.00, 0, 2, 89.00, 'Active', 'Conjunto com recepcao, duas salas de atendimento e vista para a avenida.'),
  (14, 'Apartamento Jardim Europa', 'Rua Itacema, 88, ap. 61', 'Sao Paulo', 'SP', '04530-050', 'Apartment', FALSE, NULL, 3, 3, 142.00, 'Active', 'Apartamento amplo com suite, varanda e duas vagas de garagem.'),
  (15, 'Casa Praia do Gonzaga', 'Rua Bahia, 330', 'Santos', 'SP', '11060-451', 'House', TRUE, 1480000.00, 4, 3, 240.00, 'Active', 'Casa proxima a praia, com jardim, varanda e area de servico independente.'),
  (16, 'Apartamento Estacao Central', 'Rua Barao de Jaguara, 410, ap. 22', 'Campinas', 'SP', '13015-000', 'Apartment', FALSE, NULL, 1, 1, 48.00, 'Active', 'Apartamento pratico perto da estacao, mercado e linhas de onibus.'),
  (17, 'Casa Recanto do Sol', 'Rua dos Geranios, 44', 'Valinhos', 'SP', '13270-330', 'House', FALSE, NULL, 3, 2, 160.00, 'Sold', 'Casa vendida em negociacao concluida. Registro mantido para consulta interna.'),
  (18, 'Sala Comercial Central', 'Rua XV de Novembro, 900, sala 7', 'Jundiai', 'SP', '13201-005', 'Commercial', FALSE, NULL, 0, 1, 61.00, 'Sold', 'Sala comercial vendida. Descricao preservada para historico do cadastro.'),
  (19, 'Casa Antiga do Lago', 'Rua do Lago, 19', 'Sorocaba', 'SP', '18035-120', 'House', FALSE, NULL, 2, 1, 110.00, 'Inactive', 'Cadastro inativo enquanto aguarda avaliacao estrutural do proprietario.'),
  (20, 'Loja Mercado Novo', 'Av. Independencia, 721', 'Campinas', 'SP', '13026-100', 'Commercial', FALSE, NULL, 0, 1, 45.00, 'Inactive', 'Imovel retirado temporariamente da carteira da imobiliaria.'),
  (21, 'Casa Quinta das Arvores', 'Rua dos Jacarandas, 118', 'Jundiai', 'SP', '13209-200', 'House', TRUE, 995000.00, 4, 3, 220.00, 'Active', 'Casa com piscina, varanda coberta, escritorio e garagem para tres veiculos.'),
  (22, 'Apartamento Parque Central', 'Av. Central, 144, ap. 73', 'Sao Jose dos Campos', 'SP', '12243-000', 'Apartment', TRUE, NULL, 2, 2, 91.00, 'Active', 'Apartamento com varanda gourmet, academia no condominio e uma vaga coberta. Imovel anunciado para venda enquanto o preco passa por avaliacao.');

INSERT INTO renters (id, first_name, last_name, email, phone)
VALUES
  (1, 'Mariana', 'Costa', 'mariana.costa@example.com', '+55 19 99111-0101'),
  (2, 'Rafael', 'Almeida', 'rafael.almeida@example.com', '+55 19 99222-0202'),
  (3, 'Beatriz', 'Nogueira', 'beatriz.nogueira@example.com', '+55 11 99333-0303'),
  (4, 'Lucas', 'Ferreira', 'lucas.ferreira@example.com', '+55 19 99444-0404'),
  (5, 'Camila', 'Rocha', 'camila.rocha@example.com', '+55 13 99555-0505'),
  (6, 'Pedro', 'Mendes', 'pedro.mendes@example.com', '+55 15 99666-0606'),
  (7, 'Juliana', 'Barbosa', 'juliana.barbosa@example.com', '+55 11 99777-0707'),
  (8, 'Thiago', 'Cardoso', 'thiago.cardoso@example.com', '+55 12 99888-0808'),
  (9, 'Isabela', 'Ribeiro', 'isabela.ribeiro@example.com', '+55 19 99999-0909'),
  (10, 'Gustavo', 'Araujo', 'gustavo.araujo@example.com', '+55 11 98111-1010'),
  (11, 'Fernanda', 'Lima', 'fernanda.lima@example.com', '+55 13 98222-1111'),
  (12, 'Daniel', 'Pereira', 'daniel.pereira@example.com', '+55 15 98333-1212'),
  (13, 'Larissa', 'Martins', 'larissa.martins@example.com', '+55 19 98444-1313'),
  (14, 'Andre', 'Oliveira', 'andre.oliveira@example.com', '+55 11 98555-1414'),
  (15, 'Paula', 'Souza', 'paula.souza@example.com', '+55 12 98666-1515'),
  (16, 'Henrique', 'Dias', 'henrique.dias@example.com', '+55 19 98777-1616');

INSERT INTO rental_contracts
  (id, property_id, renter_id, start_date, end_date, monthly_rent, status, notes)
VALUES
  (1, 1, 1, DATE_SUB(CURDATE(), INTERVAL 8 MONTH), DATE_ADD(CURDATE(), INTERVAL 4 MONTH), 3900.00, 'Active', 'Imovel segue anunciado para venda durante a locacao.'),
  (2, 2, 2, DATE_SUB(CURDATE(), INTERVAL 5 MONTH), DATE_ADD(CURDATE(), INTERVAL 7 MONTH), 2800.00, 'Active', 'Contrato residencial padrao.'),
  (3, 4, 3, DATE_SUB(CURDATE(), INTERVAL 10 MONTH), DATE_ADD(CURDATE(), INTERVAL 2 MONTH), 5200.00, 'Active', 'Proprietario aceita propostas de compra com aviso previo.'),
  (4, 5, 4, DATE_SUB(CURDATE(), INTERVAL 2 MONTH), DATE_ADD(CURDATE(), INTERVAL 10 MONTH), 2400.00, 'Active', 'Studio mobiliado; vistoria semestral agendada.'),
  (5, 6, 5, DATE_SUB(CURDATE(), INTERVAL 7 MONTH), DATE_ADD(CURDATE(), INTERVAL 5 MONTH), 4100.00, 'Active', 'Casa em condominio, inclui manutencao do jardim.'),
  (6, 8, 6, DATE_SUB(CURDATE(), INTERVAL 11 MONTH), DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 3300.00, 'Active', 'Contrato proximo do vencimento; confirmar interesse na renovacao.'),
  (7, 9, 7, DATE_SUB(CURDATE(), INTERVAL 3 MONTH), DATE_ADD(CURDATE(), INTERVAL 9 MONTH), 4600.00, 'Active', 'Locacao comercial.'),
  (8, 10, 8, DATE_SUB(CURDATE(), INTERVAL 6 MONTH), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 3100.00, 'Active', 'Casa com edicula; verificar calhas antes das chuvas.'),
  (9, 11, 9, DATE_SUB(CURDATE(), INTERVAL 9 MONTH), DATE_ADD(CURDATE(), INTERVAL 3 MONTH), 2950.00, 'Active', 'Renovacao deve ser discutida com antecedencia.'),
  (10, 12, 10, DATE_SUB(CURDATE(), INTERVAL 4 MONTH), DATE_ADD(CURDATE(), INTERVAL 8 MONTH), 4400.00, 'Active', 'Imovel alugado e anunciado para venda.'),
  (11, 13, 11, DATE_SUB(CURDATE(), INTERVAL 12 MONTH), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 5100.00, 'Active', 'Conjunto comercial com contrato vigente.'),
  (12, 14, 12, DATE_SUB(CURDATE(), INTERVAL 1 MONTH), DATE_ADD(CURDATE(), INTERVAL 11 MONTH), 5700.00, 'Active', 'Contrato iniciado recentemente.'),
  (13, 16, 13, DATE_SUB(CURDATE(), INTERVAL 13 MONTH), DATE_SUB(CURDATE(), INTERVAL 1 MONTH), 2100.00, 'Completed', 'Contrato encerrado; unidade aguardando nova destinacao.'),
  (14, 3, 14, DATE_SUB(CURDATE(), INTERVAL 2 YEAR), DATE_SUB(CURDATE(), INTERVAL 1 YEAR), 2600.00, 'Completed', 'Locacao comercial encerrada antes do anuncio de venda.'),
  (15, 15, 15, DATE_SUB(CURDATE(), INTERVAL 1 MONTH), DATE_ADD(CURDATE(), INTERVAL 11 MONTH), 6200.00, 'Cancelled', 'Contrato cancelado durante o periodo de negociacao.'),
  (16, 21, 16, DATE_SUB(CURDATE(), INTERVAL 3 MONTH), DATE_ADD(CURDATE(), INTERVAL 9 MONTH), 4700.00, 'Active', 'Renter recebeu comunicacao de que o imovel esta anunciado para venda.');

INSERT INTO property_tasks
  (id, property_id, title, description, priority, due_date, status)
VALUES
  (1, 1, 'Revisar torneira da cozinha', 'Renter informou um pequeno vazamento na torneira.', 'Medium', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Open'),
  (2, 1, 'Agendar fotos atualizadas', 'Atualizar as fotos do anuncio de venda com o jardim em boas condicoes.', 'Low', DATE_ADD(CURDATE(), INTERVAL 12 DAY), 'Open'),
  (3, 2, 'Confirmar renovacao do contrato', 'Entrar em contato com o renter antes do prazo de renovacao.', 'High', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'In Progress'),
  (4, 3, 'Atualizar fotos da sala', 'Fotografar a sala comercial depois da pintura.', 'Low', DATE_ADD(CURDATE(), INTERVAL 20 DAY), 'Open'),
  (5, 4, 'Enviar aviso sobre visitas', 'Combinar dias e horarios para visitas de compradores com o renter.', 'High', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'Open'),
  (6, 5, 'Verificar controle de acesso', 'Confirmar entrega do controle da garagem ao renter.', 'Medium', DATE_ADD(CURDATE(), INTERVAL 8 DAY), 'Completed'),
  (7, 6, 'Inspecionar aquecedor', 'Renter pediu verificacao preventiva antes do inverno.', 'Medium', DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'In Progress'),
  (8, 7, 'Solicitar levantamento do terreno', 'Obter levantamento atualizado para interessados.', 'Low', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'Open'),
  (9, 8, 'Confirmar interesse em renovacao', 'Contrato termina em breve; confirmar planos do renter.', 'High', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Open'),
  (10, 9, 'Revisar luminarias da loja', 'Checar duas luminarias da vitrine.', 'Low', DATE_ADD(CURDATE(), INTERVAL 18 DAY), 'Completed'),
  (11, 10, 'Limpar calhas', 'Agendar limpeza das calhas antes do periodo de chuva.', 'Medium', DATE_ADD(CURDATE(), INTERVAL 16 DAY), 'Open'),
  (12, 11, 'Solicitar comprovante de seguro', 'Atualizar os documentos do contrato comercial.', 'Medium', DATE_ADD(CURDATE(), INTERVAL 9 DAY), 'In Progress'),
  (13, 12, 'Revisar informacoes do anuncio', 'Conferir area util e dados das placas solares.', 'Low', DATE_ADD(CURDATE(), INTERVAL 21 DAY), 'Open'),
  (14, 13, 'Agendar visita tecnica', 'Validar a instalacao eletrica antes de novas visitas.', 'Medium', DATE_ADD(CURDATE(), INTERVAL 11 DAY), 'Open'),
  (15, 14, 'Confirmar cadastro da garagem', 'Verificar cadastro da placa do veiculo na portaria.', 'Low', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Completed'),
  (16, 15, 'Preparar material de venda', 'Separar fotos externas e documentos do imovel.', 'Medium', DATE_ADD(CURDATE(), INTERVAL 13 DAY), 'Open'),
  (17, 16, 'Marcar vistoria de saida', 'Registrar condicao do apartamento apos encerramento da locacao.', 'High', DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'In Progress'),
  (18, 17, 'Arquivar documentos da venda', 'Salvar documentos finais no arquivo interno.', 'Low', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Completed'),
  (19, 19, 'Solicitar avaliacao estrutural', 'Aguardar laudo antes de reativar o cadastro.', 'High', DATE_ADD(CURDATE(), INTERVAL 6 DAY), 'Open'),
  (20, 20, 'Revisar cadastro inativo', 'Confirmar com o proprietario se o imovel voltara para a carteira.', 'Low', DATE_ADD(CURDATE(), INTERVAL 45 DAY), 'Open'),
  (21, 21, 'Organizar horario de visita', 'Coordenar possiveis visitas de venda com o renter atual.', 'High', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Open'),
  (22, 22, 'Verificar exaustor da cozinha', 'Incluir verificacao na proxima visita de manutencao.', 'Medium', DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'In Progress'),
  (23, 2, 'Inspecao preventiva do ar-condicionado', 'Agendar limpeza do filtro com autorizacao do renter.', 'Low', DATE_ADD(CURDATE(), INTERVAL 28 DAY), 'Open'),
  (24, 12, 'Conferir conta de energia solar', 'Solicitar leitura recente para completar informacoes do anuncio.', 'Low', DATE_ADD(CURDATE(), INTERVAL 35 DAY), 'Completed');
