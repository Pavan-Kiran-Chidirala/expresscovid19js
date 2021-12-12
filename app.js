const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running...");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();
const stateDetails = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};
const districtDetails = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};
//App1
app.get("/states/", async (request, response) => {
  const query = `
    SELECT * 
    FROM state;
    `;
  const dbResponse = await db.all(query);
  response.send(dbResponse.map((eachState) => stateDetails(eachState)));
});
//App2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const query = `
    SELECT * 
    FROM state
    WHERE state_id= ${stateId};
    `;
  const dbResponse = await db.get(query);
  response.send(stateDetails(dbResponse));
});
//App3
app.post("/districts/", async (request, response) => {
  const details = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = details;
  const query = `
    INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
    VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});
    `;
  await db.run(query);
  response.send("District Successfully Added");
});
//App4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `
    SELECT * 
    FROM district
    WHERE district_id= ${districtId};
    `;
  const dbResponse = await db.get(query);
  response.send(districtDetails(dbResponse));
});
//App5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `
    DELETE FROM district
    WHERE district_id= ${districtId};
    `;
  await db.run(query);
  response.send("District Removed");
});
//App6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const details = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = details;
  const query = `
    UPDATE district
    SET district_name= '${districtName}',state_id= ${stateId},cases= ${cases},cured= ${cured},active= ${active},deaths= ${deaths}
    WHERE district_id= ${districtId};
    `;
  await db.run(query);
  response.send("District Details Updated");
});
//App7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const query = `
    SELECT SUM(cases) AS totalCases,SUM(cured) AS totalCured,SUM(active) AS totalActive,SUM(deaths) As totalDeaths
    FROM district
    WHERE state_id= ${stateId};
    `;
  const dbResponse = await db.get(query);
  response.send(dbResponse);
});
//App8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const query = `
    SELECT state.state_name AS stateName 
    FROM district INNER JOIN state ON district.state_id= state.state_id
    WHERE district.district_id= ${districtId};
    `;
  const dbResponse = await db.get(query);
  response.send(dbResponse);
});
module.exports = app;
