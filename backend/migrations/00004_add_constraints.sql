-- +goose Up
-- +goose StatementBegin

-- Добавляем NOT NULL constraints для обязательных полей
ALTER TABLE users 
    ALTER COLUMN email SET NOT NULL,
    ALTER COLUMN password SET NOT NULL,
    ALTER COLUMN role_id SET NOT NULL;

ALTER TABLE buildings 
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN address SET NOT NULL,
    ALTER COLUMN city SET NOT NULL,
    ALTER COLUMN cost_per_day SET NOT NULL,
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN description SET NOT NULL;

ALTER TABLE rent 
    ALTER COLUMN start_date SET NOT NULL,
    ALTER COLUMN end_date SET NOT NULL,
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN building_id SET NOT NULL;
    
-- total_amount будет иметь NOT NULL после создания триггера, который всегда его заполняет
-- Но сначала создадим триггер, чтобы он мог работать с NULL значениями

-- CHECK constraint: описание должно быть от 10 до 100 символов
ALTER TABLE buildings 
    ADD CONSTRAINT buildings_description_length_check 
    CHECK (char_length(description) >= 10 AND char_length(description) <= 100);

-- CHECK constraint: цена должна быть положительной
ALTER TABLE buildings 
    ADD CONSTRAINT buildings_cost_per_day_positive_check 
    CHECK (cost_per_day > 0);

-- CHECK constraint: этаж должен быть положительным, если указан
ALTER TABLE buildings 
    ADD CONSTRAINT buildings_floor_positive_check 
    CHECK (floor IS NULL OR floor > 0);

-- CHECK constraint: дата окончания должна быть позже даты начала
ALTER TABLE rent 
    ADD CONSTRAINT rent_dates_check 
    CHECK (end_date > start_date);

-- CHECK constraint: сумма должна быть положительной
ALTER TABLE rent 
    ADD CONSTRAINT rent_total_amount_positive_check 
    CHECK (total_amount > 0);

-- Создаем функцию для проверки пересечения дат при бронировании
CREATE OR REPLACE FUNCTION check_rent_overlap()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM rent
        WHERE building_id = NEW.building_id
          AND rent_id != COALESCE(NEW.rent_id, 0)
          AND NOT (NEW.end_date < start_date OR NEW.start_date > end_date)
    ) THEN
        RAISE EXCEPTION 'На выбранные даты помещение уже занято';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для проверки пересечения дат
CREATE TRIGGER rent_overlap_trigger
    BEFORE INSERT OR UPDATE ON rent
    FOR EACH ROW
    EXECUTE FUNCTION check_rent_overlap();

-- Создаем функцию для автоматического расчета total_amount
CREATE OR REPLACE FUNCTION calculate_rent_total()
RETURNS TRIGGER AS $$
DECLARE
    price_per_month numeric;
    days_count integer;
    months_count integer;
BEGIN
    -- Если total_amount уже указан, не пересчитываем
    IF NEW.total_amount IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Получаем цену за месяц (cost_per_day хранится как цена за месяц)
    SELECT cost_per_day INTO price_per_month
    FROM buildings
    WHERE building_id = NEW.building_id;
    
    IF price_per_month IS NULL THEN
        RAISE EXCEPTION 'Помещение не найдено';
    END IF;
    
    -- Вычисляем количество дней
    days_count := (NEW.end_date - NEW.start_date);
    
    -- Округляем количество месяцев вверх, считая 30 дней в месяце
    months_count := (days_count + 29) / 30;
    IF months_count < 1 THEN
        months_count := 1;
    END IF;
    
    -- Рассчитываем общую сумму
    NEW.total_amount := price_per_month * months_count;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического расчета total_amount
CREATE TRIGGER calculate_rent_total_trigger
    BEFORE INSERT OR UPDATE ON rent
    FOR EACH ROW
    EXECUTE FUNCTION calculate_rent_total();

-- Теперь можно установить NOT NULL для total_amount, так как триггер всегда его заполняет
ALTER TABLE rent 
    ALTER COLUMN total_amount SET NOT NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Удаляем триггеры
DROP TRIGGER IF EXISTS calculate_rent_total_trigger ON rent;
DROP TRIGGER IF EXISTS rent_overlap_trigger ON rent;

-- Удаляем функции
DROP FUNCTION IF EXISTS calculate_rent_total();
DROP FUNCTION IF EXISTS check_rent_overlap();

-- Удаляем CHECK constraints
ALTER TABLE rent DROP CONSTRAINT IF EXISTS rent_total_amount_positive_check;
ALTER TABLE rent DROP CONSTRAINT IF EXISTS rent_dates_check;
ALTER TABLE buildings DROP CONSTRAINT IF EXISTS buildings_floor_positive_check;
ALTER TABLE buildings DROP CONSTRAINT IF EXISTS buildings_cost_per_day_positive_check;
ALTER TABLE buildings DROP CONSTRAINT IF EXISTS buildings_description_length_check;

-- Удаляем NOT NULL constraints (PostgreSQL не поддерживает прямую отмену NOT NULL, 
-- но это нормально для rollback миграции)
ALTER TABLE rent 
    ALTER COLUMN building_id DROP NOT NULL,
    ALTER COLUMN user_id DROP NOT NULL,
    ALTER COLUMN total_amount DROP NOT NULL,
    ALTER COLUMN end_date DROP NOT NULL,
    ALTER COLUMN start_date DROP NOT NULL;

ALTER TABLE buildings 
    ALTER COLUMN description DROP NOT NULL,
    ALTER COLUMN user_id DROP NOT NULL,
    ALTER COLUMN cost_per_day DROP NOT NULL,
    ALTER COLUMN city DROP NOT NULL,
    ALTER COLUMN address DROP NOT NULL,
    ALTER COLUMN name DROP NOT NULL;

ALTER TABLE users 
    ALTER COLUMN role_id DROP NOT NULL,
    ALTER COLUMN password DROP NOT NULL,
    ALTER COLUMN email DROP NOT NULL;

-- +goose StatementEnd

