const mysql = require("mysql2/promise");

async function verifyTriggers() {
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Nandini@01",
    database: "waste_management"
  });

  console.log("========================================");
  console.log("   TRIGGER VERIFICATION REPORT");
  console.log("========================================\n");

  // ── SETUP: pick a real bin and vehicle ──────────────────────────
  const [bins] = await db.query("SELECT * FROM waste_bin LIMIT 1");
  const [vehicles] = await db.query("SELECT vehicle_id FROM collection_vehicle LIMIT 1");

  if (!bins.length || !vehicles.length) {
    console.log("SKIP: Need at least 1 bin and 1 vehicle in DB.");
    await db.end(); return;
  }

  const bin = bins[0];
  const vehicleId = vehicles[0].vehicle_id;
  const binId = bin.bin_id;
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  console.log(`Using bin_id=${binId}, vehicle_id=${vehicleId}`);
  console.log(`Today: ${today} | Tomorrow: ${tomorrow}\n`);

  // ── Cleanup any existing test data ──────────────────────────────
  await db.query(
    "DELETE FROM collection_event WHERE bin_id=? AND vehicle_id=? AND DATE(collected_time)=?",
    [binId, vehicleId, today]
  );
  await db.query(
    "DELETE FROM collection_schedule WHERE bin_id=? AND vehicle_id=? AND DATE(schedule_time) IN (?,?)",
    [binId, vehicleId, today, tomorrow]
  );
  await db.query("UPDATE waste_bin SET status='Empty' WHERE bin_id=?", [binId]);
  console.log("Cleanup done.\n");

  // ════════════════════════════════════════════════════════════════
  // TEST 1: TRIGGER - BEFORE_INSERT_COLLECTION_SCHEDULE
  //   a) Auto-sets status to 'Active'
  //   b) Blocks duplicate schedule same bin+vehicle+day
  // ════════════════════════════════════════════════════════════════
  console.log("── TEST 1: BEFORE_INSERT_COLLECTION_SCHEDULE ──────────");

  // 1a: Insert with no status — trigger should set it to 'Active'
  const [maxId] = await db.query("SELECT COALESCE(MAX(schedule_id),0)+1 AS nid FROM collection_schedule");
  const schedId = maxId[0].nid;

  try {
    await db.query(
      "INSERT INTO collection_schedule (schedule_id, bin_id, vehicle_id, schedule_time, schedule_status) VALUES (?,?,?,NOW(),'')",
      [schedId, binId, vehicleId]
    );
    const [sched] = await db.query("SELECT schedule_status FROM collection_schedule WHERE schedule_id=?", [schedId]);
    const status = sched[0]?.schedule_status;
    console.log(`  1a) Auto-set status = '${status}'  → ${status === 'Active' ? '✅ PASS' : '❌ FAIL (expected Active)'}`);
  } catch (e) {
    console.log(`  1a) Insert failed: ${e.sqlMessage || e.message}`);
  }

  // 1b: Try inserting duplicate (same bin+vehicle+today) — should throw error
  try {
    const [maxId2] = await db.query("SELECT COALESCE(MAX(schedule_id),0)+1 AS nid FROM collection_schedule");
    await db.query(
      "INSERT INTO collection_schedule (schedule_id, bin_id, vehicle_id, schedule_time, schedule_status) VALUES (?,?,?,NOW(),'')",
      [maxId2[0].nid, binId, vehicleId]
    );
    console.log("  1b) Duplicate insert ALLOWED  → ❌ FAIL (should have been blocked)");
  } catch (e) {
    const msg = e.sqlMessage || e.message;
    const blocked = msg.includes("Schedule already exists");
    console.log(`  1b) Duplicate blocked: "${msg}"  → ${blocked ? '✅ PASS' : '⚠️  Blocked but wrong message'}`);
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 2: TRIGGER - AFTER_INSERT_COLLECTION_EVENT
  //   → marks schedule 'Completed', sets bin status = 'Empty'
  // ════════════════════════════════════════════════════════════════
  console.log("\n── TEST 2: AFTER_INSERT_COLLECTION_EVENT ──────────────");

  // Set bin to Full first
  await db.query("UPDATE waste_bin SET status='Full' WHERE bin_id=?", [binId]);

  // Insert a collection event
  try {
    await db.query(
      "INSERT INTO collection_event (bin_id, vehicle_id, collected_time, collected_quantity) VALUES (?,?,NOW(),50)",
      [binId, vehicleId]
    );
    console.log("  Inserted collection_event.");

    // Check schedule status
    const [sched] = await db.query(
      "SELECT schedule_status FROM collection_schedule WHERE bin_id=? AND vehicle_id=? AND DATE(schedule_time)=? LIMIT 1",
      [binId, vehicleId, today]
    );
    const schedStatus = sched[0]?.schedule_status;
    console.log(`  2a) Schedule status = '${schedStatus}'  → ${schedStatus === 'Completed' ? '✅ PASS' : '❌ FAIL (expected Completed)'}`);

    // Check bin status
    const [binRow] = await db.query("SELECT status FROM waste_bin WHERE bin_id=?", [binId]);
    const binStatus = binRow[0]?.status;
    console.log(`  2b) Bin status = '${binStatus}'  → ${binStatus === 'Empty' ? '✅ PASS' : '❌ FAIL (expected Empty)'}`);

  } catch (e) {
    console.log(`  2) collection_event insert FAILED: ${e.sqlMessage || e.message}`);
  }

  // ════════════════════════════════════════════════════════════════
  // TEST 3: TRIGGER - AFTER_UPDATE_WASTE_BIN
  //   → when bin becomes 'Full', auto-insert schedule for tomorrow
  // ════════════════════════════════════════════════════════════════
  console.log("\n── TEST 3: AFTER_UPDATE_WASTE_BIN ─────────────────────");

  // First clear tomorrow's schedule so trigger has room to insert
  await db.query(
    "DELETE FROM collection_schedule WHERE bin_id=? AND DATE(schedule_time)=?",
    [binId, tomorrow]
  );

  // Set bin to Empty (so transition to Full fires)
  await db.query("UPDATE waste_bin SET status='Empty' WHERE bin_id=?", [binId]);

  // Now set to Full — trigger should auto-create tomorrow's schedule
  try {
    await db.query("UPDATE waste_bin SET status='Full' WHERE bin_id=?", [binId]);

    const [nextSched] = await db.query(
      "SELECT * FROM collection_schedule WHERE bin_id=? AND DATE(schedule_time)=? LIMIT 1",
      [binId, tomorrow]
    );

    if (nextSched.length > 0) {
      console.log(`  3a) Auto-schedule for tomorrow created! schedule_id=${nextSched[0].schedule_id}, vehicle_id=${nextSched[0].vehicle_id}, status=${nextSched[0].schedule_status}  → ✅ PASS`);
    } else {
      console.log("  3a) No schedule created for tomorrow  → ❌ FAIL");
      // Check if vehicle table has entries
      const [v] = await db.query("SELECT COUNT(*) AS cnt FROM collection_vehicle");
      console.log(`      (vehicles in DB: ${v[0].cnt})`);
    }
  } catch (e) {
    console.log(`  3) AFTER_UPDATE_WASTE_BIN trigger error: ${e.sqlMessage || e.message}`);
  }

  console.log("\n========================================");
  console.log("   VERIFICATION COMPLETE");
  console.log("========================================");

  await db.end();
  process.exit(0);
}

verifyTriggers().catch(e => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
