import { memo, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Group, NumberInput, SegmentedControl, Stack, Text, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ToolShell } from '@ff8-speedruns/ui';
import rows from './data/kaivel.json';
import { buildRow, matchingRows } from './lib/kai';
import { renderManip, renderPattern } from './lib/markup';
import KaivelButton from './components/KaivelButton';
import './app.css';

// The three ways the ATB column can be read. "Limits + refresh" is the default
// and replaces the pair of checkboxes the old page used, which could be put
// into combinations that meant nothing.
const MODES = [
  { value: 'waves', label: 'Limits + refresh' },
  { value: 'limits', label: 'Limits' },
  { value: 'refresh', label: 'Refreshes' },
];

// Shared between the header and every row so columns always line up.
const COLUMNS = [
  { key: 'opening', label: 'Opening', flex: '0 0 4.5rem' },
  { key: 'pattern', label: 'Pattern', flex: '0 0 11rem' },
  { key: 'fish1', label: '1st Fish', flex: '2 1 10rem' },
  { key: 'hp1', label: 'HP Needed (Drop)', flex: '0 0 7rem' },
  { key: 'atb1', label: 'ATB', flex: '0 0 8rem', separator: true },
  { key: 'fish2', label: '2nd Fish', flex: '2 1 10rem' },
  { key: 'hp2', label: 'HP Needed (Drop)', flex: '0 0 7rem' },
  { key: 'atb2', label: 'ATB', flex: '0 0 8rem' },
];

const AtbCell = memo(function AtbCell({ limits, refreshes, refreshesToLastLimit, mode }) {
  if (mode === 'waves') {
    return (
      <Text size="sm">
        {Math.max(limits - 1, 0)} Limits +<br />
        {refreshesToLastLimit} Refresh
      </Text>
    );
  }

  const primary = mode === 'limits' ? `(${limits} Limit)` : refreshes;
  const secondary = mode === 'limits' ? refreshes : `(${limits} Limit)`;

  return (
    <>
      <Text size="sm">{primary}</Text>
      <Text size="xs" c="dimmed">
        {secondary}
      </Text>
    </>
  );
});

AtbCell.propTypes = {
  limits: PropTypes.number,
  refreshes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  refreshesToLastLimit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  mode: PropTypes.oneOf(['waves', 'limits', 'refresh']),
};

// Every prop here is a primitive (string/number), destructured out of the
// buildRow() result rather than passed as a single object, so that a row
// whose computed values happen to be unchanged between two renders — the
// common case while typing a pattern with Q HP held steady — correctly skips
// re-rendering (React.memo's default comparison works on primitive values;
// buildRow's result object is a new reference every call, which would defeat
// a comparison done on the whole object).
const ResultRow = memo(function ResultRow({
  virtualIndex,
  start,
  measureElement,
  index,
  pattern,
  reset,
  fish1Sequence,
  fish1Refreshes,
  fish1hp,
  fish1drop,
  fish1limits,
  fish1refreshesToLastLimit,
  fish2Sequence,
  fish2Refreshes,
  fish2hp,
  fish2drop,
  fish2limits,
  fish2refreshesToLastLimit,
  mode,
}) {
  if (reset) {
    return (
      <div
        ref={measureElement}
        data-index={virtualIndex}
        role="row"
        className="ff8-vtable-row"
        style={{ transform: `translateY(${start}px)` }}
      >
        <div role="cell" className="ff8-vtable-cell" style={{ flex: COLUMNS[0].flex }}>
          {index}
        </div>
        <div role="cell" className="ff8-vtable-cell" style={{ flex: COLUMNS[1].flex }}>
          {renderPattern(pattern)}
        </div>
        <div role="cell" className="ff8-vtable-cell" style={{ flex: '5 1 auto' }}>
          <Text c="red" fw={600}>
            RESET bc {reset}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={measureElement}
      data-index={virtualIndex}
      role="row"
      className="ff8-vtable-row"
      style={{ transform: `translateY(${start}px)` }}
    >
      <div role="cell" className="ff8-vtable-cell" style={{ flex: COLUMNS[0].flex }}>
        {index}
      </div>
      <div role="cell" className="ff8-vtable-cell" style={{ flex: COLUMNS[1].flex }}>
        {renderPattern(pattern)}
      </div>
      <div role="cell" className="ff8-vtable-cell" style={{ flex: COLUMNS[2].flex }}>
        {renderManip(fish1Sequence)}
      </div>
      <div role="cell" className="ff8-vtable-cell" style={{ flex: COLUMNS[3].flex }}>
        {fish1hp} ({fish1drop})
      </div>
      <div role="cell" className="ff8-vtable-cell kai-separator" style={{ flex: COLUMNS[4].flex }}>
        <AtbCell
          limits={fish1limits}
          refreshes={fish1Refreshes}
          refreshesToLastLimit={fish1refreshesToLastLimit}
          mode={mode}
        />
      </div>
      <div role="cell" className="ff8-vtable-cell" style={{ flex: COLUMNS[5].flex }}>
        {renderManip(fish2Sequence)}
      </div>
      <div role="cell" className="ff8-vtable-cell" style={{ flex: COLUMNS[6].flex }}>
        {fish2hp} ({fish2drop})
      </div>
      <div role="cell" className="ff8-vtable-cell" style={{ flex: COLUMNS[7].flex }}>
        <AtbCell
          limits={fish2limits}
          refreshes={fish2Refreshes}
          refreshesToLastLimit={fish2refreshesToLastLimit}
          mode={mode}
        />
      </div>
    </div>
  );
});

ResultRow.propTypes = {
  virtualIndex: PropTypes.number.isRequired,
  start: PropTypes.number.isRequired,
  measureElement: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  pattern: PropTypes.string.isRequired,
  reset: PropTypes.string,
  fish1Sequence: PropTypes.string,
  fish1Refreshes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  fish1hp: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  fish1drop: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  fish1limits: PropTypes.number,
  fish1refreshesToLastLimit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  fish2Sequence: PropTypes.string,
  fish2Refreshes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  fish2hp: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  fish2drop: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  fish2limits: PropTypes.number,
  fish2refreshesToLastLimit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  mode: PropTypes.oneOf(['waves', 'limits', 'refresh']),
};

export default function App() {
  const [qhp, setQhp] = useState('');
  const [pattern, setPattern] = useState('');
  const [mode, setMode] = useState('waves');

  // Both inputs stay controlled and instant; only the RNG recompute (up to
  // three limit-break simulations per row, across every matching row) and the
  // resulting table re-render wait for typing to settle.
  const [debouncedQhp] = useDebouncedValue(qhp, 150);
  const [debouncedPattern] = useDebouncedValue(pattern, 150);

  const results = useMemo(
    () => matchingRows(rows, debouncedPattern).map((row) => buildRow(row, debouncedQhp)),
    [debouncedPattern, debouncedQhp]
  );

  const scrollRef = useRef(null);

  // Rows vary in height — manip text wraps at different lengths, and RESET
  // rows are shorter than normal ones — so we estimate up front and let the
  // virtualizer measure each row's real rendered height and adjust.
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 56,
    overscan: 8,
    getItemKey: (i) => results[i].index,
  });

  return (
    <ToolShell
      title={
        <Group gap="xs" wrap="nowrap">
          <KaivelButton />
          <span>Fin Manip KAI</span>
        </Group>
      }
      status="working"
      repo="fish-fins-kai"
      intro="Foudre times two was good."
      credits="Kaivel."
      size="xl"
    >
      <Stack gap="md">
        <Group align="flex-end" grow>
          <NumberInput
            label="Pre-fight Q HP"
            placeholder="Quistis HP"
            min={0}
            allowDecimal={false}
            value={qhp}
            onChange={setQhp}
            maw={180}
          />
          <TextInput
            label="Pattern"
            placeholder="Fin pattern"
            value={pattern}
            onChange={(event) => setPattern(event.currentTarget.value)}
          />
        </Group>

        <Group justify="space-between" align="flex-end">
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              <b className="kai-atb">Orange</b> is starting ATB.{' '}
              <b className="kai-alt">Purple</b> is an alternate manip.
            </Text>
            <Text size="xs" c="dimmed">
              <b className="kai-important">WAIT</b> means wait until Squall&apos;s thunder animation
              starts.
            </Text>
          </Stack>
          <SegmentedControl size="xs" data={MODES} value={mode} onChange={setMode} />
        </Group>

        <Box className="ff8-vtable" role="table" aria-label="Fish fin patterns">
          <div className="ff8-vtable-head" role="row">
            {COLUMNS.map((column) => (
              <div
                key={column.key}
                role="columnheader"
                className={column.separator ? 'ff8-vtable-cell kai-separator' : 'ff8-vtable-cell'}
                style={{ flex: column.flex }}
              >
                {column.label}
              </div>
            ))}
          </div>

          <div ref={scrollRef} className="ff8-vtable-scroll" style={{ height: 560 }}>
            <div
              role="rowgroup"
              className="ff8-vtable-body"
              style={{ height: virtualizer.getTotalSize() }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = results[virtualRow.index];
                return (
                  <ResultRow
                    key={virtualRow.key}
                    virtualIndex={virtualRow.index}
                    start={virtualRow.start}
                    measureElement={virtualizer.measureElement}
                    index={row.index}
                    pattern={row.pattern}
                    reset={row.reset}
                    fish1Sequence={row.fish1Sequence}
                    fish1Refreshes={row.fish1Refreshes}
                    fish1hp={row.fish1hp}
                    fish1drop={row.fish1drop}
                    fish1limits={row.fish1limits}
                    fish1refreshesToLastLimit={row.fish1refreshesToLastLimit}
                    fish2Sequence={row.fish2Sequence}
                    fish2Refreshes={row.fish2Refreshes}
                    fish2hp={row.fish2hp}
                    fish2drop={row.fish2drop}
                    fish2limits={row.fish2limits}
                    fish2refreshesToLastLimit={row.fish2refreshesToLastLimit}
                    mode={mode}
                  />
                );
              })}
            </div>
          </div>
        </Box>

        {results.length === 0 && (
          <Text c="dimmed" ta="center" py="lg">
            No pattern matches “{pattern}”.
          </Text>
        )}
      </Stack>
    </ToolShell>
  );
}
