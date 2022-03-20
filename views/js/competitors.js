export function initCompetitors(result) {
  console.log(result);

  const detailView = (data, competitor_name) => {
    var html = `
      <h4 class="remainingPurse">Remaining in ${competitor_name}'s purse is ${data.remaining_purse}</h4>
      <div class="biddingEntity">
    `;
    if(data.team && data.team.name) {
      html += `
        <h4>Team</h4>
        <div class="ownedTeam">
          <div class="entityName">${data.team.name}</div>
          <div class="entityPrice">${data.team.bid_amount}</div>
        </div>
      `;
    }
    if(data.players && data.players.length) {
      html += `
        <h4>Players</h4>
      `;
      for(var i = 0; i < data.players.length; i++) {
        html += `
          <div class="teamPlayers">
            <div class="entityName">${data.players[i].name}</div>
            <div class="entityCategory">${data.players[i].category.substring(0,3)}</div>
            <div class="entityPrice">${data.players[i].bid_amount}</div>
          </div>
        `;
      }
    }
    html += `</div>`;

    document.getElementsByClassName('competitorsPurse')[0].classList.add('inactive');
    document.querySelector('.competitorTeam .container').innerHTML = html;
    document.getElementsByClassName('competitorTeam')[0].classList.remove('inactive');
  }

  document.querySelectorAll('.competitorsPurse .item').forEach(element => {
    element.onclick = () => {
      detailView(result.competitors[element.dataset.name], element.dataset.name);
    }
  });

  document.querySelector('.competitorTeam .back').onclick = () => {
    document.querySelector('.competitorTeam .container').innerHTML = '';
    document.getElementsByClassName('competitorTeam')[0].classList.add('inactive');
    document.getElementsByClassName('competitorsPurse')[0].classList.remove('inactive');
  }
}


