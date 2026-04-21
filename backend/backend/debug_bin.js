const mysql = require("mysql2/promise");

async function debug() {
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Nandini@01",
    database: "waste_management"
  });

  const [cols] = await db.query("SHOW COLUMNS FROM waste_bin");
  console.log("COLUMNS:");
  for (const c of cols) {
    console.log("FIELD=" + c.Field + " TYPE=" + c.Type + " NULL=" + c.Null);
  }

  const [trigs] = await db.query("SHOW TRIGGERS");
  console.log("TRIGGERS:");
  for (const t of trigs) {
    console.log("TRIGGER=" + t.Trigger + " TABLE=" + t.Table + " EVENT=" + t.Event + " TIMING=" + t.Timing);
  }

  const [bins] = await db.query("SELECT * FROM waste_bin LIMIT 3");
  console.log("BINS:");
  for (const b of bins) {
    console.log("BIN=" + JSON.stringify(b));
  }

  if (bins.length > 0) {
    const bin = bins[0];
    console.log("TESTING UPDATE on bin_id=" + bin.bin_id);
    try {
      const [res] = await db.query(
        "UPDATE waste_bin SET zone_id=?, location=?, capacity=?, waste_type=?, status=? WHERE bin_id=?",
        [bin.zone_id, bin.location, bin.capacity, bin.waste_type, "Full", bin.bin_id]
      );
      console.log("UPDATE_OK affectedRows=" + res.affectedRows + " changedRows=" + res.changedRows);
    } catch (err) {
      console.log("UPDATE_FAIL code=" + err.code + " msg=" + (err.sqlMessage || err.message));
    }
  }

  await db.end();
  process.exit(0);
}

debug().catch(err => {
  console.log("FATAL=" + err.message);
  process.exit(1);
});
