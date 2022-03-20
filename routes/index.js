var express = require('express'),
  router = express.Router(),
  bcrypt = require('bcrypt'),
  db = require('./utils/db.js');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('pages/index', { title: 'Fantasy Auction', action: req.app.get('signup_message')});
});

router.post('/signup', function(req, res, next) {
  let db_instance = new db(),
    con = db_instance.con,
    nick = req.body.nick_name,
    email = req.body.email,
    password = req.body.password;

  con.connect(function(err) {
    if (err) {
      console.log(err);
      res.send({
          'status': 'error',
          'result': err,
          'summary': 'Connection Error'
      });
    } else {
      console.log("Connected!");
      bcrypt.hash(password, 10, function(err, hash) {
        if (!err) {
          var sql = `insert into users (nick_name, email, password) values('${nick}', '${email}', '${hash}')`;
          con.query(sql, function (err1, result) {
            if (!err1) {
              req.app.set('signup_message', "Your signup is successful. Please login after your account is active.");
              res.redirect('/');
            } else {
              console.log(err1);
              res.send({
                'status': 'error',
                'result': err1,
                'summary': 'Query Error'
              });
            }
          });
        } else {
          res.send({
            'status': 'error',
            'result': err,
            'summary': 'Unable to encrypt password'
          });
        }
      });
    }
  });
});

router.post('/login', function(req, res, next) {
  let db_instance = new db(),
    con = db_instance.con,
    email = req.body.email,
    password = req.body.password;

  con.connect(function(err) {
    if (err) {
      console.log(err);
      res.send({
          'status': 'error',
          'result': err,
          'summary': 'Connection Error'
      });
    } else {
      console.log("Connected!");
      var sql = `select * from users where email='${email}'`;
      con.query(sql, function (err, result) {
        if (!err) {
          bcrypt.compare(password, result[0].password, function(err, result1) {
            if (result1) {
              res.cookie('user_email', email);
              res.cookie('nick_name', result[0].nick_name);
              req.app.set('is_user_active', result[0].is_active);
              res.redirect('/home');
            } else {
              res.send({
                'status': 'error',
                'result': 'Unable to Login',
                'summary': 'Incorrect Password'
              });
            }
          });
        } else {
          console.log(err);
          res.send({
            'status': 'error',
            'result': err,
            'summary': 'Query Error'
          });
        }
      });
    }
  });
});

router.get('/home', (req, res, next) => {
  if (req.cookies.user_email) {
    res.render('pages/home', { title: 'Fantasy Auction', user: req.cookies.nick_name, is_active: req.app.get('is_user_active')});
  } else {
    res.redirect('/');
  }
});

router.get('/create-league', (req, res, next) => {
  if (req.cookies.user_email) {
    res.render('pages/create-league', { title: 'Fantasy Auction', user: req.cookies.nick_name, is_active: req.app.get('is_user_active')});
  } else {
    res.redirect('/');
  }
});

router.get('/ping', (req, res, next) => {
  res.send({
    'result': "pong"
  })
});

module.exports = router;
