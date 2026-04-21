-- ============================================================
-- ADVANCED MySQL TRIGGERS WITH SIGNAL EXCEPTION HANDLING
-- Waste Management System
-- Created: 2026-04-02
-- ============================================================
-- IMPORTANT: Only ADDING new triggers — no existing triggers or tables are modified.
-- Run this file once against the `waste_management` database.
-- ============================================================

USE waste_management;

-- ============================================================
-- TRIGGER 1: Prevent Vehicle Overload (Smart Workload Control)
-- ============================================================
-- Objective: Prevent assigning a vehicle to more than 5 schedules
--            on the same calendar day.
-- Fires:     BEFORE INSERT on COLLECTION_SCHEDULE
-- Signal:    SQLSTATE '45000' — user-defined exception
-- ============================================================

DROP TRIGGER IF EXISTS trigger_prevent_vehicle_overload;

DELIMITER $$

CREATE TRIGGER trigger_prevent_vehicle_overload
BEFORE INSERT ON COLLECTION_SCHEDULE
FOR EACH ROW
BEGIN
    DECLARE task_count INT DEFAULT 0;

    -- Count existing schedules for the same vehicle on the same day
    SELECT COUNT(*) INTO task_count
    FROM COLLECTION_SCHEDULE
    WHERE vehicle_id = NEW.vehicle_id
      AND DATE(schedule_time) = DATE(NEW.schedule_time);

    IF task_count >= 5 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Vehicle overload: Cannot assign more than 5 tasks per day';
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- TRIGGER 2: Prevent Scheduling for Already Empty Bins
-- ============================================================
-- Objective: Prevent inserting a collection schedule for a bin
--            whose current status is 'Empty' (wasteful operation).
-- Fires:     BEFORE INSERT on COLLECTION_SCHEDULE
-- Signal:    SQLSTATE '45000' — user-defined exception
-- ============================================================

DROP TRIGGER IF EXISTS trigger_prevent_empty_bin_schedule;

DELIMITER $$

CREATE TRIGGER trigger_prevent_empty_bin_schedule
BEFORE INSERT ON COLLECTION_SCHEDULE
FOR EACH ROW
BEGIN
    DECLARE bin_status VARCHAR(20);

    -- Fetch the current status of the bin being scheduled
    SELECT status INTO bin_status
    FROM WASTE_BIN
    WHERE bin_id = NEW.bin_id;

    IF bin_status = 'Empty' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot schedule collection for an empty bin';
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- VERIFICATION: Confirm both triggers exist
-- ============================================================

SELECT 
    TRIGGER_NAME,
    EVENT_MANIPULATION AS `FIRES ON`,
    EVENT_OBJECT_TABLE AS `TABLE`,
    ACTION_TIMING AS `TIMING`
FROM INFORMATION_SCHEMA.TRIGGERS
WHERE TRIGGER_SCHEMA = 'waste_management'
  AND TRIGGER_NAME IN (
        'trigger_prevent_vehicle_overload',
        'trigger_prevent_empty_bin_schedule'
  );
