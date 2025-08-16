import React, { useState, useEffect } from 'react';
import {
  Field,
  Input,
  Select,
  Button,
  useStyles2,
  IconButton,
  ColorPicker,
  TextArea,
  Tooltip,
  Icon,
} from '@grafana/ui';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { css } from '@emotion/css';
import { JsonApiQuery, AnySeriesConfiguration } from '../types';

interface Props {
  query: JsonApiQuery;
  onChange: (query: JsonApiQuery) => void;
  onRunQuery: () => void;
}

export const AggregateDataEditor: React.FC<Props> = ({ query, onChange, onRunQuery }) => {
  const styles = useStyles2(getStyles);
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);

  // Initialize form state from query or defaults
  const [formData, setFormData] = useState({
    filterTreeItems: query.customBody?.filterTreeItems || '${filterTreeItems:json}',
    start: query.customBody?.start || '${__from}',
    end: query.customBody?.end || '${__to}',
    siteExternalId: query.customBody?.siteExternalId || '${siteId}',
    uiObjectFullName: query.customBody?.uiObjectFullName || '${uiObject}',
    granularity: query.customBody?.granularity || '${granularity}',
    seriesConfiguration: query.customBody?.seriesConfiguration || ([] as AnySeriesConfiguration[]),
  });

  const seriesTypeOptions: Array<SelectableValue<string>> = [
    { label: 'Data Service Series', value: 'DataServiceSeriesConfiguration' },
    { label: 'Multi Data Service Series', value: 'MultiDataServiceSeriesConfiguration' },
    { label: 'Native Data Service Series', value: 'NativeDataServiceSeriesConfiguration' },
  ];

  const interpolationOptions: Array<SelectableValue<string>> = [
    { label: 'None', value: 'None' },
    { label: 'Null', value: 'Null' },
    { label: 'Value', value: 'Value' },
    { label: 'Zero', value: 'Zero' },
  ];

  const aggregationOptions: Array<SelectableValue<string>> = [
    { label: 'AVG', value: 'AVG' },
    { label: 'AVGMM', value: 'AVGMM' },
    { label: 'COUNT', value: 'COUNT' },
    { label: 'MAX', value: 'MAX' },
    { label: 'MIN', value: 'MIN' },
    { label: 'STDEV', value: 'STDEV' },
    { label: 'SUM', value: 'SUM' },
    { label: 'VAR', value: 'VAR' },
    { label: 'FIRST', value: 'FIRST' },
    { label: 'LAST', value: 'LAST' },
    { label: 'DIFF', value: 'DIFF' },
    { label: 'NONE', value: 'NONE' },
    { label: 'COUNTDIST', value: 'COUNTDIST' },
    { label: 'COUNT0', value: 'COUNT0' },
    { label: 'COUNT1', value: 'COUNT1' },
    { label: 'COUNTGRP', value: 'COUNTGRP' },
    { label: 'MED', value: 'MED' },
    { label: 'EDGE', value: 'EDGE' },
    { label: 'DISTVAL', value: 'DISTVAL' },
    { label: 'AVGW', value: 'AVGW' },
    { label: 'INTEGRAL', value: 'INTEGRAL' },
    { label: 'HIST', value: 'HIST' },
  ];

  // Update query when form data changes
  useEffect(() => {
    const newQuery = {
      ...query,
      customBody: formData,
      body: JSON.stringify(formData, null, 2),
    };
    onChange(newQuery);
  }, [formData, query, onChange]);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSeries = (type: string) => {
    const baseSeries = {
      name: `Series ${formData.seriesConfiguration.length + 1}`,
      color: '',
    };

    let newSeries: AnySeriesConfiguration;

    switch (type) {
      case 'DataServiceSeriesConfiguration':
        newSeries = {
          ...baseSeries,
          $type: 'DataServiceSeriesConfiguration',
          dataformat: 'Energy_1',
          selector: 'SelectorName',
          interpolation: 'None',
          aggregation: 'AVG',
        };
        break;
      case 'MultiDataServiceSeriesConfiguration':
        newSeries = {
          ...baseSeries,
          $type: 'MultiDataServiceSeriesConfiguration',
          dataformat: 'DataFormat_1',
          selector: 'SelectorName',
          interpolation: 'Zero',
          isParentAggregation: true,
          streamAggregation: 'DIFF',
          seriesAggregation: 'SUM',
        };
        break;
      case 'NativeDataServiceSeriesConfiguration':
        newSeries = {
          ...baseSeries,
          $type: 'NativeDataServiceSeriesConfiguration',
          query: 'SELECT *\r\nFROM MyTable',
        };
        break;
      default:
        return;
    }

    setFormData((prev) => ({
      ...prev,
      seriesConfiguration: [...prev.seriesConfiguration, newSeries],
    }));
  };

  const updateSeries = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      seriesConfiguration: prev.seriesConfiguration.map((series: AnySeriesConfiguration, i: number) =>
        i === index ? { ...series, [field]: value } : series
      ),
    }));
  };

  const removeSeries = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      seriesConfiguration: prev.seriesConfiguration.filter((_: AnySeriesConfiguration, i: number) => i !== index),
    }));
  };

  const renderSeriesEditor = (series: AnySeriesConfiguration, index: number) => {
    return (
      <div key={index} className={styles.seriesItem}>
        <div className={styles.seriesHeader}>
          <h4>
            Series {index + 1} ({series.$type.replace('SeriesConfiguration', '')})
          </h4>
          <IconButton
            name="trash-alt"
            size="sm"
            variant="destructive"
            onClick={() => removeSeries(index)}
            tooltip="Remove series"
          />
        </div>

        <div className={styles.seriesFields}>
          <div className={styles.seriesRowHorizontal}>
            <Field label="Name">
              <Input
                id={`series-${index}-name`}
                value={series.name}
                onChange={(e) => updateSeries(index, 'name', e.currentTarget.value)}
                placeholder="Series name"
              />
            </Field>
            <Field
              label={
                <div className={styles.labelWithTooltip}>
                  Color
                  <Tooltip content="This works with Apache ECharts only">
                    <Icon name="question-circle" className={styles.tooltipIcon} />
                  </Tooltip>
                </div>
              }
            >
              <ColorPicker color={series.color} onChange={(color) => updateSeries(index, 'color', color)} />
            </Field>
          </div>

          {series.$type === 'DataServiceSeriesConfiguration' && (
            <>
              <div className={styles.seriesRowHorizontal}>
                <Field label="Data Format">
                  <Input
                    id={`series-${index}-dataformat`}
                    value={series.dataformat}
                    onChange={(e) => updateSeries(index, 'dataformat', e.currentTarget.value)}
                    placeholder="e.g., Energy_1"
                  />
                </Field>
                <Field label="Selector">
                  <Input
                    id={`series-${index}-selector`}
                    value={series.selector}
                    onChange={(e) => updateSeries(index, 'selector', e.currentTarget.value)}
                    placeholder="e.g., SelectorName"
                  />
                </Field>
              </div>
              <div className={styles.seriesRowHorizontal}>
                <Field label="Interpolation">
                  <Select
                    id={`series-${index}-interpolation`}
                    value={series.interpolation}
                    options={interpolationOptions}
                    onChange={(selected) => updateSeries(index, 'interpolation', selected?.value || 'None')}
                  />
                </Field>
                <Field label="Aggregation">
                  <Select
                    id={`series-${index}-aggregation`}
                    value={series.aggregation}
                    options={aggregationOptions}
                    onChange={(selected) => updateSeries(index, 'aggregation', selected?.value || 'AVG')}
                  />
                </Field>
              </div>
            </>
          )}

          {series.$type === 'MultiDataServiceSeriesConfiguration' && (
            <>
              <div className={styles.seriesRowHorizontal}>
                <Field label="Data Format">
                  <Input
                    id={`series-${index}-dataformat-multi`}
                    value={series.dataformat}
                    onChange={(e) => updateSeries(index, 'dataformat', e.currentTarget.value)}
                    placeholder="e.g., DataFormat_1"
                  />
                </Field>
                <Field label="Selector">
                  <Input
                    id={`series-${index}-selector-multi`}
                    value={series.selector}
                    onChange={(e) => updateSeries(index, 'selector', e.currentTarget.value)}
                    placeholder="e.g., SelectorName"
                  />
                </Field>
              </div>
              <div className={styles.seriesRowHorizontal}>
                <Field label="Parent Aggregation">
                  <Select
                    id={`series-${index}-parent-aggregation`}
                    value={series.isParentAggregation}
                    options={[
                      { label: 'Yes', value: true },
                      { label: 'No', value: false },
                    ]}
                    onChange={(selected) => updateSeries(index, 'isParentAggregation', selected?.value || false)}
                  />
                </Field>
                <Field label="Interpolation">
                  <Select
                    id={`series-${index}-interpolation-multi`}
                    value={series.interpolation}
                    options={interpolationOptions}
                    onChange={(selected) => updateSeries(index, 'interpolation', selected?.value || 'None')}
                  />
                </Field>
              </div>
              <div className={styles.seriesRowHorizontal}>
                <Field label="Stream Aggregation">
                  <Select
                    id={`series-${index}-stream-aggregation`}
                    value={series.streamAggregation}
                    options={aggregationOptions}
                    onChange={(selected) => updateSeries(index, 'streamAggregation', selected?.value || 'DIFF')}
                  />
                </Field>
                <Field label="Series Aggregation">
                  <Select
                    id={`series-${index}-series-aggregation`}
                    value={series.seriesAggregation}
                    options={aggregationOptions}
                    onChange={(selected) => updateSeries(index, 'seriesAggregation', selected?.value || 'SUM')}
                  />
                </Field>
              </div>
            </>
          )}

          {series.$type === 'NativeDataServiceSeriesConfiguration' && (
            <div className={styles.seriesRow}>
              <Field label="SQL Query">
                <TextArea
                  id={`series-${index}-query`}
                  value={series.query}
                  onChange={(e) => updateSeries(index, 'query', e.currentTarget.value)}
                  placeholder="SELECT * FROM MyTable"
                  rows={4}
                />
              </Field>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Series Configuration</h3>
          <div className={styles.addButtons}>
            {seriesTypeOptions.map((option) => (
              <Button key={option.value} onClick={() => addSeries(option.value!)} variant="secondary" size="sm">
                Add {option.label}
              </Button>
            ))}
          </div>
        </div>

        {formData.seriesConfiguration.map((series: AnySeriesConfiguration, index: number) =>
          renderSeriesEditor(series, index)
        )}

        {formData.seriesConfiguration.length === 0 && (
          <div className={styles.emptyState}>
            <p>No series configured. Add a series to get started.</p>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Request Parameters</h3>
          <Button
            onClick={() => setShowAdvancedParams(!showAdvancedParams)}
            variant="secondary"
            size="sm"
            icon={showAdvancedParams ? 'angle-up' : 'angle-down'}
          >
            {showAdvancedParams ? 'Hide' : 'Show'} Parameter Override
          </Button>
        </div>

        <div className={styles.parameterInfo}>
          <p>
            Using dashboard variables:{' '}
            <code>
              ${'{'}filterTreeItems:json{'}'}
            </code>
            ,{' '}
            <code>
              ${'{'}__from{'}'}
            </code>
            ,{' '}
            <code>
              ${'{'}__to{'}'}
            </code>
            ,{' '}
            <code>
              ${'{'}siteId{'}'}
            </code>
            ,{' '}
            <code>
              ${'{'}uiObject{'}'}
            </code>
            ,{' '}
            <code>
              ${'{'}granularity{'}'}
            </code>
          </p>
        </div>

        {showAdvancedParams && (
          <div className={styles.advancedParams}>
            <Field label="Filter Tree Items" description="Dashboard variable for filter tree items">
              <Input
                id="filterTreeItems"
                value={formData.filterTreeItems}
                onChange={(e) => updateField('filterTreeItems', e.currentTarget.value)}
                placeholder="${filterTreeItems:json}"
              />
            </Field>

            <Field label="Start Time" description="Start time for the query">
              <Input
                id="start"
                value={formData.start}
                onChange={(e) => updateField('start', e.currentTarget.value)}
                placeholder="${__from}"
              />
            </Field>

            <Field label="End Time" description="End time for the query">
              <Input
                id="end"
                value={formData.end}
                onChange={(e) => updateField('end', e.currentTarget.value)}
                placeholder="${__to}"
              />
            </Field>

            <Field label="Site External ID" description="Dashboard variable for site ID">
              <Input
                id="siteExternalId"
                value={formData.siteExternalId}
                onChange={(e) => updateField('siteExternalId', e.currentTarget.value)}
                placeholder="${siteId}"
              />
            </Field>

            <Field label="UI Object Full Name" description="Dashboard variable for UI object">
              <Input
                id="uiObjectFullName"
                value={formData.uiObjectFullName}
                onChange={(e) => updateField('uiObjectFullName', e.currentTarget.value)}
                placeholder="${uiObject}"
              />
            </Field>

            <Field label="Granularity" description="Dashboard variable for data granularity">
              <Input
                id="granularity"
                value={formData.granularity}
                onChange={(e) => updateField('granularity', e.currentTarget.value)}
                placeholder="${granularity}"
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    width: '100%',
    padding: theme.spacing(2, 0),
    position: 'relative',
    zIndex: 1,
  }),
  section: css({
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.borderRadius(),
    position: 'relative',
    overflow: 'visible',
  }),
  sectionHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  }),
  parameterInfo: css({
    padding: theme.spacing(1.5),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.borderRadius(),
    marginBottom: theme.spacing(2),
    '& p': {
      margin: 0,
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.secondary,
    },
    '& code': {
      fontFamily: theme.typography.fontFamilyMonospace,
      backgroundColor: theme.colors.background.primary,
      padding: theme.spacing(0.25, 0.5),
      borderRadius: theme.shape.borderRadius(0.5),
      border: `1px solid ${theme.colors.border.weak}`,
    },
  }),
  advancedParams: css({
    padding: theme.spacing(2),
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.shape.borderRadius(),
    border: `1px solid ${theme.colors.border.weak}`,
  }),
  addButtons: css({
    display: 'flex',
    gap: theme.spacing(1),
  }),
  seriesItem: css({
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.borderRadius(),
    backgroundColor: theme.colors.background.secondary,
  }),
  seriesHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    '& h4': {
      margin: 0,
      fontSize: theme.typography.h4.fontSize,
    },
  }),
  seriesFields: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  }),
  seriesRow: css({
    width: '100%',
  }),
  seriesRowHorizontal: css({
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'flex-end',
    '& > div': {
      flex: 1,
    },
  }),
  emptyState: css({
    textAlign: 'center',
    padding: theme.spacing(4),
    color: theme.colors.text.secondary,
  }),
  labelWithTooltip: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  }),
  tooltipIcon: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    cursor: 'help',
  }),
});
