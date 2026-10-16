-- Permite cadastrar um imóvel à venda antes de informar o preço.
USE imobiliaria;

ALTER TABLE properties
  MODIFY postal_code VARCHAR(10) NOT NULL DEFAULT '',
  DROP CHECK chk_property_sale_price,
  ADD CONSTRAINT chk_property_sale_price CHECK (
    (is_for_sale = TRUE AND (sale_price IS NULL OR sale_price >= 0))
    OR (is_for_sale = FALSE AND sale_price IS NULL)
  );
