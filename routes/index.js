var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mydb1'
});
connection.connect(function (err) {
  if (err) {
    console.log("Error connecting to Database" + err);
  } else {
    console.log("Connection established");
  }
});

router.get('/', function (req, res, next) {
  res.render('index');
});
router.get('/add', function (req, res, next) {
  res.render('addform');
});

router.post('/formprocess', function (req, res, next) {
  var a = req.body.txt1;
  var b = req.body.txt2;
  var c = req.files.file123;
  var filename = req.files.file123.name;
  var email  = req.body.email;
  var password  = req.body.password;
  connection.query("insert into tbl_student(st_name,st_gender,st_photo,st_email,st_password) values(?,?,?,?,?)", [a, b, filename,email,password], function (err, result) {
    if (err) return err;
    console.log("Record inserted");
    c.mv("public/upload/" + filename, function () {
      console.log("File Upload");
    });

    res.redirect('/add');
  })
});


router.get('/login', function (req, res, next) {
  res.render('login');
});

router.post('/loginprocess', function (req, res, next) {
  var email = req.body.txt1;
  var password = req.body.txt2;

  connection.query("select * from tbl_student where st_email = ? and st_password = ?", [email, password],
    function (err, result) {
      console.log(result.length);
      console.log(result);

      if (result.length > 0) {
        //Store id in Session
        req.session.userid = result[0].st_id;
        req.session.username = result[0].st_name;
        res.redirect('home');
      } else {
        res.send("Login Failed");
      }

    });
});

router.get('/home', function (req, res, next) {

  if (req.session.userid) {   //Fetch Name from Session Variable
    var name = req.session.username;
    res.render('home', { uname: name });
  } else {
    res.redirect('login');
  }

});

router.get('/changepassword', function (req, res, next) {
  res.render('changepassword');
});

router.post('/changepasswordprocess', function (req, res, next) {
  var opass = req.body.txt1;
  var npass = req.body.txt2;
  var cpass = req.body.txt3;
  var uid = req.session.userid;
  //Fetch Old Password 
  if (uid) {
    connection.query("select * from tbl_student where st_id = ?", [uid], function (err, result) {
      var opassdb = result[0].st_password; // Opass

      if (opass == opassdb) {
        if (npass == cpass) {
          connection.query("update tbl_student set st_password = ? where st_id = ?", [npass, uid], function (err, result) {
            res.send("Password changed");
          });
        } else {
          res.send("New and Confirm password not match");
        }
      } else {
        res.send("Old password not match");
      }

    });

  } else {
    res.redirect('/login');
  }
});

router.get('/forgotpassword', function (req, res, next) {
  res.render('forgotpassword');
});

router.post('/forgotpasswordprocess', function (req, res, next) {
  var txt1 = req.body.txt1;
  connection.query("select * from tbl_student where st_email = ?", [txt1], function (err, result) {

    if (result.length > 0) {
      var password = result[0].st_password;
      //Password Message 
      var msg = "Your Password is " + password;
      //Mail Code
      const nodemailer = require("nodemailer");
      // async..await is not allowed in global scope, must use a wrapper
      async function main() {
        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        let testAccount = await nodemailer.createTestAccount();
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: "akash.padhiyar123@gmail.com", // generated ethereal user
            pass: "cbjiuxlquxsevqfo", // generated ethereal password
          },
        });
        // send mail with defined transport object
        let info = await transporter.sendMail({
          from: 'akash.padhiyar123@gmail.com', // sender address
          to: txt1, // list of receivers
          subject: "Forgot Password", // Subject line
          text: msg, // plain text body
          html: msg, // html body
        });
        console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
      }
      main().catch(console.error);

    }else{
      res.send("User Not Found");
    }

  });


});

 


router.get('/view', function (req, res, next) {
  connection.query("select * from tbl_student", function (err, result) {
    if (err) return err;
    console.log(result);
    res.render('display', { mydata: result });
  })
});

router.get('/delete/:id', function (req, res, next) {
  var id = req.params.id;
  console.log(id);
  connection.query("delete from tbl_student where st_id= ?", [id], function (err, result) {
    if (err) return err;
    res.redirect('/view');
  })
});

router.get('/edit/:id', function (req, res, next) {
  var id = req.params.id;
  console.log(id);
  connection.query("select * from tbl_student where st_id= ?", [id], function (err, result) {
    if (err) return err;
    console.log(result);
    res.render('edit', { mydata: result });
  })
});

router.post('/updateprocess/:id', function (req, res, next) {
  var id = req.params.id;
  var txt1 = req.body.txt1;
  var txt2 = req.body.txt2;
  console.log(id);
  connection.query("update tbl_student set st_name = ?,st_gender=? where st_id= ?", [txt1, txt2, id], function (err, result) {
    if (err) return err;
    console.log(result);
    res.redirect('/view');
  })
});

router.get('/logout', function (req, res, next) {
  
  req.session.destroy(function(err){
    res.redirect('login');
  })
  
});

module.exports = router;
