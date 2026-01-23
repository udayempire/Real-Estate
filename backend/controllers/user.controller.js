import pool from "../db.js";

export const getUsers = async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.json(result.rows);
};

export const createUser = async (req, res) => {
  const { name, email } = req.body;
  const result = await pool.query(
    "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
    [name, email]
  );
  res.status(201).json(result.rows[0]);
};
