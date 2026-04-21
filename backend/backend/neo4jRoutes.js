/**
 * Neo4j Graph-based relationship API routes — Real-world model.
 * Additive module — does NOT modify any existing MySQL or MongoDB routes.
 *
 * Graph Model:
 *   (Worker)-[:ASSIGNED_TO]->(Vehicle)
 *   (Vehicle)-[:FOLLOWS]->(Route)
 *   (Route)-[:COVERS]->(Bin)
 *   (Zone)-[:HAS_BIN]->(Bin)
 *
 * Endpoints:
 *   GET  /neo4j/worker-bins/:worker_id  → Worker → Vehicle → Route → Bins
 *   GET  /neo4j/zone-bins/:zone_name    → Zone → Bins
 *   GET  /neo4j/vehicle-bins/:vehicle_id→ Vehicle → Route → Bins
 *   GET  /neo4j/graph-summary           → Node & relationship counts
 *   POST /neo4j/sync                    → Sync MySQL data into Neo4j graph
 */
const express = require("express");
const router = express.Router();
const { getSession } = require("./neo4j");

// The MySQL pool is injected via initNeo4jRoutes(pool) from server.js
let mysqlPool = null;

function initNeo4jRoutes(pool) {
  mysqlPool = pool;
  return router;
}

// Helper: safely extract Neo4j integer values
function toJsNumber(val) {
  if (val && typeof val.toNumber === "function") return val.toNumber();
  return Number(val);
}

// Helper: convert Neo4j node to plain JS object
function nodeProps(node) {
  const props = {};
  for (const [key, val] of Object.entries(node.properties || node)) {
    props[key] = val && typeof val.toNumber === "function" ? val.toNumber() : val;
  }
  return props;
}

// ─── GET /neo4j/worker-bins/:worker_id ───────────────────────────────────────
// Real-world chain: Worker → Vehicle → Route → Bin
router.get("/neo4j/worker-bins/:worker_id", async (req, res) => {
  const session = getSession();
  try {
    const { worker_id } = req.params;
    const result = await session.run(
      `MATCH (w:Worker)-[:ASSIGNED_TO]->(v:Vehicle)-[:FOLLOWS]->(r:Route)-[:COVERS]->(b:Bin)
       WHERE w.worker_id = $worker_id
       RETURN w, v, r, b`,
      { worker_id: String(worker_id) }
    );

    const bins = result.records.map((record) => ({
      worker: nodeProps(record.get("w")),
      vehicle: nodeProps(record.get("v")),
      route: nodeProps(record.get("r")),
      bin: nodeProps(record.get("b")),
    }));
    res.json(bins);
  } catch (err) {
    console.error("Neo4j worker-bins error:", err.message);
    res.status(500).json({ error: "Failed to query worker-bin relationships" });
  } finally {
    await session.close();
  }
});

// ─── GET /neo4j/worker-load ──────────────────────────────────────────────────
// Worker Load Analysis — counts bins per worker for overload detection
router.get("/neo4j/worker-load", async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (w:Worker)-[:ASSIGNED_TO]->(:Vehicle)-[:FOLLOWS]->(:Route)-[:COVERS]->(b:Bin)
       RETURN w.worker_id AS worker_id, w.worker_name AS worker_name, COUNT(b) AS total_bins
       ORDER BY total_bins DESC`
    );

    const data = result.records.map((record) => ({
      worker_id: record.get("worker_id"),
      worker_name: record.get("worker_name"),
      total_bins: toJsNumber(record.get("total_bins")),
    }));
    res.json(data);
  } catch (err) {
    console.error("Neo4j worker-load error:", err.message);
    res.status(500).json({ error: "Failed to query worker load analysis" });
  } finally {
    await session.close();
  }
});

// ─── GET /neo4j/zone-bins/:zone_name ─────────────────────────────────────────
// Zone → Bin
router.get("/neo4j/zone-bins/:zone_name", async (req, res) => {
  const session = getSession();
  try {
    const { zone_name } = req.params;
    const result = await session.run(
      `MATCH (z:Zone)-[:HAS_BIN]->(b:Bin)
       WHERE z.zone_name = $zone_name
       RETURN z, b`,
      { zone_name: String(zone_name) }
    );

    const bins = result.records.map((record) => ({
      zone: nodeProps(record.get("z")),
      bin: nodeProps(record.get("b")),
    }));
    res.json(bins);
  } catch (err) {
    console.error("Neo4j zone-bins error:", err.message);
    res.status(500).json({ error: "Failed to query zone-bin relationships" });
  } finally {
    await session.close();
  }
});

// ─── GET /neo4j/vehicle-bins/:vehicle_id ─────────────────────────────────────
// Real-world chain: Vehicle → Route → Bin
router.get("/neo4j/vehicle-bins/:vehicle_id", async (req, res) => {
  const session = getSession();
  try {
    const { vehicle_id } = req.params;
    const result = await session.run(
      `MATCH (v:Vehicle)-[:FOLLOWS]->(r:Route)-[:COVERS]->(b:Bin)
       WHERE v.vehicle_id = $vehicle_id
       RETURN v, r, b`,
      { vehicle_id: String(vehicle_id) }
    );

    const bins = result.records.map((record) => ({
      vehicle: nodeProps(record.get("v")),
      route: nodeProps(record.get("r")),
      bin: nodeProps(record.get("b")),
    }));
    res.json(bins);
  } catch (err) {
    console.error("Neo4j vehicle-bins error:", err.message);
    res.status(500).json({ error: "Failed to query vehicle-bin relationships" });
  } finally {
    await session.close();
  }
});

// ─── GET /neo4j/graph-summary ────────────────────────────────────────────────
router.get("/neo4j/graph-summary", async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(`
      OPTIONAL MATCH (w:Worker) WITH count(w) AS workers
      OPTIONAL MATCH (v:Vehicle) WITH workers, count(v) AS vehicles
      OPTIONAL MATCH (r:Route) WITH workers, vehicles, count(r) AS routes
      OPTIONAL MATCH (b:Bin) WITH workers, vehicles, routes, count(b) AS bins
      OPTIONAL MATCH (z:Zone) WITH workers, vehicles, routes, bins, count(z) AS zones
      OPTIONAL MATCH ()-[r1:ASSIGNED_TO]->() WITH workers, vehicles, routes, bins, zones, count(r1) AS assigned_to
      OPTIONAL MATCH ()-[r2:FOLLOWS]->() WITH workers, vehicles, routes, bins, zones, assigned_to, count(r2) AS follows
      OPTIONAL MATCH ()-[r3:COVERS]->() WITH workers, vehicles, routes, bins, zones, assigned_to, follows, count(r3) AS covers
      OPTIONAL MATCH ()-[r4:HAS_BIN]->()
      RETURN workers, vehicles, routes, bins, zones, assigned_to, follows, covers, count(r4) AS has_bin
    `);

    const record = result.records[0];
    res.json({
      nodes: {
        workers: toJsNumber(record.get("workers")),
        vehicles: toJsNumber(record.get("vehicles")),
        routes: toJsNumber(record.get("routes")),
        bins: toJsNumber(record.get("bins")),
        zones: toJsNumber(record.get("zones")),
      },
      relationships: {
        assigned_to: toJsNumber(record.get("assigned_to")),
        follows: toJsNumber(record.get("follows")),
        covers: toJsNumber(record.get("covers")),
        has_bin: toJsNumber(record.get("has_bin")),
      },
    });
  } catch (err) {
    console.error("Neo4j graph-summary error:", err.message);
    res.status(500).json({ error: "Failed to get graph summary" });
  } finally {
    await session.close();
  }
});

// ─── POST /neo4j/sync ────────────────────────────────────────────────────────
// Fetches data DIRECTLY from MySQL and builds the real-world graph model:
//   Worker → Vehicle → Route → Bin, Zone → Bin
router.post("/neo4j/sync", async (req, res) => {
  if (!mysqlPool) {
    return res.status(500).json({ error: "MySQL pool not available for sync" });
  }

  const session = getSession();
  try {
    console.log("Neo4j Sync: Starting...");

    // ── Step 1: Fetch all data from MySQL ──────────────────────────────────
    const [workers] = await mysqlPool.query(
      "SELECT worker_id, worker_name, role, assigned_zone, shift_type FROM WORKER"
    );
    const [vehicles] = await mysqlPool.query(
      "SELECT vehicle_id, vehicle_number, capacity, vehicle_status FROM COLLECTION_VEHICLE"
    );
    const [bins] = await mysqlPool.query(
      "SELECT bin_id, zone_id, location, capacity, waste_type, status FROM WASTE_BIN"
    );
    const [zones] = await mysqlPool.query(
      "SELECT zone_id, zone_name, manager_name, zone_status FROM CITY_ZONE"
    );
    const [assignments] = await mysqlPool.query(
      "SELECT assignment_id, vehicle_id, worker_id, assigned_from, assigned_to FROM VEHICLE_WORKER_ASSIGNMENT"
    );
    const [schedules] = await mysqlPool.query(
      "SELECT schedule_id, bin_id, vehicle_id, schedule_time, schedule_status FROM COLLECTION_SCHEDULE"
    );

    console.log(`Neo4j Sync: MySQL data fetched — ${workers.length} workers, ${vehicles.length} vehicles, ${bins.length} bins, ${zones.length} zones, ${assignments.length} assignments, ${schedules.length} schedules`);

    // ── Step 2: Clear existing graph ───────────────────────────────────────
    await session.run("MATCH (n) DETACH DELETE n");
    console.log("Neo4j Sync: Cleared existing graph");

    // ── Step 3: Create Worker nodes ────────────────────────────────────────
    for (const w of workers) {
      await session.run(
        `MERGE (w:Worker {worker_id: $worker_id})
         SET w.worker_name = $worker_name,
             w.role = $role,
             w.assigned_zone = $assigned_zone,
             w.shift_type = $shift_type`,
        {
          worker_id: String(w.worker_id),
          worker_name: w.worker_name || "",
          role: w.role || "",
          assigned_zone: w.assigned_zone || "",
          shift_type: w.shift_type || "",
        }
      );
    }
    console.log(`Neo4j Sync: ${workers.length} Worker nodes created`);

    // ── Step 4: Create Vehicle nodes ───────────────────────────────────────
    for (const v of vehicles) {
      await session.run(
        `MERGE (v:Vehicle {vehicle_id: $vehicle_id})
         SET v.vehicle_number = $vehicle_number,
             v.capacity = $capacity,
             v.vehicle_status = $vehicle_status`,
        {
          vehicle_id: String(v.vehicle_id),
          vehicle_number: v.vehicle_number || "",
          capacity: v.capacity != null ? Number(v.capacity) : 0,
          vehicle_status: v.vehicle_status || "",
        }
      );
    }
    console.log(`Neo4j Sync: ${vehicles.length} Vehicle nodes created`);

    // ── Step 5: Create Zone nodes ──────────────────────────────────────────
    for (const z of zones) {
      await session.run(
        `MERGE (z:Zone {zone_id: $zone_id})
         SET z.zone_name = $zone_name,
             z.manager_name = $manager_name,
             z.zone_status = $zone_status`,
        {
          zone_id: String(z.zone_id),
          zone_name: z.zone_name || "",
          manager_name: z.manager_name || "",
          zone_status: z.zone_status || "",
        }
      );
    }
    console.log(`Neo4j Sync: ${zones.length} Zone nodes created`);

    // ── Step 6: Create Bin nodes ───────────────────────────────────────────
    for (const b of bins) {
      await session.run(
        `MERGE (b:Bin {bin_id: $bin_id})
         SET b.zone_id = $zone_id,
             b.location = $location,
             b.capacity = $capacity,
             b.waste_type = $waste_type,
             b.bin_status = $bin_status`,
        {
          bin_id: String(b.bin_id),
          zone_id: String(b.zone_id),
          location: b.location || "",
          capacity: b.capacity != null ? Number(b.capacity) : 0,
          waste_type: b.waste_type || "",
          bin_status: b.status || "",
        }
      );
    }
    console.log(`Neo4j Sync: ${bins.length} Bin nodes created`);

    // ── Step 7: Create (Worker)-[:ASSIGNED_TO]->(Vehicle) ──────────────────
    let assignmentCount = 0;
    for (const a of assignments) {
      const result = await session.run(
        `MATCH (w:Worker {worker_id: $worker_id})
         MATCH (v:Vehicle {vehicle_id: $vehicle_id})
         MERGE (w)-[r:ASSIGNED_TO]->(v)
         SET r.assignment_id = $assignment_id
         RETURN r`,
        {
          worker_id: String(a.worker_id),
          vehicle_id: String(a.vehicle_id),
          assignment_id: String(a.assignment_id),
        }
      );
      if (result.records.length > 0) assignmentCount++;
    }
    console.log(`Neo4j Sync: ${assignmentCount} ASSIGNED_TO relationships created`);

    // ── Step 8: Create Route nodes & (Vehicle)-[:FOLLOWS]->(Route) ────────
    // Group bins by vehicle from schedules to form routes
    const vehicleBinMap = {};
    for (const s of schedules) {
      const vid = String(s.vehicle_id);
      if (!vehicleBinMap[vid]) vehicleBinMap[vid] = new Set();
      vehicleBinMap[vid].add(String(s.bin_id));
    }

    let routeCount = 0;
    let followsCount = 0;
    let coversCount = 0;

    for (const [vehicleId, binSet] of Object.entries(vehicleBinMap)) {
      const routeId = `ROUTE_${vehicleId}`;
      const binCount = binSet.size;

      // Create the Route node
      await session.run(
        `MERGE (r:Route {route_id: $route_id})
         SET r.vehicle_id = $vehicle_id,
             r.route_name = $route_name,
             r.total_bins = $total_bins`,
        {
          route_id: routeId,
          vehicle_id: vehicleId,
          route_name: `Route for Vehicle ${vehicleId}`,
          total_bins: binCount,
        }
      );
      routeCount++;

      // Create (Vehicle)-[:FOLLOWS]->(Route)
      const followResult = await session.run(
        `MATCH (v:Vehicle {vehicle_id: $vehicle_id})
         MATCH (r:Route {route_id: $route_id})
         MERGE (v)-[rel:FOLLOWS]->(r)
         RETURN rel`,
        {
          vehicle_id: vehicleId,
          route_id: routeId,
        }
      );
      if (followResult.records.length > 0) followsCount++;

      // Create (Route)-[:COVERS]->(Bin) for each bin in this route
      for (const binId of binSet) {
        const coverResult = await session.run(
          `MATCH (r:Route {route_id: $route_id})
           MATCH (b:Bin {bin_id: $bin_id})
           MERGE (r)-[rel:COVERS]->(b)
           RETURN rel`,
          {
            route_id: routeId,
            bin_id: binId,
          }
        );
        if (coverResult.records.length > 0) coversCount++;
      }
    }
    console.log(`Neo4j Sync: ${routeCount} Route nodes created`);
    console.log(`Neo4j Sync: ${followsCount} FOLLOWS relationships created`);
    console.log(`Neo4j Sync: ${coversCount} COVERS relationships created`);

    // ── Step 9: Create (Zone)-[:HAS_BIN]->(Bin) ───────────────────────────
    let hasBinCount = 0;
    for (const b of bins) {
      const result = await session.run(
        `MATCH (z:Zone {zone_id: $zone_id})
         MATCH (b:Bin {bin_id: $bin_id})
         MERGE (z)-[r:HAS_BIN]->(b)
         RETURN r`,
        {
          zone_id: String(b.zone_id),
          bin_id: String(b.bin_id),
        }
      );
      if (result.records.length > 0) hasBinCount++;
    }
    console.log(`Neo4j Sync: ${hasBinCount} HAS_BIN relationships created`);

    const summary = {
      success: true,
      message: "Neo4j graph synced — Worker → Vehicle → Route → Bin model",
      counts: {
        workers: workers.length,
        vehicles: vehicles.length,
        routes: routeCount,
        bins: bins.length,
        zones: zones.length,
        assigned_to: assignmentCount,
        follows: followsCount,
        covers: coversCount,
        has_bin: hasBinCount,
      },
    };
    console.log("Neo4j Sync: Complete!", summary.counts);
    res.json(summary);
  } catch (err) {
    console.error("Neo4j sync error:", err.message);
    console.error("Neo4j sync stack:", err.stack);
    res.status(500).json({ error: "Failed to sync data to Neo4j", details: err.message });
  } finally {
    await session.close();
  }
});

module.exports = { initNeo4jRoutes, neo4jRouter: router };
