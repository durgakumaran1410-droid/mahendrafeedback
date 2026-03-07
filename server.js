const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// SQLite Database Connection & Initialization
// This automatically creates a local database file: database.sqlite
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening SQLite database:', err.message);
    } else {
        console.log('Connected to the SQLite zero-config database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Create users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'admin'
        )`);

        // Create feedback table
        db.run(`CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            submitter_name TEXT NOT NULL,
            event_name TEXT NOT NULL,
            submitter_role TEXT NOT NULL,
            department TEXT,
            class TEXT,
            section TEXT,
            year TEXT,
            rating INTEGER NOT NULL,
            comments TEXT,
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (!err) {
                // For existing databases, ensure the columns exist
                db.serialize(() => {
                    db.run("ALTER TABLE feedback ADD COLUMN department TEXT", (e) => { });
                    db.run("ALTER TABLE feedback ADD COLUMN class TEXT", (e) => { });
                    db.run("ALTER TABLE feedback ADD COLUMN section TEXT", (e) => { });
                    db.run("ALTER TABLE feedback ADD COLUMN year TEXT", (e) => { });
                });
            }
        });

        // Insert default principal user (Password: password123)
        // INSERT OR REPLACE ensures the hash is updated if the username already exists
        db.run(`INSERT OR REPLACE INTO users (id, username, password_hash, role) 
                VALUES (1, 'principal', '$2b$10$UeFM4xcrgSc0wenf5uX8SegpA95BB7PH5e.Uj1VI7NMQw1j73KxLu', 'admin')`);
    });
}

// Middleware for authenticating JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided!' });

    jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid Token!' });
        req.user = user;
        next();
    });
};

// Routes

// 1. Submit Feedback (Public Access via Form)
app.post('/api/feedback', (req, res) => {
    const { submitter_name, event_name, submitter_role, department, class_name, section, year, rating, comments } = req.body;

    if (!submitter_name || !event_name || !submitter_role || !rating) {
        return res.status(400).json({ message: 'Name, Event name, role, and rating are required.' });
    }

    const query = 'INSERT INTO feedback (submitter_name, event_name, submitter_role, department, class, section, year, rating, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.run(query, [
        submitter_name,
        event_name,
        submitter_role,
        department || null,
        class_name || null,
        section || null,
        year || null,
        rating,
        comments || null
    ], function (err) {
        if (err) {
            console.error('Error inserting feedback:', err.message);
            return res.status(500).json({ message: 'Error submitting feedback.' });
        }
        res.status(201).json({ message: 'Feedback submitted successfully!' });
    });
});

// 2. Admin Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const query = 'SELECT * FROM users WHERE username = ?';
    db.get(query, [username], async (err, user) => {
        if (err) {
            console.error('Error fetching user:', err.message);
            return res.status(500).json({ message: 'Server error.' });
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '1h' });

        res.json({ message: 'Login successful!', token });
    });
});

// 3. Fetch All Feedback (Admin Only)
app.get('/api/feedback', authenticateToken, (req, res) => {
    const query = 'SELECT * FROM feedback ORDER BY submitted_at DESC';
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching feedback:', err.message);
            return res.status(500).json({ message: 'Error fetching feedback.' });
        }
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
