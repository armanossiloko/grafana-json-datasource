const express = require('express');
const cors = require('cors');

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'DataHub Mock JSON API Server is running' });
});

app.post('/api/data/batch', (req, res) => {
  console.log('Received request body:', JSON.stringify(req.body, null, 2));

  const {
    filterTreeItems,
    // start,
    // end,
    // siteExternalId,
    // uiObjectFullName,
    // granularity,
    seriesConfiguration,
  } = req.body;

  let selectedFilterItems = filterTreeItems;
  if (typeof filterTreeItems === 'string') {
    try {
      selectedFilterItems = JSON.parse(filterTreeItems);
    } catch (e) {
      selectedFilterItems = [
        { id: 'filter1', label: 'Filter 1', fullPath: '/filters/filter-a' },
        { id: 'filter2', label: 'Filter 2', fullPath: '/filters/filter-b' },
      ];
    }
  }

  if (!selectedFilterItems || !Array.isArray(selectedFilterItems) || selectedFilterItems.length === 0) {
    res.json([]);
    return;
  }

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 30 * 60 * 1000);

  const response = [];

  if (!seriesConfiguration || seriesConfiguration.length === 0) {
    selectedFilterItems.forEach((filterItem, index) => {
      const filterItemLabel = filterItem.label || filterItem.fullPath || `FilterTreeItem${index + 1}`;
      const combinedLabel = `Series - ${filterItemLabel}`;

      response.push([
        {
          meta: {
            aggregation: 'SUM',
            columns: [
              {
                name: 'ts',
                format: 'long',
                unit: 'ms',
                stream: null,
                type: 'TimeStampWithoutTimeZone',
              },
              {
                name: 'sum',
                format: 'double',
                unit: 'kWh',
                stream: null,
                type: 'Real',
              },
              {
                name: 'label',
                format: null,
                unit: null,
                stream: null,
                type: null,
              },
            ],
            label: combinedLabel,
          },
          data: {
            timestamp: Date.now(),
            values: [],
          },
        },
      ]);
    });
  } else {
    seriesConfiguration.forEach((series, seriesIndex) => {
      selectedFilterItems.forEach((filterItem, filterIndex) => {
        const seriesName = series.name || `Series ${seriesIndex + 1}`;
        const filterItemLabel = filterItem.label || filterItem.fullPath || `FilterTreeItem${filterIndex + 1}`;
        const combinedLabel = `${seriesName} - ${filterItemLabel}`;

        response.push([
          {
            meta: {
              aggregation: 'SUM',
              columns: [
                {
                  name: 'ts',
                  format: 'long',
                  unit: 'ms',
                  stream: null,
                  type: 'TimeStampWithoutTimeZone',
                },
                {
                  name: 'sum',
                  format: 'double',
                  unit: 'kWh',
                  stream: null,
                  type: 'Real',
                },
                {
                  name: 'label',
                  format: null,
                  unit: null,
                  stream: null,
                  type: null,
                },
              ],
              label: combinedLabel,
            },
            data: {
              timestamp: Date.now(),
              values: [],
            },
          },
        ]);
      });
    });
  }

  const currentDate = new Date(startDate);
  const endDateObj = new Date(endDate);

  while (currentDate <= endDateObj) {
    response.forEach((itemArray, index) => {
      const timestamp = currentDate.getTime();
      const label = itemArray[0].meta.label;

      const baseValue = Math.floor(Math.random() * 200) + 50;
      const itemValue = baseValue + index * 10 + Math.floor(Math.random() * 20);

      itemArray[0].data.values.push([timestamp, itemValue, label]);
    });

    currentDate.setTime(currentDate.getTime() + 1000);
  }

  response.forEach((itemArray) => {
    itemArray[0].data.timestamp = Date.now();
  });

  console.log('Sending response:', JSON.stringify(response, null, 2));
  res.json(response);
});

app.post('/graphql', (req, res) => {
  const { query, variables } = req.body;

  if (query.includes('experimentsBySiteExternalId')) {
    const mockExperiments = [
      { id: 'exp1', name: 'Experiment A' },
      { id: 'exp2', name: 'Experiment B' },
      { id: 'exp3', name: 'Experiment C' },
    ];

    res.json({
      data: {
        experimentsBySiteExternalId: mockExperiments,
      },
    });
    return;
  } else if (query.includes('flatFilterTreeItems')) {
    const mockFilterItems = [
      { id: 'filter1', fullPath: '/root/category1/item1' },
      { id: 'filter2', fullPath: '/root/category1/item2' },
      { id: 'filter3', fullPath: '/root/category2/item1' },
      { id: 'filter4', fullPath: '/root/category2/item2' },
    ];

    res.json({
      data: {
        flatFilterTreeItems: mockFilterItems,
      },
    });
    return;
  }

  res.status(400).json({
    errors: [{ message: 'Unknown GraphQL query' }],
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Mockend API server running at http://localhost:${port}`);
});
