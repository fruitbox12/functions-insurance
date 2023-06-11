const userId = args[0]

if (secrets.googleFitnessToken == "" || secrets.googleFitnessToken == "Your Google Fitness API token") {
  throw Error(
    "Google Fitness API Token environment variable not set. Please ensure you have a valid token."
  )
}

const listDataSourceRequest = Functions.makeHttpRequest({
  url: `https://www.googleapis.com/fitness/v1/users/${userId}/dataSources`,
  headers: { "Authorization": `Bearer ${secrets.googleFitnessToken}` },
})

const [listDataSourceResponse] = await Promise.all([
  listDataSourceRequest,
])

if (listDataSourceResponse.error) {
  throw Error("Failed to fetch data sources from Google Fitness API.")
}

// Get data source ID for steps
let stepsDataSourceId = "";
for (let dataSource of listDataSourceResponse.data.dataSource) {
  if (dataSource.dataType.name === "com.google.step_count.delta") {
    stepsDataSourceId = dataSource.dataStreamId;
    break;
  }
}

// Now fetch steps data
const stepsDataRequest = Functions.makeHttpRequest({
  url: `https://www.googleapis.com/fitness/v1/users/${userId}/dataset:aggregate`,
  method: 'POST',
  headers: { 
    "Authorization": `Bearer ${secrets.googleFitnessToken}`,
    "Content-Type": "application/json"
  },
  data: {
    "aggregateBy": [{
      "dataSourceId": stepsDataSourceId
    }],
    "bucketByTime": { "durationMillis": 86400000 }, // one day in milliseconds
    "startTimeMillis": 1623316595000, // start time for the request in milliseconds
    "endTimeMillis": 1623402995000, // end time for the request in milliseconds
  }
})

const [stepsDataResponse] = await Promise.all([
  stepsDataRequest,
])

if (stepsDataResponse.error) {
  throw Error("Failed to fetch steps data from Google Fitness API.")
}

// Calculate total steps
let totalSteps = 0;
for (let bucket of stepsDataResponse.data.bucket) {
  for (let dataset of bucket.dataset) {
    for (let point of dataset.point) {
      totalSteps += point.value[0].intVal;
    }
  }
}

console.log(`Total Steps: ${totalSteps}`);

return Functions.encodeUint256(totalSteps);
