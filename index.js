const express = require('express');
// const { default: mongoose } = require('mongoose');
const app=express();

//Instantiation of User Model
const User = require('./models/user');
const Component = require('./models/component');

const bcrypt = require('bcrypt');
const session = require('express-session');

const mongoose = require("mongoose");
const { use } = require('bcrypt/promises');

//mongodb://localhost:27017
mongoose.connect("mongodb+srv://rishi_chef:hello@softwarecomponent.vhswafu.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
//   serverSelectionTimeoutMS: 5000
}, () => {
  console.log('connected to local database myDb ;)');
});

//Using of ejs
app.set('view engine','ejs');
app.set('views','views');
app.use(express.urlencoded({extended: true}));
app.use(session({secret:'notagoodsecret'}))

app.get('/',(req,res)=>{
    res.render("login");
})

app.get('/login',(req,res)=>{
    res.render("login");
})

app.get('/home',async (req,res)=>{
    if(!req.session.user_id){
        return res.redirect('/login');
    }
    try {
        // Fetch data from MongoDB
        const components = await Component.find({}).populate('addedBy');
        // Render the 'home.ejs' template with the fetched data
        res.render('home', {  components, user_id: req.session.user_id });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
})

//Instantiation of Admin Model
const Admin = require('./models/admin');

app.get('/admin-login' || 'adminlogin', (req, res) => {
    res.render("admin-login");
});

//This contains admin-login details

app.post('/admin-login' || '/admin-login', async (req, res) => {
    const{password,username}=req.body;
    const admin= await Admin.findOne({username});
    try{
        const validPassword = await bcrypt.compare(password, admin.password);
        if(!validPassword){
            res.send("Passwords Not Matching or Not a Valid Password");
        }
        else{
            req.session.admin_id=username;
            res.redirect('/admin-dashboard');
        }
    } catch{
        res.send("Invalid Username or Password");
    }
});

app.get('/admin-dashboard', async (req, res) => {
    if (!req.session.admin_id) {
        return res.render('admin-login');
    }

    try {
        // Fetch all components from MongoDB
        const components = await Component.find({}).populate('addedBy');
        // Render the 'admin-dashboard.ejs' template with the fetched data
        res.render('admin-dashboard', { components });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

//Remove the admin session details
app.get('/admin-logout' || '/adminlogout', (req, res) => {
    req.session.admin_id = null;
    res.redirect('/admin-login');
});

//Deleting Components
app.post('/deleteComponent/:id', async (req, res) => {
    const componentId = req.params.id;
    const userId = req.session.user_id;
    const adminId = req.session.admin_id;

    try {
        // Find the component by ID
        const component = await Component.findById(componentId);

        if (component) {
            // Check if the logged-in user is the one who added the component or if the user is an admin
            if (adminId) {
                // Delete the component if the user is authorized
                await Component.findByIdAndDelete(componentId);
                res.redirect('/admin-dashboard');
            } else {
                // Unauthorized user trying to delete the component
                res.status(403).send('Unauthorized');
            }
        } else {
            // Component not found
            res.status(404).send('Component not found');
        }
    } catch (error) {
        console.error('Error deleting component:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Editing Components by User
app.get('/editComponent/:id', async (req, res) => {
    try {
        const componentId = req.params.id;
        const component = await Component.findById(componentId);
        
        if (!component) {
            return res.status(404).send('Component not found');
        }

        // Render the 'editcomponent.ejs' template with the component data
        res.render('editcomponent', { component });
    } catch (error) {
        console.error('Error fetching component for editing:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Add a route to handle the form submission for editing components
app.post('/editComponent/:id', async (req, res) => {
    try {
        const componentId = req.params.id;
        const { title, tag, description, code } = req.body;

        // Find the component by ID
        const component = await Component.findByIdAndUpdate(componentId, {
            title,
            tag,
            description,
            code,
        }, { new: true });

        if (!component) {
            return res.status(404).send('Component not found');
        }

        // Once it is edited, redirect to the home dashboard
        res.redirect('/home');
    } catch (error) {
        console.error('Error updating component:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.get('/studentregister',(req,res)=>{
    res.render('studentregister')
})

app.get('/register',(req,res)=>{
    res.render('studentregister')
})

app.post('/login',async(req,res)=>{
    const{password,username,rwpassword}=req.body;
    const user= await User.findOne({username});
    try{
        const validPassword = await bcrypt.compare(password, user.password);
        if(password!=rwpassword || !validPassword){
            res.send("Passwords Not Matching or Not a Valid Password");
        }
        else{
            req.session.user_id=username;
            res.redirect('/home');
        }
    } catch{
        res.send("Invalid Username or Password")
    }
    
})


app.get('/addComponent',(req,res)=>{
    res.render('addcomponent')
})

app.get('/search', async (req, res) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }

    const searchTerm = req.query.search;
    try {
        // Search for components by title or tag
        const components = await Component.find({
            $or: [
                { title: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive title search
                { tag: { $regex: searchTerm, $options: 'i' } },   // Case-insensitive tag search
            ],
        });

        // Render the 'home.ejs' template with the search results
        res.render('home', { components });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/addComponent',async(req,res)=>{
    const {title, tag, description, code} = req.body;
    const userId = req.session.user_id; // Stored userId is fetched
    const component = new Component({
        title,
        tag,
        description,
        code
    }) 
    await component.save();
    res.redirect('/home');
})

app.get('/admin-register',async(req,res)=>{
    res.render('admin-register');
})

app.post('/admin-register',async(req,res)=>{
    const {password, username} = req.body;
    const hash = await bcrypt.hash(password, 12);
    const user = new Admin({
        username,
        password: hash
    }) 
    await user.save();
    res.redirect('/admin-login');
})


app.post('/studentregister',async(req,res)=>{
    const {password, username} = req.body;
    const hash = await bcrypt.hash(password, 12);
    const user = new User({
        username,
        password: hash
    }) 
    await user.save();
    res.redirect('/login');
})

//Remove the session id of user / admin
app.post('/logout',(req,res)=>{
    req.session.user_id=null;
    res.redirect("/login");
})

app.listen(process.env.port || 3000,()=>{
    console.log("Server Started");
})

//Connecting with Database
// mongoose.connect("mongodb+srv://rishi_chef:hello@softwarecomponent.vhswafu.mongodb.net/", { 
//     useNewUrlParser: true, 
//     useUnifiedTopology: true
// }, () => { 
//     console.log('connected to database myDb') 
// })
 