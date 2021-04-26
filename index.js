//IMPORTING REQUIRED LIBRARIES
const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const dbConnection = require('./database');
const {
  body,
  validationResult
} = require('express-validator');
const multer = require('multer');
const favicon = require('serve-favicon');

const app = express();
app.use(express.urlencoded({
  extended: false
}));

// SETTING VIEWS AND VIEW ENGINE
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// APPLY COOKIE SESSION MIDDLEWARE
app.use(cookieSession({
  name: 'session',
  secret: "my_secret",
  //maxAge:  3600 * 1000 // 1hr
}));
app.use(express.static(__dirname + "/public"));
app.use('/Images', express.static(__dirname + "/Images"))


app.use(favicon(path.join(__dirname, 'public/ico', 'favicon.ico')));


// Set The Storage Engine
const storage = multer.diskStorage({
  destination: './Images/',
  filename: function(req, file, cb) {
    cb(null, file.originalname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init Upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1000000
  },
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
});

// Check File Type
function checkFileType(file, cb) {
  // Allowed ext
  console.log("this" + file.originalname);
  const filetypes = /jpeg|jpg|png/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  console.log("Hey" + extname);
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Please upload correct image!');
  }
}

const ifNotLoggedin = (req, res, next) => {
  console.log("\n\n\n\n" + req.session.isLoggedIn + "\n\n\n\n");

  if (!req.session.isLoggedIn) {
    console.log("\n\n\n\n" + req.session.isLoggedIn + "\n\n\n\n");
    return res.redirect('/login-register');
  }
  next();
}

const ifLoggedin = (req, res, next) => {
  if (req.session.isLoggedIn) {
    return res.redirect('/');
  }
  next();
}



//GET requests
app.get('/login-register', (req, res) => {
  if (!req.session.isLoggedIn) {
    res.render("login-register");
  } else {
    res.redirect('/');
  }
});



app.get('/', ifNotLoggedin, (req, res, next) => {
  dbConnection.execute("SELECT CONCAT(f_name,' ',l_name) as name FROM `users` WHERE `id`=?", [req.session.userID])
    .then(([ansone]) => {
      dbConnection.execute("SELECT id,name,description,price,image_url from items where seller_id=?", [req.session.userID])
        .then(([anstwo]) => {
          console.log("User Products:");
          console.log(anstwo);
          products = []
          for (var i = 0; i < anstwo.length; i++) {
            products.push({
              id: anstwo[i].id,
              name: anstwo[i].name,
              desc: anstwo[i].description,
              price: anstwo[i].price,
              image_url: anstwo[i].image_url
            });
          }
          res.render('home', {
            name: ansone[0].name,
            prods: products
          });

        }).catch(err => {
          console.log(err);
        });

    }).catch(err => {
      console.log(err);

    })
});





app.get('/add_item', ifNotLoggedin, (req, res, next) => {
  res.render("add_item")
});




app.get('/market', ifNotLoggedin, (req, res, next) => {
  dbConnection.execute("SELECT name,price,image_url,id from items").then(([rows]) => {
    //console.log(rows);
    product = [];
    if (rows.length) {
      for (var i = 0; i < rows.length; i++) {
        product.push({
          name: rows[i].name,
          price: rows[i].price,
          image_url: rows[i].image_url,
          id: rows[i].id
        })
      }
      res.render("market", {
        prods: product
      });;
    } else {
      res.render("market", {
        prods: product
      });
    }
  }).catch(err => {

  })
});





// app.get("/product_details", ifNotLoggedin, (req, res, next) => {
//   res.redirect("/market")
// });



//POST requests

app.post('/delete_item', ifNotLoggedin, (req, res, next) => {
  console.log("Delete This")
  console.log(req.body.id);
  dbConnection.execute("DELETE from items where id=?", [req.body.id]).then(([rows]) => {
    res.redirect("/");
  }).catch(err => {
    console.log(err);
  })
})



app.post("/filter", ifNotLoggedin, (req, res, next) => {
  console.log("Filter This");
  console.log(req.body.tags);
  if (req.body.tags) {
    dbConnection.query("SELECT item_id from item_tags join tags on tags.id=item_tags.tag_id where tags.tag_name in (?)", [req.body.tags]).then(([rows1]) => {
      console.log(rows1);

      items = []
      for (var i = 0; i < rows1.length; i++) {
        items.push(rows1[i].item_id)
      }
      console.log("Items Found");
      console.log(items);
      dbConnection.query("SELECT name,price,image_url,id from items where id in (?)", [items]).then(([rows2]) => {
        console.log(rows2);
        //console.log(rows);
        product = [];
        if (rows2.length) {
          for (var i = 0; i < rows2.length; i++) {
            product.push({
              name: rows2[i].name,
              price: rows2[i].price,
              image_url: rows2[i].image_url,
              id: rows2[i].id
            })
          }
          console.log(product)
          res.render("market", {
            prods: product
          });
          //console.log(product[0])
          ;
        } else {
          product = []
          res.render("market", {
            prods: product
          });
        }


      }).catch(err => {
        console.log(err);
        product = []

        res.render("market", {
          prods: product
        });

      })

    }).catch(err => {
      console.log(err);
      product = []
      res.render("market", {
        prods: product
      });
    })
  } else {
    res.redirect("/market");
  }
})



app.post('/register', ifLoggedin,

  [body('user_name', 'Invalid username').custom((value) => {
      return dbConnection.execute('SELECT `username` FROM `users` WHERE `username`=?', [value])
        .then(([rows]) => {
          if (rows.length > 0) {
            return Promise.reject('This username is already in use!');
          }
          return true;
        });
    }),

    body('f_name', 'First Name is Empty!').trim().not().isEmpty(),
    body('l_name', 'Last Name is Empty!').trim().not().isEmpty(),
    body('phone', 'Phone No. is Invalid!').isMobilePhone(),
    body('user_pass', 'The password must be of minimum length 6 characters').trim().isLength({
      min: 6
    }),
  ],
  (req, res, next) => {
    const validation_result = validationResult(req);
    const {
      f_name,
      l_name,
      phone,
      user_name,
      user_pass
    } = req.body;

    if (validation_result.isEmpty()) {

      bcrypt.hash(user_pass, 12).then((hash_pass) => {

          dbConnection.execute("INSERT INTO users (f_name,l_name,phone,username,password) VALUES(?,?,?,?,?)", [f_name, l_name, phone, user_name, hash_pass])
            .then(result => {
              res.send(`your account has been created successfully, Now you can <a href="/">Login</a>`);
            }).catch(err => {

              if (err) throw err;
            });
        })
        .catch(err => {

          if (err) throw err;
        })
    } else {

      let allErrors = validation_result.errors.map((error) => {
        return error.msg;
      });

      res.render('login-register', {
        register_error: allErrors,
        old_data: req.body
      });
    }
  });


app.post('/login', ifLoggedin, [
  body('user_name').custom((value) => {
    return dbConnection.execute('SELECT username FROM users WHERE username=?', [value])
      .then(([rows]) => {
        if (rows.length == 1) {
          return true;
        }
        return Promise.reject('invalid username');
      });
  }),
  body('user_pass', 'Password is empty!').trim().not().isEmpty(),
], (req, res) => {
  const validation_result = validationResult(req);
  const {
    user_name,
    user_pass
  } = req.body;
  if (validation_result.isEmpty()) {

    dbConnection.execute("SELECT username,password,id FROM users WHERE username=?", [user_name])
      .then(([rows]) => {
        // console.log(rows[0].password);
        bcrypt.compare(user_pass, rows[0].password).then(compare_result => {
            if (compare_result === true) {
              req.session.isLoggedIn = true;
              console.log(rows[0].id);
              req.session.userID = rows[0].id;

              res.redirect('/');
            } else {
              res.render('login-register', {
                login_errors: ['Invalid Password!']
              });
            }
          })
          .catch(err => {
            if (err) throw err;
          });


      }).catch(err => {
        if (err) throw err;
      });
  } else {
    let allErrors = validation_result.errors.map((error) => {
      return error.msg;
    });

    res.render('login-register', {
      login_errors: allErrors
    });
  }
});




app.post('/add_item', ifNotLoggedin, upload.any('myImage'),

  function(req, res) {
    try {
      name = req.body.name;
      //console.log(name);
      description = req.body.description;
      //console.log(description);
      price = req.body.price;
      tags = [].concat(req.body.tags);
      console.log(tags);
      image_url = req.files[0].path;
      //console.log(image_url);
      id = req.session.userID;
      //console.log(name,description,tags,image_url,id);
      //Item insert
      dbConnection.execute("INSERT into items (name,description,image_url,seller_id,price) VALUES (?,?,?,?,?)", [name, description, image_url, id, price]).then(result => {
        res.render("add_item", {
          msg: "Item has Been Added Successfully!!"
        })
        if (tags) {

          dbConnection.execute("Select id from items order by created_at desc limit 1").then(([rows1]) => {

              console.log(tags);
              console.log(rows1);
              item_id = rows1[0].id;
              console.log(item_id);




              dbConnection.query("Select id from tags where tag_name in (?)", [tags]).then(([rows2]) => {
                //console.log(item_id,rows2);
                val = [];
                for (var i = 0; i < rows2.length; i++) {
                  val.push({
                    id1: item_id,
                    id2: rows2[i].id
                  });
                }
                console.log("Hoopa");
                console.log(val);
                for (var i = 0; i < val.length; i++) {
                  dbConnection.execute("INSERT into item_tags(item_id,tag_id) VALUES (?,?)", [val[i].id1, val[i].id2]).then(result => {
                    console.log("SUCCESS");
                  }).catch(err => {
                    console.log(err);})
                }

                // console.log(reses);
                //console.log("Wow");

              }).catch(err => {
                console.log(err);
              })

            }

          ).catch(err => {
            console.log(err);
          })
        }






      }).catch(err => {
        console.log(err);

      })



    } catch (err) {
      console.log("Fail");
      res.render("add_item", {
        msg: "Please Enter Data Correctly!!"
      });

    };
  });

var rv;


app.post('/product_details', ifNotLoggedin, (req, res, next) => {
  //console.log(req.body);
  //console.log("this is received");

  dbConnection.execute("Select tags.tag_name as tags from item_tags join tags on tags.id=item_tags.tag_id where item_tags.item_id=?", [req.body.id]).then(([rows]) => {
    //console.log("Hello"+rows.length);
    rv=req.body.id;
    console.log(rv,"rate");
    item_tags = [];

    if (rows.length) {
      for (var i = 0; i < rows.length; i++) {
        item_tags.push(rows[i].tags);
      }
    }
    dbConnection.execute("Select avg(rating)  as rating FROM review WHERE book_id=?", [req.body.id]).then(([data]) => {
      review_data=[]
      review_data.push({rate:data[0].rating})

})
    dbConnection.execute("Select concat(users.f_name,' ',users.l_name) as seller_name,users.phone as contact,items.name as name,items.description as description,items.image_url as image_url,items.price as price from items join users on items.seller_id=users.id  where items.id=?", [req.body.id]).then(([rows]) => {
      item_data = [];
      item_data.push({
        seller_name: rows[0].seller_name,
        contact: rows[0].contact,
        item_name: rows[0].name,
        description: rows[0].description,
        url: rows[0].image_url,
        price: rows[0].price
      });


      // console.log(item_data);

      res.render("product_details", {
        revi: review_data[0],
        prod: item_data[0],
        tags: item_tags
      });





    }).catch(err => {
      console.log(err);
      res.redirect("/market");
    })
    // console.log(tags);

  }).catch(err => {
    console.log("errortags")
    res.redirect("/market");
  })

});
// -----------------------------------------------------------------------------
//
app.post('/review_post',ifNotLoggedin,(req,res,next)=>{
  review=req.body.review;
  console.log(req.session.userID)
  console.log(rv);


  dbConnection.execute("INSERT into review (user_id,book_id,rating) VALUES (?,?,?)", [req.session.userID,rv,review])
    .then(result => {
    res.send(`your review has been submitted successfully, Now you can <a href="/">market</a>`);
    }).catch(err => {

      if (err) {
          dbConnection.execute("UPDATE review SET rating=? where user_id=? and book_id=?", [review,req.session.userID,rv])
          console.log("updated");
          res.send(`your review has been updated successfully, Now you can <a href="/">market</a>`);
      }
    });






  });
// -----------------------------------------------------------------------------


app.get('/logout', (req, res) => {
  //session destroy
  req.session = null;
  res.redirect('/');
});

//server listens
app.use('/', (req, res) => {
  res.status(404).send('<h1>404 Page Not Found!</h1>');
});

app.listen(3000, () => console.log("Server is Running..."));
