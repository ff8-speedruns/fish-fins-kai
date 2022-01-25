// ಠ_ಠಠ_ಠಠ_ಠಠ_ಠ
// ಠ_ಠ         ಠ_ಠ
// ಠ_ಠ         ಠ_ಠ
// ಠ_ಠ       ಠ_ಠ
// ಠ_ಠ         ಠ_ಠ
// ಠ_ಠ         ಠ_ಠ
// ಠ_ಠ         ಠ_ಠ
// ಠ_ಠಠ_ಠಠ_ಠಠ_ಠ


// Patterns from https://docs.google.com/spreadsheets/d/1uqW35D6YmuSPpVp8WxKf35xmbj5BaD93d5-Tt68ZBnI/edit#gid=2051911454

let vals;

// Inputs
let inputBox = document.getElementById('pattern');

// Outputs
let index = document.getElementById('index');
let patD = document.getElementById('pat');
let atb = document.getElementById('atb');
let drop = document.getElementById('drop');
let p1 = document.getElementById('p1');
let p2 = document.getElementById('p2');
let p3 = document.getElementById('p3');
let gc = document.getElementById('gc');

// General setup settings
const SQUALL_MAX_HP = 486;
const QUISTIS_MAX_HP = 501;


// Initialize & load data
window.onload = async function () {
    loadData();
}

async function loadData (data = "kaivel") {
	let fins = await fetch(`./data/${data}.json`);
	vals = await fins.json();
	CalculatePattern();
}

// Search for results automatically as user types pattern.
document.body.addEventListener('change', function (e) {
    CalculatePattern();
});

document.body.addEventListener('keyup', function (e) {
    CalculatePattern();
});

// Formats the pattern based on the user's input
function CalculatePattern() {
    let pat = document.getElementById('pattern').value;
    UpdateIndex(pat.trim());
}

function GetTextValue(textName) {
    let val = document.querySelector('input[name="' + textName + '"]');
    return (val !== null) ? val.value : "";
}

function UpdateIndex(pat) {
    var tbodyRef = document.getElementById('results').getElementsByTagName('tbody')[0];

    pat = pat.trim();
    pat = pat.replace(/ /g, '');
    idx = vals.filter(element => element.pattern.toLowerCase().replace(/ /g, '').startsWith(pat.toLowerCase()));

    var tableRows = "";
    idx.forEach((row) => {
        tableRows += `
                        <tr>
                            <th scope="row" id="opening">${row.index}</th>
                            <td id="pat">${row.pattern}</td>
                            <td id="dmg">${row.globaldamage ? row.globaldamage.replace(' // ', '<br />') : ""}</td>
                            <td id="fish1">${row.manip_1 ? row.manip_1 : ""}</td>
                            <td id="fish1hp">${row.hp1 ? row.hp1 : ""}</td>
                            <td id="fish1atb" class="separator">Skip ${row.skip_1 ? row.skip_1 : ""}</td>
							<td id="fish2">${row.manip_2 ? row.manip_2 : ""}</td>
                            <td id="fish2hp">${row.hp2 ? row.hp2 : ""}</td>
                            <td id="fish2atb">Skip ${row.skip_2 ? row.skip_2 : ""}</td>
                        </tr>
                        `;
    });
    tbodyRef.innerHTML = tableRows;
}

function CrisisCalculator (currentHp, maxHp, deadCharacters, statusArray) {
	
	let hpMod = Math.floor(2500 * (currentHp/maxHp));
	let deathBonus= Math.floor(1600 + (deadCharacters * 200));
	
	// For StatusSum
	const STATUSES = {
		'aura': 200,
		'slow': 15,
		'poison': 30,
		'darkness': 30,
		'silence': 30,
		'petrifying': 30,
		'doom': 45
	}
	
    let statusSum = 0;
	
	statusArray.forEach((affliction) => {
		if (affliction in STATUSES) {
			statusSum += STATUSES[affliction]
		}
	});
	
	let statusBonus = Math.floor(10 * statusSum);
	
	// RNG...ish
	const rngBase = 160;
	const rngMin = rngBase + 0;
	const rngMax = rngBase + 255;
	
	// Calculation
	for (let rng = rngMin; rng <= rngMax; rng++) {
		let limitLevel = (statusBonus + deathBonus - hpMod) / rng;
		let limitLevelRound = Math.floor(limitLevel);
		
		//Limit Level	Crisis Level
		//4 or lower	0
		//5				1
		//6				2
		//7				3
		//8 or higher	4
		
		let crisisLevel = limitLevelRound - 4;
		crisisLevel = (crisisLevel > 4) ? 4 : crisisLevel;
		crisisLevel = (crisisLevel < 0) ? 0 : crisisLevel;
	}
	// TODO: DO SOMETHING?
}