const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const session = require('express-session');
const app = express();
// Route to handle owner registration form submission
const bcrypt = require('bcrypt');
const { name } = require('ejs');
const { text } = require('body-parser');
const methodOverride = require('method-override');
const port = 3300;
let mailOptions={};

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

// Create a MySQL connection pool
// const pool = mysql.createPool({
//     host: '127.0.0.1',
//     user: 'root',
//     password: 'Satyaveni@369', // Replace with your MySQL password
//     database: 'student_registration'
// });


// const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ MySQL Connection Failed:', err);
    } else {
        console.log('✅ Connected to Clever Cloud MySQL!');
        connection.release();
    }
});

module.exports = pool;



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

app.get('/studentreg',(req,res)=>{
    res.sendFile(path.join(__dirname,'static', 'public', 'html','student_register.html'))
})
app.get('/ownerreg',(req,res)=>{
    res.sendFile(path.join(__dirname,'static', 'public', 'html','owner_register.html'))
})




// Route to handle student registration form submission
// Route to handle student form submission and fetching matching owners
app.post('/student/register', async (req, res) => {
    const { firstname, lastname, gender, age, email, password, phone } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if email/phone exists
    const checkquery = `SELECT * FROM students WHERE email = ? AND phone = ?`;
    
    pool.execute(checkquery, [email, phone], (err, existingUsers) => {
        if (err) {
            console.error('Error checking existing user:', err);
            return res.status(500).send('Server Error');
        }

        if (existingUsers.length > 0) {
            return res.send("The user already exists");
        }

        // Insert student data
        const studentQuery = `INSERT INTO students (firstname, lastname, gender, age, email, phone, password) 
                            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        pool.execute(studentQuery, [firstname, lastname, gender, age, email, phone, hashedPassword], 
            (err, results) => {
                if (err) {
                    console.error('Error inserting student:', err);
                    return res.status(500).send('Server Error');
                }

                // Fetch all available hostels
                const hostelQuery = `SELECT * FROM owners_room`;
                
                pool.execute(hostelQuery, [], (err, owners) => {
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
                        owners,
                        email,
                        firstname,
                        lastname,
                        email
                    });
                });
            }
        );
    });
});







// sending the mail
// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
    // service: 'gmail', // Use any email service like Gmail, Outlook, etc.
    host : 'smtp.gmail.com',
    port : 587,
    secure : false,
    auth: {
        user: 'gopivarri5612v@gmail.com', // Replace with your email
        pass: 'ixxr bpfq nhwa zgpb' // Replace with your email password or app-specific password if 2FA is enabled
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
        text: `Dear ${ownerName},\n\nA student named ${studentName} is interested in your hostel. Here are the details:\n\n
        Name: ${studentName}\n
        Email: ${studentEmail}\n
        Please reach out to them for further details.\n\nBest regards,\nYour Company`
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




// route to handle the ownerlogin
app.post('/login-owner', (req, res) => {
    const { types,email, password } = req.body;

    // Find owner by email
    console.log(req.body);
    console.log(types);
    const query = `SELECT * FROM ${types} WHERE email = ?`;
    pool.execute(query, [email], async (err, results) => {
        if (err) {
            console.error('Error finding owner:', err);
            return res.status(500).send('Server Error');
        }

        if (results.length === 0) {
            return res.status(401).send('Invalid email ');
        }
        console.log("the results are the ",results);
        const owner = results[0];

        // Compare hashed password
        const match = await bcrypt.compare(password, owner.password);

        if (!match) {
            return res.status(401).send('Invalid  password');
        }
        if(types === "owners"){
            const querylog = `SELECT * FROM owners_room 
                    INNER JOIN owners ON owners_room.owner_id = owners.owner_id 
                    WHERE owners.owner_id = ?`;
            pool.execute(querylog,[owner.owner_id],(err,rooms)=>{
                if(err){
                    console.log("sql error ");
                    res.status(500).send("server error");
                }
                console.log(rooms);
                const owner_rooms = rooms[0];
                console.log("the owners room are the ",owner_rooms);
                res.render('owner-dashboard.ejs',{
                    owner: owner_rooms
                })
            })
        }
        else if(types == "students"){
            const hostelQuery = `SELECT * FROM owners_room`;
                var firstname = owner.firstname;
                var lastname = owner.lastname;
                var email = owner.email;
                pool.execute(hostelQuery, [], (err, owners) => {
                    if (err) {
                        console.error('Error fetching hostels:', err);
                        return res.status(500).send('Server Error');
                    }
                    console.log(owner);
                    var student_id = owner.student_id;
                    // Set session variables
                    req.session.loggedin = true;
                    req.session.email = email;
                    req.session.firstname = firstname;
                    req.session.lastname = lastname;

                    // Render the hostel page with all data
                    res.render('student.ejs', {
                        owners,
                        email,
                        firstname,
                        lastname,
                        student_id,
                        email
                    });
                });
        }
        // Render the page with owner data
        // console.log("th owner details are the ",owner);
        // res.render('owner-dashboard.ejs', {
        //     owner:owner
        // });
    });
});


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



// Add method-override middleware
app.use(methodOverride('_method'));


// Your existing route
app.patch('/updated/:ownerId', (req, res) => {
    const { 
        college, 
        hostel_name, 
        roomsfor, 
        twoshare, 
        threeshare, 
        fourshare, 
        tworent, 
        threerent, 
        fourrent 
    } = req.body;
    
    const owner_id = req.params.ownerId;
    
    const query = `
        UPDATE owners_room
        SET 
            college = ?,
            hostel_name = ?,
            roomsfor = ?,
            twoshare = ?,
            threeshare = ?,
            fourshare = ?,
            tworent = ?,
            threerent = ?,
            fourrent = ?
        WHERE owner_id = ?`;
    
    console.log('Executing query:', query);
    
    pool.execute(query, [
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
        
        const query9 = `SELECT * FROM owners_room WHERE owner_id = ?`;
        pool.execute(query9, [owner_id], (err, results) => {
            if (err) {
                console.log("Error in fetching owner room data");
                return res.status(500).send("Server error");
            }
            let ownerroom = results[0];
            res.render("owner-dashboard.ejs", {
                owner: ownerroom
            });
        });
    });
});





app.get('/update/:owner_id',(req,res)=>{
    // res.send("what do you wannn update");
    const ownerId = req.params.owner_id ;
     console.log(ownerId);
    const query = `SELECT * FROM owners_room WHERE owner_id = ? `;
    pool.execute(query,[ownerId],async(err,results)=>{
        if (err) {
            console.error('Error update owner data:', err);
            return res.status(500).send('Server Error');
        }
        const owner = results[0];
        console.log("the result are the ",results);
        const query10 = `select * from owners where owner_id = ?`;
        pool.execute(query10,[ownerId],async(err,results)=>{
            if(err){
                console.error('Error update owner data:', err);
                return res.status(500).send('Server Error');
            }
            res.render("updation.ejs",{
                owners:owner,
                owner:results[0]
            });
        })
       
        // res.send("hi hello");
    })


})

app.post('/login-owner/delete',(req,res)=>{
    res.send("what do you wannn delete");
})



app.get('/logout', (req, res) => {
    req.session.destroy();
    // res.sendfile();
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
    pool.execute('SELECT * FROM owners WHERE email = ? OR phone = ?', 
        [email, phone], 
        (err, existingUsers) => {
            if (err) {
                console.error('Error checking existing user:', err);
                return res.status(500).send('Server Error');
            }

            if (existingUsers.length > 0) {
                return res.status(400).send('User already exists');
            }

            // Get the next owner_id
            pool.execute('SELECT MAX(owner_id) as max_id FROM owners', [], 
                (err, results) => {
                    if (err) {
                        console.error('Error getting max owner_id:', err);
                        return res.status(500).send('Server Error');
                    }

                    const owner_id = ((results[0]?.max_id || 0) + 1);

                    // Insert into owners table
                    pool.execute(
                        `INSERT INTO owners (owner_id, fname, lname, gender, age, email, phone, password) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [owner_id, firstname, lastname, gender, age, email, phone, hashedPassword],
                        (err, ownerResult) => {
                            if (err) {
                                console.error('Error inserting owner:', err);
                                return res.status(500).send('Server Error');
                            }

                            // Insert into owners_room table
                            pool.execute(
                                `INSERT INTO owners_room 
                                 (college, hostel_name, roomsfor, twoshare, tworent, threeshare, threerent, 
                                  fourshare, fourrent, pincode, owner_id)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                }
            );
        }
    );
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
