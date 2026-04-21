const mysql = require("mysql2/promise");
const fs = require("fs");

const DB = {
  host: "localhost",
  user: "root",
  password: "Nandini@01",
  database: "waste_management",
};

let conn;
let log = "";
function print(msg) { log += msg + "\n"; console.log(msg); }

async function run() {
  conn = await mysql.createConnection(DB);
  print("Connected.");

  const [[existingZone]]    = await conn.query("SELECT zone_id FROM CITY_ZONE LIMIT 1");
  const [[existingVehicle]] = await conn.query("SELECT vehicle_id FROM COLLECTION_VEHICLE LIMIT 1");
  const zoneId    = existingZone.zone_id;
  const vehicleId = existingVehicle.vehicle_id;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const FUTURE_DATE = tomorrow.toISOString().slice(0, 10);

  print("Using zone=" + zoneId + ", vehicle=" + vehicleId + ", date=" + FUTURE_DATE);

  const [[maxBin]] = await conn.query("SELECT COALESCE(MAX(bin_id), 9000) + 100 AS next FROM WASTE_BIN");
  const [[maxSch]] = await conn.query("SELECT COALESCE(MAX(schedule_id), 9000) + 100 AS next FROM COLLECTION_SCHEDULE");

  const BIN_EMPTY  = maxBin.next;
  // We need 6 separate Full bins to avoid the "same bin same day" existing trigger
  const BIN_FULL_BASE = maxBin.next + 1;
  const SCH_BASE   = maxSch.next;
  const SCH_EMPTY  = maxSch.next + 10;

  // Create the empty test bin
  await conn.query("INSERT IGNORE INTO WASTE_BIN (bin_id, zone_id, location, capacity, waste_type, status) VALUES (?, ?, 'TrigTestEmpty', 100, 'General', 'Empty')", [BIN_EMPTY, zoneId]);

  // Create 6 separate Full bins (to avoid existing per-bin-per-day trigger)
  for (let i = 0; i < 6; i++) {
    await conn.query("INSERT IGNORE INTO WASTE_BIN (bin_id, zone_id, location, capacity, waste_type, status) VALUES (?, ?, ?, 100, 'General', 'Full')", [BIN_FULL_BASE + i, zoneId, "TrigTestFull" + (i + 1)]);
  }

  let passCount = 0;

  // TEST 1
  print("\n--- TEST 1: Schedule for an Empty Bin (should FAIL) ---");
  try {
    await conn.query("INSERT INTO COLLECTION_SCHEDULE (schedule_id, bin_id, vehicle_id, schedule_time, schedule_status) VALUES (?, ?, ?, ?, 'Scheduled')", [SCH_EMPTY, BIN_EMPTY, vehicleId, FUTURE_DATE + " 08:00:00"]);
    print("FAIL - Insert succeeded (trigger did NOT fire)");
  } catch (err) {
    if (err.sqlMessage && err.sqlMessage.toLowerCase().includes("empty bin")) {
      print("PASS - Trigger fired: " + err.sqlMessage);
      passCount++;
    } else {
      print("UNEXPECTED ERROR: " + (err.sqlMessage || err.message));
    }
  }

  // TEST 2 - Use different bins for each schedule to avoid same-bin-per-day trigger
  print("\n--- TEST 2: Vehicle Overload >5 schedules/day (6th should FAIL) ---");
  let insertedCount = 0;
  for (let i = 0; i < 5; i++) {
    const hour = (8 + i).toString().padStart(2, '0');
    try {
      await conn.query("INSERT INTO COLLECTION_SCHEDULE (schedule_id, bin_id, vehicle_id, schedule_time, schedule_status) VALUES (?, ?, ?, ?, 'Scheduled')", [SCH_BASE + i, BIN_FULL_BASE + i, vehicleId, FUTURE_DATE + " " + hour + ":00:00"]);
      insertedCount++;
      print("  Schedule " + insertedCount + "/5 inserted (id=" + (SCH_BASE + i) + ", bin=" + (BIN_FULL_BASE + i) + ")");
    } catch (e) {
      print("  Schedule " + (i + 1) + " failed: " + (e.sqlMessage || e.message));
    }
  }
  print("  " + insertedCount + " of 5 schedules inserted. Attempting 6th...");

  try {
    await conn.query("INSERT INTO COLLECTION_SCHEDULE (schedule_id, bin_id, vehicle_id, schedule_time, schedule_status) VALUES (?, ?, ?, ?, 'Scheduled')", [SCH_BASE + 5, BIN_FULL_BASE + 5, vehicleId, FUTURE_DATE + " 14:00:00"]);
    print("FAIL - 6th insert succeeded (trigger did NOT fire)");
  } catch (err) {
    if (err.sqlMessage && err.sqlMessage.toLowerCase().includes("overload")) {
      print("PASS - Trigger fired: " + err.sqlMessage);
      passCount++;
    } else {
      print("UNEXPECTED ERROR: " + (err.sqlMessage || err.message));
    }
  }

  // Cleanup
  print("\n--- Cleanup ---");
  for (let i = 0; i <= 5; i++) await conn.query("DELETE FROM COLLECTION_SCHEDULE WHERE schedule_id = ?", [SCH_BASE + i]);
  await conn.query("DELETE FROM COLLECTION_SCHEDULE WHERE schedule_id = ?", [SCH_EMPTY]);
  await conn.query("DELETE FROM WASTE_BIN WHERE bin_id = ?", [BIN_EMPTY]);
  for (let i = 0; i < 6; i++) await conn.query("DELETE FROM WASTE_BIN WHERE bin_id = ?", [BIN_FULL_BASE + i]);
  print("Test rows cleaned up.");

  print("\n=== RESULTS: " + passCount + "/2 tests passed ===");
  if (passCount === 2) print("Both SIGNAL triggers are working correctly!");
  else print("Some tests failed - review above.");

  fs.writeFileSync("_test_output.txt", log, "utf8");
}

run()
  .catch(err => { print("Fatal: " + err.message); fs.writeFileSync("_test_output.txt", log, "utf8"); })
  .finally(() => conn && conn.end());
