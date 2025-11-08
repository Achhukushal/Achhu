import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "achhuachhu05",
  database: "adoptlink",   // ✅ must match the DB you inserted data into
});

export default pool;
