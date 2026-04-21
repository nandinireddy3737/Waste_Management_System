/**
 * run_triggers.js
 * Creates both advanced SIGNAL triggers in the waste_management database.
 * Run once with: node run_triggers.js
 */

const mysql = require("mysql2/promise");

const DB = {
  host: "localhost",
  user: "root",
  password: "Nandini@01",
  database: "waste_management",
  multipleStatements: true   // needed to run DROP + CREATE in the same call if desired
};

const TRIGGERS = [
  // ── TRIGGER 1: Prevent Vehicle Overload ───────────────────────────────────
  {
    name: "trigger_prevent_vehicle_overload",
    drop: "DROP TRIGGER IF EXISTS trigger_prevent_vehicle_overload",
    create: `
CREATE TRIGGER trigger_prevent_vehicle_overload
BEFORE INSERT ON COLLECTION_SCHEDULE
FOR EACH ROW
BEGIN
    DECLARE task_count INT DEFAULT 0;

    SELECT COUNT(*) INTO task_count
    FROM COLLECTION_SCHEDULE
    WHERE vehicle_id = NEW.vehicle_id
      AND DATE(schedule_time) = DATE(NEW.schedule_time);

    IF task_count >= 5 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Vehicle overload: Cannot assign more than 5 tasks per day';
    END IF;
END`
  },
  // ── TRIGGER 2: Prevent Scheduling Empty Bins ─────────────────────────────
  {
    name: "trigger_prevent_empty_bin_schedule",
    drop: "DROP TRIGGER IF EXISTS trigger_prevent_empty_bin_schedule",
    create: `
CREATE TRIGGER trigger_prevent_empty_bin_schedule
BEFORE INSERT ON COLLECTION_SCHEDULE
FOR EACH ROW
BEGIN
    DECLARE bin_status VARCHAR(20);

    SELECT status INTO bin_status
    FROM WASTE_BIN
    WHERE bin_id = NEW.bin_id;

    IF bin_status = 'Empty' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot schedule collection for an empty bin';
    END IF;
END`
  }
];

(async () => {
  let conn;
  try {
    conn = await mysql.createConnection(DB);
    console.log("✅ Connected to waste_management database.\n");

    for (const t of TRIGGERS) {
      // Drop if exists
      await conn.query(t.drop);
      console.log(`🗑  Dropped (if existed): ${t.name}`);

      // Create fresh
      await conn.query(t.create);
      console.log(`✅ Created trigger: ${t.name}`);
    }

    console.log("\n─────────────────────────────────────────────────────");
    console.log("📋 VERIFICATION — Active Triggers in waste_management:");
    const [rows] = await conn.query(`
      SELECT 
        TRIGGER_NAME          AS \`Trigger\`,
        EVENT_MANIPULATION    AS \`Fires On\`,
        EVENT_OBJECT_TABLE    AS \`Table\`,
        ACTION_TIMING         AS \`When\`
      FROM INFORMATION_SCHEMA.TRIGGERS
      WHERE TRIGGER_SCHEMA = 'waste_management'
        AND TRIGGER_NAME IN (
          'trigger_prevent_vehicle_overload',
          'trigger_prevent_empty_bin_schedule'
        )
    `);

    if (rows.length === 0) {
      console.warn("⚠️  No triggers found — check database permissions.");
    } else {
      console.table(rows);
    }

    console.log("─────────────────────────────────────────────────────");
    console.log("✅ All done. Both triggers are active.\n");

  } catch (err) {
    console.error("❌ Error:", err.sqlMessage || err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
})();
