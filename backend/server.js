require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const authRoutes = require('./routes/auth');
const bloodRoutes = require('./routes/blood');
const userRoutes = require("./routes/user");
const donorRoutes = require("./routes/donor");
const medicineRoutes = require("./routes/medicine");
const oxygenRoutes = require("./routes/oxygen");
const doctorRoutes = require("./routes/doctors");
const hospitalRoutes = require("./routes/hospitals");
const notificationRoutes = require("./routes/notifications");
const pharmacyRoutes = require("./routes/pharmacy");
const oxygenProviderRoutes = require("./routes/oxygenProvider");
const authenticateToken = require("./middleware/auth");
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/blood', bloodRoutes);
app.use("/api/users", userRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/oxygen", oxygenRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/oxygen-provider", oxygenProviderRoutes);

app.get('/', (req, res) => {
  res.send('HealthConnect API is running');
});

app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.get("/api/test-auth", authenticateToken, (req, res) => {
    res.json({
        message: "Authentication successful",
        user: req.user
    });
});
app.listen(PORT, '0.0.0.0', () => {
  console.log(`HealthConnect API running on port ${PORT}`);
});
