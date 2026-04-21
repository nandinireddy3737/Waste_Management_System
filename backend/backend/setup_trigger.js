const mysql = require("mysql2/promise");

async function setupAdvancedSystem() {
  const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Nandini@01",
    database: "waste_management",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true // Required for creating procedures and multiple drops
  });

  const connection = await pool.getConnection();

  try {
    console.log("--- 1. CLEANING UP OLD TRIGGERS & PROCEDURES ---");
    const oldTriggers = [
      "after_collection_event", "prevent_duplicate_schedule", "set_schedule_active",
      "trg_auto_schedule_on_full", "prevent_duplicate_worker_assignment",
      "BEFORE_INSERT_COLLECTION_SCHEDULE", "AFTER_INSERT_COLLECTION_EVENT", "AFTER_UPDATE_WASTE_BIN"
    ];
    for (const name of oldTriggers) {
      await connection.query(`DROP TRIGGER IF EXISTS \`${name}\``);
    }

    const procedures = [
      "get_zone_wise_collection", "get_vehicle_efficiency", 
      "get_worker_utilization", "get_system_summary"
    ];
    for (const name of procedures) {
      await connection.query(`DROP PROCEDURE IF EXISTS \`${name}\``);
    }
    console.log("Cleanup complete.\n");

    console.log("--- 2. CREATING ADVANCED TRIGGERS ---");

    // TRIGGER 1: INTELLIGENT AUTO COLLECTION SCHEDULER
    // Logic: Auto-assign vehicle with workers and min workload when bin is 'Full'
    await connection.query(`
      CREATE TRIGGER AFTER_UPDATE_WASTE_BIN_SMART
      AFTER UPDATE ON waste_bin
      FOR EACH ROW
      BEGIN
          DECLARE best_vehicle_id INT DEFAULT NULL;
          
          IF NEW.status = 'Full' AND (OLD.status IS NULL OR OLD.status != 'Full') THEN
              -- Find vehicle that:
              -- 1. Has at least one worker assigned
              -- 2. Has the minimum existing schedules for tomorrow
              SELECT v.vehicle_id INTO best_vehicle_id
              FROM collection_vehicle v
              INNER JOIN vehicle_worker_assignment vwa ON v.vehicle_id = vwa.vehicle_id
              LEFT JOIN collection_schedule cs ON v.vehicle_id = cs.vehicle_id 
                   AND DATE(cs.schedule_time) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
              GROUP BY v.vehicle_id
              ORDER BY COUNT(cs.schedule_id) ASC
              LIMIT 1;

              -- Only insert if a qualified vehicle with workers exists and no duplicate schedule exists
              IF best_vehicle_id IS NOT NULL AND NOT EXISTS (
                  SELECT 1 FROM collection_schedule 
                  WHERE bin_id = NEW.bin_id 
                    AND DATE(schedule_time) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
              ) THEN
                  INSERT INTO collection_schedule (bin_id, vehicle_id, schedule_time, schedule_status)
                  VALUES (NEW.bin_id, best_vehicle_id, DATE_ADD(NOW(), INTERVAL 1 DAY), 'Scheduled');
              END IF;
          END IF;
      END;
    `);
    console.log("✓ Created: AFTER_UPDATE_WASTE_BIN_SMART");

    // TRIGGER 2 & 3: SMART STATUS & WORKER VALIDATION
    // Logic: Validate worker assignment and auto-set status based on date
    await connection.query(`
      CREATE TRIGGER BEFORE_INSERT_COLLECTION_SCHEDULE_ADVANCED
      BEFORE INSERT ON collection_schedule
      FOR EACH ROW
      BEGIN
          DECLARE worker_count INT DEFAULT 0;
          
          -- Check if vehicle has workers assigned
          SELECT COUNT(*) INTO worker_count 
          FROM vehicle_worker_assignment 
          WHERE vehicle_id = NEW.vehicle_id;

          IF worker_count = 0 THEN
              -- Safely prevent insertion if no workers assigned
              SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot schedule: No workers assigned to this vehicle';
          END IF;

          -- Intelligent Status Setting
          IF DATE(NEW.schedule_time) > CURDATE() THEN
              SET NEW.schedule_status = 'Scheduled';
          ELSEIF DATE(NEW.schedule_time) = CURDATE() THEN
              SET NEW.schedule_status = 'Active';
          ELSE
              SET NEW.schedule_status = 'Completed';
          END IF;
      END;
    `);
    console.log("✓ Created: BEFORE_INSERT_COLLECTION_SCHEDULE_ADVANCED");

    // TRIGGER 4: AUTO BIN RESET AFTER COLLECTION
    // Logic: If schedule marked 'Completed', reset bin to 'Empty'
    await connection.query(`
      CREATE TRIGGER AFTER_UPDATE_SCHEDULE_RESET_BIN
      AFTER UPDATE ON collection_schedule
      FOR EACH ROW
      BEGIN
          IF NEW.schedule_status = 'Completed' AND OLD.schedule_status != 'Completed' THEN
              UPDATE waste_bin 
              SET status = 'Empty' 
              WHERE bin_id = NEW.bin_id;
          END IF;
      END;
    `);
    console.log("✓ Created: AFTER_UPDATE_SCHEDULE_RESET_BIN");

    console.log("\n--- 3. CREATING STORED PROCEDURES ---");

    // PROC 1: Zone-wise schedules
    await connection.query(`
      CREATE PROCEDURE get_zone_wise_collection(IN p_zone_id INT)
      BEGIN
          SELECT cs.*, wb.location, wb.waste_type
          FROM collection_schedule cs
          JOIN waste_bin wb ON cs.bin_id = wb.bin_id
          WHERE wb.zone_id = p_zone_id;
      END;
    `);

    // PROC 2: Vehicle Efficiency
    await connection.query(`
      CREATE PROCEDURE get_vehicle_efficiency(IN p_vehicle_id INT)
      BEGIN
          SELECT vehicle_id, 
                 COUNT(*) as total_tasks,
                 SUM(CASE WHEN schedule_status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks
          FROM collection_schedule
          WHERE vehicle_id = p_vehicle_id
          GROUP BY vehicle_id;
      END;
    `);

    // PROC 3: Worker Utilization
    await connection.query(`
      CREATE PROCEDURE get_worker_utilization(IN p_worker_id INT)
      BEGIN
          SELECT w.worker_name, COUNT(cs.schedule_id) as assigned_tasks
          FROM worker w
          JOIN vehicle_worker_assignment vwa ON w.worker_id = vwa.worker_id
          JOIN collection_schedule cs ON vwa.vehicle_id = cs.vehicle_id
          WHERE w.worker_id = p_worker_id
          GROUP BY w.worker_id;
      END;
    `);

    // PROC 4: System Summary
    await connection.query(`
      CREATE PROCEDURE get_system_summary()
      BEGIN
          SELECT 
            (SELECT COUNT(*) FROM waste_bin) as total_bins,
            (SELECT COUNT(*) FROM waste_bin WHERE status = 'Full') as full_bins,
            (SELECT COUNT(*) FROM collection_schedule WHERE schedule_status = 'Active') as active_schedules,
            (SELECT COUNT(*) FROM collection_vehicle) as total_vehicles;
      END;
    `);
    console.log("✓ All Procedures Created.\n");

    console.log("--- SYSTEM READY: Advanced SMART triggers & procedures active ---");

  } catch (err) {
    console.error("FATAL ERROR setting up advanced logic:", err.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

setupAdvancedSystem();
