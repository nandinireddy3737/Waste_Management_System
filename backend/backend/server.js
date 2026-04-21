const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// Use a connection pool so connections are reused safely
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Nandini@01",
  database: "waste_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper to send SQL errors to console with detail
function logSqlError(err) {
  console.error('SQL Error:', err && (err.sqlMessage || err.message) ? (err.sqlMessage || err.message) : err);
}

// Base API path prefix
const API_BASE = '/api';

// City zones - SELECT
app.get(`${API_BASE}/zones`, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT zone_id, zone_name, manager_name, zone_status FROM CITY_ZONE"
    );
    res.json(rows);
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: "Failed to fetch zones" });
  }
});

// City zones - INSERT
app.post(`${API_BASE}/zones`, async (req, res) => {
  const { zone_id, zone_name, manager_name, zone_status } = req.body || {};

  if (!zone_id || !zone_name || !manager_name || !zone_status) {
    return res
      .status(400)
      .json({ error: "zone_id, zone_name, manager_name, zone_status are required" });
  }

  try {
    await pool.query(
      "INSERT INTO CITY_ZONE (zone_id, zone_name, manager_name, zone_status) VALUES (?, ?, ?, ?)",
      [zone_id, zone_name, manager_name, zone_status]
    );

    // Return the freshly inserted row from DB
    const [rows] = await pool.query(
      "SELECT zone_id, zone_name, manager_name, zone_status FROM CITY_ZONE WHERE zone_id = ?",
      [zone_id]
    );

    res.status(201).json(rows[0] || null);
  } catch (err) {
    logSqlError(err);
    if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
      return res
        .status(400)
        .json({ error: "Zone ID already exists. Please use a unique Zone ID.", code: "PK_ZONE_DUP" });
    }
    res.status(500).json({ error: "Failed to insert zone" });
  }
});

// City zones - UPDATE
app.put(`${API_BASE}/zones/:zoneId`, async (req, res) => {
  const { zoneId } = req.params;
  const { zone_name, manager_name, zone_status } = req.body || {};

  if (!zone_name || !manager_name || !zone_status) {
    return res
      .status(400)
      .json({ error: "zone_name, manager_name, zone_status are required" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE CITY_ZONE SET zone_name = ?, manager_name = ?, zone_status = ? WHERE zone_id = ?",
      [zone_name, manager_name, zone_status, zoneId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Zone not found" });
    }

    const [rows] = await pool.query(
      "SELECT zone_id, zone_name, manager_name, zone_status FROM CITY_ZONE WHERE zone_id = ?",
      [zoneId]
    );

    res.json(rows[0] || null);
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: "Failed to update zone" });
  }
});

// City zones - DELETE
app.delete(`${API_BASE}/zones/:zoneId`, async (req, res) => {
  const { zoneId } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM CITY_ZONE WHERE zone_id = ?",
      [zoneId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Zone not found" });
    }

    res.status(204).send();
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: "Failed to delete zone" });
  }
});

// Waste bins - GET (alias `status` => `bin_status` so all frontend reads bin.bin_status correctly)
app.get(`${API_BASE}/bins`, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT bin_id, zone_id, location, capacity, waste_type, status AS bin_status FROM WASTE_BIN"
    );
    res.json(rows);
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: 'Failed to fetch bins' });
  }
});

// Waste bins - INSERT
app.post(`${API_BASE}/bins`, async (req, res) => {
  // Frontend sends bin_status; DB column is `status`
  const { bin_id, zone_id, location, capacity, waste_type, bin_status, status } = req.body || {};
  const targetStatus = bin_status || status;

  if (!bin_id || !zone_id || !location || capacity == null || !waste_type || !targetStatus) {
    return res.status(400).json({
      error: "bin_id, zone_id, location, capacity, waste_type, and status are required"
    });
  }

  try {
    await pool.query(
      "INSERT INTO WASTE_BIN (bin_id, zone_id, location, capacity, waste_type, status) VALUES (?, ?, ?, ?, ?, ?)",
      [bin_id, zone_id, location, capacity, waste_type, targetStatus]
    );
    // Return with bin_status alias so frontend reads it correctly
    const [rows] = await pool.query(
      "SELECT bin_id, zone_id, location, capacity, waste_type, status AS bin_status FROM WASTE_BIN WHERE bin_id = ?",
      [bin_id]
    );
    res.status(201).json(rows[0] || null);
  } catch (err) {
    logSqlError(err);
    if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
      return res.status(400).json({ error: "Bin ID already exists. Please use a unique Bin ID.", code: "PK_BIN_DUP" });
    }
    if (err && (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452)) {
      return res.status(400).json({ error: "Invalid Zone selected. Please choose an existing City Zone.", code: "FK_ZONE_INVALID" });
    }
    res.status(500).json({ error: "Failed to insert bin" });
  }
});

// Waste bins - UPDATE
app.put(`${API_BASE}/bins/:binId`, async (req, res) => {
  const { binId } = req.params;
  // Support both 'status' and 'bin_status' from frontend
  const { zone_id, location, capacity, waste_type, status, bin_status } = req.body || {};
  const targetStatus = status || bin_status;

  if (!zone_id || !location || capacity == null || !waste_type || !targetStatus) {
    return res.status(400).json({
      error: "zone_id, location, capacity, waste_type, and status are required"
    });
  }

  console.log(`Updating bin ${binId} to status: ${targetStatus}`);

  try {
    const [result] = await pool.query(
      "UPDATE WASTE_BIN SET zone_id = ?, location = ?, capacity = ?, waste_type = ?, status = ? WHERE bin_id = ?",
      [zone_id, location, capacity, waste_type, targetStatus, binId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Bin not found" });
    }

    const [rows] = await pool.query(
      "SELECT bin_id, zone_id, location, capacity, waste_type, status AS bin_status FROM WASTE_BIN WHERE bin_id = ?",
      [binId]
    );
    console.log(`Successfully updated bin ${binId}`);
    res.json(rows[0] || null);

  } catch (err) {
    console.error("--- BIN UPDATE ERROR ---");
    console.error("Bin ID:", binId);
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.sqlMessage || err.message);
    
    // Check if the error is likely from the AFTER_UPDATE_WASTE_BIN trigger
    if (targetStatus === 'Full' && err.code !== 'ER_NO_REFERENCED_ROW_2') {
      console.warn("Update likely failed due to AFTER_UPDATE_WASTE_BIN trigger logic (e.g. Schedule insert failure)");
    }

    logSqlError(err);

    // Foreign key violation
    if (err && (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452)) {
      return res
        .status(400)
        .json({ error: "Invalid Zone selected. Please choose an existing City Zone.", code: "FK_ZONE_INVALID" });
    }

    // Handle trigger signal or generic status update error
    res.status(500).json({ 
      error: "Failed to update bin. This may be due to automated schedule creation failure.",
      details: err.sqlMessage || "Trigger or constraint error"
    });
  }
});

// Waste bins - DELETE
app.delete(`${API_BASE}/bins/:binId`, async (req, res) => {
  const { binId } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM WASTE_BIN WHERE bin_id = ?", [binId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Bin not found" });
    }
    res.status(204).send();
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: "Failed to delete bin" });
  }
});

// Collection vehicles
app.get(`${API_BASE}/vehicles`, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM COLLECTION_VEHICLE");
    res.json(rows);
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Collection vehicles - INSERT
app.post(`${API_BASE}/vehicles`, async (req, res) => {
  const { vehicle_id, vehicle_number, capacity, vehicle_status } = req.body || {};

  if (!vehicle_id || !vehicle_number || capacity == null || !vehicle_status) {
    return res
      .status(400)
      .json({ error: "vehicle_id, vehicle_number, capacity, vehicle_status are required" });
  }

  try {
    await pool.query(
      "INSERT INTO COLLECTION_VEHICLE (vehicle_id, vehicle_number, capacity, vehicle_status) VALUES (?, ?, ?, ?)",
      [vehicle_id, vehicle_number, capacity, vehicle_status]
    );
    const [rows] = await pool.query(
      "SELECT * FROM COLLECTION_VEHICLE WHERE vehicle_id = ?",
      [vehicle_id]
    );
    res.status(201).json(rows[0] || null);
  } catch (err) {
    logSqlError(err);
    if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
      return res.status(400).json({
        error: "Vehicle ID already exists. Please use a unique Vehicle ID.",
        code: "PK_VEHICLE_DUP"
      });
    }
    res.status(500).json({ error: "Failed to insert vehicle" });
  }
});

// Collection vehicles - UPDATE
app.put(`${API_BASE}/vehicles/:vehicleId`, async (req, res) => {
  const { vehicleId } = req.params;
  const { vehicle_number, capacity, vehicle_status } = req.body || {};

  if (!vehicle_number || capacity == null || !vehicle_status) {
    return res
      .status(400)
      .json({ error: "vehicle_number, capacity, vehicle_status are required" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE COLLECTION_VEHICLE SET vehicle_number = ?, capacity = ?, vehicle_status = ? WHERE vehicle_id = ?",
      [vehicle_number, capacity, vehicle_status, vehicleId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    const [rows] = await pool.query(
      "SELECT * FROM COLLECTION_VEHICLE WHERE vehicle_id = ?",
      [vehicleId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: "Failed to update vehicle" });
  }
});

// Collection vehicles - DELETE
app.delete(`${API_BASE}/vehicles/:vehicleId`, async (req, res) => {
  const { vehicleId } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM COLLECTION_VEHICLE WHERE vehicle_id = ?",
      [vehicleId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    res.status(204).send();
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: "Failed to delete vehicle" });
  }
});

// Vehicle-worker assignments
app.get(`${API_BASE}/assignments`, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM VEHICLE_WORKER_ASSIGNMENT");
    res.json(rows);
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Workers (lookup table for assignments)
app.get(`${API_BASE}/workers`, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT worker_id, worker_name, role, assigned_zone, shift_type FROM WORKER");
    res.json(rows);
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: "Failed to fetch workers" });
  }
});

// Vehicle-worker assignments - INSERT
app.post(`${API_BASE}/assignments`, async (req, res) => {
  const { assignment_id, vehicle_id, worker_id, assigned_from, assigned_to } = req.body || {};

  if (!assignment_id || !vehicle_id || !worker_id || !assigned_from || !assigned_to) {
    return res.status(400).json({
      error: "assignment_id, vehicle_id, worker_id, assigned_from, assigned_to are required"
    });
  }

  try {
    await pool.query(
      "INSERT INTO VEHICLE_WORKER_ASSIGNMENT (assignment_id, vehicle_id, worker_id, assigned_from, assigned_to) VALUES (?, ?, ?, ?, ?)",
      [assignment_id, vehicle_id, worker_id, assigned_from, assigned_to]
    );
    const [rows] = await pool.query(
      "SELECT * FROM VEHICLE_WORKER_ASSIGNMENT WHERE assignment_id = ?",
      [assignment_id]
    );
    res.status(201).json(rows[0] || null);
  } catch (err) {
    logSqlError(err);
    if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
      return res.status(400).json({
        error: "Assignment ID already exists. Please use a unique Assignment ID.",
        code: "PK_ASSIGNMENT_DUP"
      });
    }
    if (err && (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452)) {
      return res.status(400).json({
        error: "Invalid Vehicle or Worker selected. Please choose existing records.",
        code: "FK_ASSIGNMENT_INVALID"
      });
    }
    res.status(500).json({ error: "Failed to insert assignment" });
  }
});

// Vehicle-worker assignments - UPDATE
app.put(`${API_BASE}/assignments/:assignmentId`, async (req, res) => {
  const { assignmentId } = req.params;
  const { vehicle_id, worker_id, assigned_from, assigned_to } = req.body || {};

  if (!vehicle_id || !worker_id || !assigned_from || !assigned_to) {
    return res.status(400).json({
      error: "vehicle_id, worker_id, assigned_from, assigned_to are required"
    });
  }

  try {
    const [result] = await pool.query(
      "UPDATE VEHICLE_WORKER_ASSIGNMENT SET vehicle_id = ?, worker_id = ?, assigned_from = ?, assigned_to = ? WHERE assignment_id = ?",
      [vehicle_id, worker_id, assigned_from, assigned_to, assignmentId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    const [rows] = await pool.query(
      "SELECT * FROM VEHICLE_WORKER_ASSIGNMENT WHERE assignment_id = ?",
      [assignmentId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    logSqlError(err);
    if (err && (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452)) {
      return res.status(400).json({
        error: "Invalid Vehicle or Worker selected. Please choose existing records.",
        code: "FK_ASSIGNMENT_INVALID"
      });
    }
    res.status(500).json({ error: "Failed to update assignment" });
  }
});

// Vehicle-worker assignments - DELETE
app.delete(`${API_BASE}/assignments/:assignmentId`, async (req, res) => {
  const { assignmentId } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM VEHICLE_WORKER_ASSIGNMENT WHERE assignment_id = ?",
      [assignmentId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }
    res.status(204).send();
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

// Collection schedules
app.get(`${API_BASE}/schedules`, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM COLLECTION_SCHEDULE");
    res.json(rows);
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// Collection schedules - INSERT
app.post(`${API_BASE}/schedules`, async (req, res) => {
  const { schedule_id, bin_id, vehicle_id, schedule_time, schedule_status } = req.body || {};

  if (!schedule_id || !bin_id || !vehicle_id || !schedule_time || !schedule_status) {
    return res.status(400).json({
      error: "schedule_id, bin_id, vehicle_id, schedule_time, schedule_status are required"
    });
  }

  try {
    await pool.query(
      "INSERT INTO COLLECTION_SCHEDULE (schedule_id, bin_id, vehicle_id, schedule_time, schedule_status) VALUES (?, ?, ?, ?, ?)",
      [schedule_id, bin_id, vehicle_id, schedule_time, schedule_status]
    );
    const [rows] = await pool.query(
      "SELECT * FROM COLLECTION_SCHEDULE WHERE schedule_id = ?",
      [schedule_id]
    );
    res.status(201).json(rows[0] || null);
  } catch (err) {
    console.error("DB Error:", err.message);
    logSqlError(err);
    if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
      return res.status(400).json({
        error: "Schedule ID already exists. Please use a unique Schedule ID.",
        code: "PK_SCHEDULE_DUP"
      });
    }
    if (err && (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452)) {
      return res.status(400).json({
        error: "Invalid Bin or Vehicle selected. Please choose existing records.",
        code: "FK_SCHEDULE_INVALID"
      });
    }
    // ── SIGNAL triggers (SQLSTATE '45000') surface their MESSAGE_TEXT here ──
    // MySQL driver maps user-defined signals to ER_SIGNAL_EXCEPTION (errno 1644)
    if (err && (err.code === 'ER_SIGNAL_EXCEPTION' || err.errno === 1644)) {
      return res.status(422).json({
        error: err.sqlMessage || err.message,
        code: "TRIGGER_VIOLATION"
      });
    }
    res.status(400).json({ error: err.message || "Failed to insert schedule" });
  }
});

// Collection schedules - UPDATE
app.put(`${API_BASE}/schedules/:scheduleId`, async (req, res) => {
  const { scheduleId } = req.params;
  const { bin_id, vehicle_id, schedule_time, schedule_status } = req.body || {};

  if (!bin_id || !vehicle_id || !schedule_time || !schedule_status) {
    return res.status(400).json({
      error: "bin_id, vehicle_id, schedule_time, schedule_status are required"
    });
  }

  try {
    const [result] = await pool.query(
      "UPDATE COLLECTION_SCHEDULE SET bin_id = ?, vehicle_id = ?, schedule_time = ?, schedule_status = ? WHERE schedule_id = ?",
      [bin_id, vehicle_id, schedule_time, schedule_status, scheduleId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }
    const [rows] = await pool.query(
      "SELECT * FROM COLLECTION_SCHEDULE WHERE schedule_id = ?",
      [scheduleId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    logSqlError(err);
    if (err && (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452)) {
      return res.status(400).json({
        error: "Invalid Bin or Vehicle selected. Please choose existing records.",
        code: "FK_SCHEDULE_INVALID"
      });
    }
    res.status(500).json({ error: "Failed to update schedule" });
  }
});

// Collection schedules - DELETE
app.delete(`${API_BASE}/schedules/:scheduleId`, async (req, res) => {
  const { scheduleId } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM COLLECTION_SCHEDULE WHERE schedule_id = ?",
      [scheduleId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }
    res.status(204).send();
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
});

// ====================================================================
// ADVANCED SCHEDULE FILTER ENDPOINTS (additive — no existing routes changed)
// ====================================================================

// Multi-parameter filter: date range, status, vehicle_id, bin_id
app.get(`${API_BASE}/filter-schedules`, async (req, res) => {
  try {
    const { from_date, to_date, status, vehicle_id, bin_id } = req.query;

    let sql = "SELECT * FROM COLLECTION_SCHEDULE WHERE 1=1";
    const params = [];

    if (from_date) {
      sql += " AND schedule_time >= ?";
      params.push(from_date);
    }
    if (to_date) {
      sql += " AND schedule_time <= ?";
      // Append end-of-day so the 'to' date is inclusive
      params.push(to_date + " 23:59:59");
    }
    if (status) {
      sql += " AND schedule_status = ?";
      params.push(status);
    }
    if (vehicle_id) {
      sql += " AND vehicle_id = ?";
      params.push(vehicle_id);
    }
    if (bin_id) {
      sql += " AND bin_id = ?";
      params.push(bin_id);
    }

    sql += " ORDER BY schedule_time DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: "Failed to filter schedules" });
  }
});

// Today's schedules
app.get(`${API_BASE}/today-schedules`, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM COLLECTION_SCHEDULE WHERE DATE(schedule_time) = CURDATE() ORDER BY schedule_time DESC"
    );
    res.json(rows);
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: "Failed to fetch today's schedules" });
  }
});

// Overdue schedules (past schedule_time but not Completed)
app.get(`${API_BASE}/overdue-schedules`, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM COLLECTION_SCHEDULE WHERE schedule_time < NOW() AND schedule_status != 'Completed' ORDER BY schedule_time ASC"
    );
    res.json(rows);
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: "Failed to fetch overdue schedules" });
  }
});

// Active schedules only
app.get(`${API_BASE}/active-schedules`, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM COLLECTION_SCHEDULE WHERE schedule_status = 'Active' ORDER BY schedule_time DESC"
    );
    res.json(rows);
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: "Failed to fetch active schedules" });
  }
});

// Schedules for bins that are currently Full (JOIN query)
app.get(`${API_BASE}/full-bin-schedules`, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT cs.*
       FROM COLLECTION_SCHEDULE cs
       JOIN WASTE_BIN wb ON cs.bin_id = wb.bin_id
       WHERE wb.status = 'Full'
       ORDER BY cs.schedule_time DESC`
    );
    res.json(rows);
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: "Failed to fetch full-bin schedules" });
  }
});

// Worker signup (self-registration)
app.post(`${API_BASE}/worker/signup`, async (req, res) => {
  const { name, email, phone, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email, and password are required"
    });
  }

  if (String(password).length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters"
    });
  }

  const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

  try {
    // worker_id is INT: use MAX+1 or rely on AUTO_INCREMENT
    let worker_id;
    const [maxRow] = await pool.query("SELECT COALESCE(MAX(worker_id), 0) + 1 AS next_id FROM WORKER");
    const nextId = maxRow && maxRow[0] ? maxRow[0].next_id : 1;

    await pool.query(
      "INSERT INTO WORKER (worker_id, worker_name, email, phone, password_hash, role, assigned_zone, shift_type) VALUES (?, ?, ?, ?, ?, 'Worker', NULL, NULL)",
      [nextId, name, email, phone || null, hashedPassword]
    );
    worker_id = nextId;

    res.status(201).json({
      success: true,
      worker_id: String(worker_id),
      worker_name: name,
      message: "Account created successfully"
    });
  } catch (err) {
    logSqlError(err);
    if (err && (err.code === "ER_BAD_FIELD_ERROR" || err.errno === 1054)) {
      return res.status(500).json({
        message: "Database schema mismatch. Add email, phone, password_hash columns to WORKER table."
      });
    }
    if (err && (err.code === "ER_DUP_ENTRY" || err.errno === 1062)) {
      return res.status(400).json({ message: "Email already registered" });
    }
    if (err && (err.code === "ER_TRUNCATED_WRONG_VALUE" || err.errno === 1366)) {
      return res.status(500).json({ message: "Invalid data format. Check that worker_id is integer type." });
    }
    const errMsg = (err && (err.sqlMessage || err.message)) ? err.sqlMessage || err.message : "Unknown error";
    console.error("Worker signup error:", errMsg);
    res.status(500).json({ message: "Sign up failed: " + errMsg });
  }
});

// Worker login
app.post(`${API_BASE}/worker/login`, async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

  try {
    const [rows] = await pool.query(
      "SELECT worker_id, worker_name FROM WORKER WHERE email = ? AND password_hash = ?",
      [email, hashedPassword]
    );

    if (rows && rows.length > 0) {
      res.json({
        success: true,
        worker_id: rows[0].worker_id,
        worker_name: rows[0].worker_name
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    logSqlError(err);
    if (err && (err.code === "ER_BAD_FIELD_ERROR" || err.errno === 1054)) {
      return res.status(500).json({
        message: "Database schema missing email/password_hash. Run the ALTER TABLE from signup instructions."
      });
    }
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

// Worker Complete Task
app.post(`${API_BASE}/worker/complete-task`, async (req, res) => {
  try {
    const { schedule_id } = req.body;

    if (!schedule_id) {
      return res.status(400).json({ error: "schedule_id is required" });
    }

    const updateSql = `
      UPDATE COLLECTION_SCHEDULE
      SET schedule_status = 'Completed'
      WHERE schedule_id = ?
    `;
    await pool.query(updateSql, [schedule_id]);

    res.json({ success: true });
  } catch (error) {
    logSqlError(error);
    res.status(500).json({ message: "Failed to update schedule status" });
  }
});

// Worker Dashboard Tasks
app.get("/api/worker/tasks", async (req, res) => {
  try {
    const workerId = req.query.worker_id;

    if (!workerId) {
      return res.status(400).json({ error: "worker_id is required" });
    }

    // Check if worker has any assigned vehicle
    const [[assignment]] = await pool.query(
      "SELECT vehicle_id FROM VEHICLE_WORKER_ASSIGNMENT WHERE worker_id = ? AND CURDATE() BETWEEN assigned_from AND assigned_to LIMIT 1",
      [workerId]
    );

    if (!assignment) {
      return res.json({ message: "No tasks assigned" });
    }

    const sql = `
      SELECT
        cs.schedule_id,
        wb.bin_id,
        wb.location,
        wb.waste_type,
        cs.schedule_time,
        cs.schedule_status,
        vwa.vehicle_id
      FROM VEHICLE_WORKER_ASSIGNMENT vwa
      JOIN COLLECTION_SCHEDULE cs
        ON cs.vehicle_id = vwa.vehicle_id
      JOIN WASTE_BIN wb
        ON wb.bin_id = cs.bin_id
      WHERE vwa.worker_id = ?
      AND CURDATE() BETWEEN vwa.assigned_from AND vwa.assigned_to
      AND DATE(cs.schedule_time) = CURDATE()
    `;

    const [rows] = await pool.query(sql, [workerId]);

    res.json(rows);

  } catch (error) {
    console.error("Error loading worker tasks:", error);
    res.status(500).json({ error: "Failed to load worker tasks" });
  }
});

// Worker Progress
app.get(`${API_BASE}/worker/progress`, async (req, res) => {
  try {
    const { vehicle_id } = req.query;
    if (!vehicle_id) {
      return res.status(400).json({ error: 'vehicle_id is required' });
    }
    
    const [[totalRows]] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM COLLECTION_SCHEDULE 
      WHERE vehicle_id = ? AND DATE(schedule_time) = CURDATE()
    `, [vehicle_id]);
    
    const [[completedRows]] = await pool.query(`
      SELECT COUNT(*) as completed 
      FROM COLLECTION_SCHEDULE 
      WHERE vehicle_id = ? AND schedule_status = 'Completed' AND DATE(schedule_time) = CURDATE()
    `, [vehicle_id]);

    res.json({
      total: totalRows.total || 0,
      completed: completedRows.completed || 0
    });
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: 'Failed to fetch worker progress' });
  }
});

// Dashboard summary counts
app.get(`${API_BASE}/dashboard-summary`, async (req, res) => {
  try {
    const [zonesResult] = await pool.query("SELECT COUNT(*) as total_zones FROM CITY_ZONE");
    const [binsResult] = await pool.query("SELECT COUNT(*) as total_bins FROM WASTE_BIN");
    const [vehiclesResult] = await pool.query("SELECT COUNT(*) as total_vehicles FROM COLLECTION_VEHICLE");
    const [activeSchedulesResult] = await pool.query("SELECT COUNT(*) as active_schedules FROM COLLECTION_SCHEDULE WHERE schedule_status = 'Active'");

    res.json({
      total_zones: zonesResult[0]?.total_zones || 0,
      total_bins: binsResult[0]?.total_bins || 0,
      total_vehicles: vehiclesResult[0]?.total_vehicles || 0,
      active_schedules: activeSchedulesResult[0]?.active_schedules || 0
    });
  } catch (err) {
    logSqlError(err);
    res.status(500).json({ error: 'Failed to load dashboard summary' });
  }
});

// Priority Bins
app.get('/api/insights/priority-bins', async (req, res) => {
  try {
    const [rows] = await pool.query("CALL get_priority_bins()");
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Priority bins error" });
  }
});

// Daily Report
app.get('/api/insights/daily-report', async (req, res) => {
  try {
    const [rows] = await pool.query("CALL get_daily_collection_report()");
    res.json(rows[0][0] || {});
  } catch (err) {
    res.status(500).json({ error: "Daily report error" });
  }
});

// Overloaded Vehicles
app.get('/api/insights/overloaded-vehicles', async (req, res) => {
  try {
    const [rows] = await pool.query("CALL get_overloaded_vehicles()");
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Vehicles error" });
  }
});

// Idle Workers
app.get('/api/insights/idle-workers', async (req, res) => {
  try {
    const [rows] = await pool.query("CALL get_idle_workers()");
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Workers error" });
  }
});

// --- Citizen Complaints (MongoDB only — no MySQL for complaints) ---
const { connectMongo } = require("./mongo");
const complaintMongoRoutes = require("./complaintMongoRoutes");
app.use(complaintMongoRoutes);

// --- Neo4j Graph Database (relationship-based queries — additive module) ---
const { verifyNeo4jConnection } = require("./neo4j");
const { initNeo4jRoutes } = require("./neo4jRoutes");
app.use(initNeo4jRoutes(pool));

(async () => {
  try {
    await connectMongo();
    // Neo4j is optional — failure is non-fatal so existing features keep working
    await verifyNeo4jConnection();
    app.listen(5000, () => {
      console.log("Server running on port 5000");
    });
  } catch (err) {
    console.error("Failed to connect MongoDB:", err);
    process.exit(1);
  }
})();
