/**
 * Citizen Complaint APIs — MongoDB only (collection: complaints).
 * Mounted separately; does not alter existing MySQL routes.
 */
const express = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("./mongo");

const router = express.Router();

function isValidObjectId(id) {
  try {
    return ObjectId.isValid(id) && String(new ObjectId(id)) === String(id);
  } catch {
    return false;
  }
}

// POST /complaint — insert new complaint
router.post("/complaint", async (req, res) => {
  try {
    const { citizen_name, issue, description, location } = req.body || {};

    console.log("[Complaint] Submit received:", {
      citizen_name,
      issue,
      description: description ? "(provided)" : "",
      location
    });

    if (!citizen_name || !issue || !description || !location) {
      return res.status(400).json({
        error: "citizen_name, issue, description, and location are required"
      });
    }

    const db = await getDb();
    const doc = {
      citizen_name: String(citizen_name),
      issue: String(issue),
      description: String(description),
      location: String(location),
      status: "Pending",
      created_at: new Date(),
      updates: []
    };

    const result = await db.collection("complaints").insertOne(doc);
    console.log("[Complaint] MongoDB insert OK, id:", result.insertedId.toString());

    return res.status(201).json({
      success: true,
      id: result.insertedId.toString()
    });
  } catch (err) {
    console.error("Mongo complaint POST:", err);
    return res.status(500).json({ error: "Failed to create complaint" });
  }
});

// GET /complaints — fetch all complaints
router.get("/complaints", async (req, res) => {
  try {
    const db = await getDb();
    const list = await db
      .collection("complaints")
      .find({})
      .sort({ created_at: -1 })
      .toArray();

    const out = list.map((c) => ({
      ...c,
      _id: c._id.toString()
    }));
    return res.json(out);
  } catch (err) {
    console.error("Mongo complaint GET:", err);
    return res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

// PUT /complaint/:id — update status and append to updates[]
router.put("/complaint/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid complaint id" });
  }

  if (!status || typeof status !== "string") {
    return res.status(400).json({ error: "status is required" });
  }

  try {
    const db = await getDb();
    const updateEntry = {
      at: new Date(),
      status
    };

    const result = await db.collection("complaints").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { status },
        $push: { updates: updateEntry }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Mongo complaint PUT:", err);
    if (err && err.name === "BSONError") {
      return res.status(400).json({ error: "Invalid complaint id" });
    }
    return res.status(500).json({ error: "Failed to update complaint" });
  }
});

// DELETE /complaint/:id — delete a complaint
router.delete("/complaint/:id", async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid complaint id" });
  }

  try {
    const db = await getDb();
    const result = await db.collection("complaints").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("Mongo complaint DELETE:", err);
    return res.status(500).json({ error: "Failed to delete complaint" });
  }
});

// GET /complaints-summary-status — $group by status
router.get("/complaints-summary-status", async (req, res) => {
  try {
    const db = await getDb();
    const summary = await db.collection("complaints").aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } }
    ]).toArray();
    return res.json(summary);
  } catch (err) {
    console.error("Mongo aggregation GET:", err);
    return res.status(500).json({ error: "Failed to aggregate complaints by status" });
  }
});

// GET /complaints-summary-location — $group by location
router.get("/complaints-summary-location", async (req, res) => {
  try {
    const db = await getDb();
    const summary = await db.collection("complaints").aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $project: { _id: 0, location: "$_id", count: 1 } }
    ]).toArray();
    return res.json(summary);
  } catch (err) {
    console.error("Mongo aggregation GET:", err);
    return res.status(500).json({ error: "Failed to aggregate complaints by location" });
  }
});

// GET /complaints-active — $match status = "In Progress"
router.get("/complaints-active", async (req, res) => {
  try {
    const db = await getDb();
    const active = await db.collection("complaints").aggregate([
      { $match: { status: "In Progress" } }
    ]).toArray();
    
    const out = active.map((c) => ({ ...c, _id: c._id.toString() }));
    return res.json(out);
  } catch (err) {
    console.error("Mongo aggregation GET:", err);
    return res.status(500).json({ error: "Failed to fetch active complaints" });
  }
});

// GET /complaints-analysis — exclude "Resolved", $group by location, $project formatted output
router.get("/complaints-analysis", async (req, res) => {
  try {
    const db = await getDb();
    const analysis = await db.collection("complaints").aggregate([
      { $match: { status: { $ne: "Resolved" } } },
      { $group: { _id: "$location", pendingCount: { $sum: 1 } } },
      { $project: { _id: 0, location: "$_id", count: "$pendingCount" } }
    ]).toArray();
    return res.json(analysis);
  } catch (err) {
    console.error("Mongo aggregation GET:", err);
    return res.status(500).json({ error: "Failed to analyze pending complaints" });
  }
});

module.exports = router;
