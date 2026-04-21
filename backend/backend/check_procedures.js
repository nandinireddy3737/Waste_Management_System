const mysql = require("mysql2/promise");

async function checkProcedures() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Nandini@01",
    database: "waste_management"
  });

  try {
    const [rows] = await connection.query("SHOW PROCEDURE STATUS WHERE Db = 'waste_management'");
    console.log("Procedures:", rows.map(r => r.Name));
  } catch (err) {
    console.error(err.message);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

checkProcedures();
