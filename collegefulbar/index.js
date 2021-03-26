//Define dependency for the project 
//-------------------------------------------------------
const express = require('express');                     
const session = require('express-session');            
const bodyParser = require('body-parser');            
const Handlebars = require('express-handlebars');       
const app = express();                                 
const mysql = require('mysql');                         
const bcrypt = require('bcryptjs');                  
//-------------------------------------------------------

//set up the database credientials and create connections 
//-----------------------------------------------
const db = mysql.createConnection({            
    host        : 'localhost',                  
    user        : 'root',                     
    password    : '',                         
    database    : 'collegefulbar'            
});                                                                                     
//db connection                              
db.connect((error)=>{                       
    if(error){                                
        console.log(error);                   
    }else{                                     
        console.log("MYSQL Server Connected");  
    }                                          
});                                           
//------------------------------------------------

//define uses snd set views
//----------------------------------------------------------------
app.use(express.static('static'));                              
app.use(session({secret: 'collegefulbar'}));                    
app.use(bodyParser.urlencoded({extended: true}));              
app.use(express.urlencoded());                                 
app.engine('handlebars',Handlebars({defaultLayout: 'main'}));  
app.set('view engine','handlebars');                            
//----------------------------------------------------------------




//check for login
//as of right not using this function
//not used as of right now
//-----------------------------------
function checkAuth(req,res,next) { 
    if(!req.session.user_id) {     
        res.render(302,'/login'); 
    }else {                        
        next();                   
    }                              
}                                  
//-----------------------------------

//debug on console 
//-------------------------------------------------------------------------------------------------------------------------------
function debuglog(req, res, next) {                                                                                            
    console.debug(`${req.method} -- ${req.path} (params: ${JSON.stringify(req.params)}) [body: ${JSON.stringify(req.body)}]`); 
    next();                                                                                                                   
}                                                                                                                              
//-------------------------------------------------------------------------------------------------------------------------------


//did not implement the multiple query function yet


//load home screen
//-------------------------
app.get("/",(req,res)=>{ 
    res.render('home');  
});                      
//-------------------------


//upon clicking login render the login html page
//------------------------------------------------
app.get('/login',(req, res) => {                
res.render('login');                            
});                                             
//------------------------------------------------

//upon clicking register 
//--------------------------------------------------
app.get('/register',(req, res) => {                
    res.render('register');                            
    });  
//--------------------------------------------------

//upon clicking enroll
//----------------------------------------------------

app.get('/enroll',(req, res) => {                
    res.render('enroll');                            
    }); 

//-----------------------------------------------------

//upon clicking drop
//----------------------------------------------------

app.get('/drop',(req, res) => {                
    res.render('drop');                            
    }); 

//-----------------------------------------------------

//if student account then render student handlebar material
//------------------------------------------------------------
app.get('/user/:email',(req, res) => { 
    res.render('student');                                 
});                                                        
//------------------------------------------------------------


//if admin account then render student handlebar material
//------------------------------------------------------------
app.get('/user/admin/:email',(req,res)=>{                  
    res.render('admin');                                   
});                                                        
//------------------------------------------------------------


//From login screen query database and if if user exists then log them in
//------------------------------------------------------------------------------------
app.post('/auth/login', async (req,res)=>{                                          
    const {account, email, password} = req.body;                                    
    if( !email || !password || !account){                                           
        return res.status(400).render('login',{                                     
            message: 'Fields can not be empty'                                     
        });                                                                         
    }                                                                               
    db.query("SELECT * FROM user WHERE email =?",[email],async(error,results)=>{    
        console.log(results);                                                       
        if(results ==0){                                                            
            res.status(401).render('login',{                                        
                message: 'Account does not exist'                                   
            });                                                                     
        }                                                                           
        if (!results || !( await bcrypt.compare(password, results[0].password))){   
            res.status(401).render('login',{                                        
                message:'Email or password is Incorrect'                            
            });                                                                     
        }else{                                                                      
            const account = results[0].account;                                     
            req.session.user_id = results[0].id;                                   
            console.log("Logging in the user ID is: " + req.session.user_id);       
            req.session.user_name = req.body.email;                                 
            console.log("Logging in the username is: " + req.session.user_name);    
            if(account == "student" || account == "Student"){                                                              
                res.redirect(`/user/${req.session.user_name}`);                     
            }                                                                                                               
            if(account == "admin" || account == "Admin"){                          
                res.redirect(`/user/admin/${req.session.user_name}`);               
            }                                                                       
        }                                                                           
    });                                                                             
});                                                                                 
//------------------------------------------------------------------------------------


//function to let a student register 
//------------------------------------------------------------------------------------------------
app.post('/auth/register', async (req,res)=>{  
    const name = req.body.name;
    const account = req.body.account;
    const email = req.body.email;
    const password = req.body.password;
    const passwordConfirm = req.body.passwordConfirm;

    //this is where we will take in the  email the user enters in the form and put inside our database and 
    //if the email already exists then show them the message
    db.query('SELECT email FROM user WHERE email = ?', [email], async (error, results) => {
        if(error){
            console.log(error);
        }
        if(results.length > 0) {
            return res.render('register',{
                message: 'The email already exists'
            });
        }else if (password !== passwordConfirm){
            return res.render('register',{
                message: 'Passwords do not match'
            });
        }
        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);
        //insert into database
        db.query('INSERT INTO user SET ?',{name: name, account: account, email: email, password: hashedPassword},(error,results)=>{
            if(error){
                console.log(error);
            }else{
                console.log(results);
                return res.redirect('/login');
            }
        });
    });
});

//---------------------------------------------------------------------------------------------------------------------------------------------------


//upon clicking enroll button after filling the form execue this query 
//--------------------------------------------------------------------------------------------------------------------
app.post('/enroll/submit', async (req,res)=>{  
    const title = req.body.title;
    const section = req.body.section;
    const instructor = req.body.instructor;
    const dept = req.body.dept;
    const year = req.body.year;
    const semester = req.body.semester;
    const credits = req.body.credits;
    const cost = req.body.cost;
    const student_email = req.body.student_email;

    db.query('INSERT INTO class SET ?',{student_email: student_email, title:title, section: section, instructor: instructor, dept:dept, year:year,semester: semester, credits: credits, cost: cost},(error,results)=>{
        if(error){
            console.log(error);
        }else{
            console.log(results);
            return res.render('enroll',{
                message: 'Course Has been Added'
            });
        }
    });
});
//----------------------------------------------------------------------------------------------------------------------


//upon clicking drop the class the student wants to drop will be removed from database
//--------------------------------------------------------------------------------------------------------------------
app.post('/drop/submit', async (req,res)=>{  
    const student_email = req.body.student_email;
    const title = req.body.title;
    const section = req.body.section;
    const instructor = req.body.instructor;

    db.query('DELETE FROM class WHERE title = ?', [title],(err,rows,fields) => {
        if(err){
            console.log(err);
        }else{
            console.log("Course has been deleted");
            console.log(rows);
             res.render('drop',{
                message: 'Course Has been Deleted'
                
            });
            res.redirect('/view');
        }
    });
});
//----------------------------------------------------------------------------------------------------------------------



//function to let logged in student view classes
//-----------------------------------------------------------------------------------------------------------------------
app.get('/view', (req,res)=>{
   
    db.query("SELECT * FROM class WHERE student_email = ?",[req.session.user_name],function(err,rows,fields){
        if(err) throw err;
        console.log(rows);
        res.render('view',{title: 'Classes',items: rows});
    });
});
//-----------------------------------------------------------------------------------------------------------------------



//if logout button is pressed then log the user out of this session
//--------------------------------------------------------------------------------
app.post('/logout', async (req, res) => {                                       
  delete req.session.user_id;                                                  
  delete req.session.user_name;                                                 
  console.log("After Logging out the user ID is: " + req.session.user_id);      
  console.log("After Logging out the username is: " + req.session.user_name);  
  res.redirect('/');                                                            
   });                                                                          
//--------------------------------------------------------------------------------




//+===========++++============
// ADMIN WORK ================
//+===========++++============

//upon clicking add course
//----------------------------------------------------

app.get('/add',(req, res) => {                
    res.render('addCourse');                            
    }); 

//-----------------------------------------------------

//Enter the fields into table courses in the database
//--------------------------------------------------------------------------------------------------------------------
app.post('/add/submit', async (req,res)=>{  
    const title = req.body.title;
    const section = req.body.section;
    const instructor = req.body.instructor;
    const room = req.body.room;
    const credits = req.body.credits;
    const cost = req.body.cost;


    db.query('INSERT INTO courses SET ?',{name:title, section: section, instructor: instructor, room:room, credits: credits, cost: cost},(error,results)=>{
        if(error){
            console.log(error);
        }else{
            console.log(results);
            return res.render('addCourse',{
                message: 'Course Has been Added'
            });
        }
    });
});
//----------------------------------------------------------------------------------------------------------------------


// Admin gets to see all the courses in the entire school
//---------------when view course is pressed-----------------------
app.get('/viewadmin', (req,res)=>{
   
    db.query("SELECT * FROM courses",function(err,rows,fields){
        if(err) throw err;
        console.log(rows);
        res.render('viewadmin',{title: 'Classes',items: rows});
    });
});
//-------------------------------------------------------------------


//listen to a certain port on localhost to run the app
//--------------------------------------------------------
app.listen(5000,()=>{                                  
    console.log("Server Started on Port 5000");        
});                                                     
//--------------------------------------------------------
