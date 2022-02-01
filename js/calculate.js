// ಠ_ಠಠ_ಠಠ_ಠಠ_ಠ
// ಠ_ಠ         ಠ_ಠ
// ಠ_ಠ         ಠ_ಠ
// ಠ_ಠ       ಠ_ಠ
// ಠ_ಠ         ಠ_ಠ
// ಠ_ಠ         ಠ_ಠ
// ಠ_ಠ         ಠ_ಠ
// ಠ_ಠಠ_ಠಠ_ಠಠ_ಠ


// Patterns from https://docs.google.com/spreadsheets/d/1uqW35D6YmuSPpVp8WxKf35xmbj5BaD93d5-Tt68ZBnI/edit#gid=2051911454

let VALS, RNG;

// Inputs
let inputBox = document.getElementById('pattern');
let qhp = document.getElementById('QHP');
let limitMode = document.getElementById("limitMode");

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

async function loadData() {
	let fins = await fetch(`./data/kaivel.json`);
	VALS = await fins.json();

	let limitRng = await fetch(`./data/limitRng.json`);
	RNG = await limitRng.json();

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
	let pat = inputBox.value;
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
	idx = VALS.filter(element => element.pattern.toLowerCase().replace(/ /g, '').startsWith(pat.toLowerCase()));

	var tableRows = "";
	const italic = /\*(.*)\*/gim
	const bold = /\*\*(.*)\*\*/gim

	idx.forEach((row) => {

		row.manip_1 = row.manip_1.replace(bold, '<b class="satb">$1</b>');
		row.manip_2 = row.manip_2.replace(bold, '<b class="satb">$1</b>');
		row.manip_3 = row.manip_3 ? row.manip_3.replace(bold, '<b class="satb">$1</b>') : "";
		row.manip_1 = row.manip_1.replace(italic, '<b class="important">$1</b>');
		row.pattern = row.pattern.replace(italic, '<b class="atb">$1</b>');
		row.pattern = row.pattern.replace(italic, '<b class="atb">$1</b>');

		// Calculate limit refreshes.
		let limitRefreshes1 = 0;
		let limitRefreshes2 = 0;
		let limitRefreshes3 = 0;
		if (qhp.value.length > 0) {
			qCalcHp = parseInt(qhp.value) - row.globaldamage_q;
			let rngStart1 = row.rng_start_1++;
			let rngStart2 = row.rng_start_2++;
			let rngStart3 = row.rng_start_3++;
			limitRefreshes1 = LimitsBetweenRng(rngStart1, row.rng_end_1, qCalcHp, 501);
			limitRefreshes2 = LimitsBetweenRng(rngStart2, row.rng_end_2, qCalcHp, 501);
			limitRefreshes3 = LimitsBetweenRng(rngStart3, row.rng_end_3, qCalcHp, 501);
		}

		limitClass = limitMode.checked ? "" : "sup";
		refreshClass = limitMode.checked ? "sub" : "";

		// For future ref: https://sebhastian.com/javascript-double-question-mark/
		let index = row.index;
		let pattern = row.pattern;
		let manip1 = row.manip_1 ?? "";
		let manip2 = row.manip_2 ?? "";
		let manip3 = row.manip_3 ?? "";
		let skip1 = row.skip_1 ? `<span class="${refreshClass}">${row.skip_1}</span>` : "";
		let skip2 = row.skip_2 ? `<span class="${refreshClass}">${row.skip_2}</span>` : "";
		let skip3 = row.skip_3 ? `<span class="${refreshClass}">${row.skip_3}</span><br /><span class="limit ${limitClass}">(${limitRefreshes3} Limit)</span>` : "";
		let hp1 = row.hp1 ? `${row.hp1} (${row.drop1})` : "";
		let hp2 = row.hp2 ? `${row.hp2} (${row.drop2})` : "";
		let hp3 = row.hp3 ? `${row.hp3} (${row.drop3})` : "";

		tableRows += `
                        <tr>
                            <th scope="row" id="opening">${index}</th>
                            <td id="pat">${pattern}</td>
                            <td id="fish1">${manip1}</td>
                            <td id="fish1hp">${hp1}</td>
                            <td id="fish1atb" class="separator"><span class="skips">${skip1}</span><br /><span class="limit ${limitClass}">(${limitRefreshes1} Limit)</span></td>
							<td id="fish2">${manip2}<br /><em class="alt">${manip3}</em></td>
                            <td id="fish2hp">${hp2}<br /><em class="alt">${hp3}</em></td>
                            <td id="fish2atb">${skip2}<br /><span class="limit ${limitClass}">(${limitRefreshes2} Limit)</span><br /><em class="alt">${skip3}</em></td>
                        </tr>
                        `;
	});
	tbodyRef.innerHTML = tableRows;
}

function LimitLevelNumerator(currentHp, maxHp, deadCharacters, statusArray) {
	let hpMod = Math.floor(2500 * (currentHp / maxHp));
	let deathBonus = Math.floor(1600 + (deadCharacters * 200));

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

	return (statusBonus + deathBonus - hpMod);
}

function LimitsBetweenRng(rngStart, rngEnd, currentHp, maxHp) {
	let numLimits = 0;
	let numerator = LimitLevelNumerator(currentHp, maxHp, 0, []);

	// Need to map RNG values using Kaivel's explanation.
	for (let i = rngStart; i <= rngEnd; i++) {
		let limitLevel = Math.floor(numerator / (160 + RNG[i]));
		if (limitLevel > 4) {
			numLimits++;
		}
	}

	return numLimits;
}


// Handling Limit Mode
limitMode.addEventListener('change', function (e) {
	Array.from(document.querySelectorAll('.limit')).forEach((el) => el.classList.toggle('sup'));
});