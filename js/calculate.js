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
		let qHPAfterDamage = (parseInt(qhp.value) - row.globaldamage_q);
		// Manip says RESET if Q will die (i.e. HP before battle is lower than Q Global Damage)
		// or if Q hp is above the max hp allowed for the row

		if (qhp.value.length > 0 && (qHPAfterDamage > row.hp1 || qHPAfterDamage <= 0)) {

			tableRows += `
			<tr>
				<th scope="row" id="opening">${row.index}</th>
				<td id="pat">${row.pattern}</td>
				<td id="fish1">RESET bc ${(qHPAfterDamage > row.hp1) ? "Q HP too high" : "Q Dead"}</td>
				<td id="fish1hp"></td>
				<td id="fish1atb" class="separator"></td>
				<td id="fish2"></td>
				<td id="fish2hp"></td>
				<td id="fish2atb"></td>
			</tr>
			`;
		} else {
			limitClass = limitMode.checked ? "" : "sup";
			refreshClass = limitMode.checked ? "sub" : "";

			row.manip_1 = row.manip_1.replace(bold, '<b class="satb">$1</b>');
			row.manip_2 = row.manip_2.replace(bold, '<b class="satb">$1</b>');
			row.manip_3 = row.manip_3 ? row.manip_3.replace(bold, '<b class="satb">$1</b>') : "";
			row.manip_1 = row.manip_1.replace(italic, '<b class="important">$1</b>');
			row.pattern = row.pattern.replace(italic, '<b class="atb">$1</b>');
			row.pattern = row.pattern.replace(italic, '<b class="atb">$1</b>');

			let manipRow = GenerateRowObject(row);

			tableRows += `
			<tr>
				<th scope="row" id="opening">${manipRow.index}</th>
				<td id="pat">${manipRow.pattern}</td>
				<td id="fish1">${manipRow.fish1Sequence}</td>
				<td id="fish1hp">${manipRow.fish1hp} (${manipRow.fish1drop})</td>
				<td id="fish1atb" class="separator"><span class="${refreshClass}">${manipRow.fish1Refreshes}</span><br /><span class="limit ${limitClass}">(${manipRow.fish1limits} Limit + ${manipRow.fish1refreshesToLastLimit} Refresh)</span></td>
				<td id="fish2">${manipRow.fish2Sequence}</td>
				<td id="fish2hp">${manipRow.fish2hp} (${manipRow.fish2drop})</td>
				<td id="fish2atb"><span class="${refreshClass}">${manipRow.fish2Refreshes}</span><br /><span class="limit ${limitClass}">(${manipRow.fish2limits} Limit + ${manipRow.fish2refreshesToLastLimit} Refresh)</span></td>
			</tr>
			`;
		}
	});
	tbodyRef.innerHTML = tableRows;
}

function GenerateRowObject(row) {
	let obj = {};

	// Set up some logic variables
	let qHP = parseInt(qhp.value);
	let qHPValid = !isNaN(qHP);

	// Set up some RNG variables
	qCalcHp = qHP - row.globaldamage_q;
	let rngStart1 = row.rng_start_1 + 1;
	let rngStart2 = row.rng_start_2 + 1;
	let rngStart3 = row.rng_start_3 + 1;

	// Calculate limit refreshes.
	let limitRefreshes1 = LimitsBetweenRng(rngStart1, row.rng_end_1, qCalcHp, 501);
	let limitRefreshes2 = LimitsBetweenRng(rngStart2, row.rng_end_2, qCalcHp, 501);
	let limitRefreshes3 = LimitsBetweenRng(rngStart3, row.rng_end_3, qCalcHp, 501);

	// Basic things
	obj.index = row.index;
	obj.pattern = row.pattern;

	// For future ref: https://sebhastian.com/javascript-double-question-mark/
	obj.fish1Sequence = row.manip_1 ?? "?"; // manip1
	obj.fish1Refreshes = row.skip_1 ?? "?"; //skip1
	obj.fish1hp = row.hp1 ?? "?"; // hp1
	obj.fish1drop = row.drop1 ?? "?"; // drop1

	obj.fish1limits = limitRefreshes1.limits;
	obj.fish1refreshesToLastLimit = limitRefreshes1.refreshesToLastLimit;

	// Calculate damage to Q in phase 1 to determine which phase 2 is displayed
	let phase1Qdamage = row.damage_q1;
	let qPhase1HP = (qHP - phase1Qdamage);

	if (qPhase1HP > row.hp3) {
		// Use Skip 2
		obj.fish2Sequence = row.manip_2 ?? "?"; // manip2
		obj.fish2Refreshes = row.skip_2 ?? "?"; //skip_2
		obj.fish2hp = row.hp2 ?? "?"; // phase2
		obj.fish2drop = row.drop2 ?? "?"; // phase2

		obj.fish2limits = limitRefreshes2.limits - 1; //limitRefreshes2.limits
		obj.fish2refreshesToLastLimit = limitRefreshes2.refreshesToLastLimit; //limitRefreshes2.refreshesToLastLimit
	} else {
		// Use Skip 3
		obj.fish2Sequence = row.manip_3 ?? "?"; // manip3
		obj.fish2Refreshes = row.skip_3 ?? "?"; //skip_3
		obj.fish2hp = row.hp3 ?? "?"; // phase3
		obj.fish2drop = row.drop3 ?? "?"; // phase3

		obj.fish2limits = limitRefreshes3.limits - 1; //limitRefreshes3.limits
		obj.fish2refreshesToLastLimit = limitRefreshes3.refreshesToLastLimit; //limitRefreshes3.refreshesToLastLimit
	}

	return obj;
}

function LimitLevelNumerator(currentHp, maxHp, deadCharacters, statusArray) {
	let hpMod = Math.trunc(2500 * (currentHp / maxHp));
	let deathBonus = Math.trunc(1600 + (deadCharacters * 200));

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

	let statusBonus = Math.trunc(10 * statusSum);

	/**
	 * console.log(`CurrHP/MaxHP: ${(currentHp / maxHp)}`);
	 * console.log(`HPModRaw: ${(2500 * (currentHp / maxHp))}`);
	 * console.log(`Status Bonus: ${statusBonus}`);
	 * console.log(`+ Death Bonus: ${deathBonus}`);
	 * console.log(`- hpMod: ${hpMod}`);
	 */
	return (statusBonus + deathBonus - hpMod);
}

function LimitsBetweenRng(rngStart, rngEnd, currentHp, maxHp) {
	let result = {
		'limits': 0,
		'refreshesToLastLimit': 0
	};

	if (isNaN(parseInt(currentHp))) return result;

	let numLimits = 0;
	let numerator = LimitLevelNumerator(currentHp, maxHp, 0, []);

	// Waves wants the number of refreshes between the second last limit -> last limit
	let numRefresh = 0;
	let resetRefreshes = false;

	// Need to map RNG values using Kaivel's explanation.
	if (rngStart > rngEnd) rngEnd += 256;

	for (let i = rngStart; i <= rngEnd; i++) {
		// If we hit a limit in the last iteration, reset the refreshes.
		if (resetRefreshes) {
			numRefresh = 0;
			resetRefreshes = false;
		}

		numRefresh++;

		// RNG if we go over 256
		let moduloRngIndex = i % 256;

		let limitLevel = Math.trunc(numerator / (160 + RNG[moduloRngIndex]));

		/**
		 * console.log(`i: ${i}`);
		 * console.log(`moduloRngIndex: ${moduloRngIndex}`);
		 * console.log(`numerator: ${numerator}`);
		 * console.log(`RNG: ${RNG[moduloRngIndex]}`);
		 * console.log(`RNGMod: ${(160 + RNG[moduloRngIndex])}`);
		 * console.log(`limitLevelRaw: ${numerator / (160 + RNG[moduloRngIndex])}`);
		 * console.log(`limitLevel: ${limitLevel}`);
		 */
		if (limitLevel > 4) {
			numLimits++;
			resetRefreshes = true;
		}
	}

	result.limits = numLimits;
	result.refreshesToLastLimit = numRefresh;

	return result;
}



// Handling Limit Mode
limitMode.addEventListener('change', function (e) {
	Array.from(document.querySelectorAll('.limit')).forEach((el) => el.classList.toggle('sup'));
});

function tests() {
	test('index 17', LimitsBetweenRng(37, 56, 15, 501).limits, 15)
	test('index 201', LimitsBetweenRng(251, 1, 8, 501).limits, 4)
	test('index 33', LimitsBetweenRng(56, 56, 43, 501).limits, 1)
	test('index 45b', LimitsBetweenRng(109, 137, -16, 501).limits, 21)
	test('index 50b', LimitsBetweenRng(109, 137, 0, 501).limits, 20)
}

function test(name, result, expected) {
	if (result === expected) {
		console.log(`%cTest ${name} passed!`, 'color: green');
	} else {
		console.log(`%cTest ${name} failed!`, 'color: red');
		console.log(`Expected: ${expected}`);
		console.log(`Got: ${result}`);
	}
}