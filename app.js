const express = require("express")
const mysql=require("mysql")
const path=require("path")
const app = express()
const bodyParser=require("body-parser")
const sessions=require("express-session")
const cookieParser=require("cookie-parser")
var flash = require("connect-flash");
const { json } = require("body-parser")
const bcrypt = require('bcrypt');

app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user : 'root',
    password : '',
    database: 'cruddb'
});
userid="chethan";
//setting up the view-engine
app.set("view engine","ejs")

//listening to port 3000
app.listen("3000")

app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));
app.use(flash());
db.connect((error)=>{
    if(error){
        console.log(error)
    }else{
        console.log("mysql connected")
    }
})

app.use(sessions({
    secret:"thisismysecret",
    saveUninitialized:false,
    cookie:{maxAge:40000000000},
    resave:false
}))
app.use(cookieParser());
app.use(bodyParser.json());
app.get("/",(req,res)=>{
    if(req.session.userid)
    userid=req.session.userid;
    res.render("home",{userid});
})

app.get("/books",(req,res)=>{
    sql="select * from book_table";
    if(req.session.userid)
    userid=req.session.userid;
    db.query(sql,(err,result)=>{
        res.render("books",{result:result,userid});
    })
})

app.get("/admin/books/delete/:id",(req,res)=>{
    sql="delete from book_table where book_id=?";
    db.query(sql,req.params.id,(err,result)=>{
        if(err) throw err;
        res.redirect("/books");
    })
})
// app.get("/books/:name",(req,res)=>{
//     var name=req.params.name;
//     res.render("bookdetail",{name})
// })

app.get("/admin/addbook",(req,res)=>{
    if(req.session.userid){
        res.render("addbook",{message1:req.flash("message1")});
    }else{
        res.redirect("/admin/login")
    }
})
app.post("/admin/addbook",(req,res)=>{
    sql="insert into book_table set ?";
    db.query(sql,req.body,(err,result)=>{
        if (err) throw err;
        req.flash("message1","Book Added Successfully!!")
        res.redirect("/admin/addbook");
    })
})

app.get("/admin/profile",(req,res)=>{
    if(req.session.userid){
        sql="select * from admin_table where email_id=?"
        db.query(sql,req.session.userid,(err,result)=>{
            if(err) throw err;
            res.render("profile",{result,message:req.flash("message")});
        })
    }
    else
    res.redirect("/admin/login")
})
app.post("/admin/profile",(req,res)=>{
    // var values1=[[req.body.name,req.body.surname,req.body.phno,req.body.postcode,req.body.state,req.body.area,req.body.email_id,req.body.country,req.body.password,req.session.userid]];
    sql="update admin_table set ? where email_id=?";
    db.query(sql,[req.body,req.session.userid],(err,result)=>{
        if(err) throw err;
        req.flash("message","Updated Successfully!!");
        res.redirect("/admin/profile");
    })
})
 app.get("/admin/requested",(req,res)=>{
     if(req.session.userid){
     sql="select * from request_book_table";
     db.query(sql,(err,result)=>{
         res.render("requested",{result:result});
     })
    }else{
        res.redirect("/admin/login")
    }
 })
 app.get("/admin/requested/delete/:id",(req,res)=>{
     sql="delete from request_book_table where request_id=?";
     db.query(sql,req.params.id,(err,result)=>{
         if (err) throw err;
         res.redirect("/admin/requested");
     })
 })

 app.get("/request",(req,res)=>{
     res.render("request",{message:req.flash("message")});
 })
 app.post("/request",(req,res)=>{
     sql="insert into request_book_table set ?";
     db.query(sql,req.body,(err,result)=>{
         if (err) throw err;
         req.flash("message"," Request Successfully!!");
         res.redirect("/request")
     })
 })


 
 app.get("/admin/login",(req,res)=>{
     res.render("login")
 })
 app.post("/admin/login",(req,res)=>{
    sql=`select email_id,password from admin_table where email_id="${req.body.email_id}"`
    db.query(sql,(err,result)=>{
        if (err) throw err;  
        // console.log(result[0].password); 
        // result[0].password==req.body.password
        // console.log(bcrypt.compareSync(req.body.password,result[0].password))
        if(bcrypt.compareSync(req.body.password,result[0].password)){
            req.flash("message"," Logged in Successfully!!");
            session=req.session;
            session.userid=req.body.email_id;
            session.username=result[0].username;
            // console.log(req.session.id)
            email_id=req.body.email_id;
            username=result[0].username;
            res.redirect("/admin/profile")
        }else{
            res.redirect("/admin/login")
        }
    })
 })
 app.get("/admin/register",(req,res)=>{
     res.render("register",{message:req.flash("message")})
 })
 app.post("/admin/register",async (req,res)=>{
     password=req.body.password;
     const salt = bcrypt.genSaltSync(10);
     const hash=bcrypt.hashSync(password,salt);
    //  console.log(hash);
     const values=[[req.body.name,req.body.surname,req.body.phno,req.body.postcode,req.body.state,req.body.area,req.body.email_id,req.body.country,hash]];    
     sql="insert into admin_table values?";
     db.query(sql,[values],(err,result)=>{
         if (err) throw err;
         else{
            req.flash("message"," User Registered Successfully!!");
            res.redirect("/admin/register")
         }
     })
 })

 app.get("/admin/logout",(req,res)=>{
     req.session.destroy();
     userid="chethan";
     res.redirect("/admin/login");
 })