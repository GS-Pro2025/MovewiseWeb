import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, OutlinedInput,
  Paper, Select, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RuleIcon from '@mui/icons-material/Rule';
import type { GroupCombine, ReportConfig, ReportRule, RuleKind, RuleLevel, RuleOp } from '../../domain/ReportModels';
import { COMPARE_OPS, RULE_FIELDS, RULE_OPS } from '../../domain/ReportModels';
import { fetchCustomerFactories, fetchJobs } from '../../../Home/data/repositoryOrders';

const BRAND = '#0B2863';

interface Props {
  value: ReportConfig;
  onChange: (partial: Partial<ReportConfig>) => void;
}

interface Option { id: number; name: string }

const kindOf = (field: string): RuleKind => RULE_FIELDS[field]?.kind ?? 'number';

/** Fields available at a level. */
const fieldsFor = (level: RuleLevel): string[] =>
  Object.entries(RULE_FIELDS)
    .filter(([, meta]) => meta.levels.includes(level))
    .map(([field]) => field);

const defaultValue = (kind: RuleKind, op: RuleOp): ReportRule['value'] => {
  if (op === 'empty' || op === 'not_empty') return undefined;
  if (op === 'between') return ['', ''];
  if (op === 'in') return [];
  return kind === 'number' ? '' : '';
};

const newRule = (): ReportRule => ({
  field: fieldsFor('order')[0], op: 'lt', value: '', level: 'order',
});

const ReportRulesEditor: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const rules = value.rules ?? [];
  const combine: GroupCombine = value.group_combine ?? 'sum';
  const [factories, setFactories] = useState<Option[]>([]);
  const [jobs, setJobs] = useState<Option[]>([]);

  const needsLookups = rules.some((r) => kindOf(r.field) === 'id');
  useEffect(() => {
    if (!needsLookups || factories.length || jobs.length) return;
    fetchCustomerFactories().then((r) => setFactories(r.map((f) => ({ id: f.id_factory, name: f.name })))).catch(() => undefined);
    fetchJobs().then((r) => setJobs(r.map((j) => ({ id: j.id, name: j.name })))).catch(() => undefined);
  }, [needsLookups, factories.length, jobs.length]);

  const setRules = (next: ReportRule[]) => onChange({ rules: next });
  const update = (i: number, patch: Partial<ReportRule>) =>
    setRules(rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const changeLevel = (i: number, level: RuleLevel) => {
    const r = rules[i];
    const allowed = fieldsFor(level);
    if (allowed.includes(r.field)) {
      const vf = r.value_field && fieldsFor(level).includes(r.value_field) ? r.value_field : undefined;
      return update(i, { level, value_field: vf, ...(r.value_field && !vf ? { value: '' } : {}) });
    }
    const field = allowed[0];
    update(i, { level, field, op: RULE_OPS[kindOf(field)][0], value: defaultValue(kindOf(field), RULE_OPS[kindOf(field)][0]), value_field: undefined });
  };

  const changeField = (i: number, field: string) => {
    const kind = kindOf(field);
    const op = RULE_OPS[kind][0];
    update(i, { field, op, value: defaultValue(kind, op), value_field: undefined });
  };

  const changeOp = (i: number, op: RuleOp) => {
    const keepField = rules[i].value_field && COMPARE_OPS.includes(op);
    update(i, { op, value: defaultValue(kindOf(rules[i].field), op), value_field: keepField ? rules[i].value_field : undefined });
  };

  /** Other numeric fields a rule can be compared against at its level. */
  const compareTargets = (r: ReportRule): string[] =>
    fieldsFor(r.level).filter((f) => f !== r.field && kindOf(f) === 'number');

  const renderValue = (r: ReportRule, i: number) => {
    const kind = kindOf(r.field);
    if (r.op === 'empty' || r.op === 'not_empty') return null;

    if (r.value_field) {
      return (
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <InputLabel>{t('reports.rules.compareWith')}</InputLabel>
          <Select value={r.value_field} label={t('reports.rules.compareWith')}
            onChange={(e) => update(i, { value_field: e.target.value })}>
            {compareTargets(r).map((f) => <MenuItem key={f} value={f}>{t(`reports.rules.fields.${f}`)}</MenuItem>)}
          </Select>
        </FormControl>
      );
    }

    if (r.op === 'between') {
      const [min, max] = Array.isArray(r.value) ? r.value : ['', ''];
      return (
        <Box display="flex" gap={1}>
          <TextField size="small" type="number" label={t('reports.rules.min')} value={min}
            onChange={(e) => update(i, { value: [e.target.value, max] })} sx={{ width: 110 }} />
          <TextField size="small" type="number" label={t('reports.rules.max')} value={max}
            onChange={(e) => update(i, { value: [min, e.target.value] })} sx={{ width: 110 }} />
        </Box>
      );
    }

    if (kind === 'id') {
      const options = r.field === 'job' ? jobs : factories;
      const label = t(`reports.rules.fields.${r.field}`);
      if (r.op === 'in') {
        const selected = (Array.isArray(r.value) ? r.value : []) as number[];
        return (
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>{label}</InputLabel>
            <Select multiple value={selected} input={<OutlinedInput label={label} />}
              onChange={(e) => update(i, { value: e.target.value as number[] })}
              renderValue={(ids) => (
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {(ids as number[]).map((id) => <Chip key={id} size="small" label={options.find((o) => o.id === id)?.name ?? id} />)}
                </Box>
              )}>
              {options.map((o) => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
            </Select>
          </FormControl>
        );
      }
      return (
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>{label}</InputLabel>
          <Select value={typeof r.value === 'number' ? r.value : ''} label={label}
            onChange={(e) => update(i, { value: Number(e.target.value) })}>
            {options.map((o) => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
          </Select>
        </FormControl>
      );
    }

    if (r.op === 'in') {
      return (
        <TextField size="small" label={t('reports.rules.value')} helperText={t('reports.rules.commaHint')}
          value={Array.isArray(r.value) ? r.value.join(', ') : ''}
          onChange={(e) => update(i, { value: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })}
          sx={{ minWidth: 220 }} />
      );
    }

    return (
      <TextField size="small" label={t('reports.rules.value')} type={kind === 'number' ? 'number' : 'text'}
        value={typeof r.value === 'string' || typeof r.value === 'number' ? r.value : ''}
        onChange={(e) => update(i, { value: e.target.value })} sx={{ minWidth: 160 }} />
    );
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', borderColor: rules.length ? BRAND : 'divider', borderWidth: rules.length ? 2 : 1 }}>
      <Box px={2} py={1.5} display="flex" alignItems="center" gap={1.5} bgcolor="grey.50">
        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: rules.length ? BRAND : 'grey.200', color: rules.length ? 'white' : 'grey.600' }}>
          <RuleIcon fontSize="small" />
        </Box>
        <Box flex={1}>
          <Typography variant="body2" fontWeight={600}>{t('reports.rules.title')}</Typography>
          <Typography variant="caption" color="text.secondary">{t('reports.rules.subtitle')}</Typography>
        </Box>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setRules([...rules, newRule()])}>
          {t('reports.rules.add')}
        </Button>
      </Box>

      <Box px={2} py={1.5} display="flex" flexDirection="column" gap={1.5}>
        {rules.length === 0 && <Typography variant="caption" color="text.secondary">{t('reports.rules.empty')}</Typography>}

        {rules.map((r, i) => {
          const kind = kindOf(r.field);
          return (
            <Box key={i} display="flex" gap={1} flexWrap="wrap" alignItems="flex-start"
              sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(11,40,99,0.04)' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>{t('reports.rules.level')}</InputLabel>
                <Select value={r.level} label={t('reports.rules.level')} onChange={(e) => changeLevel(i, e.target.value as RuleLevel)}>
                  <MenuItem value="order">{t('reports.rules.levelOrder')}</MenuItem>
                  <MenuItem value="group">{t('reports.rules.levelGroup')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 190 }}>
                <InputLabel>{t('reports.rules.field')}</InputLabel>
                <Select value={r.field} label={t('reports.rules.field')} onChange={(e) => changeField(i, e.target.value)}>
                  {fieldsFor(r.level).map((f) => <MenuItem key={f} value={f}>{t(`reports.rules.fields.${f}`)}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>{t('reports.rules.op')}</InputLabel>
                <Select value={r.op} label={t('reports.rules.op')} onChange={(e) => changeOp(i, e.target.value as RuleOp)}>
                  {RULE_OPS[kind].map((op) => <MenuItem key={op} value={op}>{t(`reports.rules.ops.${op}`)}</MenuItem>)}
                </Select>
              </FormControl>
              {kind === 'number' && COMPARE_OPS.includes(r.op) && (
                <ToggleButtonGroup size="small" exclusive value={r.value_field ? 'field' : 'value'}
                  onChange={(_, v) => {
                    if (v === 'field') update(i, { value_field: compareTargets(r)[0], value: undefined });
                    else if (v === 'value') update(i, { value_field: undefined, value: '' });
                  }}
                  sx={{ height: 40 }}>
                  <ToggleButton value="value">{t('reports.rules.againstValue')}</ToggleButton>
                  <ToggleButton value="field">{t('reports.rules.againstField')}</ToggleButton>
                </ToggleButtonGroup>
              )}
              {renderValue(r, i)}
              <Tooltip title={t('reports.rules.remove')}>
                <IconButton size="small" onClick={() => setRules(rules.filter((_, idx) => idx !== i))} sx={{ mt: 0.25 }}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        })}

        {rules.length > 1 && (
          <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
            <Typography variant="caption" fontWeight={600}>{t('reports.rules.match')}</Typography>
            <ToggleButtonGroup size="small" exclusive value={value.rules_match ?? 'all'}
              onChange={(_, v) => v && onChange({ rules_match: v })}>
              <ToggleButton value="all">{t('reports.rules.matchAll')}</ToggleButton>
              <ToggleButton value="any">{t('reports.rules.matchAny')}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        <Box>
          <Typography variant="caption" fontWeight={600}>{t('reports.rules.combine')}</Typography>
          <Box mt={0.5}>
            <ToggleButtonGroup size="small" exclusive value={combine} onChange={(_, v) => v && onChange({ group_combine: v as GroupCombine })}>
              <ToggleButton value="sum">{t('reports.rules.combineSum')}</ToggleButton>
              <ToggleButton value="single">{t('reports.rules.combineSingle')}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {combine === 'single' && (
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              {t('reports.rules.combineSingleHint')}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default ReportRulesEditor;
