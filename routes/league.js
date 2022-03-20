var express = require('express'),
  router = express.Router(),
  db = require('./utils/db.js');

/* GET home page. */
router.post('/create', function(req, res, next) {
  let db_instance = new db(),
    con = db_instance.con;

  var c1 = new Promise((resolve, reject) => {
    con.connect((err, result) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });

  var q1 = new Promise((resolve, reject) => {
    var sql = "SELECT UUID();";
    return con.query(sql, (err, result) => {
      if (err) {
        console.log(err);
        reject(err);
        res.send({
          'status': 'error',
          'result': err,
          'summary': 'Generate League Code Query Error'
        });
      } else {
        return resolve(result);
      }
    });
  });

  Promise.all([c1, q1])
    .then(values => {
      var code = values[1][0]['UUID()'];
      res.cookie('league_code', code);
      var sql = `insert into leagues (code, amount, created_by, created_at) values('${code}', '${req.body.amount}', '${req.cookies.user_email}', '${new Date()}')`;
      con.query(sql, function (err, result1) {
        if (err) {
          console.log(err);
          res.send({
            'status': 'error',
            'result': err,
            'summary': 'Insert Query Error'
          });
        } else {
          res.redirect('/league/index/choose-tournament');
        }
      });
    })
    .catch(err => {
      console.log(err);
      res.send({
        'status': 'error',
        'result': err,
      });
    });
});

router.post('/join', function(req, res, next) {
  let db_instance = new db(),
    con = db_instance.con;
  // b8b537a2-8e81-11ec-bf39-be94aca32bed
  res.cookie('league_code', req.body.code);
  var c1 = new Promise((resolve, reject) => {
    con.connect((err, result) => {
      if (err) {
        console.log(err);
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });

  var q1 = new Promise((resolve, reject) => {
    var sql = `SELECT id from leagues where code='${req.body.code}'`;
    con.query(sql, (err, result) => {
      if (err) {
        console.log(err);
        return reject(err);
      } else {
        if (result[0]) {
          return resolve(result);
        } else {
          return reject("No league found.");
        }
      }
    });
  });

  var q2 = new Promise((resolve, reject) => {
    var sql = `SELECT id from users where email='${req.cookies.user_email}'`;
    con.query(sql, (err, result) => {
      if (err) {
        console.log(err);
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });

  Promise.all([c1, q1, q2])
    .then(values => {
      var sql = `insert into league_participants (league_id, user_id, joined_at) values('${values[1][0].id}', '${values[2][0].id}', '${new Date()}')`;
      con.query(sql, function (err, result1) {
        if (!err || !err.result || err.result.code === "ER_DUP_ENTRY") {
          res.redirect('/bidding');
        } else {
          console.log(err);
          res.send({
            'status': 'error',
            'result': err,
            'summary': 'Insert Query Error'
          });
        }
      });
    })
    .catch(err => {
      console.log(err);
      res.render('pages/home', { title: 'Fantasy Auction', result: err });
    });
});

router.get('/index/:action', (req, res, next) => {
  if (!req.cookies.user_email) {
    res.redirect('/');
  }
  if (!req.cookies.league_code) {
    res.redirect('/home');
  }
  let db_instance = new db(),
    con = db_instance.con,
    action = req.params.action

  var c1 = new Promise((resolve, reject) => {
    con.connect((err, result) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });

  var q1 = new Promise((resolve, reject) => {
    var sql = `SELECT id, name from tournaments`;
    con.query(sql, (err, result) => {
      if (err) {
        console.log(err);
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });

  if (action === 'choose-tournament') {
    Promise.all([c1, q1])
      .then(values => {
        res.render('pages/league/index', { title: "Welcome to the Auction", result: {league_code: req.cookies.league_code, tournaments: values[1]} });
      })
      .catch(err => {
        console.log(err);
        res.send({
          'status': 'error',
          'result': err,
        });
      });
  }
});

router.post('/choose-tournament', function(req, res, next) {
  let db_instance = new db(),
    con = db_instance.con;
  var c1 = new Promise((resolve, reject) => {
    con.connect((err, result) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });

  var q1 = new Promise((resolve, reject) => {
    var sql = `update leagues set tournament_id=${req.body.tournament} where code='${req.cookies.league_code}'`;
    con.query(sql, (err, result) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });

  var q2 = new Promise((resolve, reject) => {
    var sql = `insert into league_specific_entity_base_prices (league_id, entity_id, base_price, created_by, created_at) select l.id, ebp.id, ROUND(ebp.base_price/100*(l.amount/(select count(id) from entity_base_prices where tournament_id=l.tournament_id and entity_type='teams')),0), '${req.cookies.user_email}', '${new Date()}' from leagues as l INNER JOIN entity_base_prices as ebp ON l.tournament_id=ebp.tournament_id and l.code='${req.cookies.league_code}';`;
    con.query(sql, (err, result) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });

  Promise.all([c1, q1, q2])
    .then(values => {
      res.redirect('/league/base-prices');
    })
    .catch(err => {
      console.log(err);
      res.send({
        'status': 'error',
        'result': err,
      });
    });
});

router.get('/base-prices', (req, res, next) => {
  if (!req.cookies.user_email) {
    res.redirect('/');
  }
  if (!req.cookies.league_code) {
    res.redirect('/home');
  }
  let db_instance = new db(),
    con = db_instance.con;

  var c1 = new Promise((resolve, reject) => {
    con.connect((err, result) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });

  var q1 = new Promise((resolve, reject) => {
    var sql = `select lsebp.id, lsebp.base_price, t.name from league_specific_entity_base_prices as lsebp INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN teams as t ON ebp.entity_id=t.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and ebp.entity_type='teams';`;
    con.query(sql, (err, result) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  });

  var q2 = new Promise((resolve, reject) => {
    var sql = `select lsebp.id, lsebp.base_price, p.name, p.category from league_specific_entity_base_prices as lsebp INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN players as p ON ebp.entity_id=p.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and ebp.entity_type='players';`;
    con.query(sql, (err, result) => {
      if (err) {
        return reject(err);
      } else {
        let players = {};
        result.forEach(el => {
          players[el.category] ? players[el.category].push(el) : players[el.category] = [el];
        });
        return resolve(players);
      }
    });
  });

  Promise.all([c1, q1, q2])
    .then(values => {
      res.render('pages/league/base-prices', { title: "Set base prices", result: {league_code: req.cookies.league_code, teams: values[1], players: values[2] } });
    })
    .catch(err => {
      console.log(err);
      res.send({
        'status': 'error',
        'result': err,
      });
    });

});

router.post('/set-base-prices', (req, res, next) => {
  let db_instance = new db(),
    con = db_instance.con;

  var promises = [new Promise((resolve, reject) => {
    con.connect((err, result) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  })];

  for (var el in req.body) {
    let entity = el.split('_')[1];
    if (entity) {
      promises.push(new Promise((resolve, reject) => {
        let sql = `update league_specific_entity_base_prices set base_price=${req.body[el]} where id=${entity}`;
        con.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      }));
    }
  }

  Promise.all(promises)
    .then(values => {
      res.redirect('/league/configure');
    })
    .catch(err => {
      console.log(err);
      res.send({
        'status': 'error',
        'result': err,
      });
    });

});

router.get('/configure', (req, res, next) => {
  if (!req.cookies.user_email) {
    res.redirect('/');
  }
  if (!req.cookies.league_code) {
    res.redirect('/home');
  }
  res.render('pages/league/configure', { title: "Configure the league", result: {league_code: req.cookies.league_code} });
});

router.post('/set-configurations', (req, res, next) => {
  let db_instance = new db(),
    con = db_instance.con;

  var promises = [new Promise((resolve, reject) => {
    con.connect((err, result) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(result);
      }
    });
  })];

  for (var el in req.body) {
    let config = el.split('-')[1];
    if (config) {
      promises.push(new Promise((resolve, reject) => {
        let sql = `insert into league_configurations (league_id, name, value, created_by, created_at) select id, '${config}', '${req.body[el]}', '${req.cookies.user_email}', '${new Date()}' from leagues where code='${req.cookies.league_code}'`;
        con.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      }));
    }
  }

  Promise.all(promises)
    .then(values => {
      res.redirect('/bidding');
    })
    .catch(err => {
      console.log(err);
      res.send({
        'status': 'error',
        'result': err,
      });
    });

});



module.exports = router;
