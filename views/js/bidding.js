export function initBidding(result) {
  console.log(result)
  let socket = io(),
    user = result.user_email,
    pendingTeams = result.teams,
    pendingPlayers = result.players,
    currentEntity = null,
    currentEntityIndex = null,
    leagueConfig = result.league_config,
    currentBid = null,
    currentBidder = null,
    unsoldTeamsAuction = true,
    fetch_team_button =  document.getElementById('fetch_team'),
    fetch_player_button = document.getElementById('fetch_player'),
    bid_button = document.getElementById('bid'),
    sell_button = document.getElementById('sell'),
    unsold_button = document.getElementById('unsold'),
    is_team_purchased = result.is_team_purchased,
    remaining_purse = result.remaining_purse,
    live_purse = result.remaining_purse;

  socket.emit('join-push', {league_code: result.league_code, user_email: result.user_email});
  const showLiveBidding = () => {
    let details = result.bidding_details;
    if (details) {
      currentEntity = {id: details.entity_id, name: details.name, base_price: details.base_price, entity_type: details.tptype};
      updateEntity(currentEntity);
      currentBid = details.bid_amount;
      currentBidder = details.user;
      updateBid(currentBid, details.bid_status, details.user);
    }
  }

  const pickATeam = () => {
    if (pendingTeams.length) {
      currentEntityIndex = Math.floor((Math.random() * pendingTeams.length));
      currentEntity = pendingTeams[currentEntityIndex];
      pendingTeams.splice(currentEntityIndex, 1);
    } else {
      if (!unsoldTeamsAuction) {
        const entities = new Promise((resolve, reject) => {
          fetch('/bidding/fetch-unsold-teams')
            .then(response => response.json())
            .then((result) => {
              return resolve(result);
            });
        });

        Promise.all([entities])
          .then(values => {
            pendingTeams = values[0].teams;
            unsoldTeamsAuction = true;
            pickATeam();
          })
          .catch(err => {
            console.log(err);
          })
      } else {
        fetch_team_button ? fetch_team_button.classList.add('hideButton') : null;
        fetch_player_button ? fetch_player_button.classList.remove('hideButton') : null;
      }
    }
    if (unsoldTeamsAuction && !pendingTeams.length) {
      fetch_team_button ? fetch_team_button.classList.add('hideButton') : null;
      fetch_player_button ? fetch_player_button.classList.remove('hideButton') : null;
    }
    forwardEntity();
  }

  const pickAPlayer = () => {
    if (pendingPlayers.length) {
      currentEntityIndex = Math.floor((Math.random() * pendingPlayers.length));
      currentEntity = pendingPlayers[currentEntityIndex];
      pendingPlayers.splice(currentEntityIndex, 1);
    } else {
      const entities = new Promise((resolve, reject) => {
        fetch('/bidding/fetch-unsold-players')
          .then(response => response.json())
          .then((result) => {
            return resolve(result);
          });
      });

      Promise.all([entities])
        .then(values => {
          if (values[0].players.length) {
            pendingPlayers = values[0].players;
            pickAPlayer();
          }
        })
        .catch(err => {
          console.log(err);
        })
    }
    forwardEntity();
  }

  const forwardEntity = () => {
    updateEntity(currentEntity);
    socket.emit('fetchEntity-push', {...currentEntity, league_code: result.league_code, user_email: result.user_email});
    currentBid = null;
    updateBid(currentBid, "InProgress");
    socket.emit('bid-push', {bid: currentBid, bidder: null, entity_id: currentEntity.id, status: 'InProgress', league_code: result.league_code, user_email: result.user_email});
  }

  const updateEntity = (current_entity) => {
    currentEntity = current_entity;
    document.getElementsByClassName('entityName')[0].innerHTML = currentEntity.name;
    document.getElementsByClassName('entityBasePrice')[0].innerHTML = "Base: " + currentEntity.base_price;
    if (remaining_purse < currentEntity.base_price || (is_team_purchased > 0 && pendingTeams.length)) {
      bid_button ? bid_button.classList.add('hideButton') : null;
    } else {
      bid_button ? bid_button.classList.remove('hideButton') : null;
    }
  }

  const placeBid = () => {
    if (currentBidder === user) {
      return;
    }
    if (currentBid) {
      currentBid += +leagueConfig.bid_increments;
    } else {
      currentBid = currentEntity.base_price;
    }
    currentBidder = user;
    updateBid(currentBid, "InProgress", user);
    socket.emit('bid-push', {bid: currentBid, bidder: user, entity_id: currentEntity.id, status: 'InProgress', league_code: result.league_code, user_email: result.user_email});
  }

  const updateBid = (current_bid, status, bidder) => {
    currentBid = current_bid;
    currentBidder = bidder;

    if (status === "Sold" || status === "UnSold") {
      console.log(status, pendingTeams.length, pendingPlayers.length, currentEntity);
      if (status === "UnSold") {
        if (!currentEntity.category && currentEntity.entity_type !== "players") {
          unsoldTeamsAuction = false;
        }
      }
      if (pendingTeams.length || !unsoldTeamsAuction) { //  test all teams sold at once
        fetch_team_button ? fetch_team_button.classList.remove('hideButton') : "";
      } else {
        fetch_player_button ? fetch_player_button.classList.remove('hideButton') : null;
      }
      bid_button ? bid_button.classList.add('hideButton') : null;
      sell_button ? sell_button.classList.add('hideButton') : null;
      unsold_button ? unsold_button.classList.add('hideButton') : null;
    } else {
      fetch_team_button ? fetch_team_button.classList.add('hideButton') : null;
      fetch_player_button ? fetch_player_button.classList.add('hideButton') : null;
      if (currentBidder === user) {
        bid_button ? bid_button.classList.add('hideButton') : null;
      } else {
        bid_button && (!pendingTeams.length || !is_team_purchased) ? bid_button.classList.remove('hideButton') : null; // Second and third condition for Disable bid button once one team is purchased
      }
      if (currentBidder) {
        sell_button ? sell_button.classList.remove('hideButton') : null;
        unsold_button ? unsold_button.classList.add('hideButton') : null;
      } else {
        sell_button ? sell_button.classList.add('hideButton') : null;
        unsold_button ? unsold_button.classList.remove('hideButton') : null;
      }
    }

    // Update Live Purse
    if (status === "Sold") {
      if (currentBidder === user) {
        is_team_purchased = 1;
        remaining_purse = live_purse;
        document.querySelector('.actualPurse .amount').innerHTML = remaining_purse;
      } else {
        live_purse = remaining_purse;
        document.querySelector('.livePurse .amount').innerHTML = live_purse;
      }
    } else if (status === "InProgress") {
      if (currentBidder === user) {
        live_purse -= currentBid;
        document.querySelector('.livePurse .amount').innerHTML = live_purse;
      } else {
        live_purse = remaining_purse;
        let virtual_purse = live_purse - (currentBid ? (currentBid + (+leagueConfig.bid_increments)) : currentEntity.base_price),
          virtual_message = "";
        if (virtual_purse >= 0) {
          virtual_message = virtual_purse + " (If you bid)";
        } else {
          virtual_message = "You do not have enough amount in your purse to bid."
          bid_button ? bid_button.classList.add('hideButton') : null;
        }
        document.querySelector('.livePurse .amount').innerHTML = virtual_message;
      }
    }

    document.getElementsByClassName('bidAmount')[0].innerHTML = current_bid || "No Bid Yet";
    document.getElementsByClassName('bidStatus')[0].innerHTML = status || "InProgress";
    document.getElementsByClassName('bidder')[0].innerHTML = result.participants[bidder] || "";
  }

  const sold = () => {
    updateBid(currentBid, "Sold", currentBidder);
    socket.emit('bid-push', {bid: currentBid, bidder: currentBidder, entity_id: currentEntity.id, status: 'Sold', league_code: result.league_code, user_email: result.user_email});
  }

  const unsold = () => {
    updateBid(null, "UnSold");
    socket.emit('bid-push', {bid: null, bidder: null, entity_id: currentEntity.id, status: 'UnSold', league_code: result.league_code, user_email: result.user_email});
  }

  // document.getElementById('start_auction') ? document.getElementById('start_auction').onclick = startAuction : null;
  fetch_team_button ? fetch_team_button.onclick = pickATeam : null;
  fetch_player_button ? fetch_player_button.onclick = pickAPlayer : null;
  bid_button ? bid_button.onclick = placeBid : null;
  sell_button ? sell_button.onclick = sold : null;
  unsold_button ? unsold_button.onclick = unsold : null;
  showLiveBidding();


  socket.on("connect", () => {
    socket.on('fetchEntity-broadcast', function(data) {
      updateEntity(data);
    });
    socket.on('bid-broadcast', function(data) {
      updateBid(data.bid, data.status, data.bidder);
    });
    socket.on('isOnline-broadcast', function(data) {
      console.log(data);
      if (result.is_admin) {
        let participants_email_div =  document.getElementById('participants_email'),
          html = '<ul>';
        Object.entries(data).forEach(([key, value]) => {
          html += `<li class='${value ? "onlineUser" : "offlineUser"}'>${key}</li>`
        });
        html += '</ul>';
        participants_email_div ? participants_email_div.innerHTML = html : null;
      }
    });
  });
}

