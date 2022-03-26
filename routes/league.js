var express = require('express'),
  router = express.Router();

  /* GET home page. */
router.post('/create', function(req, res, next) {
  let pool = req.app.get('db_pool');
  pool.getConnection(function(err, connection) {
    if (!err) {
      var sql = "SELECT UUID();";
      connection.query(sql, function (err1, result1) {
        if (!err1) {
          var code = result1[0]['UUID()'];
          res.cookie('league_code', code);
          var sql = `insert into leagues (code, amount, created_by, created_at) values('${code}', '${req.body.amount}', '${req.cookies.user_email}', '${new Date()}')`;
          connection.query(sql, function (err2) {
            if (!err2) {
              connection.release();
              res.redirect('/league/index/choose-tournament');
            } else {
              connection.release();
              res.send({'status': 'error', 'result': err, 'summary': 'Generate League Code Query Error'});
            }
          });
        } else {
          connection.release();
          res.send({'status': 'error', 'result': err, 'summary': 'Generate League Code Query Error'});
        }
      });
    } else {
      connection.release();
      res.send({'status': 'error', 'result': err});
    }
  });
});

router.post('/join', function(req, res, next) {
  let pool = req.app.get('db_pool');
  // b8b537a2-8e81-11ec-bf39-be94aca32bed
  res.cookie('league_code', req.body.code);

  pool.getConnection(function(err1, connection) {
    if (!err1) {
      var q1 = new Promise((resolve, reject) => {
        var sql = `SELECT id from leagues where code='${req.body.code}'`;
        connection.query(sql, (err, result) => {
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
        connection.query(sql, (err, result) => {
          if (err) {
            console.log(err);
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      Promise.all([q1, q2])
        .then(values => {
          var sql = `insert into league_participants (league_id, user_id, joined_at) values('${values[0][0].id}', '${values[1][0].id}', '${new Date()}')`;
          connection.query(sql, function (err) {
            if (!err || !err.result || err.result.code === "ER_DUP_ENTRY") {
              connection.release();
              res.redirect('/bidding');
            } else {
              console.log(err);
              connection.release();
              res.send({'status': 'error', 'result': err, 'summary': 'Insert Query Error'});
            }
          });
        })
        .catch(err => {
          console.log(err);
          connection.release();
          res.render('pages/home', { title: 'Fantasy Auction', result: err });
        });
    } else {
      connection.release();
      res.send({'status': 'error', 'result': err1});
    }
  });

});

router.get('/index/:action', (req, res, next) => {
  if (!req.cookies.user_email) {
    res.redirect('/');
  }
  if (!req.cookies.league_code) {
    res.redirect('/home');
  }
  let pool = req.app.get('db_pool'),
    action = req.params.action

  if (action === 'choose-tournament') {
    pool.getConnection(function(err1, connection) {
      if (!err1) {
        var sql = `SELECT id, name from tournaments`;
        connection.query(sql, (err, result) => {
          if (err) {
            console.log(err);
            connection.release();
            res.send({'status': 'error', 'result': err});
          } else {
            connection.release();
            res.render('pages/auction/index', { title: "Welcome to the Auction", result: {league_code: req.cookies.league_code, tournaments: result} });
          }
        });
      } else {
        connection.release();
        res.send({'status': 'error', 'result': err1});
      }
    });
  }
});

router.post('/choose-tournament', function(req, res, next) {
  let pool = req.app.get('db_pool');

  pool.getConnection(function(err1, connection) {
    if (!err1) {
      var q1 = new Promise((resolve, reject) => {
        var sql = `update leagues set tournament_id=${req.body.tournament} where code='${req.cookies.league_code}'`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      var q2 = new Promise((resolve, reject) => {
        var sql = `insert into league_specific_entity_base_prices (league_id, entity_id, base_price, created_by, created_at) select l.id, ebp.id, ebp.base_price, '${req.cookies.user_email}', '${new Date()}' from leagues as l INNER JOIN entity_base_prices as ebp ON l.tournament_id=ebp.tournament_id and l.code='${req.cookies.league_code}';`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      Promise.all([q1, q2])
        .then(values => {
          connection.release();
          res.redirect('/league/base-prices');
        })
        .catch(err => {
          console.log(err);
          connection.release();
          res.send({'status': 'error', 'result': err});
        });
    } else {
      connection.release();
      res.send({'status': 'error', 'result': err1});
    }
  });
});

router.get('/base-prices', (req, res, next) => {
  if (!req.cookies.user_email) {
    res.redirect('/');
  }
  if (!req.cookies.league_code) {
    res.redirect('/home');
  }
  let pool = req.app.get('db_pool');

  pool.getConnection(function(err1, connection) {
    if (!err1) {
      var q1 = new Promise((resolve, reject) => {
        var sql = `select lsebp.id, lsebp.base_price, t.name from league_specific_entity_base_prices as lsebp INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN teams as t ON ebp.entity_id=t.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and ebp.entity_type='teams';`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      var q2 = new Promise((resolve, reject) => {
        var sql = `select lsebp.id, lsebp.base_price, p.name, p.category from league_specific_entity_base_prices as lsebp INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN players as p ON ebp.entity_id=p.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and ebp.entity_type='players';`;
        connection.query(sql, (err, result) => {
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

      Promise.all([q1, q2])
        .then(values => {
          connection.release();
          res.render('pages/auction/base-prices', { title: "Set base prices", result: {league_code: req.cookies.league_code, teams: values[0], players: values[1] } });
        })
        .catch(err => {
          console.log(err);
          connection.release();
          res.send({'status': 'error', 'result': err});
        });
    } else {
      connection.release();
      res.send({'status': 'error', 'result': err1});
    }
  });
});

router.post('/set-base-prices', (req, res, next) => {
  let pool = req.app.get('db_pool');

  pool.getConnection(function(err1, connection) {
    if (!err1) {
      var promises = [];

      for (var el in req.body) {
        let entity = el.split('_')[1];
        if (entity) {
          promises.push(new Promise((resolve, reject) => {
            let sql = `update league_specific_entity_base_prices set base_price=${req.body[el]} where id=${entity}`;
            connection.query(sql, (err, result) => {
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
          connection.release();
          res.redirect('/league/configure');
        })
        .catch(err => {
          console.log(err);
          connection.release();
          res.send({'status': 'error', 'result': err});
        });
    } else {
      connection.release();
      res.send({'status': 'error', 'result': err1});
    }
  });

});

router.get('/configure', (req, res, next) => {
  if (!req.cookies.user_email) {
    res.redirect('/');
  }
  if (!req.cookies.league_code) {
    res.redirect('/home');
  }
  res.render('pages/auction/configure', { title: "Configure the league", result: {league_code: req.cookies.league_code} });
});

router.post('/set-configurations', (req, res, next) => {
  let pool = req.app.get('db_pool');

  pool.getConnection(function(err1, connection) {
    if (!err1) {
      var promises = [];
      for (var el in req.body) {
        let config = el.split('-')[1];
        if (config) {
          promises.push(new Promise((resolve, reject) => {
            let sql = `insert into league_configurations (league_id, name, value, created_by, created_at) select id, '${config}', '${req.body[el]}', '${req.cookies.user_email}', '${new Date()}' from leagues where code='${req.cookies.league_code}'`;
            connection.query(sql, (err, result) => {
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
          connection.release();
          res.redirect('/bidding');
        })
        .catch(err => {
          console.log(err);
          connection.release();
          res.send({'status': 'error', 'result': err});
        });
    } else {
      connection.release();
      res.send({'status': 'error', 'result': err1});
    }
  });
});

module.exports = router;