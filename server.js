#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('./app');
var debug = require('debug')('fantasy-auction:server');
var http = require('http');
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

var initSocket = () => {
  joinedUsers = {};
  io.on('connection', (socket) => {
    let league_code = "", user_email = "";
    console.log("user connected ++");

    socket.on('disconnect', () => {
      console.log('user disconnected', user_email);
      if (!joinedUsers[league_code]) {
        joinedUsers[league_code] = {};
      }
      joinedUsers[league_code][user_email] = false;
      socket.to(league_code).emit('isOnline-broadcast', joinedUsers[league_code]);
      socket.leave(league_code);
    });

    socket.on('join-push', (data) => {
      league_code = data.league_code;
      user_email = data.user_email;

      const rooms = socket.rooms.values();
      if(rooms.next().value === league_code) {
        return;
      }
      socket.rooms.clear();
      socket.join(league_code);

      if (!joinedUsers[league_code]) {
        joinedUsers[league_code] = {};
      }
      joinedUsers[league_code][user_email] = true;
      socket.to(league_code).emit('isOnline-broadcast', joinedUsers[league_code]);
      console.log('join-push', user_email, joinedUsers);
  });

    socket.on('fetchEntity-push', (data) => {
      console.log('Entity Push --> ', data, socket.id, data.league_code);
      socket.to(data.league_code).emit('fetchEntity-broadcast', data);
    });

    socket.on('bid-push', (data) => {
      console.log('Bid Push --> ', data);
      socket.to(data.league_code).emit('bid-broadcast', data);

      pool.getConnection(function(err1, connection) {
        if (!err1) {
          var q1 = new Promise((resolve, reject) => {
            let bidder = data.bidder ? `'${data.bidder}'` : data.bidder;
            var sql = `insert into bidding_details (user, entity_id, bid_amount, bid_status, created_at) values (${bidder}, ${data.entity_id}, ${data.bid}, '${data.status}', '${new Date()}')`;
            connection.query(sql, (err, result) => {
              if (err) {
                console.log(err);
                return reject(err);
              } else {
                // if (result[0]) {
                return resolve(result);
                // } else {
                //   return reject("Unable to Insert")
                // }
              }
            });
          });

          var promises = [q1];

          if (data.status === 'Sold') {
            var q2 = new Promise((resolve, reject) => {
              var sql = `update league_specific_entity_base_prices set is_sold=1 where id=${data.entity_id}`;
              connection.query(sql, (err, result) => {
                if (err) {
                  console.log(err);
                  return reject(err);
                } else {
                  return resolve(result);
                }
              });
            });

            var q3 = new Promise((resolve, reject) => {
              var sql = `insert into user_teams (user, entity_id) values ('${data.bidder}', ${data.entity_id})`;
              connection.query(sql, (err, result) => {
                if (err) {
                  console.log(err);
                  return reject(err);
                } else {
                  return resolve(result);
                }
              });
            });

            promises.push(q2, q3);
          }

          Promise.all(promises)
            .then(values => {
              connection.release();
            })
            .catch(err => {
              console.log(err);
              connection.release();
            });
        } else {
          connection.release();
          res.send({'status': 'error', 'result': err1});
        }
      });
    });
  });
}

const io = new Server(server, {
  cors: {
    origin: ["http://localhost.com/custom"],
    credentials: true
  }
});
app.set('io', io);
instrument(io, {
  auth: false,
  namespaceName: "/custom"
});

initSocket();

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}