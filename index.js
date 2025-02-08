require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const session = require('express-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

const app = express();
const port = process.env.PORT || 3300;
let mailOptions = {};

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'static', 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(session({
    secret: 'gopi-varri',
    resave: false,
    saveUninitialized: true,
}));
app.use(methodOverride('_method'));

// PostgreSQL connection setup
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    // Render often requires SSL; if needed, include these options:
    ssl: {
      rejectUnauthorized: false,
    },
});

// Test connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ PostgreSQL Connection Failed:', err);
    } else {
        console.log('✅ Connected to PostgreSQL!');
        release();
    }
});

// ----------------------------
// GET Routes
// ----------------------------

// Serve the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'public', 'html', 'home.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'public', 'html', 'home.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'public', 'html', 'about.html'));
});

app.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'public', 'html', 'student_register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'public', 'html', 'student_login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'public', 'html', 'register.html'));
});

app.get('/studentreg', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'public', 'html', 'student_register.html'));
});

app.get('/ownerreg', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'public', 'html', 'owner_register.html'));
});

// ----------------------------
// POST Routes
// ----------------------------

// Student registration route
app.post('/student/register', async (req, res) => {
    const { firstname, lastname, gender, age, email, password, phone } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // Check if the user already exists by email or phone
        const existingUser = await pool.query(
            'SELECT * FROM students WHERE email = $1 OR phone = $2',
            [email, phone]
        );

        if (existingUser.rows.length > 0) {
            return res.send("The user already exists");
        }

        // Insert the new student into the database
        const newStudent = await pool.query(
            `INSERT INTO students (firstname, lastname, gender, age, email, phone, password)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [firstname, lastname, gender, age, email, phone, hashedPassword]
        );

        // Fetch available hostels (owner rooms)
        const hostels = await pool.query('SELECT * FROM owners_room');

        // Set session variables
        req.session.loggedin = true;
        req.session.email = email;
        req.session.firstname = firstname;
        req.session.lastname = lastname;

        res.render('student.ejs', {
            owners: hostels.rows,
            email,
            firstname,
            lastname,
            student_id: newStudent.rows[0].student_id
        });

    } catch (error) {
        console.error('Error in student registration:', error);
        res.status(500).send('Server Error');
    }
});

// Owner login route
app.post('/login-owner', async (req, res) => {
    const { types, email, password } = req.body;

    try {
        const query = `SELECT * FROM ${types} WHERE email = $1`;
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(401).send('Invalid email');
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).send('Invalid password');
        }

        if (types === "owners") {
            const rooms = await pool.query(
                `SELECT * FROM owners_room 
                 INNER JOIN owners ON owners_room.owner_id = owners.owner_id 
                 WHERE owners.owner_id = $1`,
                [user.owner_id]
            );
            
            res.render('owner-dashboard.ejs', {
                owner: rooms.rows[0]
            });
        } else if (types === "students") {
            const hostels = await pool.query('SELECT * FROM owners_room');
            
            req.session.loggedin = true;
            req.session.email = user.email;
            req.session.firstname = user.firstname;
            req.session.lastname = user.lastname;

            res.render('student.ejs', {
                owners: hostels.rows,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                student_id: user.student_id
            });
        }
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).send('Server Error');
    }
});

// Update route for owner room details
app.patch('/updated/:ownerId', async (req, res) => {
    const { 
        college, hostel_name, roomsfor, 
        twoshare, threeshare, fourshare, 
        tworent, threerent, fourrent 
    } = req.body;
    const owner_id = req.params.ownerId;

    try {
        await pool.query(
            `UPDATE owners_room
             SET college = $1, hostel_name = $2, roomsfor = $3,
                 twoshare = $4, threeshare = $5, fourshare = $6,
                 tworent = $7, threerent = $8, fourrent = $9
             WHERE owner_id = $10`,
            [college, hostel_name, roomsfor, twoshare, threeshare, fourshare,
             tworent || 0, threerent || 0, fourrent || 0, owner_id]
        );

        const ownerRoom = await pool.query(
            'SELECT * FROM owners_room WHERE owner_id = $1',
            [owner_id]
        );

        res.render("owner-dashboard.ejs", {
            owner: ownerRoom.rows[0]
        });
    } catch (error) {
        console.error('Error updating owner data:', error);
        res.status(500).send('Server Error');
    }
});

// Owner registration route
app.post('/owner/register', async (req, res) => {
    const {
        firstname, lastname, gender, age, email, password, phone,
        collage, pincode, Hostel, rooms_for,
        twoshare, rent_2, threeshare, rent_3, fourshare, rent_4
    } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if the owner already exists by email or phone
        const existingUser = await pool.query(
            'SELECT * FROM owners WHERE email = $1 OR phone = $2',
            [email, phone]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).send('User already exists');
        }

        // Insert owner data and return the new owner_id
        const newOwner = await pool.query(
            `INSERT INTO owners (fname, lname, gender, age, email, phone, password)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING owner_id`,
            [firstname, lastname, gender, age, email, phone, hashedPassword]
        );

        // Insert room details for the owner
        await pool.query(
            `INSERT INTO owners_room 
             (college, hostel_name, roomsfor, twoshare, tworent, threeshare, threerent,
              fourshare, fourrent, pincode, owner_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [collage, Hostel, rooms_for, twoshare || 0, rent_2 || 0,
             threeshare || 0, rent_3 || 0, fourshare || 0, rent_4 || 0,
             pincode, newOwner.rows[0].owner_id]
        );

        res.render('owner-dashboard.ejs', {
            owner: req.body
        });
    } catch (error) {
        console.error('Error in owner registration:', error);
        res.status(500).send('Server Error');
    }
});

// ----------------------------
// Email Configuration (Nodemailer)
// ----------------------------

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'gopivarri5612v@gmail.com', // Replace with your email if needed
        pass: 'ixxr bpfq nhwa zgpb'          // Replace with your email password or app-specific password
    }
});

// ----------------------------
// Start the Server
// ----------------------------
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
