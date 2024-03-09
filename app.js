const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Ijse@1234',
  database: 'sgm'
});

const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: 'Ijse@1234',
  database: 'sgm'
});


connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

// Routes
// POST route to handle user registration
app.post('/register', (req, res) => {
  const { username, firstName, secondName, lastName, telephone, email, userType, nicNumber, password } = req.body;

  let role = '';
  if (userType === 'owner') {
    role = 'owner';
  } else if (userType === 'member') {
    role = 'member';
  }

  const sql = `INSERT INTO users (username, first_name, second_name, last_name, telephone, email, role, nic, password) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [username, firstName, secondName, lastName, telephone, email, role, nicNumber, password];

  // Execute the SQL query
  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(201).json({ message: 'User registered successfully' });
    }
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check if the username and password are provided
  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide username and password' });
  }

  // Query the database to check if the user exists and the password is correct
  pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (error, results) => {
    if (error) {
      console.error('Error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    // If no user found with the given credentials, return an error
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Extract user role from the database results
    const { role } = results[0];
    console.log(results);

    // Send the user role back to the client
    res.status(200).json({ role });
  });
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
