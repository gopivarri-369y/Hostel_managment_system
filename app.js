const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const app = express();
const port = 3300;

// Middleware to parse incoming request bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from 'static' directory
app.use(express.static(path.join(__dirname, 'static', 'public')));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



const session = require('express-session');

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));




// Create a MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Satyaveni@369', // Replace with your MySQL password
    database: 'student_registration'
});

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use any email service like Gmail, Outlook, etc.
    auth: {
        user: 'gopivarri5612v@gmail.com', // Replace with your email
        pass: 'abcd efgh ijkl mnop' // Replace with your email password or app-specific password if 2FA is enabled
    }
});

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
    res.sendFile(path.join(__dirname, 'static', 'public', 'html', 'owner_register.html'));
});




// Route to handle student registration form submission
app.post('/submit.js', (req, res) => {
    const { firstname, lastname, gender, age, email, phone, collage } = req.body;

    // Insert student data into the students table
    const studentQuery = `INSERT INTO students (firstname, lastname, gender, age, email, phone, college) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    pool.execute(studentQuery, [firstname, lastname, gender, age, email, phone, collage], (err, results) => {
        if (err) {
            console.error('Error inserting student data:', err);
            return res.status(500).send('Server Error');
        }

        // Query to find matching owners based on college
        const ownerQuery = `SELECT * FROM owners_info WHERE collage = ?`;
        pool.execute(ownerQuery, [collage], (err, owners) => {
            if (err) {
                console.error('Error fetching owner data:', err);
                return res.status(500).send('Server Error');
            }
            console.log('Matching owners:', owners);

            // Render the owner.ejs page and pass the owners data
            res.render('owners.ejs', { owners });

            // Send an email to the matching owner
            if (owners.length > 0) {
                const owner = owners[0]; // Get the first matching owner
                const mailOptions = {
                    from: 'gopivarri5612v@gmail.com', // Your Gmail account
                    to: owner.email, // Send to the owner's email
                    replyTo: email, // Student's email address as "reply-to"
                    subject: `Student Interest in Your Hostel: ${firstname} ${lastname}`,
                    text: `Dear ${owner.firstname},\n\nA student named ${firstname} ${lastname} is interested in your hostel. Here are the details:\n\n
                    Name: ${firstname} ${lastname}\n
                    Gender: ${gender}\n
                    Age: ${age}\n
                    Email: ${email}\n
                    Phone: ${phone}\n
                    College: ${collage}\n\n
                    Please reach out to them for further details.\n\nBest regards,\nYour Company`
                };

                // Send the email
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending email:', error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
            }
        });
    });
});

// Route to send an email to the owner
app.post('/send-email', (req, res) => {
    const { email, firstname } = req.body; // Ensure you're sending owner details from the form

    const mailOptions = {
        from: 'your-email@gmail.com', // Replace with your email
        to: email, // Use the email address of the owner
        subject: 'Student Interest in Your Hostel',
        text: `Dear ${firstname},\n\nA student is interested in your hostel. Please check the details.\n\nBest regards,\nYour Company`
    };

    // Send the email using the transporter
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send('Error sending email');
        }
        console.log('Email sent: ' + info.response);
        res.send('Email sent successfully');
    });
});




// Owner login route
// Route to handle owner login
app.post('/login-owner', (req, res) => {
    const { email, password } = req.body;

    // Find owner by email
    const query = 'SELECT * FROM owners_info WHERE email = ?';
    pool.execute(query, [email], async (err, results) => {
        if (err) {
            console.error('Error finding owner:', err);
            return res.status(500).send('Server Error');
        }

        if (results.length === 0) {
            return res.status(401).send('Invalid email or password');
        }
        console.log("the results are the ",results);
        const owner = results[0];

        // Compare hashed password
        const match = await bcrypt.compare(password, owner.password);

        if (!match) {
            return res.status(401).send('Invalid email or password');
        }

        // Render the page with owner data
        console.log("th owner details are the ",owner);
        res.render('owner-dashboard.ejs', {
            owner:owner
        });
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


app.post('/updated.js', (req, res) => {
    const { id, phone, collage, hostel, roomsFor, room2Share, room3Share, room4Share, rent2Share, rent3Share, rent4Share } = req.body;

    // Convert room share values to boolean
    const room2 = Boolean(room2Share);
    const room3 = Boolean(room3Share);
    const room4 = Boolean(room4Share);

    // SQL query for updating the specified owner's information
    const query = `
        UPDATE owners_info 
        SET 
            phone = ?, 
            collage = ?, 
            hostel = ?, 
            roomsFor = ?, 
            room2Share = ?, 
            room3Share = ?,
            room4Share = ?, 
            rent2Share = ?, 
            rent3Share = ?, 
            rent4Share = ? 
        WHERE id = ?`;

    console.log('Executing query:', query);
    console.log('With parameters:', [phone, collage, hostel, roomsFor, room2, room3, room4, rent2Share || 0, rent3Share || 0, rent4Share || 0, id]);

    // Execute the query
    pool.execute(query, [phone, collage, hostel, roomsFor, room2, room3, room4, 
        rent2Share || 0, rent3Share || 0, rent4Share || 0, id], (err, results) => {
        if (err) {
            console.error('Error updating owner data:', err);
            return res.status(500).send('Server Error');
        }

        // Send a success response
        res.send('Owner data updated successfully');
    });
});






app.post('/login-owner/update',(req,res)=>{
    // res.send("what do you wannn update");
    const {ownerId} = req.body;
    console.log([ownerId]);
    const query = `SELECT * FROM owners_info WHERE id = ? `;
    pool.execute(query,[ownerId],async(err,results)=>{
        if (err) {
            console.error('Error update owner data:', err);
            return res.status(500).send('Server Error');
        }
        const owner = results[0];
        console.log("the result are the ",results);
        res.render("owners.ejs",{
            owner:owner
        });
        // res.send("hi hello");
    })


})

app.post('/login-owner/delete',(req,res)=>{
    res.send("what do you wannn delete");
})



app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login-owner');
});


// Route to handle owner registration form submission
const bcrypt = require('bcrypt');
const { name } = require('ejs');

// Owner registration route
app.post('/submit1.js', async (req, res) => {
    const {
        firstname, lastname, gender, age, email, phone, collage, Hostel,
        rooms_for, room1, room2, room3, rent_2, rent_3, rent_4, password
    } = req.body;
    console.log(req.body);
    // Hash the owner's password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);



    //check the email is present or not 
    const checkquery = `select * from  owners_info where email = ? or phone = ?`;
    // SELECT * FROM owners_info WHERE email = ? OR phone = ?

    pool.execute(checkquery,[email,phone],(err,result)=>{
        if(err){
            console.error('error in the checking of the data:', err);
            return res.status(500).send('Server Error');
        }
        const length = result.length;
        if(length!=0){
            res.send("the user already exits");
        }
    })

    const query = `INSERT INTO owners_info 
        (firstname, lastname, gender, age, email, phone, collage, hostel, roomsFor, 
         room2Share, room3Share, room4Share, rent2Share, rent3Share, rent4Share, password) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    pool.execute(query, [
        firstname, lastname, gender, age, email, phone, collage, Hostel, rooms_for,
        room1 ? true : false, room2 ? true : false, room3 ? true : false, 
        rent_2 || 0, rent_3 || 0, rent_4 || 0, hashedPassword
    ], (err, results) => {
        if (err) {
            console.error('Error inserting owner data:', err);
            return res.status(500).send('Server Error');
        }
        res.sendFile(path.join(__dirname,'static','public','html','thankyou.html'));
        // res.sendFile
        // D:\myproject\Hostel\static\public\html\thankyou.html
    });
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
