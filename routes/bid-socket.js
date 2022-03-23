var initSocket = (io, pool, config) => {
  io.on('connection', (socket) => {
    console.log("user connected ++")
    socket.on('disconnect', () => {
      console.log('user disconnected');
      // let is_online = {};
      // is_online[config.user_email] = false;
      // socket.to(config.league_code).emit('isOnline-broadcast', is_online);
      socket.leave(config.league_code);
    });

    const rooms = socket.rooms.values();
    // console.log(rooms);
    if(rooms.next().value === config.league_code) {
      return;
    }
    // console.log(socket.rooms);
    socket.rooms.clear();
    // console.log(socket.rooms);
    socket.join(config.league_code);
    // console.log(socket.rooms);

    // socket.on('isOnline-push', (data) => {
    //   socket.emit('isOnline-broadcast', data);
    // });

    socket.on('fetchEntity-push', (data) => {
      console.log('Entity Push --> ', data, socket.id, config.league_code);
      socket.to(config.league_code).emit('fetchEntity-broadcast', data);
    });

    socket.on('bid-push', (data) => {
      console.log('Bid Push --> ', data);
      socket.to(config.league_code).emit('bid-broadcast', data);

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

module.exports = initSocket;