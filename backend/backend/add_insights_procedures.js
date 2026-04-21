const mysql = require("mysql2/promise");

async function addInsightsProcedures() {
  const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Nandini@01",
    database: "waste_management",
    multipleStatements: true
  });

  const connection = await pool.getConnection();

  try {
    console.log("--- ADDING NEW INSIGHTS PROCEDURES ---");

    // 1. get_priority_bins
    await connection.query(`DROP PROCEDURE IF EXISTS get_priority_bins`);
    await connection.query(`
      CREATE PROCEDURE get_priority_bins()
      BEGIN
          SELECT bin_id, location, zone_id
          FROM WASTE_BIN
          WHERE status = 'Full'
          AND bin_id NOT IN (
              SELECT bin_id 
              FROM COLLECTION_SCHEDULE 
              WHERE schedule_status IN ('Active', 'Scheduled')
          );
      END
    `);
    console.log("✓ Created: get_priority_bins");

    // 2. get_daily_collection_report
    await connection.query(`DROP PROCEDURE IF EXISTS get_daily_collection_report`);
    await connection.query(`
      CREATE PROCEDURE get_daily_collection_report()
      BEGIN
          SELECT 
              COUNT(*) as total_tasks_today,
              SUM(CASE WHEN schedule_status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
              SUM(CASE WHEN schedule_status IN ('Pending', 'Active', 'Scheduled') THEN 1 ELSE 0 END) as pending_tasks
          FROM COLLECTION_SCHEDULE
          WHERE DATE(schedule_time) = CURDATE();
      END
    `);
    console.log("✓ Created: get_daily_collection_report");

    // 3. get_overloaded_vehicles
    await connection.query(`DROP PROCEDURE IF EXISTS get_overloaded_vehicles`);
    await connection.query(`
      CREATE PROCEDURE get_overloaded_vehicles()
      BEGIN
          SELECT vehicle_id, COUNT(*) as total_tasks
          FROM COLLECTION_SCHEDULE
          GROUP BY vehicle_id
          HAVING total_tasks > 5;
      END
    `);
    console.log("✓ Created: get_overloaded_vehicles");

    // 4. get_idle_workers
    await connection.query(`DROP PROCEDURE IF EXISTS get_idle_workers`);
    await connection.query(`
      CREATE PROCEDURE get_idle_workers()
      BEGIN
          SELECT vwa.worker_id, vwa.vehicle_id
          FROM VEHICLE_WORKER_ASSIGNMENT vwa
          WHERE vwa.vehicle_id NOT IN (
              SELECT vehicle_id 
              FROM COLLECTION_SCHEDULE
          );
      END
    `);
    console.log("✓ Created: get_idle_workers");

    console.log("\n--- INSIGHTS PROCEDURES READY ---");
  } catch (err) {
    console.error("Error adding insights procedures:", err.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

addInsightsProcedures();
