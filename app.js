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
  const { username, firstName, secondName, lastName, telephone, email, userType, nicNumber, gymCategory, gymLocation, gymPhotos } = req.body;

  let role = '';
  if (userType === 'owner') {
    role = 'owner';
  } else if (userType === 'member') {
    role = 'member';
  }

  const sql = `INSERT INTO users (username, first_name, second_name, last_name, telephone, email, role, nic, gym_category, gym_location, gym_photo_url) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [username, firstName, secondName, lastName, telephone, email, role, nicNumber, gymCategory, gymLocation, gymPhotos];

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


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
