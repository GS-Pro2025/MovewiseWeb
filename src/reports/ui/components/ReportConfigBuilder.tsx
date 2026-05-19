import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Chip,
  Collapse,
  Divider,
  Fade,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Typography,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import BuildIcon from '@mui/icons-material/Build';
import FilterListIcon from '@mui/icons-material/FilterList';
import EventNoteIcon from '@mui/icons-material/EventNote';
import type { ReportConfig } from '../../domain/ReportModels';
import {
  ORDER_FIELDS,
  ASSIGN_FIELDS,
  PERSON_FIELDS,
  OPERATOR_FIELDS,
  ASSIGNMENT_FIELDS,
  FIELD_LABELS,
} from '../../domain/ReportModels';

const BRAND = '#0B2863';
const BRAND_LIGHT = 'rgba(11,40,99,0.07)';

interface Props {
  value: ReportConfig;
  onChange: (config: ReportConfig) => void;
}

function toggleArrayItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

const FieldChipGroup: React.FC<{
  fields: readonly string[];
  selected: string[];
  onChange: (updated: string[]) => void;
}> = ({ fields, selected, onChange }) => {
  const { t } = useTranslation();
  return (
    <Box display="flex" flexWrap="wrap" gap={0.75} mt={0.75}>
      {fields.map((f) => {
        const isOn = selected.includes(f);
        return (
          <Chip
            key={f}
            label={t(`reports.fields.${f}`, FIELD_LABELS[f] ?? f)}
            size="small"
            clickable
            variant={isOn ? 'filled' : 'outlined'}
            onClick={() => onChange(toggleArrayItem(selected, f))}
            sx={{
              transition: 'all 0.18s ease',
              fontWeight: isOn ? 600 : 400,
              borderColor: isOn ? BRAND : undefined,
              ...(isOn && {
                bgcolor: BRAND,
                color: 'white',
                '&:hover': { bgcolor: '#0a2255' },
              }),
            }}
          />
        );
      })}
    </Box>
  );
};

const IncludeSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}> = ({ icon, title, subtitle, checked, onToggle, children }) => (
  <Paper
    variant="outlined"
    sx={{
      borderRadius: 2,
      overflow: 'hidden',
      borderColor: checked ? BRAND : 'divider',
      borderWidth: checked ? 2 : 1,
      transition: 'border-color 0.22s ease',
    }}
  >
    <Box
      display="flex"
      alignItems="center"
      gap={1.5}
      px={2}
      py={1.5}
      onClick={() => onToggle(!checked)}
      sx={{
        cursor: 'pointer',
        bgcolor: checked ? BRAND_LIGHT : 'transparent',
        transition: 'background-color 0.22s ease',
        userSelect: 'none',
        '&:hover': { bgcolor: checked ? BRAND_LIGHT : 'grey.50' },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: checked ? BRAND : 'grey.100',
          color: checked ? 'white' : 'grey.500',
          transition: 'all 0.22s ease',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box flex={1}>
        <Typography
          variant="body2"
          fontWeight={checked ? 700 : 500}
          color={checked ? BRAND : 'text.primary'}
          sx={{ transition: 'color 0.2s ease' }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      <Switch
        checked={checked}
        size="small"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          e.stopPropagation();
          onToggle(e.target.checked);
        }}
        sx={{
          '& .MuiSwitch-switchBase.Mui-checked': { color: BRAND },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: BRAND },
        }}
      />
    </Box>
    {children && (
      <Collapse in={checked} timeout={260}>
        <Box
          px={2}
          pb={2}
          pt={1.25}
          sx={{ borderTop: `1px solid ${checked ? 'rgba(11,40,99,0.12)' : 'transparent'}` }}
        >
          {children}
        </Box>
      </Collapse>
    )}
  </Paper>
);

const TypeCard: React.FC<{
  active: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}> = ({ active, icon, label, description, onClick }) => (
  <Box
    flex={1}
    onClick={onClick}
    sx={{
      p: 2,
      borderRadius: 2.5,
      border: '2px solid',
      borderColor: active ? BRAND : 'divider',
      bgcolor: active ? BRAND_LIGHT : 'background.paper',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 1,
      position: 'relative',
      transition: 'all 0.22s ease',
      '&:hover': {
        borderColor: active ? BRAND : 'grey.400',
        transform: 'translateY(-2px)',
        boxShadow: active
          ? '0 4px 16px rgba(11,40,99,0.18)'
          : '0 2px 8px rgba(0,0,0,0.08)',
      },
    }}
  >
    {active && (
      <CheckCircleIcon
        sx={{ position: 'absolute', top: 8, right: 8, fontSize: 18, color: BRAND }}
      />
    )}
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: active ? BRAND : 'grey.100',
        color: active ? 'white' : 'grey.500',
        transition: 'all 0.22s ease',
      }}
    >
      {icon}
    </Box>
    <Typography variant="subtitle2" fontWeight={active ? 700 : 500} color={active ? BRAND : 'text.primary'}>
      {label}
    </Typography>
    <Typography variant="caption" color="text.secondary" textAlign="center">
      {description}
    </Typography>
  </Box>
);

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
    <Box display="flex" flexDirection="column" gap={2.5}>
      {/* ── Report type selector ─────────────────────────────────────────────── */}
      <Box>
        <Typography
          variant="caption"
          fontWeight={700}
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}
        >
          {t('reports.config.reportType')}
        </Typography>
        <Box display="flex" gap={1.5} mt={1}>
          <TypeCard
            active={value.report_type === 'orders'}
            icon={<ReceiptLongIcon />}
            label={t('reports.config.typeOrders')}
            description={t('reports.config.typeOrdersDesc', 'Orders, income, expenses and clients')}
            onClick={() => handleTypeChange('orders')}
          />
          <TypeCard
            active={value.report_type === 'operators'}
            icon={<PeopleIcon />}
            label={t('reports.config.typeOperators')}
            description={t('reports.config.typeOperatorsDesc', 'Operators, salaries and assignments')}
            onClick={() => handleTypeChange('operators')}
          />
        </Box>
      </Box>

      <Divider />

      {/* ── Animated section per type ────────────────────────────────────────── */}
      <Fade in key={value.report_type} timeout={280}>
        <Box display="flex" flexDirection="column" gap={1.5}>

          {/* ── Orders ── */}
          {value.report_type === 'orders' && (
            <>
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}
                >
                  {t('reports.config.orderFields')}
                </Typography>
                <FieldChipGroup
                  fields={ORDER_FIELDS}
                  selected={value.order_fields ?? []}
                  onChange={(v) => patch({ order_fields: v })}
                />
              </Box>

              <Divider />

              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}
              >
                {t('reports.config.additionalData', 'Additional Data')}
              </Typography>

              <IncludeSection
                icon={<PersonIcon fontSize="small" />}
                title={t('reports.config.includeClient')}
                subtitle={t('reports.config.includeClientDesc', 'Name, phone, email')}
                checked={!!value.include_person}
                onToggle={(v) => patch({ include_person: v })}
              >
                <FieldChipGroup
                  fields={PERSON_FIELDS}
                  selected={value.person_fields ?? []}
                  onChange={(v) => patch({ person_fields: v })}
                />
              </IncludeSection>

              <IncludeSection
                icon={<WorkIcon fontSize="small" />}
                title={t('reports.config.includeJob')}
                subtitle={t('reports.config.includeJobDesc', 'Job type name')}
                checked={!!value.include_job}
                onToggle={(v) => patch({ include_job: v })}
              />

              <IncludeSection
                icon={<BusinessIcon fontSize="small" />}
                title={t('reports.config.includeCustomerFactory')}
                subtitle={t('reports.config.includeCustomerFactoryDesc', 'Origin / destination factory')}
                checked={!!value.include_customer_factory}
                onToggle={(v) => patch({ include_customer_factory: v })}
              />

              <IncludeSection
                icon={<AssignmentIndIcon fontSize="small" />}
                title={t('reports.config.includeAssigns')}
                subtitle={t('reports.config.includeAssignsDesc', 'Operators, roles, salaries')}
                checked={!!value.include_assigns}
                onToggle={(v) => patch({ include_assigns: v })}
              >
                <FieldChipGroup
                  fields={ASSIGN_FIELDS}
                  selected={value.assign_fields ?? []}
                  onChange={(v) => patch({ assign_fields: v })}
                />
              </IncludeSection>

              <IncludeSection
                icon={<LocalGasStationIcon fontSize="small" />}
                title={t('reports.config.includeFuelCost')}
                subtitle={t('reports.config.includeFuelCostDesc', 'Distributed fuel costs per truck')}
                checked={!!value.include_costfuel}
                onToggle={(v) => patch({ include_costfuel: v })}
              />

              <IncludeSection
                icon={<BuildIcon fontSize="small" />}
                title={t('reports.config.includeTools')}
                subtitle={t('reports.config.includeToolsDesc', 'Tools assigned to the order')}
                checked={!!value.include_tools}
                onToggle={(v) => patch({ include_tools: v })}
              />

              {/* Filters */}
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box px={2} py={1.5} display="flex" alignItems="center" gap={1.5} bgcolor="grey.50">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.200',
                      color: 'grey.600',
                    }}
                  >
                    <FilterListIcon fontSize="small" />
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {t('reports.config.statusFilter')} / {t('reports.config.payStatusFilter')}
                  </Typography>
                </Box>
                <Box px={2} pb={2} pt={1.5} display="flex" gap={2} flexWrap="wrap">
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
                      <MenuItem value={1 as unknown as string}>{t('reports.config.paid')}</MenuItem>
                      <MenuItem value={0 as unknown as string}>{t('reports.config.unpaid')}</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Paper>
            </>
          )}

          {/* ── Operators ── */}
          {value.report_type === 'operators' && (
            <>
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}
                >
                  {t('reports.config.operatorFields')}
                </Typography>
                <FieldChipGroup
                  fields={OPERATOR_FIELDS}
                  selected={value.operator_fields ?? []}
                  onChange={(v) => patch({ operator_fields: v })}
                />
              </Box>

              <Divider />

              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}
              >
                {t('reports.config.additionalData', 'Additional Data')}
              </Typography>

              <IncludeSection
                icon={<EventNoteIcon fontSize="small" />}
                title={t('reports.config.includeAssignments')}
                subtitle={t('reports.config.includeAssignmentsDesc', 'Orders worked during the date range')}
                checked={!!value.include_assignments}
                onToggle={(v) => patch({ include_assignments: v })}
              >
                <FieldChipGroup
                  fields={ASSIGNMENT_FIELDS}
                  selected={value.assignment_fields ?? []}
                  onChange={(v) => patch({ assignment_fields: v })}
                />
              </IncludeSection>

              {/* Operator status filter */}
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box px={2} py={1.5} display="flex" alignItems="center" gap={1.5} bgcolor="grey.50">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.200',
                      color: 'grey.600',
                    }}
                  >
                    <FilterListIcon fontSize="small" />
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {t('reports.config.operatorStatusFilter')}
                  </Typography>
                </Box>
                <Box px={2} pb={2} pt={1.5}>
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
                </Box>
              </Paper>
            </>
          )}

        </Box>
      </Fade>
    </Box>
  );
};

export default ReportConfigBuilder;
