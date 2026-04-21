/**
 * Neo4j connection for Graph-based relationship queries.
 * Independent from MySQL and MongoDB — does not touch existing pool, queries, or routes.
 */
const neo4j = require("neo4j-driver");

const NEO4J_URI = process.env.NEO4J_URI || "bolt://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "Nandini@01";

let driver = null;

function getDriver() {
  if (!driver) {
    driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
      { encrypted: false }
    );
  }
  return driver;
}

async function verifyNeo4jConnection() {
  try {
    const d = getDriver();
    // Version-safe connectivity check: run a trivial query
    const session = d.session({ database: "neo4j" });
    await session.run("RETURN 1");
    await session.close();
    console.log("Neo4j Connected");
    return true;
  } catch (err) {
    console.warn("Neo4j connection failed (non-fatal):", err.message);
    return false;
  }
}

function getSession(database) {
  return getDriver().session({ database: database || "neo4j" });
}

async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

module.exports = { getDriver, getSession, verifyNeo4jConnection, closeDriver };
