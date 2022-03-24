var express = require('express'),
  router = express.Router(),
  initSocket = require('./bid-socket.js');

router.get('/', (req, res, next) => {
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
        var sql = `SELECT created_by from leagues where code='${req.cookies.league_code}'`;
        connection.query(sql, (err, result) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            if (result[0]) {
              return resolve(result);
            } else {
              return reject("No league found")
            }
          }
        });
      });

      var q2 = new Promise((resolve, reject) => {
        var sql = `SELECT bd.user, bd.entity_id, bd.bid_amount, bd.bid_status, ebp.entity_id as tpid, ebp.entity_type as tptype, lsebp.base_price from bidding_details as bd INNER JOIN league_specific_entity_base_prices as lsebp ON lsebp.id=bd.entity_id INNER JOIN entity_base_prices as ebp ON ebp.id=lsebp.entity_id INNER JOIN leagues as l ON l.id=lsebp.league_id where l.code='${req.cookies.league_code}' order by bd.id desc limit 0,1`;
        connection.query(sql, (err, result) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            if (result[0]) {
              if (result[0].tptype === "teams") {
                var sql1 = `SELECT name from teams where id=${result[0].tpid}`;
              } else if (result[0].tptype === "players") {
                var sql1 = `SELECT name from players where id=${result[0].tpid}`;
              }
              connection.query(sql1, (err, result1) => {
                if (err) {
                  console.log(err);
                } else {
                  result[0].name = result1[0].name;
                }
                return resolve(result[0]);
              });
            } else {
              return resolve(result[0]);
            }
          }
        });
      });

      var q3 = new Promise((resolve, reject) => {
        var sql = `select lc.name, lc.value from league_configurations as lc INNER JOIN leagues as l ON lc.league_id=l.id where l.code='${req.cookies.league_code}';`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            let leagueConfig = {}
            result.forEach((config) => {
              leagueConfig[config.name] = config.value;
            });
            return resolve(leagueConfig);
          }
        });
      });

      var q4 = new Promise((resolve, reject) => {
        var sql = `select lsebp.id, lsebp.base_price, t.name from league_specific_entity_base_prices as lsebp INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN teams as t ON ebp.entity_id=t.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and ebp.entity_type='teams' and lsebp.id NOT IN (select entity_id from bidding_details);`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      var q5 = new Promise((resolve, reject) => {
         var sql = `select lsebp.id, lsebp.base_price, p.name, p.category from league_specific_entity_base_prices as lsebp INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN players as p ON ebp.entity_id=p.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and ebp.entity_type='players' and lsebp.id NOT IN (select entity_id from bidding_details);`;
         connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            // let players = {};
            // result.forEach(el => {
            //   players[el.category] ? players[el.category].push(el) : players[el.category] = [el];
            // });
            return resolve(result);
          }
        });
      });

      var q6 = new Promise((resolve, reject) => {
        var sql = `SELECT u.nick_name, u.email from users as u INNER JOIN league_participants as lp ON u.id=lp.user_id INNER JOIN leagues as l ON lp.league_id=l.id where l.code='${req.cookies.league_code}'`;
        connection.query(sql, (err, result) => {
          if (err) {
            console.log(err);
            return reject(err);
          } else {
            if (result[0]) {
              return resolve(result);
            } else {
              return resolve([])
            }
          }
        });
      });

      var q7 = new Promise((resolve, reject) => {
        var sql = `select t.name, bd.bid_amount from bidding_details as bd INNER JOIN league_specific_entity_base_prices as lsebp ON bd.entity_id=lsebp.id INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN teams as t ON ebp.entity_id=t.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and bd.user='${req.cookies.user_email}' and bd.bid_status='Sold' and ebp.entity_type='teams';`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      var q8 = new Promise((resolve, reject) => {
        var sql = `select 3000 as amount from leagues where code='${req.cookies.league_code}';`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      var q9 = new Promise((resolve, reject) => {
        var sql = `select t.name, bd.bid_amount from bidding_details as bd INNER JOIN league_specific_entity_base_prices as lsebp ON bd.entity_id=lsebp.id INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN teams as t ON ebp.entity_id=t.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and bd.user='${req.cookies.user_email}' and bd.bid_status='Sold' and ebp.entity_type='teams';`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      var q10 = new Promise((resolve, reject) => {
        var sql = `select p.name, p.category, bd.bid_amount from bidding_details as bd INNER JOIN league_specific_entity_base_prices as lsebp ON bd.entity_id=lsebp.id INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN players as p ON ebp.entity_id=p.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and bd.user='${req.cookies.user_email}' and bd.bid_status='Sold' and ebp.entity_type='players' ORDER by p.category asc;`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      var q11 = new Promise((resolve, reject) => {
        var sql = `select lsebp.id, 260 as base_price, t.name from league_specific_entity_base_prices as lsebp INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN teams as t ON ebp.entity_id=t.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and ebp.entity_type='teams' and lsebp.is_sold=0;`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      var q12 = new Promise((resolve, reject) => {
        var sql = `select DISTINCT lsebp.entity_id, lsebp.id, lsebp.base_price, p.name, p.category from league_specific_entity_base_prices as lsebp INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN players as p ON ebp.entity_id=p.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and ebp.entity_type='players' and lsebp.is_sold=0;`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      Promise.all([q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12])
        .then(values => {
          is_admin = false;
          if (values[0][0].created_by === req.cookies.user_email) is_admin = true;

          let participants = {}
          if (values[5].length) {
            Array.from(values[5]).forEach(user => {
              participants[user.email] = user.nick_name;
            })
          }

          let players_total = 0, team_total = 0;
          if (values[8].length) {
            team_total = values[8][0].bid_amount;
          }
          if (values[9].length) {
            Array.from(values[9]).forEach(player => {
              players_total += player.bid_amount;
            });
          }
          console.log(values[7]);
          let remaining = values[7][0].amount - (team_total + players_total);
          connection.release();
          res.render('pages/league/bidding', { title: "Welcome to the Auction", result: {league_code: req.cookies.league_code, is_admin: is_admin, league_config: values[2], teams: values[3].length ? values[3] : values[10], players: values[4].length ? values[4] : values[11], bidding_details: values[1], participants: participants, is_team_purchased: values[6].length, remaining_purse: remaining, user_email: req.cookies.user_email, nick_name: req.cookies.nick_name}, page: "bidding" });
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

router.get('/fetch-unsold-teams', (req, res, next) => {
  let pool = req.app.get('db_pool');

  pool.getConnection(function(err1, connection) {
    if (!err1) {
      var sql = `select lsebp.id, 260 as base_price, t.name from league_specific_entity_base_prices as lsebp INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN teams as t ON ebp.entity_id=t.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and ebp.entity_type='teams' and lsebp.is_sold=0;`;
      connection.query(sql, (err, result) => {
        if (err) {
          connection.release();
          res.send({'status': 'error', 'result': err});
        } else {
          connection.release();
          res.send({teams: result, user_email: req.cookies.user_email });
        }
      });
    } else {
      connection.release();
      res.send({'status': 'error', 'result': err1});
    }
  });
});

router.get('/fetch-unsold-players', (req, res, next) => {
  let pool = req.app.get('db_pool');

  pool.getConnection(function(err1, connection) {
    if (!err1) {
      var sql = `select DISTINCT lsebp.entity_id, lsebp.id, lsebp.base_price, p.name, p.category from league_specific_entity_base_prices as lsebp INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN players as p ON ebp.entity_id=p.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and ebp.entity_type='players' and lsebp.is_sold=0;`;
      connection.query(sql, (err, result) => {
        if (err) {
          connection.release();
          res.send({'status': 'error', 'result': err});
        } else {
          connection.release();
          res.send({players: result, user_email: req.cookies.user_email });
        }
      });
    } else {
      connection.release();
      res.send({'status': 'error', 'result': err1});
    }
  });
});

router.get('/my-team', (req, res, next) => {
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
        var sql = `select 3000 as amount from leagues where code='${req.cookies.league_code}';`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      var q2 = new Promise((resolve, reject) => {
        var sql = `select t.name, bd.bid_amount from bidding_details as bd INNER JOIN league_specific_entity_base_prices as lsebp ON bd.entity_id=lsebp.id INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN teams as t ON ebp.entity_id=t.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and bd.user='${req.cookies.user_email}' and bd.bid_status='Sold' and ebp.entity_type='teams';`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      var q3 = new Promise((resolve, reject) => {
        // var sql = `select p.name, p.category, bd.bid_amount from bidding_details as bd INNER JOIN league_specific_entity_base_prices as lsebp ON bd.entity_id=lsebp.id INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN players as p ON ebp.entity_id=p.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and bd.user='${req.cookies.user_email}' and bd.bid_status='Sold' and ebp.entity_type='players' ORDER by p.category asc;`;
        var sql = `select p.name, p.category, bd.bid_amount, t.slug from bidding_details as bd INNER JOIN league_specific_entity_base_prices as lsebp ON bd.entity_id=lsebp.id INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN players as p ON ebp.entity_id=p.id INNER JOIN tournaments_teams_players_association as ttpa ON ttpa.player_id=p.id INNER JOIN teams as t ON t.id=ttpa.team_id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and bd.user='${req.cookies.user_email}' and bd.bid_status='Sold' and ebp.entity_type='players' ORDER by p.category asc;`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      Promise.all([q1, q2, q3])
        .then(values => {
          let players_total = 0, team_total = 0;
          if (values[1].length) {
            team_total = values[1][0].bid_amount;
          }
          if (values[2].length) {
            Array.from(values[2]).forEach(player => {
              players_total += player.bid_amount;
            });
          }
          let remaining = values[0][0].amount - (team_total + players_total);
          connection.release();
          res.render('pages/league/my-team', { title: "My Team", result: {league_code: req.cookies.league_code, team: values[1][0], players: values[2], remaining_purse: remaining, user_email: req.cookies.user_email}, page: "my_team" });
        })
        .catch(err => {
          console.log(err);
          connection.release();
          res.render('pages/league/my-team', { title: "Please try again", page: "my_team" });
        });
    } else {
      connection.release();
      res.send({'status': 'error', 'result': err1});
    }
  });
});

router.get('/competitors', (req, res, next) => {
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
        var sql = `select 3000 as amount from leagues where code='${req.cookies.league_code}';`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      var q2 = new Promise((resolve, reject) => {
        var sql = `select bd.user, u.nick_name, t.name, bd.bid_amount from bidding_details as bd INNER JOIN users as u ON bd.user=u.email INNER JOIN league_specific_entity_base_prices as lsebp ON bd.entity_id=lsebp.id INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN teams as t ON ebp.entity_id=t.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and bd.bid_status='Sold' and ebp.entity_type='teams';`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      var q3 = new Promise((resolve, reject) => {
        var sql = `select bd.user, u.nick_name, p.name, p.category, bd.bid_amount from bidding_details as bd INNER JOIN users as u ON bd.user=u.email INNER JOIN league_specific_entity_base_prices as lsebp ON bd.entity_id=lsebp.id INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN players as p ON ebp.entity_id=p.id INNER JOIN leagues as l ON lsebp.league_id=l.id where l.code='${req.cookies.league_code}' and bd.bid_status='Sold' and ebp.entity_type='players' ORDER by p.category asc;`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      Promise.all([q1, q2, q3])
        .then(values => {
          let competitors = {};
          if (values[1].length) {
            Array.from(values[1]).forEach(team => {
              competitors[team.nick_name] = {
                team: team,
                remaining_purse: values[0][0].amount - team.bid_amount,
                players: []
              }
            });
          }
          if (values[2].length) {
            Array.from(values[2]).forEach(player => {
              if (competitors[player.nick_name]) {
                competitors[player.nick_name].players.push(player);
                competitors[player.nick_name].remaining_purse -= player.bid_amount;
              } else {
                competitors[player.nick_name] = {
                  team: {},
                  remaining_purse: values[0][0].amount - player.bid_amount,
                  players: [player]
                }
              }
            });
          }
          connection.release();
          res.render('pages/league/competitors', { title: "Competitors", result: {league_code: req.cookies.league_code, competitors: competitors, user_email: req.cookies.user_email}, page: "competitors" });
        })
        .catch(err => {
          console.log(err);
          connection.release();
          res.render('pages/league/competitors', { title: "Please try again", page: "competitors" });
        });
    } else {
      connection.release();
      res.send({'status': 'error', 'result': err1});
    }
  });
});

router.get('/auction-pool', (req, res, next) => {
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
        var sql = `select t.name, lsebp.base_price, bd.bid_status, bd.bid_amount from league_specific_entity_base_prices as lsebp INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN teams as t ON ebp.entity_id=t.id INNER JOIN leagues as l ON lsebp.league_id=l.id LEFT JOIN bidding_details as bd ON bd.entity_id=lsebp.id and (bd.bid_status='Sold' or (bd.bid_status='UnSold' and lsebp.is_sold=0)) where l.code='${req.cookies.league_code}' and ebp.entity_type='teams';`;
        connection.query(sql, (err, result) => {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      });

      var q2 = new Promise((resolve, reject) => {
        var sql = `select DISTINCT lsebp.entity_id, p.name, lsebp.base_price, bd.bid_status, bd.bid_amount from league_specific_entity_base_prices as lsebp INNER JOIN entity_base_prices as ebp ON lsebp.entity_id=ebp.id INNER JOIN players as p ON ebp.entity_id=p.id INNER JOIN leagues as l ON lsebp.league_id=l.id LEFT JOIN bidding_details as bd ON bd.entity_id=lsebp.id AND (bd.bid_status='Sold' or (bd.bid_status='UnSold' and lsebp.is_sold=0)) where l.code='${req.cookies.league_code}' and ebp.entity_type='players';`;
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
          res.render('pages/league/auction-pool', { title: "Auction Pool", result: {league_code: req.cookies.league_code, teams: values[0], players: values[1], user_email: req.cookies.user_email}, page: "auction_pool" });
        })
        .catch(err => {
          console.log(err);
          connection.release();
          res.render('pages/league/auction-pool', { title: "Please try again", page: "auction_pool" });
        });
    } else {
      connection.release();
      res.send({'status': 'error', 'result': err1});
    }
  });
});

module.exports = router;
