/*! For license information please see bidding.js.LICENSE.txt */
!function(e,n){"object"==typeof exports&&"object"==typeof module?module.exports=n():"function"==typeof define&&define.amd?define([],n):"object"==typeof exports?exports.FantasyAuction=n():e.FantasyAuction=n()}(this,(function(){return(()=>{"use strict";var __webpack_modules__={"./views/js/bidding.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"initBidding\": () => (/* binding */ initBidding)\n/* harmony export */ });\nfunction ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }\n\nfunction _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }\n\nfunction _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }\n\nfunction initBidding(result) {\n  console.log(result);\n  var socket = io(),\n      user = result.user_email,\n      leagueCode = result.league_code,\n      pendingTeams = result.teams,\n      pendingPlayers = result.players,\n      currentEntity = null,\n      currentEntityIndex = null,\n      leagueConfig = result.league_config,\n      currentBid = null,\n      currentBidder = null,\n      unsoldTeamsAuction = true,\n      fetch_team_button = document.getElementById('fetch_team'),\n      fetch_player_button = document.getElementById('fetch_player'),\n      bid_button = document.getElementById('bid'),\n      sell_button = document.getElementById('sell'),\n      unsold_button = document.getElementById('unsold'),\n      is_team_purchased = result.is_team_purchased,\n      remaining_purse = result.remaining_purse,\n      live_purse = result.remaining_purse;\n\n  var showLiveBidding = function showLiveBidding() {\n    var details = result.bidding_details;\n\n    if (details) {\n      currentEntity = {\n        id: details.entity_id,\n        name: details.name,\n        base_price: details.base_price,\n        entity_type: details.tptype\n      };\n      updateEntity(currentEntity);\n      currentBid = details.bid_amount;\n      currentBidder = details.user;\n      updateBid(currentBid, details.bid_status, details.user);\n    }\n  };\n\n  var pickATeam = function pickATeam() {\n    if (pendingTeams.length) {\n      currentEntityIndex = Math.floor(Math.random() * pendingTeams.length);\n      currentEntity = pendingTeams[currentEntityIndex];\n      pendingTeams.splice(currentEntityIndex, 1);\n    } else {\n      if (!unsoldTeamsAuction) {\n        var entities = new Promise(function (resolve, reject) {\n          fetch('/bidding/fetch-unsold-teams').then(function (response) {\n            return response.json();\n          }).then(function (result) {\n            return resolve(result);\n          });\n        });\n        Promise.all([entities]).then(function (values) {\n          pendingTeams = values[0].teams;\n          unsoldTeamsAuction = true;\n          pickATeam();\n        })[\"catch\"](function (err) {\n          console.log(err);\n        });\n      } else {\n        fetch_team_button ? fetch_team_button.classList.add('hideButton') : null;\n        fetch_player_button ? fetch_player_button.classList.remove('hideButton') : null;\n      }\n    }\n\n    if (unsoldTeamsAuction && !pendingTeams.length) {\n      fetch_team_button ? fetch_team_button.classList.add('hideButton') : null;\n      fetch_player_button ? fetch_player_button.classList.remove('hideButton') : null;\n    }\n\n    forwardEntity();\n  };\n\n  var pickAPlayer = function pickAPlayer() {\n    if (pendingPlayers.length) {\n      currentEntityIndex = Math.floor(Math.random() * pendingPlayers.length);\n      currentEntity = pendingPlayers[currentEntityIndex];\n      pendingPlayers.splice(currentEntityIndex, 1);\n    } else {\n      var entities = new Promise(function (resolve, reject) {\n        fetch('/bidding/fetch-unsold-players').then(function (response) {\n          return response.json();\n        }).then(function (result) {\n          return resolve(result);\n        });\n      });\n      Promise.all([entities]).then(function (values) {\n        if (values[0].players.length) {\n          pendingPlayers = values[0].players;\n          pickAPlayer();\n        }\n      })[\"catch\"](function (err) {\n        console.log(err);\n      });\n    }\n\n    forwardEntity();\n  };\n\n  var forwardEntity = function forwardEntity() {\n    updateEntity(currentEntity);\n    socket.to(leagueCode).emit('fetchEntity-push', _objectSpread(_objectSpread({}, currentEntity), {}, {\n      league_code: leagueCode\n    }));\n    currentBid = null;\n    updateBid(currentBid, \"InProgress\");\n    socket.to(leagueCode).emit('bid-push', {\n      bid: currentBid,\n      bidder: null,\n      entity_id: currentEntity.id,\n      status: 'InProgress',\n      league_code: leagueCode\n    });\n  };\n\n  var updateEntity = function updateEntity(current_entity) {\n    currentEntity = current_entity;\n    document.getElementsByClassName('entityName')[0].innerHTML = currentEntity.name;\n    document.getElementsByClassName('entityBasePrice')[0].innerHTML = \"Base: \" + currentEntity.base_price;\n\n    if (remaining_purse < currentEntity.base_price || is_team_purchased > 0 && pendingTeams.length) {\n      bid_button ? bid_button.classList.add('hideButton') : null;\n    } else {\n      bid_button ? bid_button.classList.remove('hideButton') : null;\n    }\n  };\n\n  var placeBid = function placeBid() {\n    if (currentBidder === user) {\n      return;\n    }\n\n    if (currentBid) {\n      currentBid += +leagueConfig.bid_increments;\n    } else {\n      currentBid = currentEntity.base_price;\n    }\n\n    currentBidder = user;\n    updateBid(currentBid, \"InProgress\", user);\n    socket.to(leagueCode).emit('bid-push', {\n      bid: currentBid,\n      bidder: user,\n      entity_id: currentEntity.id,\n      status: 'InProgress',\n      league_code: leagueCode\n    });\n  };\n\n  var updateBid = function updateBid(current_bid, status, bidder) {\n    currentBid = current_bid;\n    currentBidder = bidder;\n\n    if (status === \"Sold\" || status === \"UnSold\") {\n      console.log(status, pendingTeams.length, pendingPlayers.length, currentEntity);\n\n      if (status === \"UnSold\") {\n        if (!currentEntity.category && currentEntity.entity_type !== \"players\") {\n          unsoldTeamsAuction = false;\n        }\n      }\n\n      if (pendingTeams.length || !unsoldTeamsAuction) {\n        //  test all teams sold at once\n        fetch_team_button ? fetch_team_button.classList.remove('hideButton') : \"\";\n      } else {\n        fetch_player_button ? fetch_player_button.classList.remove('hideButton') : null;\n      }\n\n      bid_button ? bid_button.classList.add('hideButton') : null;\n      sell_button ? sell_button.classList.add('hideButton') : null;\n      unsold_button ? unsold_button.classList.add('hideButton') : null;\n    } else {\n      fetch_team_button ? fetch_team_button.classList.add('hideButton') : null;\n      fetch_player_button ? fetch_player_button.classList.add('hideButton') : null;\n\n      if (currentBidder === user) {\n        bid_button ? bid_button.classList.add('hideButton') : null;\n      } else {\n        bid_button && (!pendingTeams.length || !is_team_purchased) ? bid_button.classList.remove('hideButton') : null; // Second and third condition for Disable bid button once one team is purchased\n      }\n\n      if (currentBidder) {\n        sell_button ? sell_button.classList.remove('hideButton') : null;\n        unsold_button ? unsold_button.classList.add('hideButton') : null;\n      } else {\n        sell_button ? sell_button.classList.add('hideButton') : null;\n        unsold_button ? unsold_button.classList.remove('hideButton') : null;\n      }\n    } // Update Live Purse\n\n\n    if (status === \"Sold\") {\n      if (currentBidder === user) {\n        is_team_purchased = 1;\n        remaining_purse = live_purse;\n        document.querySelector('.actualPurse .amount').innerHTML = remaining_purse;\n      } else {\n        live_purse = remaining_purse;\n        document.querySelector('.livePurse .amount').innerHTML = live_purse;\n      }\n    } else if (status === \"InProgress\") {\n      if (currentBidder === user) {\n        live_purse -= currentBid;\n        document.querySelector('.livePurse .amount').innerHTML = live_purse;\n      } else {\n        live_purse = remaining_purse;\n        var virtual_purse = live_purse - (currentBid ? currentBid + +leagueConfig.bid_increments : currentEntity.base_price),\n            virtual_message = \"\";\n\n        if (virtual_purse >= 0) {\n          virtual_message = virtual_purse + \" (If you bid)\";\n        } else {\n          virtual_message = \"You do not have enough amount in your purse to bid.\";\n          bid_button ? bid_button.classList.add('hideButton') : null;\n        }\n\n        document.querySelector('.livePurse .amount').innerHTML = virtual_message;\n      }\n    }\n\n    document.getElementsByClassName('bidAmount')[0].innerHTML = current_bid || \"No Bid Yet\";\n    document.getElementsByClassName('bidStatus')[0].innerHTML = status || \"InProgress\";\n    document.getElementsByClassName('bidder')[0].innerHTML = result.participants[bidder] || \"\";\n  };\n\n  var sold = function sold() {\n    updateBid(currentBid, \"Sold\", currentBidder);\n    socket.to(leagueCode).emit('bid-push', {\n      bid: currentBid,\n      bidder: currentBidder,\n      entity_id: currentEntity.id,\n      status: 'Sold',\n      league_code: leagueCode\n    });\n  };\n\n  var unsold = function unsold() {\n    updateBid(null, \"UnSold\");\n    socket.to(leagueCode).emit('bid-push', {\n      bid: null,\n      bidder: null,\n      entity_id: currentEntity.id,\n      status: 'UnSold',\n      league_code: leagueCode\n    });\n  }; // document.getElementById('start_auction') ? document.getElementById('start_auction').onclick = startAuction : null;\n\n\n  fetch_team_button ? fetch_team_button.onclick = pickATeam : null;\n  fetch_player_button ? fetch_player_button.onclick = pickAPlayer : null;\n  bid_button ? bid_button.onclick = placeBid : null;\n  sell_button ? sell_button.onclick = sold : null;\n  unsold_button ? unsold_button.onclick = unsold : null;\n  showLiveBidding();\n  socket.on(\"connect\", function () {\n    socket.on('fetchEntity-broadcast', function (data) {\n      updateEntity(data);\n    });\n    socket.on('bid-broadcast', function (data) {\n      updateBid(data.bid, data.status, data.bidder);\n    });\n  });\n}\n\n//# sourceURL=webpack://FantasyAuction/./views/js/bidding.js?")}},__webpack_require__={d:(e,n)=>{for(var t in n)__webpack_require__.o(n,t)&&!__webpack_require__.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:n[t]})},o:(e,n)=>Object.prototype.hasOwnProperty.call(e,n),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},__webpack_exports__={};return __webpack_modules__["./views/js/bidding.js"](0,__webpack_exports__,__webpack_require__),__webpack_exports__})()}));