const playerContainer = document.querySelector('.search-result');
const searchButton = document.getElementById('searchButton');

searchButton.addEventListener('click', () => {
    const playerNameInput = document.getElementById('playerSearch').value.toLowerCase();
    let playerTagInput = document.getElementById('playerTag').value.toLowerCase();
    const selectedServer = document.getElementById('server-select').value;
    const footerBottom = document.getElementById('footer-bottom');
    const grafButton = document.getElementById('graf-button');

    grafButton.style.display = 'block';

    footerBottom.style.position = 'relative';

    if (!playerNameInput || !playerTagInput) {
        playerContainer.innerHTML = '<p class="alert-error">Molimo unesite oba parametra za pretragu.</p>';
        document.getElementById('grafBitki').innerHTML = "";
        document.getElementById('grafGeneral').innerHTML = "";
        footerBottom.style.position = 'absolute';
        grafButton.style.display = 'none';
        return;
    }
    if (!selectedServer) {
        playerContainer.innerHTML = '<p class="alert-error">Molimo odaberite server prije pretrage.</p>';
        document.getElementById('grafBitki').innerHTML = "";
        document.getElementById('grafGeneral').innerHTML = "";
        footerBottom.style.position = 'absolute';
        grafButton.style.display = 'none';
        return;
    }
    // Use slice() to extract the tag without "#" if it starts with "#"
    if (playerTagInput.startsWith('#')) {
        playerTagInput = playerTagInput.slice(1); // Update playerTagInput with the extracted tag
    } else {
       playerContainer.innerHTML = '<p class="alert-error">Fali "#".</p>';
       document.getElementById('grafBitki').innerHTML = "";
       document.getElementById('grafGeneral').innerHTML = "";
       footerBottom.style.position = 'absolute';
       grafButton.style.display = 'none';
       return;
    }
    const playerFile = `./data/player.json`;
    const matchFile = `./data/match_${selectedServer.toLowerCase()}.json`;
    const mapsWeaponFile = `./data/maps_weapon.json`;

    Promise.all([
        fetch(playerFile).then(res => res.json()),
        fetch(matchFile).then(res => res.json()),
        fetch(mapsWeaponFile).then(res => res.json())
    ])
    .then(([playerData, matchData, mapsWeapon]) => {
        const players = playerData.players[selectedServer] || [];
        const player = players.find(p => 
            (p.playerName?.toLowerCase() === playerNameInput) && 
            (p.playerTag?.toLowerCase() === playerTagInput)
        );
        
        if (!player) {
            playerContainer.innerHTML = '<p class="alert-error">Igrač nije pronađen.</p>';
            document.getElementById('grafBitki').innerHTML = "";
            document.getElementById('grafGeneral').innerHTML = "";
            footerBottom.style.position = 'absolute';
            grafButton.style.display = 'none';
            return;
        }
        const playerMatches = matchData.matches.find(m => m.playerId === player.playerId);

        if (!playerMatches || !playerMatches.battles || playerMatches.battles.length === 0) {
            playerContainer.innerHTML = '<p class="alert-error">Nema dostupnih podataka o bitkama za ovog igrača.</p>';
            document.getElementById('grafBitki').innerHTML = "";
            document.getElementById('grafGeneral').innerHTML = "";
            footerBottom.style.position = 'absolute';
            grafButton.style.display = 'none';
            return;
        }

        function calculateLepoint(W, L, T, K, D, A, HS, P, R, KPR, FB, CL, SP, MVP) {
            const pi = Math.PI;
        
            // Izračunavanje Lepoint sa skaliranjem za rezultate između 0 i 1000
            const winLossRatio = (W / (L + 1)); // Skalar za pobede/poraze
            const kdaRatio = (K + 0.5 * A) / (D + 1); // Skalar za KDA
            const headshotBonus = HS / 100; // Skalar za headshot procenat
            const accuracyBonus = P / 100; // Skalar za preciznost procenat
            const econRatingBonus = R / 100; // Skalar za ekonomski rating
            const kprBonus = KPR; // Skalar za kills per round
            const firstBloodsBonus = FB / T; // Skalar za first bloods
            const clutchesBonus = CL / T; // Skalar za clutches
            const spikePlantsDefusesBonus = SP / T; // Skalar za spike plants/defuses
            const mvpBonus = MVP / T; // Skalar za MVP
        
            // Kombinovanje svih delova u finalnu formulu sa skaliranjem
            const lepoint = (pi * 100) * (winLossRatio + kdaRatio + headshotBonus + accuracyBonus + econRatingBonus + kprBonus + 
                firstBloodsBonus + clutchesBonus + spikePlantsDefusesBonus + mvpBonus) / 10;
        
            // Ograničavanje rezultata između 0 i 1000
            return lepoint;
        }

        function calculateBattleLepoint(K, D, A, HS, P, R, KPR, FB, CL, SP, MVP) {
            const pi = Math.PI;
        
            const kdaRatio = (K + 0.5 * A) / (D + 1);
            const headshotBonus = HS / 100;
            const accuracyBonus = P / 100;
            const econRatingBonus = R / 100;
            const kprBonus = KPR;
            const firstBloodsBonus = FB;
            const clutchesBonus = CL;
            const spikePlantsDefusesBonus = SP;
            const mvpBonus = MVP ? 1 : 0;
        
            const lepoint = (pi * 100) * (kdaRatio + headshotBonus + accuracyBonus + econRatingBonus + kprBonus + firstBloodsBonus + 
                clutchesBonus + spikePlantsDefusesBonus + mvpBonus) / 10;
        
                return lepoint;
        }


        const lepoint = calculateLepoint(
            player.wins, player.losses, player.totalMatches, player.kills, player.deaths, player.assists,
            player.headshotPercentage, player.accuracy, player.econRating, player.kpr,
            player.firstBloods, player.clutches, player.sp, player.mvp
        );


        let playerInfo = `
        <div class="playerName-container">
            <h2 class="playerName">Igrač: ${player.playerName}<span style="color:white;">#${player.playerTag}</span></h2>
            <div class="lepoint-result">
                <p>Lepoint: &nbsp;</p>
                <p><span id="lepoint-value">${lepoint.toFixed(3)}</span></p>
            </div>
            <div class="player-slika"><img src="./media/player_cards/${player.player_card}.png"></div>
            <div class="overall-stats">
                <h3>Ukupan i prosječan rezultat igrača:</h3>
                <p>Ukupno bitaka: <span class="player-span">${player.totalMatches}</span></p>
                <p>Pobjede: <span class="player-span">${player.wins}</span></p>
                <p>Porazi: <span class="player-span">${player.losses}</span></p>
                <p>Postotak pobjede: <span class="player-span">${((1 - (player.losses / player.wins)) * 100).toFixed(2)}%</span></p>
                <div class="skriveno">
                <p>Ukupno kill: <span class="player-span">${player.kills}</span></p>
                <p>Ukupno deaths: <span class="player-span">${player.deaths}</span></p>
                <p>Ukupno assist: <span class="player-span">${player.assists}</span></p>
                <p>Headshot: <span class="player-span">${player.headshotPercentage.toFixed(2)}%</span></p>
                <p>Preciznost: <span class="player-span">${player.accuracy.toFixed(2)}%</p>
                <p>Ekonomski rating: <span class="player-span">${player.econRating.toFixed(2)}%</span></p>
                <p>Damage per Round (DPR): <span class="player-span">${player.dpr}</span></p>
                <p>Kills per Round (KPR): <span class="player-span">${player.kpr}</span></p>
                <p>Ukupno First blood: <span class="player-span">${player.firstBloods}</span></p>
                <p>Ukupno Clutches (CL): <span class="player-span">${player.clutches}</span></p>
                <p>Ukupno MVP: <span class="player-span">${player.mvp}</span></p>
                <p>Ukupno Spike Plants/Defuses: <span class="player-span">${player.sp}</span></p>     
                </div>           
                <div class="more-button"><button id="player-extend">Prikaži više &#11167;</button></div>
            </div>
        </div>
        <h3 class="playerNameBitke">Bitke:</h3>
        `;

        const overallLepoint = [];
        let x = player.totalMatches;
        let n = lepoint * x;
        const izn = player.totalMatches + 1;

        let zn = player.totalMatches;

        const lepointResults = [];
        const recentBattles = [];
        let i = player.totalMatches; 

        playerMatches.battles.forEach(battle => {
            const mapName = battle.mapName.toLowerCase();
            const mapMatch = mapsWeapon.maps.find(map => map.mapMatch?.includes(mapName))?.mapMatch;

            const battleLepoint = calculateBattleLepoint(
                battle.kills, battle.deaths, battle.assists, battle.headshots, battle.accuracy,
                battle.econRating, battle.kpr, battle.firstBloods, battle.clutches,
                battle.spikePlantsDefuses, battle.mvp
            );

            lepointResults.push(battleLepoint);
            recentBattles.push(i);
            i--;

            let z = n / x;
            overallLepoint.push(z);
            n -= battleLepoint;
            x--;

            playerInfo +=  `
            <div class="bitke">
                <div class="bitke-gore">
                    <div class="mapa-container">
                        <p class="broj-bitke">${zn}.</p>
                        <p class="mapa">Mapa:<span class="displayMapa">${battle.mapName}</span></p>
                        <img class="slikamape" src="./maps/${mapMatch}.jpg" alt="${battle.mapName} map">
                        <p class="mapa">Najčešće oružje:<span class="displayMapa">${battle.mainWeapon}</span></p>
                        <img class="slika-weapon" src="./media/weapons/${battle.mainWeapon.toLowerCase()}.jpg" alt="${battle.mapName} map">
                        <p class="lepoint">Lepoint:&nbsp;&nbsp;<span id="lepoint-value">${battleLepoint.toFixed(0)}</span></p>
                    </div>
                    <div class="player-agent">
                        <p class="mvp">${battle.mvp ? 'MVP' : ''}</p>
                        <img src="./media/Agents/${battle.agent}.jpg" alt="${battle.agent}">
                        <div class="player-rezultat">
                            <div class="ispod-slike">      
                                <p class="result">Rezultat:&nbsp;&nbsp;<span class="player-span">${battle.outcome}&nbsp;-&nbsp;${battle.result}</span></p>
                                <p class="kda">K/D/A:&nbsp;&nbsp;<span class="player-span">${battle.kills}/${battle.deaths}/${battle.assists}</span></p>
                                <p class="kda">Headshots:&nbsp;&nbsp;<span class="player-span">${battle.headshots}</span></p>
                                <p class="kda">Preciznost:&nbsp;&nbsp;<span class="player-span">${battle.accuracy}%</span></p>
                                <p class="kda">Ekonomski rating:&nbsp;&nbsp;<span class="player-span">${battle.econRating}</span></p>
                                <p class="kda">Kills per Round (KPR):&nbsp;&nbsp;<span class="player-span">${battle.kpr}</span></p>
                                <p class="kda">First blood:&nbsp;&nbsp;<span class="player-span">${battle.firstBloods}</span></p>
                                <p class="kda">Clutches (CL):&nbsp;&nbsp;<span class="player-span">${battle.clutches}</span></p>
                                <p class="kda">Spike Plants/Defuses:&nbsp;&nbsp;<span class="player-span">${battle.spikePlantsDefuses}</span></p>
                            </div>
                            
                        </div>
                    </div>
                </div> 
            </div>
            `;
            zn--;
        });
        playerContainer.innerHTML = playerInfo;
        const minLepoint = Math.min(...overallLepoint);
        const maxLepoint = Math.max(...overallLepoint);
        
        const minLepoint2 = Math.min(...lepointResults);
        const maxLepoint2 = Math.max(...lepointResults);

        var grafBitki = document.getElementById('grafBitki');
        grafBitki.style.width = '40%';
        grafBitki.style.height = 'auto';
        grafBitki.style.borderRadius = '23px'

        var grafGeneral = document.getElementById('grafGeneral');
        grafGeneral.style.width = '40%';
        grafGeneral.style.height = 'auto';

        // Graf zadnjih 15 bitaka
        const data = [{
            x: recentBattles,
            y: lepointResults,
            mode: "lines",
            line: {
                shape: 'spline',
                smoothing: 1.1,
                color: '#ff6361'
            }
        }];
        const layout = {
            xaxis: {
                range: [recentBattles[0], recentBattles[14]],
                title: "Bitke",
                titlefont: { family: 'Poppins, sans-serif', color: 'wheat' }, // Bijela boja naslova x osi
                tickfont: { family: 'Poppins, sans-serif', color: 'wheat' } // Bijela boja oznaka na x osi
            },
            yaxis: {
                range: [(minLepoint2-100), (maxLepoint2+100)],
                title: "LePoint",
                titlefont: { family: 'Poppins, sans-serif', color: 'white' }, // Bijela boja naslova y osi
                tickfont: { family: 'Poppins, sans-serif', color: 'white' } // Bijela boja oznaka na y osi
            },
            title: "Zadnjih 15 bitaka",
            titlefont: { family: 'Poppins, sans-serif', size: 18, color: 'wheat' },
            paper_bgcolor: "rgba(92, 75, 153, 0.7)",
            plot_bgcolor: "rgba(92, 75, 153, 0)",
        };
        const config = {
            displayModeBar: false,
        };
        Plotly.newPlot("grafBitki", data, layout, config);

       //Graf prosječnog LePoint-a zadnjih 15 bitaka
       const data1 = [{
        x: recentBattles,
        y: overallLepoint,
        mode:"lines",
        line: {
            shape: 'spline',
            smoothing: 1.1,
            color: '#d963e2'
        }
        }];
        const layout1 = {
            xaxis: {
                range: [recentBattles[14], recentBattles[0]],
                title: "Bitke",
                titlefont: { family: 'Poppins, sans-serif', color: 'wheat' }, // Bijela boja naslova x osi
                tickfont: { family: 'Poppins, sans-serif', color: 'wheat' } // Bijela boja oznaka na x osi
            },
            yaxis: {
                range: [(minLepoint-100), (maxLepoint+100)],
                title: "LePoint",
                titlefont: { family: 'Poppins, sans-serif', color: 'white' }, // Bijela boja naslova y osi
                tickfont: { family: 'Poppins, sans-serif', color: 'white' } // Bijela boja oznaka na y osi
            },
            title: "Prosječni LePoint ovisan o zadnjih 15 bitaka",
            titlefont: { family: 'Poppins, sans-serif', size: 18, color: 'wheat' },
            paper_bgcolor: "rgba(92, 75, 153, 0.7)",
            plot_bgcolor: "rgba(92, 75, 153, 0)"
        }
        const config1 = {
            displayModeBar: false, // this is the line that hides the bar.
        };
        Plotly.newPlot("grafGeneral", data1, layout1, config1);





        // Use querySelectorAll() to get all elements with the ID 'lepoint-value'
        const lepointValueElements = document.querySelectorAll('#lepoint-value');

        // Iterate through all found elements and apply styling conditionally
        for (const lepointValueElement of lepointValueElements) {
            const lepointValue = parseFloat(lepointValueElement.textContent); // Get the numerical value from textContent

            if (lepointValue <= 300) {
                lepointValueElement.style.color = "#ff6361";
            }
            else if (lepointValue <= 600) {
                lepointValueElement.style.color = "#ffa600";
            }
            else if (lepointValue <= 900) {
                lepointValueElement.style.color = "#93d8e2";
            }
            else if (lepointValue >= 901){
                lepointValueElement.style.color = "#d963e2";
            }
        }
    
        //that the button element is in the DOM, get it and add the event listener
        var moreButton = document.getElementById("player-extend");
        var skriveno2 = document.querySelector(".skriveno");
        if (moreButton) { // Check if button exists before adding event listener
            moreButton.addEventListener("click", function() {
            if (skriveno2.style.display === "flex") {
                skriveno2.style.display = "none";
                skriveno2.style.maxHeight = 0;
                moreButton.innerHTML = "Prikaži više &#11167;";
            } else {
                skriveno2.style.display = "flex";
                moreButton.innerHTML = "Prikaži manje &#11165;";
                skriveno2.style.maxHeight = skriveno2.scrollHeight + "px";
            }
            });
        } else {
            console.error('Element with ID "player-extend" not found.');
        }

        

    })
    .catch(error => {
        console.error('Ne mogu dohvatiti:', error);
        playerContainer.innerHTML = `<p class="alert-error">Došlo je do greške prilikom preuzimanja podataka.</p>`;
    });
});