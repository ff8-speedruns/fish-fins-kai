import limitRng from '../data/limitRng.json';

export const QUISTIS_MAX_HP = 501;

const STATUS_VALUES = {
  aura: 200,
  slow: 15,
  poison: 30,
  darkness: 30,
  silence: 30,
  petrifying: 30,
  doom: 45,
};

export function limitLevelNumerator(currentHp, maxHp, deadCharacters = 0, statusArray = []) {
  const hpMod = Math.trunc(2500 * (currentHp / maxHp));
  const deathBonus = Math.trunc(1600 + deadCharacters * 200);

  const statusSum = statusArray.reduce(
    (sum, affliction) => sum + (STATUS_VALUES[affliction] ?? 0),
    0
  );
  const statusBonus = Math.trunc(10 * statusSum);

  return statusBonus + deathBonus - hpMod;
}

/**
 * Counts limit breaks available across a window of RNG values.
 *
 * Returns the total, plus the refreshes between the last two limits - that is
 * what "limits + X refresh" in the display is counting.
 */
export function limitsBetweenRng(rngStart, rngEnd, currentHp, maxHp) {
  const result = { limits: 0, refreshesToLastLimit: 0 };

  if (isNaN(parseInt(currentHp))) return result;

  const numerator = limitLevelNumerator(currentHp, maxHp, 0, []);

  // The RNG window wraps around the end of the table.
  let end = rngEnd;
  if (rngStart > end) end += 256;

  const limits = [];
  for (let i = rngStart; i <= end; i++) {
    const limitLevel = Math.trunc(numerator / (160 + limitRng[i % 256]));
    if (limitLevel > 4) limits.push(i);
  }

  result.limits = limits.length;
  if (limits.length === 1) {
    result.refreshesToLastLimit = limits[0];
  } else if (limits.length > 1) {
    result.refreshesToLastLimit = limits[limits.length - 1] - limits[limits.length - 2];
  }

  return result;
}

export function matchingRows(rows, pattern) {
  const needle = pattern.trim().replace(/ /g, '').toLowerCase();
  return rows.filter((row) =>
    row.pattern.toLowerCase().replace(/ /g, '').startsWith(needle)
  );
}

/**
 * Turns a data row plus the runner's pre-fight Quistis HP into everything the
 * results table needs. A row is a "reset" when Quistis would die or would be
 * left with more HP than the manip allows.
 */
export function buildRow(row, qhpInput) {
  const qHP = parseInt(qhpInput);
  const hasQhp = String(qhpInput ?? '').length > 0;
  const qHPAfterDamage = qHP - row.globaldamage_q;

  if (hasQhp && (qHPAfterDamage > row.hp1 || qHPAfterDamage <= 0)) {
    return {
      index: row.index,
      pattern: row.pattern,
      reset: qHPAfterDamage > row.hp1 ? 'Q HP too high' : 'Q Dead',
    };
  }

  const limits1 = limitsBetweenRng(row.rng_start_1 + 1, row.rng_end_1, qHPAfterDamage, QUISTIS_MAX_HP);
  const limits2 = limitsBetweenRng(row.rng_start_2 + 1, row.rng_end_2, qHPAfterDamage, QUISTIS_MAX_HP);
  const limits3 = limitsBetweenRng(row.rng_start_3 + 1, row.rng_end_3, qHPAfterDamage, QUISTIS_MAX_HP);

  const built = {
    index: row.index,
    pattern: row.pattern,
    fish1Sequence: row.manip_1 ?? '?',
    fish1Refreshes: row.skip_1 ?? '?',
    fish1hp: row.hp1 ?? '?',
    fish1drop: row.drop1 ?? '?',
    fish1limits: limits1.limits,
  };
  built.fish1refreshesToLastLimit =
    limits1.limits <= 1 ? built.fish1Refreshes : limits1.refreshesToLastLimit;

  // Which second-phase manip applies depends on how much damage Quistis took
  // in phase one. NaN HP (nothing entered) falls through to skip 3, as before.
  const qPhase1HP = qHP - row.damage_q1;
  const usePhase2 = qPhase1HP > row.hp3;

  const source = usePhase2
    ? { manip: row.manip_2, skip: row.skip_2, hp: row.hp2, drop: row.drop2, limits: limits2 }
    : { manip: row.manip_3, skip: row.skip_3, hp: row.hp3, drop: row.drop3, limits: limits3 };

  built.fish2Sequence = source.manip ?? '?';
  built.fish2Refreshes = source.skip ?? '?';
  built.fish2hp = source.hp ?? '?';
  built.fish2drop = source.drop ?? '?';
  built.fish2limits = source.limits.limits;
  built.fish2refreshesToLastLimit =
    source.limits.limits <= 1 ? built.fish2Refreshes : source.limits.refreshesToLastLimit;

  return built;
}
