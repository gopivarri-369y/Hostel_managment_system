const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const session = require('express-session');
const app = express();
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const { Pool } = require('pg');
const port = 3300;
let mailOptions = {};

// Middleware to parse incoming request bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from 'static' directory
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
// const pool = new Pool({
//     user: 'postgres',         // e.g., 'postgres'
//     host: '127.0.0.1',        // use 127.0.0.1 instead of localhost
//     database: 'postgres',     // the database name you created
//     password: 'Neelima@369',   // your PostgreSQL password
//     port: 3369,               // your PostgreSQL port (change if needed)
//     // ssl: { rejectUnauthorized: false } // Required for Render's SSL connections, adjust as needed
// });


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

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ pgsql Connection Failed:', err);
    } else {
        console.log('✅ Connected to Clever Cloud pgsql!');
        release();
    }
});

// Export pool if needed elsewhere
module.exports = pool;

// -----------------
// GET Routes
// -----------------

// Serve the home page at the root URL
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

// -----------------
// POST Routes
// -----------------

// Student registration route
app.post('/student/register', async (req, res) => {
    const { firstname, lastname, gender, age, email, password, phone } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if email/phone exists
    const checkquery = `SELECT * FROM students WHERE email = $1 AND phone = $2`;
    
    pool.query(checkquery, [email, phone], (err, existingUsers) => {
        if (err) {
            console.error('Error checking existing user:', err);
            return res.status(500).send('Server Error');
        }

        if (existingUsers.rows.length > 0) {
            return res.send("The user already exists");
        }

        // Insert student data (using RETURNING to get inserted row, if needed)
        const studentQuery = `INSERT INTO students (firstname, lastname, gender, age, email, phone, password) 
                            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        
        pool.query(studentQuery, [firstname, lastname, gender, age, email, phone, hashedPassword], 
            (err, results) => {
                if (err) {
                    console.error('Error inserting student:', err);
                    return res.status(500).send('Server Error');
                }

                // Fetch all available hostels from owners_room
                const hostelQuery = `SELECT * FROM owners_room`;
                
                pool.query(hostelQuery, [], (err, owners) => {
                    if (err) {
                        console.error('Error fetching hostels:', err);
                        return res.status(500).send('Server Error');
                    }

                    // Set session variables
                    req.session.loggedin = true;
                    req.session.email = email;
                    req.session.firstname = firstname;
                    req.session.lastname = lastname;

                    // Render the hostel page with all data
                    res.render('student.ejs', {
                        owners: owners.rows,
                        email,
                        firstname,
                        lastname,
                        student_id: results.rows[0].student_id
                    });
                });
            }
        );
    });
});

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'gopivarri5612v@gmail.com', // Replace with your email
        pass: 'ixxr bpfq nhwa zgpb' // Replace with your email password or app-specific password
    }
});

// Route to send an email to the owner
app.post('/send-email', (req, res) => {
    const { studentEmail, studentName, ownerEmail, ownerName } = req.body;

    const mailOptions = {
        from: 'your_email@gmail.com', // Your Gmail account
        to: ownerEmail, // Send to the owner's email
        replyTo: studentEmail, // Student's email address as "reply-to"
        subject: `Student Interest in Your Hostel: ${studentName}`,
        text: `Dear ${ownerName},\n\nA student named ${studentName} is interested in your hostel. Here are the details:\n\nName: ${studentName}\nEmail: ${studentEmail}\nPlease reach out to them for further details.\n\nBest regards,\nYour Company`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send('Error sending email');
        }
        console.log('Email sent: ' + info.response);
        res.send('Email sent successfully');
    });
});



app.post('/login-owner', async (req, res) => {
    try {
        const { types, email, password } = req.body;
        console.log(req.body);
        console.log(types);

        // Whitelist allowed table names to prevent SQL injection
        let tableName;
        if (types === "owners") {
            tableName = "owners";
        } else if (types === "students") {
            tableName = "students";
        } else {
            return res.status(400).send('Invalid user type');
        }

        // Query to find the user by email
        const query = `SELECT * FROM ${tableName} WHERE email = $1`;
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(401).send('Invalid email');
        }

        console.log("The results are:", result.rows);
        const user = result.rows[0];

        // Compare hashed password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).send('Invalid password');
        }

        // If the type is "owners", fetch the owner room details
        if (types === "owners") {
            const querylog = `
                SELECT * FROM owners_room 
                INNER JOIN owners ON owners_room.owner_id = owners.owner_id 
                WHERE owners.owner_id = $1
            `;
            const roomsResult = await pool.query(querylog, [user.owner_id]);
            if (roomsResult.rows.length === 0) {
                return res.status(404).send('No owner room data found');
            }
            const owner_rooms = roomsResult.rows[0];
            console.log("The owner's room is:", owner_rooms);
            return res.render('owner-dashboard.ejs', { owner: owner_rooms });
        }
        // If the type is "students", fetch hostel details and set session
        else if (types === "students") {
            const hostelQuery = `SELECT * FROM owners_room`;
            const ownersResult = await pool.query(hostelQuery);
            // Set session variables
            req.session.loggedin = true;
            req.session.email = user.email;
            req.session.firstname = user.firstname;
            req.session.lastname = user.lastname;
            return res.render('student.ejs', {
                owners: ownersResult.rows,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                student_id: user.student_id
            });
        }
    } catch (error) {
        console.error('Error in login-owner:', error);
        return res.status(500).send('Server Error');
    }
});






// Route to handle owner login
// app.post('/login-owner', async (req, res) => {
//     const { types, email, password } = req.body;

//     // Whitelist table names to prevent SQL injection
//     let tableName;
//     if (types === "owners") {
//         tableName = "owners";
//     } else if (types === "students") {
//         tableName = "students";
//     } else {
//         return res.status(400).send('Invalid user type');
//     }
    
//     const query = `SELECT * FROM ${tableName} WHERE email = $1`;
//     pool.query(query, [email], async (err, results) => {
//         if (err) {
//             console.error('Error finding owner:', err);
//             return res.status(500).send('Server Error');
//         }

//         if (results.rows.length === 0) {
//             return res.status(401).send('Invalid email');
//         }
//         console.log("the results are:", results.rows);
//         const owner = results.rows[0];

//         // Compare hashed password
//         const match = await bcrypt.compare(password, owner.password);
//         if (!match) {
//             return res.status(401).send('Invalid password');
//         }
//         if (types === "owners") {
//             const querylog = `SELECT * FROM owners_room 
//                     INNER JOIN owners ON owners_room.owner_id = owners.owner_id 
//                     WHERE owners.owner_id = $1`;
//             pool.query(querylog, [owner.owner_id], (err, rooms) => {
//                 if (err) {
//                     console.log("SQL error:", err);
//                     return res.status(500).send("Server error");
//                 }
//                 console.log(rooms.rows);
//                 const owner_rooms = rooms.rows[0];
//                 console.log("The owner's room is:", owner_rooms);
//                 res.render('owner-dashboard.ejs', {
//                     owner: owner_rooms
//                 });
//             });
//         } else if (types === "students") {
//             const hostelQuery = `SELECT * FROM owners_room`;
//             pool.query(hostelQuery, [], (err, ownersData) => {
//                 if (err) {
//                     console.error('Error fetching hostels:', err);
//                     return res.status(500).send('Server Error');
//                 }
//                 console.log(owner);
//                 // Set session variables
//                 req.session.loggedin = true;
//                 req.session.email = owner.email;
//                 req.session.firstname = owner.firstname;
//                 req.session.lastname = owner.lastname;

//                 // Render the hostel page with all data
//                 res.render('student.ejs', {
//                     owners: ownersData.rows,
//                     email: owner.email,
//                     firstname: owner.firstname,
//                     lastname: owner.lastname,
//                     student_id: owner.student_id
//                 });
//             });
//         }
//     });
// });


app.get('/update/:owner_id', (req, res) => {
    const ownerId = req.params.owner_id;
    console.log("Owner ID from URL:", ownerId);
    // Query the owners_room table for this owner_id
    const query = `SELECT * FROM owners_room WHERE owner_id = $1`;
    pool.query(query, [ownerId], (err, roomResults) => {
        if (err) {
            console.error('Error updating owner data:', err);
            return res.status(500).send('Server Error');
        }
        // Check if we got any row from owners_room
        if (roomResults.rows.length === 0) {
            return res.status(404).send('No room data found for this owner.');
        }
        const ownersData = roomResults.rows[0]; // This object should have owner_id

        console.log("Owners room data:", roomResults.rows);

        // Query the owners table for additional owner details
        const queryOwner = `SELECT * FROM owners WHERE owner_id = $1`;
        pool.query(queryOwner, [ownerId], (err, ownerResults) => {
            if (err) {
                console.error('Error fetching owner data:', err);
                return res.status(500).send('Server Error');
            }
            if (ownerResults.rows.length === 0) {
                return res.status(404).send('No owner data found.');
            }
            const ownerData = ownerResults.rows[0];

            // Render the "updation.ejs" view, passing both room data and owner data.
            // In your EJS, "owners" refers to the owners_room data.
            res.render("updation.ejs", {
                owners: ownersData,
                owner: ownerData
            });
        });
    });
});

// Dashboard route (for demonstration)
app.get('/dashboard', (req, res) => {
    if (req.session.owner) {
        res.send(`
            <h1>Welcome, ${req.session.owner.firstname} ${req.session.owner.lastname}</h1>
            <p>Email: ${req.session.owner.email}</p>
            <p>Hostel: ${req.session.owner.hostel}</p>
        `);
    } else {
        res.redirect('/login');
    }
});

// Update owner room details route
app.patch('/updated/:ownerId', (req, res) => {
    const { college, hostel_name, roomsfor, twoshare, threeshare, fourshare, tworent, threerent, fourrent } = req.body;
    const owner_id = req.params.ownerId;
    
    const query = `
        UPDATE owners_room
        SET 
            college = $1,
            hostel_name = $2,
            roomsfor = $3,
            twoshare = $4,
            threeshare = $5,
            fourshare = $6,
            tworent = $7,
            threerent = $8,
            fourrent = $9
        WHERE owner_id = $10`;
    
    console.log('Executing query:', query);
    
    pool.query(query, [
        college,
        hostel_name,
        roomsfor,
        twoshare,
        threeshare,
        fourshare,
        tworent || 0,
        threerent || 0,
        fourrent || 0,
        owner_id
    ], (err, results) => {
        if (err) {
            console.error('Error updating owner data:', err);
            return res.status(500).send('Server Error');
        }
        
        const query9 = `SELECT * FROM owners_room WHERE owner_id = $1`;
        pool.query(query9, [owner_id], (err, results) => {
            if (err) {
                console.log("Error in fetching owner room data");
                return res.status(500).send("Server error");
            }
            let ownerroom = results.rows[0];
            res.render("owner-dashboard.ejs", {
                owner: ownerroom
            });
        });
    });
});

// Route to get update form for owner room details
app.get('/update/:owner_id', (req, res) => {
    const ownerId = req.params.owner_id;
    console.log(ownerId);
    const query = `SELECT * FROM owners_room WHERE owner_id = $1`;
    pool.query(query, [ownerId], (err, results) => {
        if (err) {
            console.error('Error update owner data:', err);
            return res.status(500).send('Server Error');
        }
        const owner = results.rows[0];
        console.log("The result is:", results.rows);
        const query10 = `SELECT * FROM owners WHERE owner_id = $1`;
        pool.query(query10, [ownerId], (err, results) => {
            if (err) {
                console.error('Error update owner data:', err);
                return res.status(500).send('Server Error');
            }
            res.render("updation.ejs", {
                owners: owner,
                owner: results.rows[0]
            });
        });
    });
});

app.post('/login-owner/delete', (req, res) => {
    res.send("What do you want to delete");
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.sendFile(path.join(__dirname, 'static', 'public', 'html', 'student_login.html'));
});

// Owner registration route
app.post('/owner/register', async (req, res) => {
    const {
        firstname, lastname, gender, age, email, password, phone, 
        collage, pincode, Hostel, rooms_for, 
        twoshare, rent_2, threeshare, rent_3, fourshare, rent_4
    } = req.body;

    console.log(firstname, lastname, gender, age, email, password, phone, 
               collage, pincode, Hostel, rooms_for, 
               twoshare, rent_2, threeshare, rent_3, fourshare, rent_4);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    pool.query('SELECT * FROM owners WHERE email = $1 OR phone = $2', 
        [email, phone], 
        (err, existingUsers) => {
            if (err) {
                console.error('Error checking existing user:', err);
                return res.status(500).send('Server Error');
            }

            if (existingUsers.rows.length > 0) {
                return res.status(400).send('User already exists');
            }

            // Get the next owner_id
            pool.query('SELECT MAX(owner_id) as max_id FROM owners', [], (err, results) => {
                if (err) {
                    console.error('Error getting max owner_id:', err);
                    return res.status(500).send('Server Error');
                }

                const owner_id = ((results.rows[0]?.max_id || 0) + 1);

                // Insert into owners table
                pool.query(
                    `INSERT INTO owners (owner_id, fname, lname, gender, age, email, phone, password) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING owner_id`,
                    [owner_id, firstname, lastname, gender, age, email, phone, hashedPassword],
                    (err, ownerResult) => {
                        if (err) {
                            console.error('Error inserting owner:', err);
                            return res.status(500).send('Server Error');
                        }

                        // Insert into owners_room table
                        pool.query(
                            `INSERT INTO owners_room 
                             (college, hostel_name, roomsfor, twoshare, tworent, threeshare, threerent, 
                              fourshare, fourrent, pincode, owner_id)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                            [
                                collage, 
                                Hostel, 
                                rooms_for,
                                twoshare || 0,
                                rent_2 || 0,
                                threeshare || 0,
                                rent_3 || 0,
                                fourshare || 0,
                                rent_4 || 0,
                                pincode,
                                owner_id
                            ],
                            (err, roomResult) => {
                                if (err) {
                                    console.error('Error inserting room details:', err);
                                    return res.status(500).send('Server Error');
                                }

                                // Render the dashboard
                                res.render('owner-dashboard.ejs', {
                                    owner: req.body
                                });
                            }
                        );
                    }
                );
            });
        }
    );
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
