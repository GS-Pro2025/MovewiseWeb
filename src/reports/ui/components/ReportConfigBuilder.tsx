import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  Divider,
  Typography,
  Box,
  RadioGroup,
  Radio,
} from '@mui/material';
import type { ReportConfig } from '../../domain/ReportModels';
import {
  ORDER_FIELDS,
  ASSIGN_FIELDS,
  PERSON_FIELDS,
  OPERATOR_FIELDS,
  ASSIGNMENT_FIELDS,
  FIELD_LABELS,
} from '../../domain/ReportModels';

interface Props {
  value: ReportConfig;
  onChange: (config: ReportConfig) => void;
}

function toggleArrayItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

const FieldCheckboxGroup: React.FC<{
  label: string;
  fields: readonly string[];
  selected: string[];
  onChange: (updated: string[]) => void;
}> = ({ label, fields, selected, onChange }) => {
  const { t } = useTranslation();
  return (
    <Box mb={1}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        {label}
      </Typography>
      <FormGroup row sx={{ gap: 0.5 }}>
        {fields.map((f) => (
          <FormControlLabel
            key={f}
            control={
              <Checkbox
                size="small"
                checked={selected.includes(f)}
                onChange={() => onChange(toggleArrayItem(selected, f))}
              />
            }
            label={
              <Typography variant="body2">
                {t(`reports.fields.${f}`, FIELD_LABELS[f] ?? f)}
              </Typography>
            }
          />
        ))}
      </FormGroup>
    </Box>
  );
};

const ReportConfigBuilder: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation();

  const patch = (partial: Partial<ReportConfig>) => onChange({ ...value, ...partial });

  const handleTypeChange = (type: 'orders' | 'operators') => {
    if (type === 'orders') {
      onChange({
        report_type: 'orders',
        order_fields: ['key_ref', 'date', 'income', 'expense', 'status', 'payStatus'],
        include_person: false,
        person_fields: [],
        include_job: false,
        include_customer_factory: false,
        include_assigns: false,
        assign_fields: [],
        include_costfuel: false,
        include_tools: false,
        status_filter: null,
        pay_status_filter: null,
      });
    } else {
      onChange({
        report_type: 'operators',
        operator_fields: ['code', 'first_name', 'last_name', 'status', 'salary_type', 'salary'],
        include_assignments: false,
        assignment_fields: [],
        status_filter: null,
      });
    }
  };

  return (
    <Box>
      {/* Report type */}
      <FormControl sx={{ mb: 2 }}>
        <FormLabel>{t('reports.config.reportType')}</FormLabel>
        <RadioGroup
          row
          value={value.report_type}
          onChange={(e) => handleTypeChange(e.target.value as 'orders' | 'operators')}
        >
          <FormControlLabel value="orders" control={<Radio size="small" />} label={t('reports.config.typeOrders')} />
          <FormControlLabel value="operators" control={<Radio size="small" />} label={t('reports.config.typeOperators')} />
        </RadioGroup>
      </FormControl>

      <Divider sx={{ mb: 2 }} />

      {/* ── Orders config ────────────────────────────────────────────────────── */}
      {value.report_type === 'orders' && (
        <>
          <FieldCheckboxGroup
            label={t('reports.config.orderFields')}
            fields={ORDER_FIELDS}
            selected={value.order_fields ?? []}
            onChange={(v) => patch({ order_fields: v })}
          />

          <Divider sx={{ my: 1.5 }} />

          {/* include_person */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={!!value.include_person}
                  onChange={(e) => patch({ include_person: e.target.checked })}
                />
              }
              label={<Typography variant="body2">{t('reports.config.includeClient')}</Typography>}
            />
            {value.include_person && (
              <Box pl={3} mt={0.5}>
                <FieldCheckboxGroup
                  label={t('reports.config.clientFields')}
                  fields={PERSON_FIELDS}
                  selected={value.person_fields ?? []}
                  onChange={(v) => patch({ person_fields: v })}
                />
              </Box>
            )}
          </Box>

          {/* include_job */}
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={!!value.include_job}
                onChange={(e) => patch({ include_job: e.target.checked })}
              />
            }
            label={<Typography variant="body2">{t('reports.config.includeJob')}</Typography>}
          />

          {/* include_customer_factory */}
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={!!value.include_customer_factory}
                onChange={(e) => patch({ include_customer_factory: e.target.checked })}
              />
            }
            label={<Typography variant="body2">{t('reports.config.includeCustomerFactory')}</Typography>}
          />

          {/* include_assigns */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={!!value.include_assigns}
                  onChange={(e) => patch({ include_assigns: e.target.checked })}
                />
              }
              label={<Typography variant="body2">{t('reports.config.includeAssigns')}</Typography>}
            />
            {value.include_assigns && (
              <Box pl={3} mt={0.5}>
                <FieldCheckboxGroup
                  label={t('reports.config.assignFields')}
                  fields={ASSIGN_FIELDS}
                  selected={value.assign_fields ?? []}
                  onChange={(v) => patch({ assign_fields: v })}
                />
              </Box>
            )}
          </Box>

          {/* include_costfuel */}
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={!!value.include_costfuel}
                onChange={(e) => patch({ include_costfuel: e.target.checked })}
              />
            }
            label={<Typography variant="body2">{t('reports.config.includeFuelCost')}</Typography>}
          />

          {/* include_tools */}
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={!!value.include_tools}
                onChange={(e) => patch({ include_tools: e.target.checked })}
              />
            }
            label={<Typography variant="body2">{t('reports.config.includeTools')}</Typography>}
          />

          <Divider sx={{ my: 1.5 }} />

          {/* Filters */}
          <Box display="flex" gap={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>{t('reports.config.statusFilter')}</InputLabel>
              <Select
                value={value.status_filter ?? ''}
                label={t('reports.config.statusFilter')}
                onChange={(e) =>
                  patch({ status_filter: e.target.value === '' ? null : e.target.value })
                }
              >
                <MenuItem value="">{t('reports.config.filterAll')}</MenuItem>
                <MenuItem value="completed">{t('reports.config.statusCompleted')}</MenuItem>
                <MenuItem value="pending">{t('reports.config.statusPending')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>{t('reports.config.payStatusFilter')}</InputLabel>
              <Select
                value={value.pay_status_filter ?? ''}
                label={t('reports.config.payStatusFilter')}
                onChange={(e) => {
                  const v = e.target.value;
                  patch({ pay_status_filter: v === '' ? null : (Number(v) as 0 | 1) });
                }}
              >
                <MenuItem value="">{t('reports.config.filterAll')}</MenuItem>
                <MenuItem value={1}>{t('reports.config.paid')}</MenuItem>
                <MenuItem value={0}>{t('reports.config.unpaid')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </>
      )}

      {/* ── Operators config ─────────────────────────────────────────────────── */}
      {value.report_type === 'operators' && (
        <>
          <FieldCheckboxGroup
            label={t('reports.config.operatorFields')}
            fields={OPERATOR_FIELDS}
            selected={value.operator_fields ?? []}
            onChange={(v) => patch({ operator_fields: v })}
          />

          <Divider sx={{ my: 1.5 }} />

          {/* include_assignments */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={!!value.include_assignments}
                  onChange={(e) => patch({ include_assignments: e.target.checked })}
                />
              }
              label={<Typography variant="body2">{t('reports.config.includeAssignments')}</Typography>}
            />
            {value.include_assignments && (
              <Box pl={3} mt={0.5}>
                <FieldCheckboxGroup
                  label={t('reports.config.assignmentFields')}
                  fields={ASSIGNMENT_FIELDS}
                  selected={value.assignment_fields ?? []}
                  onChange={(v) => patch({ assignment_fields: v })}
                />
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Operator status filter */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{t('reports.config.operatorStatusFilter')}</InputLabel>
            <Select
              value={value.status_filter ?? ''}
              label={t('reports.config.operatorStatusFilter')}
              onChange={(e) =>
                patch({ status_filter: e.target.value === '' ? null : e.target.value })
              }
            >
              <MenuItem value="">{t('reports.config.filterAll')}</MenuItem>
              <MenuItem value="active">{t('reports.config.operatorActive')}</MenuItem>
              <MenuItem value="inactive">{t('reports.config.operatorInactive')}</MenuItem>
              <MenuItem value="freelance">{t('reports.config.operatorFreelance')}</MenuItem>
            </Select>
          </FormControl>
        </>
      )}
    </Box>
  );
};

export default ReportConfigBuilder;
