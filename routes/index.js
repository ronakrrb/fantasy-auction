var express = require('express'),
  router = express.Router(),
  bcrypt = require('bcrypt');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('pages/index', { title: 'Fantasy Auction', action: req.app.get('signup_message')});
});

router.post('/signup', function(req, res, next) {
  let nick = req.body.nick_name,
    email = req.body.email,
    password = req.body.password,
    pool = req.app.get('db_pool');

  bcrypt.hash(password, 10, function(err2, hash) {
    if (!err2) {
      pool.getConnection(function(err1, connection) {
        if (!err1) {
          var sql = `insert into users (nick_name, email, password) values('${nick}', '${email}', '${hash}')`;
          connection.query(sql, (err) => {
            if (!err) {
              req.app.set('signup_message', "Your signup is successful. Please login after your account is active.");
              connection.release();
              res.redirect('/');
            } else {
              console.log(err);
              connection.release();
              res.send({'status': 'error', 'result': err, 'summary': 'Query Error'});
            }
          });
        } else {
          connection.release();
          res.send({'status': 'error', 'result': err1});
        }
      });
    } else {
      res.send({'status': 'error', 'result': err1, 'summary': 'Unable to encrypt password'});
    }
  });
});

router.post('/login', function(req, res, next) {
  let email = req.body.email,
    password = req.body.password,
    pool = req.app.get('db_pool');

  pool.getConnection(function(err1, connection) {
    if (!err1) {
      var sql = `select * from users where email='${email}'`;
      connection.query(sql, (err, result) => {
        if (!err) {
          bcrypt.compare(password, result[0].password, function(err1, result1) {
            if (result1) {
              res.cookie('user_email', email);
              res.cookie('nick_name', result[0].nick_name);
              req.app.set('is_user_active', result[0].is_active);
              connection.release();
              res.redirect('/home');
            } else {
              connection.release();
              res.send({'status': 'error', 'result': 'Unable to Login', 'summary': 'Incorrect Password'});
            }
          });
        } else {
          console.log(err);
          connection.release();
          res.send({'status': 'error', 'result': err, 'summary': 'Query Error'});
        }
      });
    } else {
      connection.release();
      res.send({'status': 'error', 'result': err1});
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
